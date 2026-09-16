import fs from "fs";
import path from "path";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { HackathonTeam, RoundStatus, TeamMemberItem } from "@/lib/hackathon-team-models";

const DATA_DIR = path.join(process.cwd(), ".data");
const TEAMS_FILE = path.join(DATA_DIR, "hackathon_teams.json");

function ensureFile(): HackathonTeam[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEAMS_FILE)) {
      fs.writeFileSync(TEAMS_FILE, JSON.stringify([]), "utf8");
      return [];
    }
    const raw = fs.readFileSync(TEAMS_FILE, "utf8");
    return JSON.parse(raw) as HackathonTeam[];
  } catch (err) {
    console.error("Local team storage read error:", err);
    return [];
  }
}

function writeTeams(teams: HackathonTeam[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2), "utf8");
  } catch (err) {
    console.error("Local team storage write error:", err);
  }
}

export async function getTeamsForHackathon(hackathonId: string): Promise<HackathonTeam[]> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
    const snap = await adminDb.collection(COLLECTIONS.HACKATHON_TEAMS)
      .where("hackathonId", "==", hackathonId)
      .where("status", "==", "ACTIVE")
      .get();
    const firestoreTeams: HackathonTeam[] = [];
    snap.forEach((d) => {
      firestoreTeams.push({ id: d.id, ...(d.data() as any) });
    });
    if (firestoreTeams.length > 0) {
      return firestoreTeams;
    }
  } catch (err: any) {
    console.warn("Firestore teams query notice (falling back to local):", err?.message);
  }

  // Fallback to local store
  const all = ensureFile();
  return all.filter((t) => (t.hackathonId === hackathonId || t.id.includes(hackathonId)) && t.status === "ACTIVE");
}

export async function findTeamByCodeOrToken(
  hackathonId: string,
  joinCode?: string,
  inviteToken?: string
): Promise<HackathonTeam | null> {
  const teams = await getTeamsForHackathon(hackathonId);

  const cleanCode = joinCode?.trim().toUpperCase();
  const cleanToken = inviteToken?.trim();

  return (
    teams.find((t) => {
      const codeMatch = cleanCode && t.joinCode?.trim().toUpperCase() === cleanCode;
      const tokenMatch = cleanToken && t.inviteToken?.trim() === cleanToken;
      return codeMatch || tokenMatch;
    }) || null
  );
}

export async function findUserTeam(hackathonId: string, userId: string): Promise<HackathonTeam | null> {
  const teams = await getTeamsForHackathon(hackathonId);
  return teams.find((t) => t.members?.some((m) => m.userId === userId)) || null;
}

export async function saveTeamDoc(team: HackathonTeam): Promise<boolean> {
  // 1. Try Firestore
  let fsSaved = false;
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
    await adminDb.collection(COLLECTIONS.HACKATHON_TEAMS).doc(team.id).set(removeUndefinedValues({
      ...team,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    fsSaved = true;
  } catch (err: any) {
    console.warn("Firestore save team notice (saving to local persistence):", err?.message);
  }

  // 2. Also save to local resilient store
  try {
    const all = ensureFile();
    const idx = all.findIndex((t) => t.id === team.id);
    const updatedTeam = { ...team, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      all[idx] = updatedTeam;
    } else {
      all.push(updatedTeam);
    }
    writeTeams(all);
    return true;
  } catch (err) {
    console.error("Failed to save team locally:", err);
    return fsSaved;
  }
}

export async function updateTeamSubmission(
  teamId: string,
  submission: NonNullable<HackathonTeam["submission"]>
): Promise<boolean> {
  const all = ensureFile();
  const team = all.find((t) => t.id === teamId);

  if (team) {
    team.submission = submission;
    await saveTeamDoc(team);
    return true;
  }

  // Try Firestore directly
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
    const snap = await adminDb.collection(COLLECTIONS.HACKATHON_TEAMS).doc(teamId).get();
    if (snap.exists) {
      const existing = snap.data() as HackathonTeam;
      existing.submission = submission;
      await saveTeamDoc(existing);
      return true;
    }
  } catch {}

  return false;
}

export async function updateTeamRoundStatus(
  teamId: string,
  roundStatus: RoundStatus,
  round?: number
): Promise<boolean> {
  const all = ensureFile();
  const team = all.find((t) => t.id === teamId);

  if (team) {
    team.roundStatus = roundStatus;
    if (round) team.round = round;
    await saveTeamDoc(team);
    return true;
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
    const snap = await adminDb.collection(COLLECTIONS.HACKATHON_TEAMS).doc(teamId).get();
    if (snap.exists) {
      const existing = snap.data() as HackathonTeam;
      existing.roundStatus = roundStatus;
      if (round) existing.round = round;
      await saveTeamDoc(existing);
      return true;
    }
  } catch {}

  return false;
}

export async function removeMemberFromTeam(
  teamId: string,
  memberUserId: string
): Promise<{ success: boolean; members?: TeamMemberItem[]; error?: string }> {
  const all = ensureFile();
  let team = all.find((t) => t.id === teamId);

  if (!team) {
    try {
      const adminDb = getAdminDb();
      if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
      const snap = await adminDb.collection(COLLECTIONS.HACKATHON_TEAMS).doc(teamId).get();
      if (snap.exists) {
        team = snap.data() as HackathonTeam;
      }
    } catch {}
  }

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  if (team.submission) {
    return { success: false, error: "Members cannot be removed after project submission" };
  }

  const updatedMembers = team.members.filter((m) => m.userId !== memberUserId);
  team.members = updatedMembers;
  await saveTeamDoc(team);

  return { success: true, members: updatedMembers };
}
