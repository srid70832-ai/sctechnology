const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Read .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'scmain-ae18f';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!clientEmail || !rawPrivateKey) {
  console.error('Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env');
  process.exit(1);
}

const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

async function main() {
  const email = 'srics2425@gmail.com';
  const password = 'srics1315';
  let firebaseUid;

  console.log(`==> Configuring Firebase Auth for Admin: ${email}...`);
  try {
    let fbUser;
    try {
      fbUser = await admin.auth().getUserByEmail(email);
      console.log(`[AUTH] Found existing user: ${fbUser.uid}`);
      await admin.auth().updateUser(fbUser.uid, {
        password: password,
        displayName: 'Sri CS (Super Admin)',
        emailVerified: true,
      });
      console.log(`[AUTH] Updated password and profile for ${email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        fbUser = await admin.auth().createUser({
          email,
          password,
          displayName: 'Sri CS (Super Admin)',
          emailVerified: true,
        });
        console.log(`[AUTH] Created new Firebase Auth user: ${fbUser.uid}`);
      } else {
        throw err;
      }
    }

    firebaseUid = fbUser.uid;

    // Set Custom Claims for Super Admin
    await admin.auth().setCustomUserClaims(firebaseUid, {
      role: 'SUPER_ADMIN',
      admin: true,
    });
    console.log(`[AUTH] Set SUPER_ADMIN custom claims on Firebase UID: ${firebaseUid}`);

    // Firestore Document in users/{uid}
    const db = admin.firestore();
    await db.collection('users').doc(firebaseUid).set({
      uid: firebaseUid,
      email: email,
      displayName: 'Sri CS (Super Admin)',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[FIRESTORE] Updated users/${firebaseUid} with role: SUPER_ADMIN`);

    // Firestore Document in students/{uid}
    await db.collection('students').doc(firebaseUid).set({
      uid: firebaseUid,
      fullName: 'Sri CS (Super Admin)',
      displayName: 'Sri CS (Super Admin)',
      email: email,
      role: 'SUPER_ADMIN',
      college: 'SC TECH',
      department: 'Administration',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[FIRESTORE] Updated students/${firebaseUid} student profile`);

    console.log('\n========================================');
    console.log('✅ SUPER ADMIN ACCOUNT IS FULLY READY!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Firebase UID: ${firebaseUid}`);
    console.log(`Role: SUPER_ADMIN`);
    console.log('========================================\n');
  } catch (fbErr) {
    console.error('Firebase Auth/Firestore Setup error:', fbErr);
    process.exit(1);
  }
}

main();


