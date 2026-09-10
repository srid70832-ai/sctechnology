import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/payment";
import { 
  HackathonTeam, 
  TeamMemberItem, 
  computeTeamPaymentStatus 
} from "@/lib/hackathon-team-models";
import { findUserTeam, saveTeamDoc, getTeamsForHackathon } from "@/lib/team-storage";
import { processReferralConversion } from "@/lib/referrals/service";

/**
 * Creates an individual Razorpay payment order for a specific team member
 * Enforces per-participant fee calculation (e.g. ₹50 per person)
 */
export async function createTeamMemberOrder({
  hackathonId,
  teamId,
  userId,
  userEmail,
  userName,
}: {
  hackathonId: string;
  teamId?: string;
  userId: string;
  userEmail: string;
  userName: string;
}) {
  // 1. Fetch Hackathon details
  const hackathon = await prisma.hackathon.findFirst({
    where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  // 2. Strict deadline check
  if (new Date() > new Date(hackathon.registrationDeadline)) {
    throw new Error("Registration deadline has passed for this hackathon");
  }

  const entryFee = hackathon.entryFee;
  if (entryFee <= 0) {
    return {
      requiresPayment: false,
      amount: 0,
      orderId: null,
      message: "This hackathon is free to join.",
    };
  }

  // 3. Find user's team
  let team: HackathonTeam | null = null;
  if (teamId) {
    const teams = await getTeamsForHackathon(hackathon.id || hackathonId);
    team = teams.find((t) => t.id === teamId || t.teamId === teamId) || null;
  }
  if (!team) {
    team = await findUserTeam(hackathon.id || hackathonId, userId);
  }

  if (!team) {
    throw new Error("Team not found for the participant");
  }

  // 4. Verify participant is a member of the team
  const member = team.members.find((m) => m.userId === userId);
  if (!member) {
    throw new Error("User is not registered in this team");
  }

  if (member.paymentStatus === "PAID") {
    return {
      requiresPayment: false,
      alreadyPaid: true,
      amount: entryFee,
      orderId: member.orderId || null,
      message: "You have already completed payment for this hackathon.",
    };
  }

  // 5. Generate unique receipt and Razorpay order for this participant
  const receipt = `hack_tm_${team.teamId}_${userId.slice(0, 6)}_${Date.now()}`;
  const order = await createRazorpayOrder({
    amount: entryFee,
    receipt,
    notes: {
      hackathonId: hackathon.id,
      hackathonTitle: hackathon.title,
      teamId: team.id,
      teamCode: team.teamId,
      teamName: team.name,
      userId,
      userEmail,
      userName,
      type: "HACKATHON_INDIVIDUAL_MEMBER_FEE",
    },
  });

  // 6. Record payment intent in Firestore
  try {
    await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      userId,
      userEmail,
      userName,
      hackathonId: hackathon.id,
      teamId: team.id,
      teamCode: team.teamId,
      razorpayOrderId: order.orderId,
      amount: entryFee,
      currency: "INR",
      status: "CREATED",
      type: "HACKATHON_TEAM_MEMBER_FEE",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore payment log notice:", err);
  }

  return {
    requiresPayment: true,
    alreadyPaid: false,
    orderId: order.orderId,
    amount: order.amount, // in paise
    amountInINR: entryFee,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_SyQsxxuaEPVQuS",
    hackathonTitle: hackathon.title,
    teamName: team.name,
    memberRole: member.role,
  };
}

/**
 * Verifies Razorpay payment signature for an individual team member
 * Atomically updates member payment status and recalculates team payment status
 */
export async function verifyTeamMemberPayment({
  hackathonId,
  teamId,
  userId,
  userEmail,
  userName,
  orderId,
  paymentId,
  signature,
}: {
  hackathonId: string;
  teamId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  // 1. Fetch Hackathon details
  const hackathon = await prisma.hackathon.findFirst({
    where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  // 2. Validate Razorpay signature
  const isValid = verifyRazorpaySignature({
    orderId,
    paymentId,
    signature,
  });

  if (!isValid) {
    throw new Error("Invalid Razorpay payment signature. Payment cannot be verified.");
  }

  // 3. Find team
  let team: HackathonTeam | null = null;
  if (teamId) {
    const teams = await getTeamsForHackathon(hackathon.id || hackathonId);
    team = teams.find((t) => t.id === teamId || t.teamId === teamId) || null;
  }
  if (!team) {
    team = await findUserTeam(hackathon.id || hackathonId, userId);
  }

  if (!team) {
    throw new Error("Team not found for the participant");
  }

  // 4. Update member payment status
  const memberIndex = team.members.findIndex((m) => m.userId === userId);
  if (memberIndex === -1) {
    throw new Error("Participant is not a member of this team");
  }

  const updatedMembers = [...team.members];
  const member = updatedMembers[memberIndex];

  member.paymentStatus = "PAID";
  member.paymentId = paymentId;
  member.orderId = orderId;
  member.paymentAmount = hackathon.entryFee;
  member.paidAt = new Date().toISOString();

  // 5. Recompute team payment status
  const stats = computeTeamPaymentStatus({ ...team, members: updatedMembers }, hackathon.entryFee);

  const updatedTeam: HackathonTeam = {
    ...team,
    members: updatedMembers,
    paymentStatus: stats.paymentStatus,
    paidMemberCount: stats.paidMemberCount,
    totalPaidAmount: stats.totalPaidAmount,
    updatedAt: new Date().toISOString(),
  };

  await saveTeamDoc(updatedTeam);

  // 6. Record Payment in Prisma
  let paymentRecordId: string | null = null;
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId,
        paymentId,
        signature,
        userId,
        hackathonId: hackathon.id,
        amount: hackathon.entryFee,
        currency: "INR",
        status: "SUCCESS",
        gateway: "RAZORPAY",
        verifiedAt: new Date(),
      },
    });
    paymentRecordId = payment.id;
  } catch (err) {
    console.warn("Prisma payment record sync notice:", err);
  }

  // 7. Update Prisma registration if existing or create
  try {
    const reg = await prisma.hackathonRegistration.findFirst({
      where: {
        hackathonId: hackathon.id,
        userId,
      },
    });

    if (reg) {
      await prisma.hackathonRegistration.update({
        where: { id: reg.id },
        data: {
          paymentId: paymentRecordId,
          status: "CONFIRMED",
        },
      });
    }
  } catch (prismaErr) {
    console.warn("Prisma registration status sync notice:", prismaErr);
  }

  // 8. Trigger in-app notification
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: "Hackathon Entry Fee Verified ✅",
        message: `Your individual payment of ₹${hackathon.entryFee} for team "${team.name}" in "${hackathon.title}" has been verified!`,
        type: "HACKATHON",
        link: `/hackathons/${hackathon.slug || hackathon.id}?tab=team`,
      },
    });
  } catch (notifErr) {
    console.warn("Notification notice:", notifErr);
  }

  // 9. Process Referral Conversion for Team Member Payment
  try {
    await processReferralConversion({
      referredUid: userId,
      eventType: "HACKATHON_REGISTERED",
      amount: hackathon.entryFee,
      metadata: {
        hackathonId: hackathon.id,
        hackathonTitle: hackathon.title,
        teamId: team.id,
        teamName: team.name,
        paymentId,
        orderId,
      },
    });
  } catch (refErr) {
    console.warn("Referral conversion processing notice:", refErr);
  }

  return {
    success: true,
    message: "Individual team member payment verified successfully!",
    memberPaymentStatus: "PAID",
    teamPaymentStatus: stats.paymentStatus,
    paidMemberCount: stats.paidMemberCount,
    totalMembers: updatedMembers.length,
    totalPaidAmount: stats.totalPaidAmount,
    team: updatedTeam,
  };
}
