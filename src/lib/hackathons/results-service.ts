import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { generateCertificateId } from "@/lib/certificate-system";
import { getTeamsForHackathon } from "@/lib/team-storage";
import fs from "fs";
import path from "path";

export interface WinnerMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  registrationNo?: string;
  college?: string | null;
  department?: string | null;
  certificateId?: string;
}

export interface HackathonWinnerPodiumItem {
  rank: 1 | 2 | 3 | 4; // 1: 1st Place (Winner), 2: 2nd Place, 3: 3rd Place, 4: Special Mention
  rankTitle: string; // "Champion / 1st Place", "1st Runner Up / 2nd Place", "2nd Runner Up / 3rd Place", "Special Innovation Award"
  teamId: string;
  teamCode: string;
  teamName: string;
  leaderId: string;
  leaderName: string;
  members: WinnerMember[];
  prizeAmount: number;
  projectTitle: string;
  projectDescription?: string;
  repoUrl?: string;
  liveUrl?: string | null;
  videoUrl?: string | null;
  techStack?: string[];
  feedbackNotes?: string;
}

export interface HackathonResultDoc {
  id: string; // result-{hackathonId}
  hackathonId: string;
  hackathonTitle: string;
  bannerUrl?: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  publishedBy?: string | null;
  announcementNotes?: string;
  winners: HackathonWinnerPodiumItem[];
  totalPrizeDistributed: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAchievementDoc {
  id: string; // ach-{studentUid}-{type}-{eventId}
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string | null;
  studentDepartment?: string | null;
  type: "HACKATHON_WIN" | "INTERNSHIP_COMPLETION";
  hackathonId?: string;
  hackathonTitle?: string;
  teamId?: string;
  teamName?: string;
  rank: number;
  rankTitle: string;
  prizeShare: number;
  projectTitle?: string;
  repoUrl?: string;
  liveUrl?: string | null;
  certificateId: string;
  verified: boolean;
  published: boolean;
  createdAt: string;
}

export interface InternshipAchievementDoc {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string | null;
  internshipId: string;
  companyName: string;
  role: string;
  duration: string;
  stipendAmount: number;
  stipendCurrency: string;
  stipendVerified: boolean;
  completionVerified: boolean;
  certificateId?: string;
  published: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const RESULTS_FILE = path.join(DATA_DIR, "hackathon_results.json");
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, "student_achievements.json");
const INTERNSHIP_ACHIEVEMENTS_FILE = path.join(DATA_DIR, "internship_achievements.json");

function ensureLocalFile<T>(filePath: string, defaultVal: T): T {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal), "utf8");
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function writeLocalFile<T>(filePath: string, data: T) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Write local file error:", filePath, err);
  }
}

/**
 * Saves hackathon results (as Draft or Published)
 * When published:
 *  - Issues official Winner certificates
 *  - Registers individual student achievements in Firestore & local storage
 *  - Updates HackathonWinner in Prisma
 *  - Dispatches notifications
 */
export async function saveHackathonResults({
  hackathonId,
  winners,
  announcementNotes,
  isPublish,
  adminUid,
  adminEmail,
}: {
  hackathonId: string;
  winners: HackathonWinnerPodiumItem[];
  announcementNotes?: string;
  isPublish: boolean;
  adminUid?: string;
  adminEmail?: string;
}) {
  const hackathon = await prisma.hackathon.findFirst({
    where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  const effectiveId = hackathon.id;
  const resultDocId = `result-${effectiveId}`;
  const nowStr = new Date().toISOString();

  // Calculate total prize
  const totalPrizeDistributed = winners.reduce((sum, w) => sum + (Number(w.prizeAmount) || 0), 0);

  // If publishing, generate certificates and individual achievements
  const enrichedWinners: HackathonWinnerPodiumItem[] = [];

  for (const win of winners) {
    const prizeShare = win.members.length > 0 ? Math.round(win.prizeAmount / win.members.length) : win.prizeAmount;
    const enrichedMembers: WinnerMember[] = [];

    for (const mem of win.members) {
      let certId = mem.certificateId;
      if (isPublish && !certId) {
        certId = generateCertificateId("WINNER");
      }

      enrichedMembers.push({
        ...mem,
        certificateId: certId,
      });

      if (isPublish && certId) {
        // 1. Create or sync Certificate in Prisma
        try {
          const existingCert = await prisma.certificate.findUnique({
            where: { certificateNo: certId },
          });

          if (!existingCert) {
            await prisma.certificate.create({
              data: {
                certificateNo: certId,
                studentId: mem.userId,
                studentName: mem.name,
                title: `CERTIFICATE OF EXCELLENCE - ${win.rankTitle.toUpperCase()}`,
                eventName: hackathon.title,
                type: "HACKATHON_WINNER",
                status: "VERIFIED",
                metadata: JSON.stringify({
                  hackathonId: effectiveId,
                  teamId: win.teamId,
                  teamName: win.teamName,
                  rank: win.rank,
                  rankTitle: win.rankTitle,
                  prizeAmount: prizeShare,
                  projectTitle: win.projectTitle,
                }),
              },
            });
          }
        } catch (certErr) {
          console.warn("Prisma certificate sync notice:", certErr);
        }

        // 2. Write Student Achievement Record
        const achievementId = `ach-${mem.userId}-hack-${effectiveId}`;
        const studentAchievement: StudentAchievementDoc = {
          id: achievementId,
          studentUid: mem.userId,
          studentName: mem.name,
          studentEmail: mem.email,
          studentCollege: mem.college || null,
          studentDepartment: mem.department || null,
          type: "HACKATHON_WIN",
          hackathonId: effectiveId,
          hackathonTitle: hackathon.title,
          teamId: win.teamId,
          teamName: win.teamName,
          rank: win.rank,
          rankTitle: win.rankTitle,
          prizeShare,
          projectTitle: win.projectTitle,
          repoUrl: win.repoUrl,
          liveUrl: win.liveUrl,
          certificateId: certId,
          verified: true,
          published: true,
          createdAt: nowStr,
        };

        // Firestore
        try {
          await setDoc(doc(db, COLLECTIONS.STUDENT_ACHIEVEMENTS, achievementId), removeUndefinedValues({
            ...studentAchievement,
            updatedAt: serverTimestamp(),
          }), { merge: true });
        } catch (fsErr) {
          console.warn("Firestore student achievement save notice:", fsErr);
        }

        // Local Storage sync
        try {
          const allAch = ensureLocalFile<StudentAchievementDoc[]>(ACHIEVEMENTS_FILE, []);
          const idx = allAch.findIndex((a) => a.id === achievementId);
          if (idx >= 0) allAch[idx] = studentAchievement;
          else allAch.push(studentAchievement);
          writeLocalFile(ACHIEVEMENTS_FILE, allAch);
        } catch {}

        // 3. Notification to winning student
        try {
          await prisma.notification.create({
            data: {
              userId: mem.userId,
              title: `🏆 Congratulations! You won ${win.rankTitle}!`,
              message: `Your team "${win.teamName}" won ${win.rankTitle} in "${hackathon.title}" with a prize share of ₹${prizeShare.toLocaleString()}! Certificate No: ${certId}`,
              type: "HACKATHON",
              link: `/hackathons/${hackathon.slug || effectiveId}/results`,
            },
          });
        } catch {}
      }
    }

    enrichedWinners.push({
      ...win,
      members: enrichedMembers,
    });
  }

  const resultDoc: HackathonResultDoc = {
    id: resultDocId,
    hackathonId: effectiveId,
    hackathonTitle: hackathon.title,
    bannerUrl: hackathon.bannerUrl,
    status: isPublish ? "PUBLISHED" : "DRAFT",
    publishedAt: isPublish ? nowStr : null,
    publishedBy: isPublish ? (adminEmail || adminUid || "Admin") : null,
    announcementNotes: announcementNotes || "",
    winners: enrichedWinners,
    totalPrizeDistributed,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  // 1. Save in Firestore
  try {
    await setDoc(doc(db, COLLECTIONS.HACKATHON_RESULTS, resultDocId), removeUndefinedValues({
      ...resultDoc,
      serverUpdatedAt: serverTimestamp(),
    }), { merge: true });
  } catch (fsErr) {
    console.warn("Firestore result save notice:", fsErr);
  }

  // 2. Save in Local Storage
  const allResults = ensureLocalFile<HackathonResultDoc[]>(RESULTS_FILE, []);
  const idx = allResults.findIndex((r) => r.id === resultDocId);
  if (idx >= 0) allResults[idx] = resultDoc;
  else allResults.push(resultDoc);
  writeLocalFile(RESULTS_FILE, allResults);

  // 3. If publishing, update Hackathon status in Prisma
  if (isPublish) {
    try {
      await prisma.hackathon.update({
        where: { id: effectiveId },
        data: { status: "PUBLISHED" },
      });
    } catch (pErr) {
      console.warn("Prisma hackathon status update notice:", pErr);
    }
  }

  return {
    success: true,
    message: isPublish ? "Official hackathon results published successfully!" : "Results draft saved successfully.",
    result: resultDoc,
  };
}

/**
 * Retrieves official results for a specific hackathon
 */
export async function getHackathonResults(hackathonId: string): Promise<HackathonResultDoc | null> {
  const resultDocId = `result-${hackathonId}`;

  // 1. Try Firestore
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.HACKATHON_RESULTS, resultDocId));
    if (snap.exists()) {
      return snap.data() as HackathonResultDoc;
    }
  } catch {}

  // 2. Fallback to Local Storage
  const allResults = ensureLocalFile<HackathonResultDoc[]>(RESULTS_FILE, []);
  return allResults.find((r) => r.hackathonId === hackathonId || r.id === resultDocId) || null;
}

/**
 * Retrieves student achievements across all competitions
 */
export async function getStudentAchievements(studentUid: string): Promise<StudentAchievementDoc[]> {
  // 1. Try Firestore
  try {
    const q = query(
      collection(db, COLLECTIONS.STUDENT_ACHIEVEMENTS),
      where("studentUid", "==", studentUid),
      where("published", "==", true)
    );
    const snap = await getDocs(q);
    const achievements: StudentAchievementDoc[] = [];
    snap.forEach((d) => achievements.push(d.data() as StudentAchievementDoc));
    if (achievements.length > 0) return achievements;
  } catch {}

  // 2. Fallback to local
  const all = ensureLocalFile<StudentAchievementDoc[]>(ACHIEVEMENTS_FILE, []);
  return all.filter((a) => a.studentUid === studentUid && a.published);
}

/**
 * Aggregates all published achievements into the Global Public Leaderboard
 */
export async function getGlobalLeaderboard() {
  // 1. Get all published achievements
  let achievements: StudentAchievementDoc[] = [];
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENT_ACHIEVEMENTS));
    snap.forEach((d) => {
      const data = d.data() as StudentAchievementDoc;
      if (data.published) achievements.push(data);
    });
  } catch {}

  if (achievements.length === 0) {
    achievements = ensureLocalFile<StudentAchievementDoc[]>(ACHIEVEMENTS_FILE, []).filter((a) => a.published);
  }

  // 2. Aggregate by student
  const studentMap: Record<string, {
    studentUid: string;
    studentName: string;
    studentEmail: string;
    studentCollege: string;
    firstPlaceCount: number;
    secondPlaceCount: number;
    thirdPlaceCount: number;
    totalWins: number;
    totalPrizeEarned: number;
    score: number;
    achievements: StudentAchievementDoc[];
  }> = {};

  for (const ach of achievements) {
    if (!studentMap[ach.studentUid]) {
      studentMap[ach.studentUid] = {
        studentUid: ach.studentUid,
        studentName: ach.studentName || "Student Champion",
        studentEmail: ach.studentEmail || "",
        studentCollege: ach.studentCollege || "Engineering College",
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        totalWins: 0,
        totalPrizeEarned: 0,
        score: 0,
        achievements: [],
      };
    }

    const s = studentMap[ach.studentUid];
    s.achievements.push(ach);
    s.totalWins += 1;
    s.totalPrizeEarned += ach.prizeShare || 0;

    if (ach.rank === 1) {
      s.firstPlaceCount += 1;
      s.score += 100;
    } else if (ach.rank === 2) {
      s.secondPlaceCount += 1;
      s.score += 60;
    } else if (ach.rank === 3) {
      s.thirdPlaceCount += 1;
      s.score += 40;
    } else {
      s.score += 20;
    }
  }

  // Rank champions
  const champions = Object.values(studentMap)
    .sort((a, b) => b.score - a.score || b.totalPrizeEarned - a.totalPrizeEarned || b.firstPlaceCount - a.firstPlaceCount)
    .map((c, index) => ({
      rank: index + 1,
      ...c,
    }));

  // 3. Get Verified Internship Achievements
  let internshipAchievements: InternshipAchievementDoc[] = [];
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.INTERNSHIP_ACHIEVEMENTS));
    snap.forEach((d) => {
      const data = d.data() as InternshipAchievementDoc;
      if (data.published) internshipAchievements.push(data);
    });
  } catch {}

  if (internshipAchievements.length === 0) {
    internshipAchievements = ensureLocalFile<InternshipAchievementDoc[]>(INTERNSHIP_ACHIEVEMENTS_FILE, []).filter((i) => i.published);
  }

  // Sort internship achievements by stipend & date
  const sortedInternships = internshipAchievements.sort((a, b) => (b.stipendAmount || 0) - (a.stipendAmount || 0));

  return {
    champions,
    recentAchievements: achievements.slice(0, 20),
    internshipAchievements: sortedInternships,
    totalPrizePoolWon: champions.reduce((sum, c) => sum + c.totalPrizeEarned, 0),
    totalChampionsCount: champions.length,
  };
}

/**
 * Admin verifies and publishes student internship achievement
 */
export async function verifyAndPublishInternshipAchievement({
  studentUid,
  studentName,
  studentEmail,
  studentCollege,
  internshipId,
  companyName,
  role,
  duration,
  stipendAmount,
  stipendCurrency = "INR",
  stipendVerified = true,
  completionVerified = true,
  adminEmail = "admin@sctech.com",
}: {
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string;
  internshipId: string;
  companyName: string;
  role: string;
  duration: string;
  stipendAmount: number;
  stipendCurrency?: string;
  stipendVerified?: boolean;
  completionVerified?: boolean;
  adminEmail?: string;
}) {
  const achievementId = `int-ach-${studentUid}-${internshipId}`;
  const certId = generateCertificateId("INTERNSHIP");
  const nowStr = new Date().toISOString();

  const docData: InternshipAchievementDoc = {
    id: achievementId,
    studentUid,
    studentName,
    studentEmail,
    studentCollege: studentCollege || null,
    internshipId,
    companyName,
    role,
    duration,
    stipendAmount,
    stipendCurrency,
    stipendVerified,
    completionVerified,
    certificateId: certId,
    published: true,
    verifiedBy: adminEmail,
    verifiedAt: nowStr,
    createdAt: nowStr,
  };

  // 1. Firestore
  try {
    await setDoc(doc(db, COLLECTIONS.INTERNSHIP_ACHIEVEMENTS, achievementId), removeUndefinedValues({
      ...docData,
      updatedAt: serverTimestamp(),
    }), { merge: true });
  } catch (fsErr) {
    console.warn("Firestore internship achievement save notice:", fsErr);
  }

  // 2. Local fallback
  const all = ensureLocalFile<InternshipAchievementDoc[]>(INTERNSHIP_ACHIEVEMENTS_FILE, []);
  const idx = all.findIndex((i) => i.id === achievementId);
  if (idx >= 0) all[idx] = docData;
  else all.push(docData);
  writeLocalFile(INTERNSHIP_ACHIEVEMENTS_FILE, all);

  // 3. Create Certificate in Prisma
  try {
    await prisma.certificate.create({
      data: {
        certificateNo: certId,
        studentId: studentUid,
        studentName,
        title: `CERTIFICATE OF INTERNSHIP COMPLETION`,
        eventName: `${companyName} - ${role}`,
        type: "INTERNSHIP_COMPLETION",
        status: "VERIFIED",
        metadata: JSON.stringify({
          internshipId,
          companyName,
          role,
          duration,
          stipendAmount,
          stipendVerified,
        }),
      },
    });
  } catch (certErr) {
    console.warn("Prisma internship cert create notice:", certErr);
  }

  // 4. Notification
  try {
    await prisma.notification.create({
      data: {
        userId: studentUid,
        title: `💼 Internship Verified & Published!`,
        message: `Your internship with ${companyName} (${role}) with stipend ₹${stipendAmount.toLocaleString()} has been officially verified! Certificate: ${certId}`,
        type: "INTERNSHIP",
        link: `/leaderboard?tab=internships`,
      },
    });
  } catch {}

  return {
    success: true,
    message: "Internship achievement verified and published to leaderboard!",
    achievement: docData,
  };
}
