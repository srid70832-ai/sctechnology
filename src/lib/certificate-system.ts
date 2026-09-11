import { formatDate } from "@/lib/utils";
import crypto from "crypto";
import { COLLECTIONS, queryFirestoreDocs, getFirestoreDoc, saveFirestoreDoc } from "@/lib/firestore";
import { where, orderBy } from "firebase/firestore";

// ==========================================
// 1. CERTIFICATE TYPES & ENUMS
// ==========================================

export type CertificateType =
  | "ROUND_1"
  | "ROUND_2"
  | "PARTICIPATION"
  | "WINNER"
  | "INTERNSHIP"
  | "PROJECT"
  | "COURSE";

export type WinnerPosition =
  | "Winner"
  | "1st Prize"
  | "2nd Prize"
  | "3rd Prize"
  | "Special Recognition"
  | "Lead Innovator"
  | "Finalist";

export type CertificateStatus = "VALID" | "REVOKED";

export interface CertificateMetadata {
  studentName: string;
  studentEmail?: string;
  certificateType: CertificateType;
  achievementType: string;
  organization: string; // "SC TECH"
  eventId?: string;
  eventName?: string;
  roundNumber?: number;
  winnerPosition?: WinnerPosition;
  internshipId?: string;
  internshipTitle?: string;
  companyName?: string;
  department?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  completionDate?: string;
  projectId?: string;
  projectName?: string;
  projectDomain?: string;
  projectDescription?: string;
  skills?: string[];
  courseId?: string;
  courseName?: string;
  courseProvider?: string;
  verificationCode: string;
  templateVersion: string;
  issuedBy: {
    founder: string; // "Charudeshna"
    coFounder: string; // "Sridharan"
  };
  revocationReason?: string;
  revokedAt?: string;
  reissuedAt?: string;
}

export interface CertificateModelData {
  id: string;
  certificateNo: string;
  studentId: string;
  studentName: string;
  title: string;
  eventName: string;
  type: string;
  issueDate: Date | string;
  qrCodeData?: string | null;
  pdfUrl?: string | null;
  status: CertificateStatus | string;
  metadata?: string | null;
  createdAt?: Date | string;
  parsedMetadata?: CertificateMetadata;
}

// ==========================================
// 2. CERTIFICATE ID GENERATOR
// ==========================================

export function generateCertificateId(type: CertificateType): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random

  let prefix = "SC-CERT";
  switch (type) {
    case "ROUND_1":
      prefix = "SC-R1";
      break;
    case "ROUND_2":
      prefix = "SC-R2";
      break;
    case "PARTICIPATION":
      prefix = "SC-PART";
      break;
    case "WINNER":
      prefix = "SC-WIN";
      break;
    case "INTERNSHIP":
      prefix = "SC-INT";
      break;
    case "COURSE":
      prefix = "SC-COURSE";
      break;
    case "PROJECT":
      prefix = "SC-PROJ";
      break;
  }

  return `${prefix}-${year}-${randomSuffix}`;
}

export function generateVerificationCode(certificateNo: string, studentId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "sctech_cert_secret_key_2026";
  const raw = `${certificateNo}:${studentId}:${Date.now()}:${secret}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16).toUpperCase();
}

// ==========================================
// 3. OFFICIAL WORDING & TITLES BUILDER
// ==========================================

export function getCertificateWording(
  type: CertificateType,
  data: {
    studentName: string;
    eventName?: string;
    roundNumber?: number;
    winnerPosition?: WinnerPosition;
    internshipTitle?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    projectName?: string;
    projectDomain?: string;
    technologies?: string[];
    courseName?: string;
    courseProvider?: string;
    duration?: string;
    completionDate?: string;
  }
): {
  headerTitle: string;
  subHeaderTitle: string;
  bodyParagraph: string;
  achievementSummary: string;
  badgeText: string;
} {
  const name = data.studentName;
  const event = data.eventName || "SC TECH National Innovation Challenge 2026";
  const date = data.completionDate || formatDate(new Date());

  switch (type) {
    case "ROUND_1":
      return {
        headerTitle: "CERTIFICATE OF ROUND 1 COMPLETION",
        subHeaderTitle: "HACKATHON MILESTONE ADVANCEMENT",
        bodyParagraph: `This certificate is proudly presented to ${name} in recognition of successfully qualifying and completing Round 1 in the ${event} organized by SC TECH.`,
        achievementSummary: `Successfully Qualified Round 1 • ${event}`,
        badgeText: "ROUND 1 COMPLETED",
      };

    case "ROUND_2":
      return {
        headerTitle: "CERTIFICATE OF ROUND 2 COMPLETION",
        subHeaderTitle: "ADVANCED STAGE SELECTION & CODE REVIEW",
        bodyParagraph: `This certificate is proudly presented to ${name} in recognition of exceptional technical proficiency and successfully qualifying and completing Round 2 in the ${event} organized by SC TECH.`,
        achievementSummary: `Successfully Qualified Round 2 • ${event}`,
        badgeText: "ROUND 2 COMPLETED",
      };

    case "PARTICIPATION":
      return {
        headerTitle: "CERTIFICATE OF PARTICIPATION",
        subHeaderTitle: "OFFICIAL EVENT PARTICIPATION CREDENTIAL",
        bodyParagraph: `This certificate is proudly presented to ${name} in recognition of their active participation, dedication, and collaborative engineering in ${event} organized by SC TECH.`,
        achievementSummary: `Official Participant • ${event}`,
        badgeText: "PARTICIPANT",
      };

    case "WINNER": {
      const pos = data.winnerPosition || "Winner";
      return {
        headerTitle: "CERTIFICATE OF EXCELLENCE",
        subHeaderTitle: `WINNER AWARD • ${pos.toUpperCase()}`,
        bodyParagraph: `This certificate is proudly presented to ${name} for outstanding innovation, technical excellence, and securing ${pos} in ${event} organized by SC TECH.`,
        achievementSummary: `${pos} • ${event}`,
        badgeText: `🏆 ${pos.toUpperCase()}`,
      };
    }

    case "INTERNSHIP": {
      const intTitle = data.internshipTitle || "Software Engineering";
      const company = data.companyName || "SC TECH";
      const start = data.startDate || "15 September 2026";
      const end = data.endDate || "15 December 2026";
      const proj = data.projectName ? ` and successfully completed the project "${data.projectName}"` : "";

      return {
        headerTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
        subHeaderTitle: "PRACTICAL INDUSTRY ENGINEERING & MENTORSHIP",
        bodyParagraph: `This is to certify that ${name} has successfully completed the ${intTitle} internship at ${company} during the period ${start} to ${end}${proj}. During the internship, the candidate demonstrated technical excellence, consistency, and professional execution.`,
        achievementSummary: `${intTitle} Internship • ${company}`,
        badgeText: "INTERNSHIP COMPLETED",
      };
    }

    case "COURSE": {
      const course = data.courseName || "Cloud Architecture & Full Stack Specialization";
      const provider = data.courseProvider || "SC TECH Academy";

      return {
        headerTitle: "CERTIFICATE OF COURSE COMPLETION",
        subHeaderTitle: "TECHNICAL CURRICULUM MASTERY & ASSESSMENT",
        bodyParagraph: `This certificate is awarded to ${name} for successfully completing ${course} from ${provider} and demonstrating successful completion of all required learning activities, assessments, and practical blueprints on ${date}.`,
        achievementSummary: `${course} • ${provider}`,
        badgeText: "COURSE COMPLETED",
      };
    }

    case "PROJECT": {
      const proj = data.projectName || "Enterprise Distributed Platform";
      const domain = data.projectDomain || "Software Engineering";
      const tech = data.technologies && data.technologies.length > 0 ? data.technologies.join(", ") : "Modern Web & Distributed Systems";

      return {
        headerTitle: "CERTIFICATE OF PROJECT COMPLETION",
        subHeaderTitle: "REAL-WORLD CAPSTONE DEVELOPMENT & VERIFICATION",
        bodyParagraph: `This certificate is awarded to ${name} in recognition of successfully completing the project "${proj}" in the domain of ${domain}, using ${tech} on ${date}.`,
        achievementSummary: `Project "${proj}" • ${domain}`,
        badgeText: "PROJECT COMPLETED",
      };
    }

    default:
      return {
        headerTitle: "CERTIFICATE OF ACHIEVEMENT",
        subHeaderTitle: "OFFICIAL SC TECH VERIFIED CREDENTIAL",
        bodyParagraph: `This certificate is presented to ${name} in recognition of successful achievement at SC TECH on ${date}.`,
        achievementSummary: "Verified Credential • SC TECH",
        badgeText: "VERIFIED",
      };
  }
}

// ==========================================
// 4. DATABASE HELPERS & REPOSITORY
// ==========================================

export async function findCertificateByNo(certificateNo: string): Promise<CertificateModelData | null> {
  const norm = certificateNo.trim();
  try {
    const certsByNo = await queryFirestoreDocs(COLLECTIONS.CERTIFICATES, where("certificateNo", "==", norm));
    let cert = certsByNo[0];
    if (!cert) {
      cert = await getFirestoreDoc(COLLECTIONS.CERTIFICATES, norm);
    }

    if (!cert) return null;

    let parsedMetadata: CertificateMetadata | undefined = undefined;
    if (cert.metadata) {
      try {
        parsedMetadata = typeof cert.metadata === "string" ? JSON.parse(cert.metadata) : cert.metadata;
      } catch {
        // ignore parse error
      }
    }

    return {
      ...cert,
      parsedMetadata,
    };
  } catch (err) {
    console.error("findCertificateByNo error:", err);
    return null;
  }
}

export async function findStudentCertificates(studentId: string): Promise<CertificateModelData[]> {
  try {
    const certs = await queryFirestoreDocs(COLLECTIONS.CERTIFICATES, where("studentId", "==", studentId));

    return certs.map((c) => {
      let parsedMetadata: CertificateMetadata | undefined = undefined;
      if (c.metadata) {
        try {
          parsedMetadata = typeof c.metadata === "string" ? JSON.parse(c.metadata) : c.metadata;
        } catch {
          // ignore
        }
      }
      return { ...c, parsedMetadata };
    });
  } catch (err) {
    console.error("findStudentCertificates error:", err);
    return [];
  }
}
