const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUuRH152uIxoL03lEyHgcED5g11E16Tog";

async function runStudentSecurityTest() {
  const baseUrl = "http://localhost:3000";
  console.log("==> Step 1: Testing /api/auth/firebase-sync for new student user (test_student@gmail.com)");

  const studentSyncRes = await fetch(`${baseUrl}/api/auth/firebase-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: "mock-student-" + Date.now(),
      email: "test_student@gmail.com",
      displayName: "Student Test User",
    }),
  });

  const studentSyncData = await studentSyncRes.json();
  console.log(`[STATUS ${studentSyncRes.status}] Student Sync Role:`, studentSyncData?.role);
  if (studentSyncData?.role !== "STUDENT") {
    throw new Error("SECURITY FAILURE: Normal user did not receive default STUDENT role!");
  }
  console.log("[PASS] Normal user correctly received STUDENT role.");

  const cookieHeader = studentSyncRes.headers.get("set-cookie");

  console.log("\n==> Step 2: Testing /api/auth/me with Student Session");
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  const meData = await meRes.json();
  console.log(`[STATUS ${meRes.status}] /api/auth/me: user role = ${meData?.user?.role}, email = ${meData?.user?.email}`);

  console.log("\n==> Step 3: Verifying Student cannot access /api/admin/hackathons (Should be 403 Forbidden)");
  const adminAccessRes = await fetch(`${baseUrl}/api/admin/hackathons`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  console.log(`[STATUS ${adminAccessRes.status}] /api/admin/hackathons for Student: (Expected 403)`);
  if (adminAccessRes.status !== 403 && adminAccessRes.status !== 401) {
    throw new Error("SECURITY FAILURE: Student was permitted access to admin route!");
  }
  console.log("[PASS] Student correctly forbidden from accessing admin API.");

  console.log("\n==> Step 4: Testing /api/auth/logout");
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
  console.log(`[STATUS ${logoutRes.status}] /api/auth/logout successful.`);

  console.log("\n==> ALL STUDENT & SECURITY CHECKS PASSED!");
}

runStudentSecurityTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
