import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { 
  createTeamMemberOrder, 
  verifyTeamMemberPayment 
} from "@/lib/hackathons/team-payment-service";

export const dynamic = "force-dynamic";

/**
 * POST: Create an individual payment order or verify payment for a team member
 * Actions:
 *  - "create-order": Generates Razorpay Order for hackathon.entryFee
 *  - "verify": Verifies signature and updates member payment status
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyFirebaseToken(req);
    let userId = authResult.uid;
    let userEmail = authResult.email || "";
    let userName = authResult.name || "Student";

    if (!userId) {
      const session = await getServerSession(req);
      if (session) {
        userId = session.userId;
        userEmail = session.email || "";
        userName = session.name || "Student";
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Please log in to make a payment" }, { status: 401 });
    }

    const hackathonId = params.id;
    const body = await req.json();
    const { action = "create-order", teamId, orderId, paymentId, signature } = body;

    if (action === "create-order") {
      const result = await createTeamMemberOrder({
        hackathonId,
        teamId,
        userId,
        userEmail,
        userName,
      });
      return NextResponse.json(result);
    }

    if (action === "verify") {
      if (!orderId || !paymentId) {
        return NextResponse.json({ error: "orderId and paymentId are required for verification" }, { status: 400 });
      }

      const result = await verifyTeamMemberPayment({
        hackathonId,
        teamId,
        userId,
        userEmail,
        userName,
        orderId,
        paymentId,
        signature: signature || "",
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Team Member Payment Error:", error);
    return NextResponse.json({ error: error?.message || "Payment processing failed" }, { status: 500 });
  }
}
