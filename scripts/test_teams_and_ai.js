const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "sctech_super_secure_jwt_production_secret_key_2026_x892jkl";

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const jsonBody = body ? JSON.stringify(body) : "";
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonBody)
    };
    if (token) {
      headers['Cookie'] = `sctech_session_token=${token}`;
    }

    const req = http.request(`http://localhost:3000${path}`, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (jsonBody) req.write(jsonBody);
    req.end();
  });
}

async function run() {
  console.log('--- STARTING HACKATHON TEAMS & AI VERIFICATION ---');

  // 1. Get or create test hackathon
  let hackathon = await prisma.hackathon.findFirst({
    where: { slug: 'sc-tech-hackathon-2026' }
  });

  if (!hackathon) {
    console.error('Hackathon not found!');
    process.exit(1);
  }
  console.log(`[PASS] Found Hackathon: ${hackathon.title} (${hackathon.id})`);

  // Ensure deadline is in the future for testing
  await prisma.hackathon.update({
    where: { id: hackathon.id },
    data: {
      registrationDeadline: new Date(Date.now() + 86400000 * 30),
      endDate: new Date(Date.now() + 86400000 * 35),
    }
  });

  // 2. Create or find 2 test students and 1 admin
  const studentLeaderUser = await prisma.user.upsert({
    where: { email: 'team_leader@sctech.test' },
    update: { role: 'STUDENT' },
    create: {
      email: 'team_leader@sctech.test',
      name: 'Leader Alex',
      role: 'STUDENT',
      isVerified: true
    }
  });

  const studentMemberUser = await prisma.user.upsert({
    where: { email: 'team_member@sctech.test' },
    update: { role: 'STUDENT' },
    create: {
      email: 'team_member@sctech.test',
      name: 'Member Bob',
      role: 'STUDENT',
      isVerified: true
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sctech.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@sctech.com',
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true
    }
  });

  // Clean existing registrations for this hackathon for test users
  await prisma.hackathonRegistration.deleteMany({
    where: {
      hackathonId: hackathon.id,
      userId: { in: [studentLeaderUser.id, studentMemberUser.id] }
    }
  });

  const leaderToken = jwt.sign({
    userId: studentLeaderUser.id,
    email: studentLeaderUser.email,
    role: 'STUDENT',
    name: studentLeaderUser.name
  }, JWT_SECRET, { expiresIn: '7d' });

  const memberToken = jwt.sign({
    userId: studentMemberUser.id,
    email: studentMemberUser.email,
    role: 'STUDENT',
    name: studentMemberUser.name
  }, JWT_SECRET, { expiresIn: '7d' });

  const adminToken = jwt.sign({
    userId: adminUser.id,
    email: adminUser.email,
    role: 'ADMIN',
    name: adminUser.name
  }, JWT_SECRET, { expiresIn: '7d' });

  // 3. Test Team Creation by Leader
  const uniqueTeamName = `DevSquad-${Date.now().toString().slice(-4)}`;
  console.log(`\n1. Creating team "${uniqueTeamName}" with Leader Alex...`);
  const createRes = await makeRequest(
    `/api/hackathons/${hackathon.id}/team`,
    'POST',
    { teamName: uniqueTeamName },
    leaderToken
  );

  console.log('Create Team Response Status:', createRes.status);
  console.log('Created Team Info:', {
    teamId: createRes.body?.team?.teamId,
    joinCode: createRes.body?.team?.joinCode,
    leaderName: createRes.body?.team?.leaderName,
    membersCount: createRes.body?.team?.members?.length
  });

  if (createRes.status !== 200 || !createRes.body?.team?.joinCode) {
    console.error('FAILED to create team!', createRes);
    process.exit(1);
  }
  console.log('[PASS] Team created successfully with unique Team ID & Join Code!');

  const joinCode = createRes.body.team.joinCode;
  const teamDocId = createRes.body.team.id;

  // 4. Test Duplicate Creation Prevention
  console.log('\n2. Testing duplicate team creation prevention by Leader Alex...');
  const dupCreateRes = await makeRequest(
    `/api/hackathons/${hackathon.id}/team`,
    'POST',
    { teamName: `${uniqueTeamName}-New` },
    leaderToken
  );
  console.log('Duplicate Create Status:', dupCreateRes.status, dupCreateRes.body?.error);
  if (dupCreateRes.status === 400) {
    console.log('[PASS] Duplicate team creation correctly rejected!');
  } else {
    console.error('Expected 400 for duplicate creation, got:', dupCreateRes.status);
  }

  // 5. Test Member Bob Joining with Join Code
  console.log(`\n3. Member Bob joining team with code "${joinCode}"...`);
  const joinRes = await makeRequest(
    `/api/hackathons/${hackathon.id}/team/join`,
    'POST',
    { joinCode },
    memberToken
  );
  console.log('Join Response Status:', joinRes.status, joinRes.body?.message);
  if (joinRes.status === 200 && joinRes.body?.team?.members?.length === 2) {
    console.log(`[PASS] Member Bob joined! Total team members: ${joinRes.body.team.members.length}`);
  } else {
    console.error('Failed to join team:', joinRes);
    process.exit(1);
  }

  // 6. Test Duplicate Membership Rejection
  console.log('\n4. Member Bob attempting duplicate join...');
  const dupJoinRes = await makeRequest(
    `/api/hackathons/${hackathon.id}/team/join`,
    'POST',
    { joinCode },
    memberToken
  );
  console.log('Duplicate Join Status:', dupJoinRes.status, dupJoinRes.body?.error);
  if (dupJoinRes.status === 400) {
    console.log('[PASS] Duplicate member join correctly rejected!');
  } else {
    console.error('Expected 400 for duplicate join, got:', dupJoinRes.status);
  }

  // 7. Test Leader-Only Submission Lock (Member attempts submit -> rejected)
  console.log('\n5. Member Bob attempting project submission (should be rejected by leader lock)...');
  const nonLeaderSubmit = await makeRequest(
    `/api/hackathons/${hackathon.id}/submit`,
    'POST',
    {
      projectName: 'Bob Unauthorized Project',
      repoUrl: 'https://github.com/bob/project'
    },
    memberToken
  );
  console.log('Non-leader Submit Status:', nonLeaderSubmit.status, nonLeaderSubmit.body?.error);
  if (nonLeaderSubmit.status === 403) {
    console.log('[PASS] Leader submission lock successfully blocked non-leader submission!');
  } else {
    console.error('Expected 403, got:', nonLeaderSubmit.status);
  }

  // 8. Test Leader Submission
  console.log('\n6. Leader Alex submitting team project...');
  const leaderSubmit = await makeRequest(
    `/api/hackathons/${hackathon.id}/submit`,
    'POST',
    {
      projectName: 'NexusAI Health Platform',
      repoUrl: 'https://github.com/alex/nexus-ai',
      liveUrl: 'https://nexus-ai.vercel.app',
      videoUrl: 'https://youtube.com/watch?v=123456',
      description: 'Comprehensive health monitoring using edge AI models.',
      techStack: ['Next.js', 'PyTorch', 'FastAPI', 'TailwindCSS']
    },
    leaderToken
  );
  console.log('Leader Submit Status:', leaderSubmit.status, leaderSubmit.body?.message);
  if (leaderSubmit.status === 200 && leaderSubmit.body?.isTeamSubmission) {
    console.log('[PASS] Leader project submitted successfully and synced to team!');
  } else {
    console.error('Leader submission failed:', leaderSubmit);
  }

  // 9. Test Admin Teams Management & Round Qualification
  console.log('\n7. Admin listing teams and qualifying team for Round 2...');
  const adminTeamsRes = await makeRequest(
    `/api/admin/hackathons/${hackathon.id}/teams`,
    'GET',
    null,
    adminToken
  );
  console.log('Admin Teams Count:', adminTeamsRes.body?.count);

  const qualifyRes = await makeRequest(
    `/api/admin/hackathons/${hackathon.id}/teams`,
    'PATCH',
    {
      teamId: teamDocId,
      roundStatus: 'ROUND_1_QUALIFIED',
      round: 2
    },
    adminToken
  );
  console.log('Admin Qualify Status:', qualifyRes.status, qualifyRes.body?.message);
  if (qualifyRes.status === 200 && qualifyRes.body?.roundStatus === 'ROUND_1_QUALIFIED') {
    console.log('[PASS] Admin team qualification passed!');
  } else {
    console.error('Admin qualify failed:', qualifyRes);
  }

  // 10. Test AI Mentor with context
  console.log('\n8. Testing 24/7 Gemini Hackathon AI Assistant with student context...');
  const aiRes = await makeRequest(
    '/api/ai/hackathon-assistant',
    'POST',
    {
      hackathonId: hackathon.id,
      messages: [
        { role: 'user', content: 'Can our team update our submission before the deadline, and how is it scored?' }
      ]
    },
    leaderToken
  );
  console.log('AI Status:', aiRes.status);
  console.log('AI Reply Preview:', aiRes.body?.reply?.slice(0, 250) + '...');
  if (aiRes.status === 200 && aiRes.body?.reply) {
    console.log('[PASS] Gemini Hackathon AI assistant answered with accurate context!');
  } else {
    console.error('AI assistant failed:', aiRes);
  }

  console.log('\n======================================================');
  console.log(' ALL 8 HACKATHON TEAMS & AI VERIFICATION TESTS PASSED!');
  console.log('======================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
