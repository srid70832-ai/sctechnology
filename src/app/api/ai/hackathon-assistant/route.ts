import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { prisma } from "@/lib/prisma";
import { formatISTDate } from "@/lib/platform-models";
import { HackathonTeam } from "@/lib/hackathon-team-models";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest"
];

async function callGemini(contents: any[], systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.find((p: any) => typeof p.text === "string");
        if (textPart?.text) {
          return textPart.text;
        }
      } else {
        const errText = await res.text();
        console.warn(`Gemini model ${model} failed with ${res.status}:`, errText.slice(0, 200));
        lastError = new Error(`Gemini ${model} HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini model endpoints failed");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { hackathonId, messages } = body;

    if (!hackathonId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "hackathonId and messages array are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Hackathon details from Firestore and Prisma
    let hackathon: any = null;
    try {
      const hSnap = await getDoc(doc(db, COLLECTIONS.HACKATHONS, hackathonId));
      if (hSnap.exists()) {
        hackathon = hSnap.data();
      }
    } catch {}

    if (!hackathon) {
      hackathon = await prisma.hackathon.findFirst({
        where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
      });
    }

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    // 2. Fetch active problem statements if available
    let problemStatementsList: string[] = [];
    try {
      const psRef = collection(db, COLLECTIONS.PROBLEM_STATEMENTS);
      const psSnap = await getDocs(psRef);
      psSnap.forEach((d) => {
        const p = d.data();
        if (p.hackathonId === hackathonId || hackathon.problemStatementIds?.includes(d.id)) {
          problemStatementsList.push(`• Title: ${p.title}\n  Description: ${p.shortDescription || p.description}\n  Suggested Stack: ${Array.isArray(p.technologySuggestions) ? p.technologySuggestions.join(", ") : "Any"}`);
        }
      });
    } catch {}

    // 3. Check student team/registration status
    let studentStatus = "Guest / Unauthenticated";
    let teamDetails = "No active team";

    if (session) {
      studentStatus = `Authenticated Student: ${session.name} (${session.email})`;

      try {
        const teamsRef = collection(db, COLLECTIONS.HACKATHON_TEAMS);
        const qTeams = query(
          teamsRef,
          where("hackathonId", "==", hackathon.id || hackathonId),
          where("status", "==", "ACTIVE")
        );
        const tSnap = await getDocs(qTeams);
        for (const td of tSnap.docs) {
          const t = td.data() as HackathonTeam;
          if (t.members?.some((m) => m.userId === session.userId)) {
            const memberNames = t.members.map((m) => `${m.name} (${m.role})`).join(", ");
            teamDetails = `Team: "${t.name}" (ID: ${t.teamId}, Join Code: ${t.joinCode}, Round: ${t.roundStatus}). Members: [${memberNames}]. Submitted: ${t.submission ? `Yes ("${t.submission.projectName}")` : "No"}`;
            break;
          }
        }
      } catch {}
    }

    // 4. Build Context-Aware System Prompt
    const systemPrompt = `You are the official 24/7 SC TECH Hackathon AI Assistant & Technical Mentor.
You are embedded directly on the SC TECH Hackathon portal to help participants succeed.

Current Hackathon Knowledge:
- Title: ${hackathon.title}
- Tagline / Brief: ${hackathon.shortDescription || hackathon.tagLine || "National Level Innovation Hackathon"}
- Start Date: ${formatISTDate(hackathon.startDate)}
- End Date / Submission Deadline: ${formatISTDate(hackathon.endDate)}
- Registration Deadline: ${formatISTDate(hackathon.registrationDeadline)}
- Registration Fee: ₹${hackathon.registrationFee ?? hackathon.entryFee ?? 0}
- Prize Pool: ₹${(hackathon.prizePool ?? 50000).toLocaleString("en-IN")}
- Registration Mode: ${hackathon.registrationMode || "Individual & Team (Both)"}
- Team Size: Min ${hackathon.minTeamSize || 2}, Max ${hackathon.maxTeamSize || 4} members
- Rules: ${Array.isArray(hackathon.rules) ? hackathon.rules.join("; ") : hackathon.rules || "Standard hackathon code of conduct."}
- Judging Rubric: ${typeof hackathon.judgingCriteria === "string" ? hackathon.judgingCriteria : JSON.stringify(hackathon.judgingCriteria || [])}
- Submission Method: ${hackathon.submissionMethod === "GOOGLE_FORM" ? `Google Form (${hackathon.googleFormUrl})` : "Direct website submission (GitHub repo + Live URL + Video)"}

Published Problem Statements:
${problemStatementsList.length > 0 ? problemStatementsList.join("\n\n") : (hackathon.problemStatement || "Problem statements will be officially unlocked at the hackathon start time.")}

Current User State:
- Student: ${studentStatus}
- Team Status: ${teamDetails}

Your Core Instructions & Persona:
1. Always be supportive, encouraging, technically insightful, and precise.
2. If asked about deadlines, always mention the Indian Standard Time (IST) timestamp and remind them of submission requirements.
3. If asked about team registration or team codes, explain that leaders can invite members via the 6-character Join Code or Invite Link from their Team Dashboard tab. Remind them that each student can belong to only one team per hackathon.
4. For project idea or technical questions, provide modern architecture recommendations (e.g. Next.js, FastAPI, Node.js, AI/ML APIs, PostgreSQL, Tailwind CSS) aligned with the judging criteria.
5. NEVER invent unreleased problem statements or false prizes.
6. Format your replies neatly using GitHub Markdown (bolding, lists, code snippets). Keep answers concise and readable.`;

    // 5. Format message turns for Gemini
    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 6. Call Gemini
    const reply = await callGemini(geminiContents, systemPrompt);

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Hackathon AI Assistant Error:", error);
    return NextResponse.json(
      { 
        error: "Hackathon AI is temporarily busy. Please ask again in a moment.",
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}
