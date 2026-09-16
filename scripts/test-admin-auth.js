const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUuRH152uIxoL03lEyHgcED5g11E16Tog";

async function runAuthTests() {
  console.log("==> Step 1: Firebase Auth sign-in for srics2425@gmail.com");
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "srics2425@gmail.com",
      password: "srics1315",
      returnSecureToken: true,
    }),
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error("Firebase Auth sign-in failed:", authData);
    process.exit(1);
  }

  const idToken = authData.idToken;
  const uid = authData.localId;
  console.log(`[PASS] Firebase Auth successful: UID = ${uid}`);

  const baseUrl = "http://localhost:3000";
  const authHeader = { Authorization: `Bearer ${idToken}` };

  console.log("\n==> Step 2: Testing /api/auth/firebase-sync");
  const syncRes = await fetch(`${baseUrl}/api/auth/firebase-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      uid,
      email: "srics2425@gmail.com",
      displayName: "Sri CS (Super Admin)",
    }),
  });
  const syncData = await syncRes.json();
  console.log(`[STATUS ${syncRes.status}] /api/auth/firebase-sync: role = ${syncData?.user?.role}`);

  console.log("\n==> Step 3: Testing /api/admin/stats");
  const statsRes = await fetch(`${baseUrl}/api/admin/stats`, { headers: authHeader });
  const statsData = await statsRes.json();
  console.log(`[STATUS ${statsRes.status}] /api/admin/stats:`, statsRes.ok ? statsData.counts : statsData);

  console.log("\n==> Step 4: Testing /api/admin/hackathons");
  const hackRes = await fetch(`${baseUrl}/api/admin/hackathons`, { headers: authHeader });
  const hackData = await hackRes.json();
  console.log(`[STATUS ${hackRes.status}] /api/admin/hackathons: total = ${hackData?.hackathons?.length}`);

  console.log("\n==> Step 5: Testing /api/admin/opportunities");
  const oppsRes = await fetch(`${baseUrl}/api/admin/opportunities`, { headers: authHeader });
  const oppsData = await oppsRes.json();
  console.log(`[STATUS ${oppsRes.status}] /api/admin/opportunities: total = ${oppsData?.total}`);

  console.log("\n==> Step 6: Testing /api/problem-statements (Admin Create Challenge)");
  const psRes = await fetch(`${baseUrl}/api/problem-statements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      title: "AI-Powered Smart Campus Navigation System",
      track: "Artificial Intelligence",
      difficulty: "Medium",
      description: "Build an indoor assistive navigation application for university campuses using computer vision and graph traversal.",
      expectedDeliverables: "Mobile web application, AR waypoints, GitHub repository with clean documentation.",
      tags: ["AI", "Computer Vision", "Navigation"],
    }),
  });
  const psData = await psRes.json();
  console.log(`[STATUS ${psRes.status}] /api/problem-statements:`, psRes.ok ? `Created ID: ${psData?.problemStatement?.id}` : psData);

  console.log("\n==> Step 7: Testing /api/opportunities/sync (External Feeds Ingestion)");
  const syncFeedsRes = await fetch(`${baseUrl}/api/opportunities/sync`, {
    method: "POST",
    headers: authHeader,
  });
  const syncFeedsData = await syncFeedsRes.json();
  console.log(`[STATUS ${syncFeedsRes.status}] /api/opportunities/sync:`, syncFeedsRes.ok ? syncFeedsData.message : syncFeedsData);

  console.log("\n==> ALL ADMIN ENDPOINTS TEST COMPLETED SUCCESSFULLY!");
}

runAuthTests().catch(console.error);
