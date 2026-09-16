import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateRegistrationNo, generateCertificateId } from "@/lib/utils";
import { verifyRazorpayPayment } from "@/lib/payment";
import { processReferralConversion } from "@/lib/referrals/service";
import { resolveHackathon } from "@/lib/hackathons/resolve-hackathon";
import { logHackathonOperation } from "@/lib/hackathons/diagnostics";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      logHackathonOperation({ channel: "HACKATHON_REGISTRATION", hackathonId: params.id, route: "/api/hackathons/[id]/register", operation: "authenticate", result: "unauthenticated" });
      return NextResponse.json({ error: "Please log in to register" }, { status: 401 });
    }

    const hackathon = await resolveHackathon(params.id);

    if (!hackathon) {
      logHackathonOperation({ channel: "HACKATHON_REGISTRATION", hackathonId: params.id, userId: session.userId, route: "/api/hackathons/[id]/register", operation: "resolve-hackathon", result: "not-found" });
      return NextResponse.json({ error: "Hackathon not found", hackathonId: params.id }, { status: 404 });
    }

    // 1. Strict server-enforced deadline check
    const now = new Date();
    if (now > new Date(hackathon.registrationDeadline)) {
      return NextResponse.json({ 
        error: "Registration deadline has closed for this hackathon. No new entries are permitted." 
      }, { status: 400 });
    }

    // 2. Duplicate registration check
    const existing = await prisma.hackathonRegistration.findFirst({
      where: {
        hackathonId: hackathon.id,
        userId: session.userId,
      },
    });

    if (existing) {
      return NextResponse.json({ 
        error: "You are already registered for this hackathon", 
        registrationNo: existing.registrationNo,
        registration: existing 
      }, { status: 409 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const isPaid = hackathon.entryFee > 0;
    let paymentRecordId: string | null = null;

    // 3. Paid hackathon payment verification
    if (isPaid) {
      const { orderId, paymentId, signature } = body;

      if (!signature || !orderId || !paymentId) {
        return NextResponse.json({ error: "Successful payment verification is required before registration." }, { status: 400 });
      }

      await verifyRazorpayPayment({ orderId, paymentId, signature });

      const payment = await prisma.payment.create({
        data: {
          orderId,
          paymentId,
          signature,
          userId: session.userId,
          hackathonId: hackathon.id,
          amount: hackathon.entryFee,
          status: "SUCCESS",
          gateway: "RAZORPAY",
          verifiedAt: new Date(),
        },
      });
      paymentRecordId = payment.id;
    }

    const regNo = generateRegistrationNo(hackathon.slug);

    // 4. Create confirmed registration
    const registration = await prisma.hackathonRegistration.create({
      data: {
        hackathonId: hackathon.id,
        userId: session.userId,
        registrationNo: regNo,
        paymentId: paymentRecordId,
        status: "CONFIRMED",
      },
    });

    // 5. Create in-app notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: "Hackathon Registration Confirmed 🎉",
        message: `You are officially registered for "${hackathon.title}". Your Registration Number is ${regNo}.`,
        type: "HACKATHON",
        link: `/hackathons/${hackathon.slug}`,
      },
    });

    // 6. Process Referral Conversion for Hackathon Registration (Free or Paid)
    try {
      await processReferralConversion({
        referredUid: session.userId,
        eventType: "HACKATHON_REGISTERED",
        amount: hackathon.entryFee || 0,
        metadata: {
          hackathonId: hackathon.id,
          hackathonTitle: hackathon.title,
          registrationId: registration.id,
          registrationNo: regNo,
          paymentId: paymentRecordId,
        },
      });
    } catch (refErr) {
      console.warn("Hackathon referral conversion notice:", refErr);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully registered for the hackathon!",
      registrationNo: regNo,
      registration,
    });
  } catch (error: any) {
    logHackathonOperation({ channel: "HACKATHON_REGISTRATION", hackathonId: params.id, route: "/api/hackathons/[id]/register", operation: "register", result: "error" });
    console.error("Hackathon Register Error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}

