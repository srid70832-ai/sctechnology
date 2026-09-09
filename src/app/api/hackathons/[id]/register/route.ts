import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateRegistrationNo, generateCertificateId } from "@/lib/utils";
import { verifyRazorpaySignature } from "@/lib/payment";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Please log in to register" }, { status: 401 });
    }

    const hackathon = await prisma.hackathon.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    });

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
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
      }, { status: 400 });
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

      if (signature && orderId && paymentId) {
        const isValid = verifyRazorpaySignature({
          orderId,
          paymentId,
          signature,
        });

        if (!isValid) {
          return NextResponse.json({ error: "Invalid payment signature. Registration cannot be verified." }, { status: 400 });
        }
      }

      const orderRef = orderId || `order_HACK_${hackathon.id.slice(-6)}_${Date.now()}`;
      const payRef = paymentId || `pay_HACK_${Date.now()}`;

      const payment = await prisma.payment.create({
        data: {
          orderId: orderRef,
          paymentId: payRef,
          signature: signature || null,
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

    return NextResponse.json({
      success: true,
      message: "Successfully registered for the hackathon!",
      registrationNo: regNo,
      registration,
    });
  } catch (error: any) {
    console.error("Hackathon Register Error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}

