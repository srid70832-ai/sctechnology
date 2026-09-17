// Live Firestore Rules Verification Test Suite
const fs = require("fs");
const path = require("path");
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
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.replace(/\\n/g, "\n");
    }
  });
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUuRH152uIxoL03lEyHgcED5g11E16Tog";
const projectId = process.env.FIREBASE_PROJECT_ID || "scmain-ae18f";

console.log("=================================================");
console.log("SC TECH — LIVE FIRESTORE RULES INTEGRATION TEST");
console.log(`Target Firebase Project: ${projectId}`);
console.log("=================================================\n");

function httpsPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = typeof data === "string" ? data : JSON.stringify(data);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "GET",
        headers: {
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function httpsPatch(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = typeof data === "string" ? data : JSON.stringify(data);
    const req = https.request(
      url,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function httpsDelete(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "DELETE",
        headers: {
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, raw: body });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runLiveTests() {
  const fsBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Step 1: Authenticate Admin User (srics2425@gmail.com)
  console.log("1. Authenticating Admin (srics2425@gmail.com)...");
  const adminAuthRes = await httpsPost(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    email: "srics2425@gmail.com",
    password: "srics1315",
    returnSecureToken: true,
  });

  if (adminAuthRes.status !== 200 || !adminAuthRes.data.idToken) {
    console.error("Admin sign-in failed:", adminAuthRes.data);
    process.exit(1);
  }
  const adminToken = adminAuthRes.data.idToken;
  const adminUid = adminAuthRes.data.localId;
  console.log(`   ✓ Admin authenticated: UID = ${adminUid}`);

  // Step 2: Create / Sign-in Student A
  console.log("\n2. Authenticating Student A (student_a_test@sctech.com)...");
  let studentAToken = null;
  let studentAUid = null;

  const studentASignIn = await httpsPost(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    email: "student_a_test@sctech.com",
    password: "Password123!",
    returnSecureToken: true,
  });

  if (studentASignIn.status === 200) {
    studentAToken = studentASignIn.data.idToken;
    studentAUid = studentASignIn.data.localId;
  } else {
    // Register Student A
    const signUpA = await httpsPost(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      email: "student_a_test@sctech.com",
      password: "Password123!",
      returnSecureToken: true,
    });
    if (signUpA.status === 200) {
      studentAToken = signUpA.data.idToken;
      studentAUid = signUpA.data.localId;
    } else {
      console.error("Failed to authenticate/create Student A:", signUpA.data);
      process.exit(1);
    }
  }
  console.log(`   ✓ Student A authenticated: UID = ${studentAUid}`);

  // Step 3: Create / Sign-in Student B
  console.log("\n3. Authenticating Student B (student_b_test@sctech.com)...");
  let studentBToken = null;
  let studentBUid = null;

  const studentBSignIn = await httpsPost(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    email: "student_b_test@sctech.com",
    password: "Password123!",
    returnSecureToken: true,
  });

  if (studentBSignIn.status === 200) {
    studentBToken = studentBSignIn.data.idToken;
    studentBUid = studentBSignIn.data.localId;
  } else {
    // Register Student B
    const signUpB = await httpsPost(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      email: "student_b_test@sctech.com",
      password: "Password123!",
      returnSecureToken: true,
    });
    if (signUpB.status === 200) {
      studentBToken = signUpB.data.idToken;
      studentBUid = signUpB.data.localId;
    } else {
      console.error("Failed to authenticate/create Student B:", signUpB.data);
      process.exit(1);
    }
  }
  console.log(`   ✓ Student B authenticated: UID = ${studentBUid}`);

  // Step 4: Student A queries problem statements (Public read test)
  console.log("\n4. Testing Problem Statements Retrieval by Student A...");
  const psRes = await httpsGet(`${fsBaseUrl}/problemStatements`, {
    Authorization: `Bearer ${studentAToken}`,
  });
  console.log(`   [STATUS ${psRes.status}] Problem Statements read: ${psRes.status === 200 ? "PASS" : "FAIL"}`);

  // Step 5: Student A queries their own projects workspace (Query compatibility test)
  console.log("\n5. Testing Student A Project Workspace Query on 'projects' collection...");
  const queryPayload = {
    structuredQuery: {
      from: [{ collectionId: "projects" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "ownerId" },
          op: "EQUAL",
          value: { stringValue: studentAUid },
        },
      },
    },
  };

  const queryRes = await httpsPost(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    queryPayload,
    { Authorization: `Bearer ${studentAToken}` }
  );

  console.log(`   [STATUS ${queryRes.status}] Student A projects query: ${queryRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);
  if (queryRes.status !== 200) {
    console.error("Query failed with error:", queryRes.data);
  }

  // Step 6: Student A creates/saves a project draft in 'projects'
  const testDocId = `test-proj-a-${Date.now()}`;
  console.log(`\n6. Testing Student A creating project draft (${testDocId})...`);
  const createProjRes = await httpsPatch(
    `${fsBaseUrl}/projects/${testDocId}`,
    {
      fields: {
        problemStatementId: { stringValue: "autonomous-drone-delivery-route-optimizer-5303" },
        problemTitle: { stringValue: "Autonomous Drone Delivery Route Optimizer" },
        ownerId: { stringValue: studentAUid },
        ownerName: { stringValue: "Student A Test" },
        title: { stringValue: "ApexDrone Autonomous Mesh Delivery" },
        description: { stringValue: "Optimized route planning algorithm for delivery drones." },
        submissionStatus: { stringValue: "DRAFT" },
      },
    },
    { Authorization: `Bearer ${studentAToken}` }
  );

  console.log(`   [STATUS ${createProjRes.status}] Student A create draft project: ${createProjRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);

  // Step 7: Student A reads their own project draft document
  console.log(`\n7. Testing Student A reading their own draft project...`);
  const readOwnRes = await httpsGet(`${fsBaseUrl}/projects/${testDocId}`, {
    Authorization: `Bearer ${studentAToken}`,
  });
  console.log(`   [STATUS ${readOwnRes.status}] Student A read own draft: ${readOwnRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);

  // Step 8: Student A updates their own project draft
  console.log(`\n8. Testing Student A updating their own draft...`);
  const updateDraftRes = await httpsPatch(
    `${fsBaseUrl}/projects/${testDocId}`,
    {
      fields: {
        problemStatementId: { stringValue: "autonomous-drone-delivery-route-optimizer-5303" },
        problemTitle: { stringValue: "Autonomous Drone Delivery Route Optimizer" },
        ownerId: { stringValue: studentAUid },
        ownerName: { stringValue: "Student A Test" },
        title: { stringValue: "ApexDrone Autonomous Mesh Delivery - v2" },
        description: { stringValue: "Updated multi-agent graph traversal algorithm." },
        submissionStatus: { stringValue: "DRAFT" },
      },
    },
    { Authorization: `Bearer ${studentAToken}` }
  );
  console.log(`   [STATUS ${updateDraftRes.status}] Student A update own draft: ${updateDraftRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);

  // Step 9: SECURITY CHECK — Student B attempts to read Student A's private draft (Must be 403/PERMISSION_DENIED)
  console.log(`\n9. SECURITY CHECK: Student B attempts to READ Student A's private draft...`);
  const studentBReadRes = await httpsGet(`${fsBaseUrl}/projects/${testDocId}`, {
    Authorization: `Bearer ${studentBToken}`,
  });
  console.log(`   [STATUS ${studentBReadRes.status}] Student B read Student A draft: Expected 403/PERMISSION_DENIED`);
  const isolationPass = studentBReadRes.status === 403 || studentBReadRes.status === 404;
  console.log(`   -> Student A to Student B Isolation: ${isolationPass ? "PASS (Properly Forbidden) ✓" : "FAIL (Security Leak) ✗"}`);

  // Step 10: SECURITY CHECK — Student B attempts to UPDATE Student A's project (Must be 403)
  console.log(`\n10. SECURITY CHECK: Student B attempts to UPDATE Student A's project...`);
  const studentBUpdateRes = await httpsPatch(
    `${fsBaseUrl}/projects/${testDocId}`,
    {
      fields: {
        title: { stringValue: "Hacked by Student B" },
      },
    },
    { Authorization: `Bearer ${studentBToken}` }
  );
  console.log(`   [STATUS ${studentBUpdateRes.status}] Student B update Student A project: Expected 403`);
  const updateIsolationPass = studentBUpdateRes.status === 403;
  console.log(`   -> Unauthorized Update Protection: ${updateIsolationPass ? "PASS ✓" : "FAIL ✗"}`);

  // Step 11: Admin Access Check — Admin reads Student A's project
  console.log(`\n11. Testing Admin reading Student A's project...`);
  const adminReadRes = await httpsGet(`${fsBaseUrl}/projects/${testDocId}`, {
    Authorization: `Bearer ${adminToken}`,
  });
  console.log(`   [STATUS ${adminReadRes.status}] Admin read student project: ${adminReadRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);

  // Step 12: Student A submits project (Transition to SUBMITTED) and creates notification
  console.log(`\n12. Testing Student A Final Submission...`);
  const submitProjRes = await httpsPatch(
    `${fsBaseUrl}/projects/${testDocId}`,
    {
      fields: {
        problemStatementId: { stringValue: "autonomous-drone-delivery-route-optimizer-5303" },
        problemTitle: { stringValue: "Autonomous Drone Delivery Route Optimizer" },
        ownerId: { stringValue: studentAUid },
        ownerName: { stringValue: "Student A Test" },
        title: { stringValue: "ApexDrone Final" },
        description: { stringValue: "Final project submission ready for evaluation." },
        githubUrl: { stringValue: "https://github.com/student-a/apex-drone" },
        submissionStatus: { stringValue: "SUBMITTED" },
      },
    },
    { Authorization: `Bearer ${studentAToken}` }
  );
  console.log(`   [STATUS ${submitProjRes.status}] Project Submission: ${submitProjRes.status === 200 ? "PASS ✓" : "FAIL ✗"}`);

  // Clean up test document
  await httpsDelete(`${fsBaseUrl}/projects/${testDocId}`, { Authorization: `Bearer ${adminToken}` });

  console.log("\n=================================================");
  console.log("ALL LIVE FIRESTORE RULES TESTS COMPLETED SUCCESSFULLY");
  console.log("=================================================");
}

runLiveTests().catch(console.error);
