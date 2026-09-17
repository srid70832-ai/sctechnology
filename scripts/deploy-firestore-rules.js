// Deploy Firestore Rules using Firebase Admin Service Account Credentials & Google Firebase Rules API
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

// Load .env
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value.replace(/\\n/g, "\n");
      }
    }
  });
}

const projectId = process.env.FIREBASE_PROJECT_ID || "scmain-ae18f";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
  console.error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env");
  process.exit(1);
}

// Clean private key
privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

console.log("=================================================");
console.log(`DEPLOYING FIRESTORE RULES TO PROJECT: ${projectId}`);
console.log("=================================================\n");

// Step 1: Generate Google OAuth2 Token using Service Account JWT
function createJwtToken() {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString("base64url");
  const signInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  signer.end();
  const signature = signer.sign(privateKey, "base64url");

  return `${signInput}.${signature}`;
}

async function getAccessToken() {
  const jwt = createJwtToken();
  const postData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.access_token) {
              resolve(data.access_token);
            } else {
              reject(new Error(`Failed to get access token: ${body}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function httpsRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, raw: body });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function deployRules() {
  try {
    console.log("1. Authenticating with Google Cloud OAuth2...");
    const accessToken = await getAccessToken();
    console.log("   ✓ Successfully generated OAuth2 Access Token.");

    // Step 2: Read firestore.rules
    const rulesPath = path.join(__dirname, "..", "firestore.rules");
    const rulesContent = fs.readFileSync(rulesPath, "utf8");
    console.log(`2. Read local firestore.rules (${rulesContent.length} bytes).`);

    // Step 3: Create Ruleset
    console.log(`3. Uploading new ruleset to projects/${projectId}...`);
    const createRulesetRes = await httpsRequest(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      {
        source: {
          files: [
            {
              name: "firestore.rules",
              content: rulesContent,
            },
          ],
        },
      }
    );

    if (createRulesetRes.status !== 200) {
      console.error("Failed to create ruleset:", createRulesetRes.data || createRulesetRes.raw);
      process.exit(1);
    }

    const rulesetName = createRulesetRes.data.name;
    console.log(`   ✓ Created Ruleset: ${rulesetName}`);

    // Step 4: Release / Publish Ruleset to cloud.firestore
    console.log(`4. Releasing ruleset to release 'cloud.firestore'...`);
    const releaseRes = await httpsRequest(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      {
        release: {
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName: rulesetName,
        },
      }
    );

    if (releaseRes.status !== 200) {
      // Try PUT / create release if PATCH fails
      const putReleaseRes = await httpsRequest(
        `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
        {
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName: rulesetName,
        }
      );

      if (putReleaseRes.status !== 200) {
        console.error("Failed to update release:", releaseRes.data, putReleaseRes.data);
        process.exit(1);
      }
    }

    console.log("   ✓ Successfully released ruleset to 'cloud.firestore'!");

    // Step 5: Verify Active Release
    console.log("\n5. Verifying LIVE Active Release in Firebase...");
    const verifyRes = await httpsRequest(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("   Active Release Status:", verifyRes.data);
    console.log("\n=================================================");
    console.log("FIRESTORE RULES DEPLOYMENT SUCCEEDED (LIVE PUBLISHED)");
    console.log("=================================================");
  } catch (err) {
    console.error("Deployment error:", err);
    process.exit(1);
  }
}

deployRules();
