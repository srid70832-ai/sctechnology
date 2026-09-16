import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { 
  createTeamMemberOrder, 
  verifyTeamMemberPayment,
  createIndividualRegistrationOrder,
} from "@/lib/hackathons/team-payment-service";
import { logHackathonOperation } from "@/lib/hackathons/diagnostics";

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
      logHackathonOperation({ channel: "HACKATHON_PAYMENT", hackathonId: params.id, route: "/api/hackathons/[id]/team/member-payment", operation: "authenticate", result: "unauthenticated" });
      return NextResponse.json({ error: "Please log in to make a payment" }, { status: 401 });
    }

    const hackathonId = params.id;
    const body = await req.json();
    const { action = "create-order", teamId, orderId, paymentId, signature } = body;

    if (action === "create-individual-order") {
      const result = await createIndividualRegistrationOrder({
        hackathonId,
        userId,
        userEmail,
        userName,
      });
      logHackathonOperation({ channel: "HACKATHON_PAYMENT", hackathonId, userId, route: "/api/hackathons/[id]/team/member-payment", operation: action, result: "order-created" });
      return NextResponse.json(result);
    }

    if (action === "create-order") {
      const result = await createTeamMemberOrder({
        hackathonId,
        teamId,
        userId,
        userEmail,
        userName,
      });
      logHackathonOperation({ channel: "HACKATHON_PAYMENT", hackathonId, userId, route: "/api/hackathons/[id]/team/member-payment", operation: action, result: "order-created" });
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
      logHackathonOperation({ channel: "HACKATHON_PAYMENT", hackathonId, userId, route: "/api/hackathons/[id]/team/member-payment", operation: action, result: "payment-verified" });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    logHackathonOperation({ channel: "HACKATHON_PAYMENT", hackathonId: params.id, route: "/api/hackathons/[id]/team/member-payment", operation: "payment", result: "error" });
    console.error("Team Member Payment Error:", error);
    const message = error?.message || "Payment processing failed";
    const status = message.includes("not found") ? 404 : message.includes("deadline") ? 400 : 500;
    return NextResponse.json({ error: message, ...(status === 404 ? { hackathonId: params.id } : {}) }, { status });
  }
}
