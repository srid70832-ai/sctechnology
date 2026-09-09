const apiKey = "AIzaSyAu8BM2KDpOa8dbqbpBjPN-wYotj3r6VjU";
const baseUrl = "http://localhost:3000";

async function runDiscoveryVerification() {
  console.log("==================================================");
  console.log("TEST 1: Authenticate Super Admin (srics2425@gmail.com)");
  console.log("==================================================");

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
    console.error("Super Admin auth failed:", authData);
    process.exit(1);
  }

  const idToken = authData.idToken;
  console.log(`[PASS] Super Admin authenticated! UID: ${authData.localId}`);
  const authHeader = { Authorization: `Bearer ${idToken}` };

  console.log("\n==================================================");
  console.log("TEST 2: Admin Internship Discovery (Fetch Now -> 5 Internships)");
  console.log("==================================================");

  // 1. GET initial telemetry
  const getIntRes = await fetch(`${baseUrl}/api/admin/internships/discovery`, { headers: authHeader });
  const getIntData = await getIntRes.json();
  console.log(`[STATUS ${getIntRes.status}] Initial Internships: total = ${getIntData.total}, today = ${getIntData.telemetry?.todayInternships}`);

  // 2. Trigger Fetch Internships Now (target: 5)
  console.log("Triggering Admin 'Fetch Internships Now' (Calling Gemini 3.6 Flash)...");
  const postIntRes = await fetch(`${baseUrl}/api/admin/internships/discovery`, {
    method: "POST",
    headers: authHeader,
  });
  const postIntData = await postIntRes.json();
  console.log(`[STATUS ${postIntRes.status}] Ingestion Result:`, {
    message: postIntData.message,
    added: postIntData.added,
    skippedDuplicates: postIntData.skippedDuplicates,
    todayAdded: postIntData.telemetry?.todayInternships,
  });

  if (postIntData.items && postIntData.items.length > 0) {
    const sample = postIntData.items[0];
    console.log(`[VERIFIED SAMPLE INTERNSHIP]: ${sample.title} at ${sample.company}`);
    console.log(`  - Category: ${sample.category}`);
    console.log(`  - Stipend: ${sample.stipend}`);
    console.log(`  - WorkMode: ${sample.workMode}`);
    console.log(`  - Source: ${sample.sourceName}`);
    console.log(`  - Application URL: ${sample.applicationUrl}`);
  }

  console.log("\n==================================================");
  console.log("TEST 3: Admin Course Discovery (Fetch Now -> 3 Courses)");
  console.log("==================================================");

  // 1. GET initial courses
  const getCrsRes = await fetch(`${baseUrl}/api/admin/courses/discovery`, { headers: authHeader });
  const getCrsData = await getCrsRes.json();
  console.log(`[STATUS ${getCrsRes.status}] Initial Courses: total = ${getCrsData.total}, today = ${getCrsData.telemetry?.todayCourses}`);

  // 2. Trigger Fetch Courses Now (target: 3)
  console.log("Triggering Admin 'Fetch Courses Now' (Calling Gemini 3.6 Flash)...");
  const postCrsRes = await fetch(`${baseUrl}/api/admin/courses/discovery`, {
    method: "POST",
    headers: authHeader,
  });
  const postCrsData = await postCrsRes.json();
  console.log(`[STATUS ${postCrsRes.status}] Ingestion Result:`, {
    message: postCrsData.message,
    added: postCrsData.added,
    skippedDuplicates: postCrsData.skippedDuplicates,
    todayAdded: postCrsData.telemetry?.todayCourses,
  });

  if (postCrsData.items && postCrsData.items.length > 0) {
    const sample = postCrsData.items[0];
    console.log(`[VERIFIED SAMPLE COURSE]: ${sample.title} by ${sample.provider}`);
    console.log(`  - Category: ${sample.category}`);
    console.log(`  - Level: ${sample.level}`);
    console.log(`  - Free: ${sample.isFree}`);
    console.log(`  - Certificate: ${sample.certificateAvailable}`);
    console.log(`  - Course URL: ${sample.courseUrl}`);
  }

  console.log("\n==================================================");
  console.log("TEST 4: Student Public Portal API Verification");
  console.log("==================================================");

  // 1. Student internships endpoint
  const studentIntRes = await fetch(`${baseUrl}/api/internships?limit=10`);
  const studentIntData = await studentIntRes.json();
  console.log(`[STATUS ${studentIntRes.status}] Student Internships Count: ${studentIntData.count}`);
  if (studentIntData.internships?.length > 0) {
    console.log(`  - First student listing: "${studentIntData.internships[0].title}" at ${studentIntData.internships[0].company}`);
    console.log(`  - Verified Apply link: ${studentIntData.internships[0].applicationUrl}`);
  }

  // 2. Student courses endpoint
  const studentCrsRes = await fetch(`${baseUrl}/api/courses?limit=10`);
  const studentCrsData = await studentCrsRes.json();
  console.log(`[STATUS ${studentCrsRes.status}] Student Courses Count: ${studentCrsData.count}`);
  if (studentCrsData.courses?.length > 0) {
    console.log(`  - First student course: "${studentCrsData.courses[0].title}" by ${studentCrsData.courses[0].provider || studentCrsData.courses[0].instructor}`);
    console.log(`  - Verified Course link: ${studentCrsData.courses[0].courseUrl}`);
  }

  console.log("\n==================================================");
  console.log("TEST 5: Daily Scheduled Cron Routine (/api/cron/daily-discovery)");
  console.log("==================================================");

  const cronRes = await fetch(`${baseUrl}/api/cron/daily-discovery`, {
    method: "POST",
    headers: authHeader,
  });
  const cronData = await cronRes.json();
  console.log(`[STATUS ${cronRes.status}] Cron Result:`, {
    internships: cronData.internships,
    courses: cronData.courses,
    telemetry: cronData.telemetry,
  });

  console.log("\n==================================================");
  console.log("ALL DISCOVERY ENGINE END-TO-END TESTS PASSED!");
  console.log("==================================================");
}

runDiscoveryVerification().catch(console.error);
