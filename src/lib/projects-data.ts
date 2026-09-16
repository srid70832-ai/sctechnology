export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  problemStatement: string;
  solution: string;
  keyFeatures: string[];
  technologyStack: string[];
  category: 
    | "AI / Machine Learning"
    | "Generative AI"
    | "Full Stack Development"
    | "Cybersecurity"
    | "Cloud Computing"
    | "FinTech"
    | "EdTech"
    | "HealthTech"
    | "E-Commerce"
    | "IoT"
    | "Data Analytics"
    | "Blockchain/Web3"
    | "Computer Vision"
    | "Automation"
    | "Developer Tools"
    | "Smart Campus"
    | "Social Impact"
    | "Business Applications";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDuration: string;
  learningOutcomes: string[];
  prerequisites: string[];
  architecture: string;
  installationSteps: string[];
  environmentVariables: Record<string, string>;
  databaseSchema: string;
  apiDocumentation: { method: string; endpoint: string; description: string }[];
  folderStructure: string;
  deploymentGuide: string;
  testingGuide: string;
  sourceCodeFileName: string;
  sourceCodeSnippet: string;
  isPremium: boolean;
  accessLevel: "PREMIUM_399" | "FREE";
  downloadCount: number;
  published: boolean;
}

export const REAL_WORLD_PROJECTS: ProjectData[] = [
  // ==========================================
  // 1. ADVANCED PROJECTS (10 Projects)
  // ==========================================
  {
    id: "proj-01-ai-recruitment",
    slug: "ai-powered-recruitment-and-skill-matcher",
    title: "AI-Powered Recruitment & Skill Matching Platform",
    shortDescription: "Enterprise talent matching system with automated resume parsing, semantic embedding search, and objective interview question generation.",
    fullDescription: "An end-to-end recruitment intelligence platform that extracts candidate competencies from unstructured PDF resumes using Gemini Vision and NLP pipelines. Vector embeddings are indexed in Firestore Vector Search / Pinecone to calculate cosine similarity against job descriptions, eliminating unconscious bias and speeding up hiring pipelines.",
    problemStatement: "Traditional keyword matching in Applicant Tracking Systems (ATS) misses over 70% of qualified candidates who use non-standard terminology or varied resume formatting.",
    solution: "A vector-driven talent matching engine that computes semantic similarity scores, extracts validated skill graphs, and automatically drafts tailored technical interview questions based on candidate gaps.",
    keyFeatures: [
      "Zero-latency PDF/Docx multi-format resume parser using OCR and Gemini NLP",
      "Semantic vector matching using 768-dimensional text embeddings",
      "Dynamic skill gap visualization radar chart comparing candidate vs job requisites",
      "Automated technical interview question generator with rubric scoring",
      "Multi-stage candidate pipeline Kanban board with automated email dispatch",
      "Bias-free blinded resume review mode anonymizing demographic identifiers",
      "Real-time recruiter collaboration and candidate interview notes",
      "Enterprise audit logging for hiring compliance and candidate consent"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Gemini 1.5 Flash", "LangChain", "Firebase Auth", "Cloud Firestore", "Vector Embeddings", "Node.js"],
    category: "AI / Machine Learning",
    difficulty: "ADVANCED",
    estimatedDuration: "8-12 Weeks",
    learningOutcomes: [
      "Master text embedding generation and cosine similarity calculation",
      "Build complex OCR and document extraction microservices",
      "Design accessible Kanban boards with optimistic UI updates in React",
      "Implement role-based authorization for recruiters, interviewers, and candidates"
    ],
    prerequisites: ["TypeScript Proficiency", "REST & Vector API basics", "Next.js App Router"],
    architecture: `[Candidate / Recruiter UI] 
          ↓ (Next.js 14 Client)
[Next.js Server Actions & API Routes]
          ↓
[Gemini 1.5 Embedding & Extraction Pipeline]
          ↓
[Cloud Firestore (Data & Candidate Vectors)] ↔ [Firebase Auth & Storage]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/ai-recruitment-platform.git",
      "cd ai-recruitment-platform",
      "npm install",
      "cp .env.example .env.local (Fill Firebase & Gemini API keys)",
      "npm run dev (Starts local development server on http://localhost:3000)"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "NEXT_PUBLIC_FIREBASE_API_KEY": "your_firebase_api_key",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "your_firebase_project_id",
      "FIREBASE_ADMIN_PRIVATE_KEY": "your_firebase_admin_key"
    },
    databaseSchema: `Collections:
- jobs/{jobId}: { title, department, requiredSkills: [], minExperience, embeddingVector: [] }
- candidates/{candidateId}: { name, email, resumePdfUrl, extractedSkills: [], score: number }
- applications/{appId}: { jobId, candidateId, matchScore, status: "REVIEW" | "INTERVIEW" | "OFFER" }
- interviews/{interviewId}: { candidateId, questions: [], scores: {} }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/resumes/parse", description: "Uploads and extracts structured skill JSON from resume PDF." },
      { method: "POST", endpoint: "/api/matching/score", description: "Computes cosine match similarity between job description and candidate profile." },
      { method: "POST", endpoint: "/api/interviews/generate-questions", description: "Generates tailored technical interview questions based on skill gaps." }
    ],
    folderStructure: `ai-recruitment/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (recruiter)/dashboard/
│   │   ├── jobs/[id]/candidates/
│   │   └── api/resumes/parse/
│   ├── components/
│   │   ├── kanban/
│   │   ├── resume-viewer/
│   │   └── skill-radar/
│   └── lib/
│       ├── gemini-extractor.ts
│       └── vector-math.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy frontend on Vercel and link Firebase Cloud Firestore backend with CORS enabled for resume file uploads.",
    testingGuide: "Run 'npm test' for Jest unit tests covering vector similarity calculations and resume parsing schemas.",
    sourceCodeFileName: "ai-recruitment-platform-v1.0.zip",
    sourceCodeSnippet: `// lib/gemini-extractor.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseResumeWithAI(pdfBuffer: Buffer) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Extract candidate skills, years of experience, and education as strict JSON.";
  const result = await model.generateContent([prompt, { inlineData: { data: pdfBuffer.toString("base64"), mimeType: "application/pdf" } }]);
  return JSON.parse(result.response.text());
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 412,
    published: true,
  },

  {
    id: "proj-02-fraud-detection",
    slug: "real-time-fraud-detection-engine",
    title: "Real-Time Financial Fraud Detection & Risk Scoring Engine",
    shortDescription: "High-throughput financial transaction monitoring engine detecting velocity anomalies, geographic discrepancies, and synthetic identity fraud.",
    fullDescription: "A production-grade fraud risk scoring engine built for payment processors. Evaluates incoming transaction payloads against sliding-window velocity rules, geographic impossibility checks, device fingerprinting, and an isolation forest anomaly detection model in under 50ms.",
    problemStatement: "Digital payment fraud accounts for over $30 billion in annual losses. Traditional batch fraud reviews are too slow to prevent authorized push payment (APP) fraud in real time.",
    solution: "A sub-50ms streaming risk evaluation pipeline that assigns real-time risk scores (0-100), executes automated step-up 2FA challenges, and flags suspicious accounts for AML review.",
    keyFeatures: [
      "Sub-50ms real-time transaction risk scoring pipeline",
      "Sliding window velocity checks (e.g., >3 transactions in 60 seconds)",
      "Haversine geographic speed anomaly detection (impossible travel velocity)",
      "Device fingerprinting and IP reputation scoring",
      "Rule engine with dynamic admin threshold configuration",
      "Interactive fraud analyst investigation dashboard with risk drilldowns",
      "Automated webhook dispatches for payment freezing / step-up auth",
      "Audit trail compliant with PCI-DSS guidelines"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Node.js", "Redis / Upstash", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "FinTech",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Build real-time velocity counters with Redis sliding windows",
      "Implement Haversine distance equations for geographic anomaly detection",
      "Design fault-tolerant webhook distribution architectures",
      "Structure PCI-DSS compliant data minimization pipelines"
    ],
    prerequisites: ["Node.js Backend", "Redis caching concepts", "REST APIs"],
    architecture: `[Payment Gateway] 
       ↓ (Transaction Payload POST)
[Risk Engine Gateway]
       ↓
[Parallel Rule Evaluators: Velocity + GeoVelocity + DeviceReputation]
       ↓
[Decision Engine (ALLOW / STEP_UP / REJECT)] 
       ↓
[Cloud Firestore & Real-Time Analyst Dashboard]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/fraud-detection-engine.git",
      "cd fraud-detection-engine",
      "npm install",
      "cp .env.example .env.local",
      "npm run dev"
    ],
    environmentVariables: {
      "REDIS_URL": "redis://localhost:6379",
      "FIREBASE_PROJECT_ID": "scmain-b2cde",
      "WEBHOOK_SECRET": "your_secure_signing_secret"
    },
    databaseSchema: `Collections:
- transactions/{txId}: { userId, amount, currency, ipAddress, location: { lat, lng }, riskScore, decision }
- fraudRules/{ruleId}: { ruleName, weight, threshold, enabled: boolean }
- alerts/{alertId}: { transactionId, triggeredRules: [], status: "PENDING" | "RESOLVED" }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/evaluate-transaction", description: "Evaluates risk payload and returns decision score within 50ms." },
      { method: "GET", endpoint: "/api/analyst/alerts", description: "Streams high-risk flagged transactions for compliance investigation." }
    ],
    folderStructure: `fraud-engine/
├── src/
│   ├── rules/
│   │   ├── velocity-check.ts
│   │   ├── geo-impossible.ts
│   │   └── device-trust.ts
│   ├── engine/
│   │   └── risk-evaluator.ts
│   └── app/
│       ├── api/evaluate-transaction/
│       └── (analyst)/dashboard/
├── package.json
└── README.md`,
    deploymentGuide: "Containerize via Docker and deploy on AWS ECS or Google Cloud Run with serverless Redis cache.",
    testingGuide: "Run 'npm test' for scenario simulations with synthetic velocity bursts and impossible travel geolocation vectors.",
    sourceCodeFileName: "fraud-detection-engine-v1.0.zip",
    sourceCodeSnippet: `// rules/geo-impossible.ts
export function checkGeoImpossibility(prevLocation: { lat: number, lng: number, time: number }, currLocation: { lat: number, lng: number, time: number }) {
  const distanceKm = haversineDistance(prevLocation, currLocation);
  const hoursDiff = (currLocation.time - prevLocation.time) / (1000 * 60 * 60);
  const speedKmh = distanceKm / hoursDiff;
  return speedKmh > 900; // Impossible airplane travel velocity flag
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 388,
    published: true,
  },

  {
    id: "proj-03-smart-healthcare",
    slug: "smart-healthcare-management-platform",
    title: "Smart Healthcare Management & Tele-Consultation Platform",
    shortDescription: "HIPAA-aligned electronic health record (EHR) platform with WebRTC tele-consultations, prescription management, and appointment scheduling.",
    fullDescription: "A comprehensive clinical care suite for hospitals and diagnostic clinics. Features end-to-end encrypted medical record vaults, automated Doctor-Patient slot booking with calendar sync, live WebRTC video consultations, and digital PDF prescription generation.",
    problemStatement: "Fragmented hospital systems force patients to physically carry physical diagnostic records and lead to 30% missed follow-up appointments.",
    solution: "A unified patient portal and hospital management dashboard offering encrypted health file storage, real-time video consultations, and instant digital prescription delivery.",
    keyFeatures: [
      "Encrypted Medical Record Vault with role-based doctor/patient access",
      "WebRTC 1-on-1 HD video tele-consultation room with in-call chat",
      "Interactive Doctor Availability Slot scheduler with time-zone auto-conversion",
      "Digital Prescription builder with auto-suggest drug dosage database",
      "Lab test report upload with OCR blood marker extraction",
      "Patient health metric timeline (Blood Pressure, Sugar, BMI)",
      "Automated SMS/Email appointment reminders",
      "Audit logging for HIPAA compliance tracking"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "WebRTC", "Cloud Firestore", "Firebase Storage", "Tailwind CSS", "PDFKit"],
    category: "HealthTech",
    difficulty: "ADVANCED",
    estimatedDuration: "10-12 Weeks",
    learningOutcomes: [
      "Implement WebRTC peer-to-peer audio/video streaming with STUN/TURN servers",
      "Build dynamic PDF generation microservices for medical prescriptions",
      "Enforce field-level encryption for sensitive health information (PHI)",
      "Handle time-zone localized booking slots with conflict prevention"
    ],
    prerequisites: ["React Hooks", "WebRTC concepts", "Firestore Security Rules"],
    architecture: `[Patient / Doctor Browser] ↔ [WebRTC Signaling (Peer-to-Peer Video)]
          ↓ (HTTPS REST / Next.js)
[Next.js Application Layer]
          ↓
[Cloud Firestore (EHR Records & Appointments)] ↔ [Firebase Encrypted Storage]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/smart-healthcare-ehr.git",
      "cd smart-healthcare-ehr",
      "npm install",
      "cp .env.example .env.local",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "scmain-b2cde",
      "ENCRYPTION_SECRET_KEY": "32_byte_hex_encryption_key",
      "SIGNALING_SERVER_URL": "wss://signaling.sctech.dev"
    },
    databaseSchema: `Collections:
- doctors/{doctorId}: { name, specialization, consultationFee, availableSlots: [] }
- appointments/{aptId}: { doctorId, patientId, scheduledTime, status: "BOOKED" | "COMPLETED", meetingRoomId }
- prescriptions/{rxId}: { appointmentId, doctorName, patientName, medications: [], pdfUrl }
- healthRecords/{recordId}: { patientId, fileUrl, recordType, uploadedAt }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/appointments/book", description: "Atomically reserves doctor consultation slot." },
      { method: "POST", endpoint: "/api/prescriptions/generate", description: "Creates signed PDF prescription and emails it to the patient." }
    ],
    folderStructure: `smart-healthcare/
├── src/
│   ├── app/
│   │   ├── (doctor)/consultations/
│   │   ├── (patient)/my-records/
│   │   └── room/[roomId]/
│   ├── components/
│   │   ├── webrtc-video/
│   │   └── rx-builder/
│   └── lib/
│       └── ehr-encryption.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy web application on Vercel with coturn STUN/TURN server hosted on Google Cloud Compute Engine.",
    testingGuide: "Run 'npm test' for appointment race condition checks and WebRTC signaling handshake simulations.",
    sourceCodeFileName: "smart-healthcare-ehr-v1.0.zip",
    sourceCodeSnippet: `// components/webrtc-video/VideoRoom.tsx
export function VideoRoom({ roomId, isDoctor }: { roomId: string, isDoctor: boolean }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // WebRTC PeerConnection and MediaStream initialization
  return <div className="grid grid-cols-2 gap-4 h-full"><video ref={localVideoRef} autoPlay muted /><video ref={remoteVideoRef} autoPlay /></div>;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 345,
    published: true,
  },

  {
    id: "proj-04-saas-project-management",
    slug: "multi-tenant-saas-project-management",
    title: "Multi-Tenant SaaS Project Management & Issue Tracker",
    shortDescription: "Jira-style agile workspace with multi-tenant subdomains, real-time drag-and-drop sprints, and activity streams.",
    fullDescription: "A scalable multi-tenant SaaS workspace for software engineering teams. Supports tenant organization isolation, dynamic Kanban and Sprint board views, task estimation points, markdown issue descriptions, and Webhook integrations with GitHub.",
    problemStatement: "Small-to-medium engineering teams need lightweight, high-performance sprint tracking without the clunky complexity and high licensing cost of legacy enterprise tools.",
    solution: "A modern multi-tenant issue tracking platform featuring sub-millisecond drag-and-drop sprint boards, customizable ticket workflows, and automated velocity analytics.",
    keyFeatures: [
      "Multi-tenant organization data isolation with custom workspace URLs",
      "Real-time drag-and-drop Kanban & Sprint planning boards",
      "Custom issue workflows (Backlog -> Todo -> In Progress -> In Review -> Done)",
      "Sprint velocity and burndown charts with real-time story point calculations",
      "Markdown editor with image upload for issue reproduction steps",
      "Role-based access control (Owner, Scrum Master, Developer, Guest)",
      "Instant team notifications via WebSocket / Firestore listeners",
      "GitHub pull request automatic issue status link integration"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Cloud Firestore", "Firebase Auth", "Framer Motion", "DND-Kit"],
    category: "Full Stack Development",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Architect multi-tenant data structures with strict Firestore security isolation",
      "Master accessible drag-and-drop state machines using @dnd-kit",
      "Calculate dynamic Agile metrics (Burndown charts & Sprint Velocity)",
      "Implement optimistic UI updates for high-frequency Kanban actions"
    ],
    prerequisites: ["React State Management", "TypeScript", "Firestore Subcollections"],
    architecture: `[Workspace Client: tenant.sctech.dev]
          ↓ (Next.js Middleware Tenant Extraction)
[Tenant Resolver & Next.js Server Actions]
          ↓
[Cloud Firestore (organizations/{orgId}/projects/{projId}/issues)] ↔ [Firebase Storage]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/multi-tenant-saas.git",
      "cd multi-tenant-saas",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_APP_DOMAIN": "localhost:3000",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- organizations/{orgId}: { name, slug, ownerId, plan: "PRO" }
- organizations/{orgId}/projects/{projId}: { title, key: "SCT", leadId }
- organizations/{orgId}/issues/{issueId}: { key: "SCT-101", title, status, sprintId, points: 5, assigneeId }
- organizations/{orgId}/sprints/{sprintId}: { name, startDate, endDate, goal, active: boolean }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/issues/reorder", description: "Updates issue status and rank on sprint board optimistically." },
      { method: "GET", endpoint: "/api/analytics/burndown", description: "Calculates remaining story points per day for active sprint." }
    ],
    folderStructure: `saas-pm/
├── src/
│   ├── app/
│   │   ├── [tenant]/
│   │   │   ├── board/
│   │   │   ├── backlog/
│   │   │   └── settings/
│   ├── components/
│   │   ├── kanban/
│   │   └── burndown-chart/
│   └── lib/tenant.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with wildcard custom domains (*.yourdomain.com) enabled for tenant routing.",
    testingGuide: "Run 'npm test' for multi-tenant isolation unit tests and DND reordering state checks.",
    sourceCodeFileName: "multi-tenant-saas-pm-v1.0.zip",
    sourceCodeSnippet: `// components/kanban/BoardColumn.tsx
export function KanbanColumn({ status, issues, onMove }: { status: string, issues: Issue[], onMove: Function }) {
  const { setNodeRef } = useDroppable({ id: status });
  return <div ref={setNodeRef} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 w-80 shrink-0 space-y-3">
    <h4 className="text-xs font-bold uppercase text-slate-400">{status} ({issues.length})</h4>
    {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
  </div>;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 521,
    published: true,
  },

  {
    id: "proj-05-cybersecurity-siem",
    slug: "cybersecurity-threat-monitoring-siem",
    title: "Cybersecurity Threat Monitoring & SIEM Dashboard",
    shortDescription: "SOC analyst dashboard for streaming log ingestion, brute-force attack detection, and automated IP ban mitigation.",
    fullDescription: "A Security Information and Event Management (SIEM) dashboard designed for security operations center (SOC) engineers. Ingests NGINX/Auth logs, triggers real-time alerts on MITRE ATT&CK patterns, and generates automated firewall blocking rules.",
    problemStatement: "Organizations face thousands of automated credential stuffing and port scanning attacks daily that go unnoticed without centralized real-time telemetry.",
    solution: "A high-performance security operations platform that aggregates server logs, detects intrusion anomalies via sliding heuristic windows, and visualizes global attack origins on an interactive 3D globe.",
    keyFeatures: [
      "Real-time syslog and JSON log stream parser with severity classification",
      "Automated Brute-Force and Port Scan intrusion detection engine",
      "Interactive WebGL 3D Globe visualizing real-time attack geolocations",
      "MITRE ATT&CK matrix tagging for categorized security incidents",
      "One-click automated IP blocking with Cloudflare / AWS WAF webhook integration",
      "Incident investigation timeline with packet inspection headers",
      "Custom alerting rules with Slack / Discord webhook notifications",
      "Compliance audit report generator for ISO 27001 / SOC 2"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Three.js", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "Cybersecurity",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Parse high-volume structured and unstructured security logs",
      "Map intrusion indicators of compromise (IoC) to MITRE ATT&CK tactics",
      "Render real-time 3D geospatial attack arcs using Three.js and WebGL",
      "Integrate automated firewall mitigation scripts"
    ],
    prerequisites: ["Networking fundamentals", "Next.js", "Three.js / Canvas basics"],
    architecture: `[Web Servers & Firewalls] 
          ↓ (Syslog Stream POST)
[SIEM Ingestion API] 
          ↓
[Detection Heuristic Engine (MITRE Tactic Matcher)]
          ↓
[Cloud Firestore & Real-Time Three.js SOC Dashboard]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/siem-threat-dashboard.git",
      "cd siem-threat-dashboard",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "INGESTION_API_KEY": "secure_syslog_ingestion_token",
      "WAF_WEBHOOK_URL": "https://api.cloudflare.com/client/v4/zones/..."
    },
    databaseSchema: `Collections:
- securityLogs/{logId}: { timestamp, srcIp, destPort, eventType, severity: "CRITICAL" | "HIGH" | "INFO", country }
- incidents/{incId}: { title, mitreTactic: "T1110.001", affectedIps: [], status: "OPEN" | "CONTAINED" }
- blockedIps/{ip}: { ipAddress, reason, blockedAt, expiresAt }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/logs/ingest", description: "Ingests raw log batches and triggers real-time heuristic alerts." },
      { method: "POST", endpoint: "/api/incidents/block-ip", description: "Executes instant firewall IP block rule." }
    ],
    folderStructure: `siem-dashboard/
├── src/
│   ├── app/
│   │   ├── (soc)/live-telemetry/
│   │   └── incidents/[id]/
│   ├── components/
│   │   ├── 3d-globe/
│   │   └── log-stream/
│   └── lib/mitre-rules.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy application on Vercel with high-throughput ingestion endpoints routed through Cloudflare Workers.",
    testingGuide: "Run 'npm run simulate-attack' to fire synthetic brute-force and port scan log packets into the ingestion stream.",
    sourceCodeFileName: "siem-threat-dashboard-v1.0.zip",
    sourceCodeSnippet: `// lib/mitre-rules.ts
export function evaluateBruteForce(logsInWindow: SecurityLog[]): boolean {
  const failedAuths = logsInWindow.filter(l => l.eventType === "AUTH_FAIL");
  return failedAuths.length >= 5; // Trigger MITRE T1110 Credential Stuffing
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 479,
    published: true,
  },

  {
    id: "proj-06-ai-document-intelligence",
    slug: "ai-document-intelligence-rag-engine",
    title: "AI Document Intelligence & RAG Knowledge Search Engine",
    shortDescription: "Retrieval-Augmented Generation (RAG) platform querying complex multi-page financial reports, legal contracts, and technical manuals.",
    fullDescription: "An enterprise document intelligence system that converts massive multi-page PDF documents into vector chunks with Gemini Embeddings. Users query their documentation in natural language, receiving precise cited answers and source page bounding boxes.",
    problemStatement: "Professionals waste hours searching through 200+ page technical manuals and legal contracts to find specific compliance clauses and financial figures.",
    solution: "A production RAG engine that parses complex multi-column PDFs, extracts tabular data, indexes semantic chunks, and generates grounded answers with exact source citations.",
    keyFeatures: [
      "Multi-document PDF ingestion with layout-aware chunking",
      "Hybrid search combining BM25 keyword matching and dense vector embeddings",
      "Grounded conversational RAG interface with interactive citation tooltips",
      "Automatic table and financial statement extraction into structured JSON",
      "Document comparison mode highlighting diffs between contract versions",
      "Exportable summary reports in Markdown and PDF format",
      "Strict data isolation per workspace with AES-256 file encryption",
      "Low-latency streaming token responses via Server-Sent Events (SSE)"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Pro", "LangChain", "Cloud Firestore", "Tailwind CSS"],
    category: "Generative AI",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Implement optimal chunking strategies (RecursiveCharacter vs Semantic splitting)",
      "Build hybrid retrieval systems combining vector cosine similarity with BM25",
      "Stream generative LLM tokens using Next.js Edge Runtime and SSE",
      "Prevent LLM hallucinations with strict citation verification prompts"
    ],
    prerequisites: ["TypeScript", "LLM & Vector basics", "Next.js App Router"],
    architecture: `[User PDF Upload] → [Layout Parser & Chunking Engine] → [Gemini Text-Embedding]
                                                               ↓
[User Question] → [Vector Search & Re-ranker] → [Gemini 1.5 Context Prompt] → [Streaming Cited Answer]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/document-intelligence-rag.git",
      "cd document-intelligence-rag",
      "npm install",
      "cp .env.example .env.local",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- documents/{docId}: { title, totalPages, fileUrl, uploadedBy, status: "READY" }
- docChunks/{chunkId}: { documentId, pageNumber, content, embedding: [] }
- chatSessions/{sessionId}: { userId, documentId, messages: [{ role, content, citations: [] }] }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/rag/upload", description: "Uploads PDF and generates vector chunks." },
      { method: "POST", endpoint: "/api/rag/chat", description: "Streams RAG answer with citation references." }
    ],
    folderStructure: `doc-intelligence/
├── src/
│   ├── app/
│   │   ├── (chat)/workspace/
│   │   └── api/rag/
│   ├── components/
│   │   ├── pdf-viewer/
│   │   └── chat-stream/
│   └── lib/rag-pipeline.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Serverless Functions configured for streaming responses.",
    testingGuide: "Run 'npm test' for chunk overlap validations and hallucination benchmark tests.",
    sourceCodeFileName: "document-intelligence-rag-v1.0.zip",
    sourceCodeSnippet: `// lib/rag-pipeline.ts
export async function queryDocumentRag(question: string, docId: string) {
  const queryVector = await getEmbedding(question);
  const topChunks = await findTopKChunks(docId, queryVector, 5);
  const prompt = \`Use only the context below to answer. Context: \${topChunks.map(c => c.content).join("\\n")}\`;
  return streamGeminiResponse(prompt, question);
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 630,
    published: true,
  },

  {
    id: "proj-07-smart-campus-iot",
    slug: "smart-campus-energy-and-facility-management",
    title: "Smart Campus IoT Energy & Facility Management System",
    shortDescription: "Campus IoT telemetry system monitoring classroom energy consumption, automated HVAC scheduling, and parking vacancy.",
    fullDescription: "An IoT and facility optimization platform for university campuses. Integrates MQTT sensor streams from power meters, classroom occupancy detectors, and parking cameras to reduce campus energy waste by up to 35%.",
    problemStatement: "Colleges waste significant electricity running air conditioning and lights in empty lecture halls and struggle with parking congestion during peak hours.",
    solution: "A centralized IoT automation platform that monitors real-time room occupancy, executes automated HVAC/lighting cutoffs, and broadcasts live parking bay vacancies.",
    keyFeatures: [
      "Real-time MQTT telemetry ingestion for energy, temperature, and occupancy sensors",
      "Automated energy-saving rule engine turning off idle auditorium power",
      "Interactive 2D/3D campus map with live building power consumption heatmaps",
      "Computer vision camera integration for live open parking bay detection",
      "Classroom schedule timetable sync with automatic pre-cooling schedules",
      "Equipment maintenance anomaly detection based on sudden power draw spikes",
      "Campus carbon footprint calculation dashboard with monthly PDF reports",
      "Role-based access for Estate Managers, Security Officers, and Students"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "MQTT.js", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "Smart Campus",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Connect and ingest high-frequency MQTT sensor payloads into web applications",
      "Build dynamic campus floorplan heatmaps using SVG and Canvas",
      "Design cron-based IoT scheduling engines for HVAC energy conservation",
      "Calculate CO2 carbon equivalency metrics from kilowatt-hour telemetry"
    ],
    prerequisites: ["TypeScript", "IoT / MQTT concepts", "Next.js"],
    architecture: `[Campus Hardware Sensors (MQTT)] → [IoT Broker] → [Next.js Ingestion Pipeline]
                                                                ↓
[Cloud Firestore (Real-time Telemetry)] ↔ [Automated Relay Actuators & Campus Map Dashboard]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/smart-campus-iot.git",
      "cd smart-campus-iot",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "MQTT_BROKER_URL": "mqtt://broker.hivemq.com:1883",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- buildings/{bldgId}: { name, totalRooms, currentKwDraw, carbonRating }
- rooms/{roomId}: { buildingId, roomNumber, isOccupied, temperature, hvacStatus: "ON" | "OFF" }
- parkingBays/{bayId}: { bayNumber, isVacant, cameraFeedUrl, updatedAt }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/iot/telemetry", description: "Receives sensor readings and updates room state." },
      { method: "POST", endpoint: "/api/facility/override", description: "Manually triggers room power / HVAC relay state." }
    ],
    folderStructure: `smart-campus/
├── src/
│   ├── app/
│   │   ├── (campus)/energy-map/
│   │   └── parking/
│   ├── components/
│   │   ├── floorplan-heatmap/
│   │   └── power-gauge/
│   └── lib/mqtt-client.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy web dashboard on Vercel with MQTT broker connected via secure WebSockets (WSS).",
    testingGuide: "Run 'npm run simulate-iot' to generate synthetic sensor readings across 50 virtual campus rooms.",
    sourceCodeFileName: "smart-campus-iot-v1.0.zip",
    sourceCodeSnippet: `// lib/mqtt-client.ts
import mqtt from "mqtt";
export function initCampusSensorStream(onReading: (data: any) => void) {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL!);
  client.subscribe("campus/sensors/#");
  client.on("message", (topic, message) => onReading(JSON.parse(message.toString())));
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 395,
    published: true,
  },

  {
    id: "proj-08-computer-vision-safety",
    slug: "computer-vision-workplace-safety-monitoring",
    title: "Computer Vision Workplace Safety & PPE Compliance System",
    shortDescription: "Edge computer vision monitoring system detecting Personal Protective Equipment (hard hats, vests) and restricted zone intrusions.",
    fullDescription: "An industrial safety monitoring suite powered by TensorFlow.js and Gemini Vision. Analyzes live RTSP video feeds from industrial job sites to detect missing helmets, safety goggles, and hazardous zone crossings in real time.",
    problemStatement: "Construction and industrial manufacturing sites suffer high injury rates due to lack of continuous PPE compliance and unauthorized restricted zone entry.",
    solution: "An automated edge vision analytics dashboard that flags missing safety gear, sounds instant local audio alarms, and logs safety compliance incidents with annotated snapshot evidence.",
    keyFeatures: [
      "Client-side edge object detection for Hard Hats, High-Visibility Vests, and Goggles",
      "Dynamic Virtual Polygon Zone builder for defining hazardous/restricted boundaries",
      "Real-time intrusion alert sound and strobe alert dispatch",
      "Annotated snapshot evidence storage in Firebase Cloud Storage",
      "Worker PPE compliance score leaderboard per shift/department",
      "Multi-camera grid dashboard with individual RTSP/WebRTC stream controls",
      "Automated daily safety audit report generation for site supervisors",
      "Offline-first edge inference capability without internet dependency"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "TensorFlow.js", "Cloud Firestore", "Firebase Storage", "Tailwind CSS"],
    category: "Computer Vision",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Execute real-time object detection models in the browser using TensorFlow.js WebGL",
      "Calculate point-in-polygon algorithms for restricted boundary breach detection",
      "Process high-frame-rate HTML5 video canvas overlays",
      "Generate automated compliance analytics from detected safety infractions"
    ],
    prerequisites: ["JavaScript/TypeScript", "Computer Vision basics", "Canvas 2D API"],
    architecture: `[Industrial IP Camera / Webcam] → [HTML5 Canvas Video Feed]
                                              ↓
[TensorFlow.js Edge PPE Model & Polygon Collision Engine]
                                              ↓
[Cloud Firestore Safety Log & Snapshot Evidence Vault]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/cv-safety-monitor.git",
      "cd cv-safety-monitor",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "scmain-b2cde",
      "SAFETY_ALERT_WEBHOOK": "https://hooks.slack.com/services/..."
    },
    databaseSchema: `Collections:
- cameras/{camId}: { name, location, streamUrl, restrictedPolygonCoords: [] }
- safetyViolations/{violationId}: { cameraId, violationType: "MISSING_HELMET" | "ZONE_BREACH", snapshotUrl, timestamp }
- siteAudits/{auditId}: { siteName, date, compliancePercentage, totalViolations }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/violations/log", description: "Uploads annotated violation snapshot and logs event." },
      { method: "GET", endpoint: "/api/analytics/compliance", description: "Returns site safety compliance trends over time." }
    ],
    folderStructure: `cv-safety/
├── src/
│   ├── app/
│   │   ├── (surveillance)/live-monitor/
│   │   └── violations/
│   ├── components/
│   │   ├── canvas-overlay/
│   │   └── zone-editor/
│   └── lib/detector.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel or run locally on edge hardware (NVIDIA Jetson / Intel NUC) for ultra-low latency.",
    testingGuide: "Run 'npm test' for polygon intersection logic and synthetic video frame detection accuracy tests.",
    sourceCodeFileName: "cv-safety-monitor-v1.0.zip",
    sourceCodeSnippet: `// lib/detector.ts
export function checkPolygonIntrusion(point: [number, number], polygon: [number, number][]) {
  // Ray-casting algorithm for point-in-polygon test
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 310,
    published: true,
  },

  {
    id: "proj-09-blockchain-identity",
    slug: "decentralized-verifiable-credential-identity",
    title: "Decentralized Verifiable Credential & Digital Identity Vault",
    shortDescription: "Self-Sovereign Identity (SSI) platform for issuing, holding, and cryptographically verifying tamper-proof educational and professional credentials.",
    fullDescription: "A decentralized identity management platform implementing W3C Verifiable Credentials and Decentralized Identifiers (DIDs). Enables universities and employers to issue cryptographically signed digital certificates that students store in their personal identity vault and share via zero-knowledge QR proofs.",
    problemStatement: "Fake degrees and forged employment experience cost corporations billions in background verification and take weeks to manually audit.",
    solution: "A cryptographic identity platform where institutions issue ECDSA-signed verifiable credentials directly to a student's digital wallet for instant, mathematically tamper-proof verification.",
    keyFeatures: [
      "W3C standard compliant Verifiable Credential (VC) JSON-LD generator",
      "Institutional Issuer Dashboard with batch credential issuance",
      "Student Self-Sovereign Identity Vault with selective attribute disclosure",
      "Cryptographic signature verification using ECDSA / Ed25519 keys",
      "Zero-Knowledge QR Verification scanner for third-party recruiters",
      "Revocation registry checking via cryptographic accumulator status lists",
      "Exportable verifiable PDF certificates with embedded signed JSON metadata",
      "Wallet backup and recovery with shamir secret sharing phrases"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Ethers.js / Web3", "Cloud Firestore", "Tailwind CSS", "QRCode"],
    category: "Blockchain/Web3",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Master W3C Verifiable Credentials and DID data schemas",
      "Implement public/private key cryptographic signing and verification (Ed25519)",
      "Build QR-based offline verification flows without exposing full personal data",
      "Manage institutional credential revocation registries"
    ],
    prerequisites: ["Cryptography basics", "TypeScript", "Next.js"],
    architecture: `[University / Issuer] → [Sign with Institutional Private Key] → [Issue VC JSON]
                                                                      ↓
[Student Identity Wallet] ↔ [Selective Disclosure QR Code] ↔ [Employer Verifier Engine]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/decentralized-identity.git",
      "cd decentralized-identity",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "ISSUER_PRIVATE_KEY": "hex_encoded_private_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- issuers/{issuerId}: { name, did, publicKey, verificationUrl }
- credentials/{credId}: { recipientDid, credentialType, signedJwt, issuedAt, isRevoked }
- revocationList/{listId}: { bitstringAccumulator, lastUpdated }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/credentials/issue", description: "Signs and issues W3C Verifiable Credential." },
      { method: "POST", endpoint: "/api/credentials/verify", description: "Validates cryptographic signature and revocation status." }
    ],
    folderStructure: `decentralized-identity/
├── src/
│   ├── app/
│   │   ├── (issuer)/issue-credential/
│   │   ├── (wallet)/my-vault/
│   │   └── verify/
│   ├── components/
│   │   ├── qr-scanner/
│   │   └── credential-badge/
│   └── lib/crypto-vc.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with issuer public keys published at /.well-known/did.json for global DID resolution.",
    testingGuide: "Run 'npm test' for signature verification, tampering detection, and revocation check validations.",
    sourceCodeFileName: "decentralized-identity-v1.0.zip",
    sourceCodeSnippet: `// lib/crypto-vc.ts
import { ethers } from "ethers";
export async function verifyCredentialSignature(credentialPayload: any, signature: string, expectedIssuerAddress: string): Promise<boolean> {
  const messageHash = ethers.id(JSON.stringify(credentialPayload));
  const recoveredAddress = ethers.recoverAddress(messageHash, signature);
  return recoveredAddress.toLowerCase() === expectedIssuerAddress.toLowerCase();
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 290,
    published: true,
  },

  {
    id: "proj-10-bi-analytics-platform",
    slug: "real-time-business-intelligence-data-lake",
    title: "Real-Time Business Intelligence & Data Lake Analytics Platform",
    shortDescription: "Self-service analytics platform with automated SQL query generation, multi-source ingestion, and interactive drag-and-drop dashboard widgets.",
    fullDescription: "An end-to-end enterprise Business Intelligence (BI) engine. Ingests CSVs, PostgreSQL, and REST APIs, lets non-technical stakeholders generate custom SQL charts via Gemini Natural Language to SQL, and builds shareable live dashboards.",
    problemStatement: "Business teams wait days for overworked data engineering teams to write basic SQL queries and build routine executive KPI reports.",
    solution: "A self-service BI platform that translates plain English questions into verified SQL queries, renders dynamic visualizations, and exports scheduled executive executive summaries.",
    keyFeatures: [
      "Natural Language to SQL query translator powered by Gemini 1.5",
      "Multi-source data ingestion (CSV uploads, Cloud Firestore, and REST endpoints)",
      "Interactive drag-and-drop dashboard grid with customizable chart widgets",
      "Rich visualization library (Area, Bar, Donut, Heatmap, Sankey, Funnel)",
      "Scheduled automated dashboard PDF reports delivered via Email/Slack",
      "SQL query performance optimizer with automated query caching",
      "Granular dashboard sharing permissions (Public, Team, Private View)",
      "Data masking controls for PII and sensitive financial columns"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Pro", "Tailwind CSS", "Recharts", "Cloud Firestore"],
    category: "Data Analytics",
    difficulty: "ADVANCED",
    estimatedDuration: "8-10 Weeks",
    learningOutcomes: [
      "Build Text-to-SQL LLM translation pipelines with schema context awareness",
      "Design flexible drag-and-drop dashboard layouts with React-Grid-Layout",
      "Optimize frontend data transformation pipelines for 100k+ row datasets",
      "Implement scheduled headless browser PDF rendering for executive reports"
    ],
    prerequisites: ["SQL Knowledge", "TypeScript", "React State Management"],
    architecture: `[CSV / DB Ingestion] → [Data Lake Normalizer & Schema Profiler]
                                           ↓
[User English Question] → [Gemini Text-to-SQL Engine] → [In-Memory Query Runner]
                                           ↓
[Dynamic Recharts Visualization & Shareable Dashboard Grid]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/bi-analytics-platform.git",
      "cd bi-analytics-platform",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- dataSources/{srcId}: { name, sourceType: "CSV" | "API", schemaDefinition: {}, rowCount }
- dashboards/{dashId}: { title, widgets: [{ title, chartType, querySql, gridLayout: {} }], ownerId }
- queryHistory/{queryId}: { naturalPrompt, generatedSql, executionTimeMs }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/bi/generate-sql", description: "Converts natural language prompt into safe SQL query." },
      { method: "POST", endpoint: "/api/bi/execute-query", description: "Executes sanitized SQL and returns formatted tabular JSON." }
    ],
    folderStructure: `bi-analytics/
├── src/
│   ├── app/
│   │   ├── (dashboard)/dashboards/[id]/
│   │   ├── query-builder/
│   │   └── data-sources/
│   ├── components/
│   │   ├── chart-renderer/
│   │   └── grid-dashboard/
│   └── lib/sql-generator.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with in-memory query processing for sub-second dashboard rendering.",
    testingGuide: "Run 'npm test' for SQL injection sanitization and Text-to-SQL prompt edge case validations.",
    sourceCodeFileName: "bi-analytics-platform-v1.0.zip",
    sourceCodeSnippet: `// lib/sql-generator.ts
export async function generateSqlFromPrompt(prompt: string, schema: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const sysPrompt = \`Translate to valid SQLite query. Schema: \${schema}. Return only SQL.\`;
  const result = await model.generateContent([sysPrompt, prompt]);
  return result.response.text().replace(/\`\`\`sql|\`\`\`/g, "").trim();
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 512,
    published: true,
  },

  // ==========================================
  // 2. INTERMEDIATE PROJECTS (10 Projects)
  // ==========================================
  {
    id: "proj-11-ecom-multivendor",
    slug: "headless-ecommerce-and-multivendor-marketplace",
    title: "Headless E-Commerce & Multi-Vendor Marketplace",
    shortDescription: "High-performance online store with vendor commission management, Razorpay payment splits, and real-time inventory tracking.",
    fullDescription: "A full-featured headless e-commerce marketplace allowing multiple independent vendors to list products, manage inventory, and fulfill customer orders. Features Razorpay Checkout payments, instant stock decrement locks, and vendor revenue split calculations.",
    problemStatement: "Traditional single-store e-commerce platforms do not support multiple independent sellers, automatic commission payouts, or unified shopping carts.",
    solution: "A modern multi-vendor marketplace engine that handles catalog management, multi-seller cart checkout, automated commission split calculations, and customer order tracking.",
    keyFeatures: [
      "Multi-vendor product management portal with image gallery upload",
      "Unified customer shopping cart combining products from multiple sellers",
      "Razorpay Checkout payment integration with automated invoice generation",
      "Real-time inventory decrement with race-condition prevention",
      "Vendor revenue analytics with commission deduction calculation",
      "Customer product review and 5-star rating system",
      "Order status lifecycle tracker (Placed -> Packed -> Shipped -> Delivered)",
      "Wishlist and instant search with fuzzy name/category matching"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Cloud Firestore", "Firebase Storage", "Razorpay"],
    category: "E-Commerce",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Design transactional shopping cart checkout flows with Firestore",
      "Integrate Razorpay payment webhooks and order verification",
      "Handle multi-seller product inventory synchronization",
      "Implement dynamic search and category filtering in Next.js"
    ],
    prerequisites: ["React Context API", "TypeScript", "Firebase Auth & Firestore"],
    architecture: `[Customer / Vendor UI] → [Next.js Server Actions & API]
                                   ↓
[Cloud Firestore (Products, Orders, Vendors)] ↔ [Razorpay Gateway API]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/headless-multivendor-ecom.git",
      "cd headless-multivendor-ecom",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_RAZORPAY_KEY_ID": "rzp_live_your_public_key_id",
      "RAZORPAY_KEY_SECRET": "your_server_only_key_secret",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- vendors/{vendorId}: { storeName, payoutUpi, commissionRate: 0.10 }
- products/{productId}: { vendorId, title, price, stockQuantity, images: [] }
- orders/{orderId}: { customerId, items: [], totalAmount, paymentStatus: "PAID" }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/orders/create", description: "Initializes Razorpay order for multi-item cart." },
      { method: "POST", endpoint: "/api/orders/verify", description: "Verifies payment signature and locks inventory." }
    ],
    folderStructure: `multivendor-ecom/
├── src/
│   ├── app/
│   │   ├── (store)/products/
│   │   ├── (vendor)/portal/
│   │   └── cart/
│   ├── components/
│   │   ├── product-card/
│   │   └── checkout-modal/
│   └── lib/cart-context.tsx
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Razorpay test keys configured in environment variables.",
    testingGuide: "Run 'npm test' for shopping cart price calculations and stock reservation concurrency tests.",
    sourceCodeFileName: "headless-multivendor-ecom-v1.0.zip",
    sourceCodeSnippet: `// lib/cart-context.tsx
export function calculateCartSummary(items: CartItem[], commissionRate = 0.1) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const platformFee = subtotal * commissionRate;
  const vendorPayout = subtotal - platformFee;
  return { subtotal, platformFee, vendorPayout };
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 560,
    published: true,
  },

  {
    id: "proj-12-ai-lms-platform",
    slug: "ai-personalized-learning-management-system",
    title: "AI-Personalized Learning Management System (LMS)",
    shortDescription: "Interactive course platform with automated AI quiz generation, personalized learning roadmaps, and code playground.",
    fullDescription: "An AI-powered EdTech platform that adapts course difficulty based on individual student quiz performance. Includes an interactive in-browser JavaScript/Python code sandbox, automated video transcription summaries, and milestone completion certificates.",
    problemStatement: "One-size-fits-all online courses lead to high dropout rates (>85%) because students get stuck or bored without personalized pacing.",
    solution: "An adaptive learning platform that generates customized diagnostic quizzes, pinpoints specific conceptual weaknesses, and dynamically adjusts module prerequisites.",
    keyFeatures: [
      "Modular video course builder with structured lesson chapters",
      "Automated AI quiz generator based on video transcript content",
      "Adaptive learning path recommending remedial modules on failed tests",
      "In-browser interactive code editor playground with live console output",
      "Course progress tracking with gamified streak counters",
      "Verifiable PDF completion certificate generator with unique verification ID",
      "Student discussion forum with Markdown code snippet formatting",
      "Instructor analytics dashboard showing student drop-off bottlenecks"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Flash", "Cloud Firestore", "Tailwind CSS", "Monaco Editor"],
    category: "EdTech",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Integrate Monaco Code Editor into modern React applications",
      "Build dynamic quiz state machines with immediate answer validation",
      "Generate programmatic certificate verification IDs and badges",
      "Leverage Gemini AI for automated quiz question extraction"
    ],
    prerequisites: ["React", "TypeScript", "Firestore basics"],
    architecture: `[Student / Instructor UI] → [Next.js API & Monaco Sandbox]
                                  ↓
[Cloud Firestore (Courses, Lessons, Progress)] ↔ [Gemini Quiz Generator]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/ai-personalized-lms.git",
      "cd ai-personalized-lms",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- courses/{courseId}: { title, description, instructorId, modules: [] }
- enrollments/{enrollId}: { userId, courseId, progressPercentage, completedLessons: [] }
- quizzes/{quizId}: { lessonId, questions: [{ question, options: [], correctIndex }] }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/quiz/generate", description: "Generates 5-question multiple choice quiz from lesson transcript." },
      { method: "POST", endpoint: "/api/certificates/claim", description: "Issues certificate upon 100% course completion." }
    ],
    folderStructure: `ai-lms/
├── src/
│   ├── app/
│   │   ├── courses/[id]/
│   │   ├── playground/
│   │   └── certificate/[id]/
│   ├── components/
│   │   ├── code-editor/
│   │   └── quiz-runner/
│   └── lib/ai-quiz.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with video assets stored on Firebase Cloud Storage or Cloudflare Stream.",
    testingGuide: "Run 'npm test' for quiz scoring logic and certificate eligibility verification tests.",
    sourceCodeFileName: "ai-personalized-lms-v1.0.zip",
    sourceCodeSnippet: `// lib/ai-quiz.ts
export async function generateQuizForLesson(lessonText: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Generate 4 multiple choice questions with correct answer index based on: " + lessonText;
  const res = await model.generateContent(prompt);
  return JSON.parse(res.response.text());
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 440,
    published: true,
  },

  {
    id: "proj-13-realtime-chat-collaboration",
    slug: "realtime-team-collaboration-and-chat-hub",
    title: "Real-Time Team Collaboration & Workspace Chat Hub",
    shortDescription: "Slack-like team communication platform with threaded channels, direct messaging, rich file sharing, and online presence tracking.",
    fullDescription: "A real-time workspace collaboration application featuring organized public/private channels, direct messages, typing indicators, rich markdown message previews, and automated file uploads.",
    problemStatement: "Engineering teams need secure, self-hosted team communication without recurring per-seat monthly license fees.",
    solution: "A scalable team messaging hub built on Firestore Real-Time listeners and WebSockets with threaded message replies, audio voice clips, and search indexing.",
    keyFeatures: [
      "Public and private team channels with invite-only permissions",
      "Direct 1-on-1 messaging with end-to-end user notifications",
      "Threaded message conversations keeping main channel clean",
      "Real-time typing indicators and live user online/offline presence",
      "Rich media sharing (Images, Code Snippets with syntax highlighting, PDFs)",
      "Custom emoji reactions on messages with optimistic counter updates",
      "Full-text message search across all accessible channels",
      "Desktop notification support for direct mentions (@username)"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Cloud Firestore", "Firebase Storage", "Firebase Auth"],
    category: "Full Stack Development",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Implement real-time Firestore onSnapshot listeners with clean unsubscriptions",
      "Manage online/offline user presence using Firebase heartbeat timestamps",
      "Build high-performance virtualized message scroll lists (react-window)",
      "Handle threaded sub-collection hierarchies in NoSQL"
    ],
    prerequisites: ["React Hooks", "Firestore Subcollections", "Tailwind CSS"],
    architecture: `[Client UI (Next.js 14)] ↔ [Firestore Real-Time onSnapshot Subscriptions]
                                  ↓
[Firebase Storage (File Attachments)] ↔ [Firebase Cloud Messaging (Push Notifications)]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/realtime-chat-hub.git",
      "cd realtime-chat-hub",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_FIREBASE_API_KEY": "your_api_key",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- channels/{channelId}: { name, isPrivate, memberIds: [], createdAt }
- channels/{channelId}/messages/{msgId}: { senderId, senderName, content, attachments: [], reactions: {} }
- channels/{channelId}/messages/{msgId}/replies/{replyId}: { senderId, content, createdAt }
- userPresence/{userId}: { status: "ONLINE" | "OFFLINE", lastSeen: Timestamp }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/messages/send", description: "Publishes message to channel and triggers push notifications." },
      { method: "POST", endpoint: "/api/messages/react", description: "Appends emoji reaction to message." }
    ],
    folderStructure: `realtime-chat/
├── src/
│   ├── app/
│   │   ├── channels/[id]/
│   │   └── dms/[userId]/
│   ├── components/
│   │   ├── message-feed/
│   │   ├── thread-drawer/
│   │   └── channel-sidebar/
│   └── lib/presence.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Firestore index rules enabled for channel message timestamp ordering.",
    testingGuide: "Run 'npm test' for message formatting and real-time subscription lifecycle tests.",
    sourceCodeFileName: "realtime-chat-hub-v1.0.zip",
    sourceCodeSnippet: `// components/message-feed/MessageList.tsx
export function useChannelMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    const q = query(collection(db, "channels", channelId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message))));
  }, [channelId]);
  return messages;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 485,
    published: true,
  },

  {
    id: "proj-14-ai-customer-support",
    slug: "ai-automated-customer-support-agent",
    title: "AI Customer Support Agent & Ticket Resolution Suite",
    shortDescription: "Autonomous customer support agent with sentiment classification, FAQ auto-reply, and seamless human agent handoff.",
    fullDescription: "An AI-powered customer support bot that ingests company product knowledge, handles tier-1 customer inquiries autonomously, detects customer frustration sentiment, and seamlessly escalates complex issues to human agents with summarized context.",
    problemStatement: "Customer support teams spend 60% of their day answering repetitive FAQs, leading to slow response times for high-urgency account issues.",
    solution: "An intelligent support copilot that resolves routine questions instantly, categorizes ticket urgency, and gives human agents pre-drafted suggested replies.",
    keyFeatures: [
      "Embeddable floating customer chat widget for any website",
      "Autonomous AI resolution agent powered by Gemini 1.5 Flash",
      "Real-time sentiment analysis detecting angry/frustrated users",
      "Automated ticket priority classification (Low, Medium, High, Urgent)",
      "Seamless Human Agent Handoff with conversation summary generation",
      "Knowledge Base document sync (import Markdown and Notion pages)",
      "Support agent inbox with canned responses and ticket resolution SLAs",
      "Customer satisfaction CSAT survey modal after ticket closure"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Flash", "Cloud Firestore", "Tailwind CSS"],
    category: "Generative AI",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Build embeddable third-party JavaScript chat widgets with iframe/Shadow DOM",
      "Implement sentiment scoring and dynamic human escalation triggers",
      "Generate concise conversation summaries for support agents using LLMs",
      "Calculate Customer Satisfaction (CSAT) analytics and First Response Time (FRT)"
    ],
    prerequisites: ["JavaScript/TypeScript", "Next.js", "Prompt Engineering"],
    architecture: `[Client Website Chat Widget] ↔ [Customer Support API]
                                         ↓
[Gemini AI Agent (Sentiment & FAQ Answer)] → [Human Agent Inbox (Firestore)]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/ai-support-agent.git",
      "cd ai-support-agent",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- tickets/{ticketId}: { customerEmail, subject, status: "OPEN" | "AI_RESOLVED" | "HUMAN_ESCALATED", priority, sentimentScore }
- tickets/{ticketId}/messages/{msgId}: { sender: "USER" | "AI" | "AGENT", text, timestamp }
- knowledgeBase/{kbId}: { title, content, category }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/support/message", description: "Processes customer message and returns AI response or escalates to human." },
      { method: "POST", endpoint: "/api/support/close-ticket", description: "Closes ticket and triggers CSAT survey." }
    ],
    folderStructure: `ai-support/
├── src/
│   ├── app/
│   │   ├── (agent)/inbox/
│   │   └── widget/
│   ├── components/
│   │   ├── chat-widget/
│   │   └── agent-reply-box/
│   └── lib/support-ai.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy web application on Vercel and embed the widget script via a simple HTML script tag.",
    testingGuide: "Run 'npm test' for sentiment analysis classification accuracy and ticket priority assignment tests.",
    sourceCodeFileName: "ai-support-agent-v1.0.zip",
    sourceCodeSnippet: `// lib/support-ai.ts
export async function evaluateSentimentAndReply(userMessage: string, history: string[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = \`Classify sentiment (POSITIVE/NEUTRAL/NEGATIVE) and answer based on knowledge base. Input: \${userMessage}\`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 390,
    published: true,
  },

  {
    id: "proj-15-cloud-devops-monitor",
    slug: "cloud-infrastructure-and-devops-uptime-monitor",
    title: "Cloud Infrastructure & DevOps Uptime Monitoring Suite",
    shortDescription: "Statuspage and uptime monitoring system checking HTTP, SSL certificates, and ping latency with multi-region health probes.",
    fullDescription: "A BetterUptime/Pingdom alternative that conducts automated health check probes on web servers, monitors SSL certificate expiration dates, measures DNS latency, and displays a public status page during outages.",
    problemStatement: "Server outages and unexpected SSL certificate expirations cause customer churn when development teams are not alerted within seconds.",
    solution: "A distributed uptime monitoring engine with configurable ping intervals, automated incident creation, and instant multi-channel incident alerts.",
    keyFeatures: [
      "Configurable health probes (HTTP/HTTPS, TCP Port, ICMP Ping, DNS lookup)",
      "SSL Certificate expiration tracker with 30-day/7-day advance warnings",
      "Global response time latency graph (p50, p95, p99 percentiles)",
      "Customizable public Status Page for end-user incident communication",
      "Automated outage incident creator with root-cause HTTP status code logs",
      "Multi-channel alert dispatcher (Telegram, Discord, Slack, Email Webhooks)",
      "Maintenance window scheduler suppressing alerts during planned upgrades",
      "Exportable SLA uptime percentage reports (e.g. 99.95% Monthly Uptime)"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Node.js", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "Cloud Computing",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Build background cron job health probe workers with Node.js",
      "Extract and parse X.509 SSL certificate validity dates using TLS sockets",
      "Design clean public status pages with incident post-mortems",
      "Calculate 99.99% uptime availability metrics from discrete probe logs"
    ],
    prerequisites: ["Node.js Networking", "TypeScript", "Next.js"],
    architecture: `[Cron Health Check Worker] → [Ping External URLs & Inspect TLS]
                                       ↓
[Cloud Firestore (Probe Logs & Uptime Percentiles)] → [Public Status Page & Discord Alerts]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/devops-uptime-monitor.git",
      "cd devops-uptime-monitor",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "DISCORD_ALERT_WEBHOOK": "https://discord.com/api/webhooks/...",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- monitors/{monId}: { name, url, intervalSeconds: 60, status: "UP" | "DOWN", sslExpiryDate }
- probeLogs/{logId}: { monitorId, responseTimeMs, statusCode, timestamp }
- incidents/{incId}: { monitorId, title, startedAt, resolvedAt, status: "INVESTIGATING" | "RESOLVED" }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/probes/execute", description: "Executes batch health check across all active monitors." },
      { method: "GET", endpoint: "/api/status/public", description: "Returns public status page overview and active incidents." }
    ],
    folderStructure: `uptime-monitor/
├── src/
│   ├── app/
│   │   ├── (admin)/monitors/
│   │   └── status/
│   ├── components/
│   │   ├── latency-chart/
│   │   └── incident-card/
│   └── lib/probe-worker.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy frontend on Vercel with scheduled health check execution via cron service (GitHub Actions / Cloud Scheduler).",
    testingGuide: "Run 'npm test' for probe timeout handling and SSL certificate parsing edge case tests.",
    sourceCodeFileName: "devops-uptime-monitor-v1.0.zip",
    sourceCodeSnippet: `// lib/probe-worker.ts
import https from "https";
export function checkSslCertificate(hostname: string): Promise<Date> {
  return new Promise((resolve, reject) => {
    const req = https.request({ host: hostname, port: 443, method: "GET" }, res => {
      const cert = (res.socket as any).getPeerCertificate();
      resolve(new Date(cert.valid_to));
    });
    req.on("error", reject);
    req.end();
  });
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 375,
    published: true,
  },

  {
    id: "proj-16-intelligent-logistics",
    slug: "intelligent-fleet-and-logistics-optimizer",
    title: "Intelligent Fleet Routing & Logistics Tracking System",
    shortDescription: "Fleet tracking platform with Dijkstra/TSP route optimization, delivery dispatch, and live driver GPS updates.",
    fullDescription: "A last-mile logistics management system that optimizes delivery vehicle routes to minimize fuel consumption and delivery delays. Features real-time GPS vehicle tracking on OpenStreetMap, proof of delivery signature capture, and automated customer ETA SMS notifications.",
    problemStatement: "Last-mile logistics accounts for over 50% of total delivery costs due to inefficient routing and lack of dynamic dispatch rescheduling.",
    solution: "A dispatch management engine that solves the Travelling Salesperson Problem (TSP) for multiple vehicles, calculates optimal route sequences, and tracks driver waypoints in real time.",
    keyFeatures: [
      "TSP delivery route optimization algorithm minimizing total transit kilometers",
      "Interactive OpenStreetMap live tracking of delivery fleet locations",
      "Driver mobile dispatch screen with step-by-step waypoint navigation",
      "Digital Proof of Delivery (signature pad and photo capture upload)",
      "Automated real-time customer ETA calculations based on traffic speed",
      "Vehicle capacity and payload volume constraint management",
      "Fuel consumption and delivery efficiency metrics dashboard",
      "Customer delivery tracking URL with live moving driver pin"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Leaflet / OSM", "Cloud Firestore", "Tailwind CSS", "Turf.js"],
    category: "Automation",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Implement route optimization heuristics (Nearest Neighbor & 2-Opt TSP)",
      "Render interactive geospatial Leaflet maps with custom animated vehicle markers",
      "Capture and store digital signature canvas data into Cloud Storage",
      "Calculate spatial distance matrices with Turf.js"
    ],
    prerequisites: ["TypeScript", "Geospatial basics", "Next.js"],
    architecture: `[Driver Mobile Web App (GPS)] ↔ [Firestore Location Stream] ↔ [Dispatcher Dashboard]
                                         ↓
[TSP Route Optimization Engine (Turf.js)] → [Customer Live Tracking Link]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/fleet-logistics-optimizer.git",
      "cd fleet-logistics-optimizer",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_MAP_TILES_URL": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- drivers/{driverId}: { name, vehiclePlate, currentCoords: { lat, lng }, status: "ON_ROUTE" }
- deliveries/{delId}: { driverId, customerName, address, coords: { lat, lng }, status: "DELIVERED", signatureUrl }
- routes/{routeId}: { driverId, waypoints: [], totalDistanceKm, optimizedSequence: [] }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/routes/optimize", description: "Calculates optimal delivery sequence for order batch." },
      { method: "POST", endpoint: "/api/deliveries/complete", description: "Submits customer signature and marks delivery completed." }
    ],
    folderStructure: `fleet-logistics/
├── src/
│   ├── app/
│   │   ├── (dispatcher)/routes/
│   │   ├── (driver)/my-deliveries/
│   │   └── track/[orderId]/
│   ├── components/
│   │   ├── leaflet-map/
│   │   └── signature-pad/
│   └── lib/tsp-solver.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Leaflet CSS and OpenStreetMap vector tiles.",
    testingGuide: "Run 'npm test' for TSP distance minimization algorithms and waypoint sorting validations.",
    sourceCodeFileName: "fleet-logistics-optimizer-v1.0.zip",
    sourceCodeSnippet: `// lib/tsp-solver.ts
export function solveTspNearestNeighbor(start: [number, number], stops: [number, number][]) {
  const unvisited = [...stops];
  const route = [start];
  let current = start;
  while (unvisited.length > 0) {
    unvisited.sort((a, b) => distance(current, a) - distance(current, b));
    current = unvisited.shift()!;
    route.push(current);
  }
  return route;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 320,
    published: true,
  },

  {
    id: "proj-17-dev-api-gateway",
    slug: "developer-api-gateway-and-rate-limiter",
    title: "Developer API Gateway & Rate-Limiter Portal",
    shortDescription: "API gateway proxy with token bucket rate-limiting, dynamic API key generation, and developer documentation portal.",
    fullDescription: "A developer infrastructure proxy that sits in front of microservices to provide authentication, API key generation with usage quotas, token-bucket rate limiting, and request latency telemetry.",
    problemStatement: "Backend APIs without rate limiting are vulnerable to denial-of-service (DoS) attacks and abusive scrapers.",
    solution: "A lightweight API Gateway proxy that validates API keys, enforces per-minute rate limits, transforms headers, and generates real-time analytics for API creators.",
    keyFeatures: [
      "API Key generator with SHA-256 secret hashing and usage tiers",
      "Token bucket rate-limiting algorithm returning 429 Too Many Requests",
      "Reverse proxy forwarding verified requests to downstream microservices",
      "Developer portal generating interactive Swagger/OpenAPI documentation",
      "Request/Response payload logging with latency metrics",
      "IP whitelisting and blacklisting security controls",
      "Monthly quota meter with automated developer alert emails at 80% and 100%",
      "API monetization dashboard tracking billable API calls"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Node.js", "Cloud Firestore", "Tailwind CSS"],
    category: "Developer Tools",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Implement Token Bucket and Leaky Bucket rate limiting algorithms",
      "Build high-performance HTTP reverse proxies in Node.js",
      "Hash and securely store API keys using cryptographic salts",
      "Generate dynamic OpenAPI/Swagger documentation from JSON schemas"
    ],
    prerequisites: ["Node.js Streams", "HTTP Protocol", "TypeScript"],
    architecture: `[External Developer Client] 
          ↓ (Request with X-API-KEY)
[API Gateway Proxy (Rate Limiter & Auth Validator)]
          ↓
[Downstream Microservice] ↔ [Cloud Firestore (Usage Logs & API Keys)]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/api-gateway-proxy.git",
      "cd api-gateway-proxy",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "DOWNSTREAM_API_URL": "https://api.internal.service.com",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- apiKeys/{keyId}: { hashedKey, ownerId, tier: "STARTER" | "ENTERPRISE", rateLimitPerMin: 60, currentMonthCalls: 1200 }
- apiLogs/{logId}: { keyId, endpoint, statusCode, latencyMs, timestamp }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/keys/create", description: "Generates new API key and returns one-time secret token." },
      { method: "ALL", endpoint: "/gateway/v1/*", description: "Proxies request to downstream service after verifying rate limits." }
    ],
    folderStructure: `api-gateway/
├── src/
│   ├── app/
│   │   ├── (dev)/keys/
│   │   ├── (dev)/analytics/
│   │   └── gateway/[...path]/
│   ├── components/
│   │   └── api-key-table/
│   └── lib/rate-limiter.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy gateway on Cloudflare Workers or Vercel Edge Runtime for lowest proxy latency.",
    testingGuide: "Run 'npm test' with Artillery load-testing script to verify 429 Too Many Requests enforcement under heavy load.",
    sourceCodeFileName: "api-gateway-proxy-v1.0.zip",
    sourceCodeSnippet: `// lib/rate-limiter.ts
export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private lastRefill: number;
  constructor(capacity: number) { this.capacity = capacity; this.tokens = capacity; this.lastRefill = Date.now(); }
  consume(): boolean {
    this.refill();
    if (this.tokens >= 1) { this.tokens--; return true; }
    return false;
  }
  private refill() { const now = Date.now(); const added = (now - this.lastRefill) / 1000; this.tokens = Math.min(this.capacity, this.tokens + added); this.lastRefill = now; }
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 305,
    published: true,
  },

  {
    id: "proj-18-social-impact-food-rescue",
    slug: "community-food-rescue-and-redistribution",
    title: "Community Food Rescue & Hunger Relief Redistribution Network",
    shortDescription: "Logistics network connecting restaurants and supermarkets with surplus food to local shelters and food banks in real time.",
    fullDescription: "A civic tech application tackling urban food waste. Restaurants and grocery stores post surplus perishable meals, notifying nearby verified NGOs and volunteer drivers to claim and transport food before expiration.",
    problemStatement: "Over 40% of prepared food in urban restaurants is discarded while local community shelters face severe daily meal shortages.",
    solution: "A real-time surplus food matching marketplace that alerts nearby volunteers via geospatial push notifications when fresh food is available for immediate rescue.",
    keyFeatures: [
      "Donor surplus food listing portal with expiry countdown timers",
      "Geospatial matching alerting verified NGOs within a 5km radius",
      "Volunteer driver claim and pickup confirmation workflow",
      "QR Code verification at pickup and drop-off points",
      "Dietary categorization (Vegetarian, Vegan, Non-Veg, Allergen labels)",
      "Impact analytics tracking kilograms of food saved and meals served",
      "Food safety self-certification checklist before donor dispatch",
      "Volunteer achievement badges and community impact leaderboard"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Leaflet", "Cloud Firestore", "Tailwind CSS"],
    category: "Social Impact",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Build location-based push notification broadcasts with GeoFirestore",
      "Implement multi-party pickup/delivery verification state machines",
      "Calculate environmental metrics (CO2 emissions diverted and meals delivered)",
      "Design accessible mobile-first interfaces for non-profit field volunteers"
    ],
    prerequisites: ["TypeScript", "Next.js", "Firebase Firestore"],
    architecture: `[Donor Restaurant] → [List Surplus Food (Firestore)]
                                ↓
[Geospatial Query (Nearby NGOs & Drivers)] → [Volunteer Pick-up & QR Drop-off Verification]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/food-rescue-network.git",
      "cd food-rescue-network",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- donors/{donorId}: { businessName, address, contactPhone, verified: boolean }
- foodDonations/{donationId}: { donorId, description, quantityKg, expiryTime, status: "AVAILABLE" | "CLAIMED" | "DELIVERED" }
- claims/{claimId}: { donationId, volunteerId, ngoId, pickedUpAt, deliveredAt }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/donations/create", description: "Posts surplus food listing with auto-expiry countdown." },
      { method: "POST", endpoint: "/api/donations/claim", description: "Reserves donation for volunteer pickup." }
    ],
    folderStructure: `food-rescue/
├── src/
│   ├── app/
│   │   ├── (donor)/post-food/
│   │   ├── (volunteer)/available-rescues/
│   │   └── impact/
│   ├── components/
│   │   ├── donation-card/
│   │   └── qr-verifier/
│   └── lib/geo-distance.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with mobile-responsive viewport optimization.",
    testingGuide: "Run 'npm test' for donation expiry scheduler and proximity calculation tests.",
    sourceCodeFileName: "food-rescue-network-v1.0.zip",
    sourceCodeSnippet: `// lib/geo-distance.ts
export function isWithinRadius(donorLoc: [number, number], ngoLoc: [number, number], radiusKm = 5): boolean {
  const d = haversineDistance(donorLoc, ngoLoc);
  return d <= radiusKm;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 280,
    published: true,
  },

  {
    id: "proj-19-personal-finance-manager",
    slug: "ai-personal-finance-and-budget-manager",
    title: "AI Personal Finance & Expense Intelligence Manager",
    shortDescription: "Personal wealth dashboard with automated transaction categorization, recurring subscription detection, and budget forecasting.",
    fullDescription: "A smart personal wealth and expense management application that parses bank CSV statements, categorizes purchases using Gemini NLP, tracks recurring SaaS subscriptions, and provides personalized monthly savings forecasts.",
    problemStatement: "Consumers lose hundreds of dollars annually to forgotten recurring subscriptions and lack clarity on where their monthly budget leaks occur.",
    solution: "An automated financial analytics dashboard that detects recurring billing cycles, alerts users to price hikes, and simulates compound interest retirement projections.",
    keyFeatures: [
      "Bank statement CSV importer with automated column schema mapping",
      "Gemini AI transaction categorizer (Groceries, Utilities, Dining, Investments)",
      "Recurring Subscription Tracker with renewal date calendar alerts",
      "Dynamic Category Budget Progress Bars with overspending warnings",
      "Monthly Savings Rate and Net Worth trajectory visualizations",
      "Emergency Fund goal progress tracker with automated target milestones",
      "Financial Health Score algorithm based on debt-to-income and savings ratios",
      "Encrypted local database export option for privacy-conscious users"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Flash", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "FinTech",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Parse and sanitize heterogeneous CSV financial statements in the browser",
      "Train zero-shot transaction categorizers with Gemini prompt engineering",
      "Construct interactive compound interest and savings simulation calculators",
      "Design clean financial charts using Recharts and Tailwind CSS"
    ],
    prerequisites: ["TypeScript", "Next.js", "React State Management"],
    architecture: `[Bank CSV Upload / Manual Entry] → [Gemini AI Categorization Pipeline]
                                              ↓
[Cloud Firestore (Encrypted Transactions & Budgets)] → [Financial Intelligence Dashboard]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/personal-finance-manager.git",
      "cd personal-finance-manager",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- userBudgets/{userId}: { monthlyIncome, categoryLimits: { dining: 5000, rent: 15000 } }
- transactions/{txId}: { userId, date, description, amount, category, isRecurring: boolean }
- subscriptions/{subId}: { userId, serviceName, amount, billingCycle: "MONTHLY", nextRenewal }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/finance/categorize", description: "Uses Gemini AI to categorize raw bank transaction descriptions." },
      { method: "GET", endpoint: "/api/finance/analytics", description: "Calculates monthly spending breakdown and savings rate." }
    ],
    folderStructure: `finance-manager/
├── src/
│   ├── app/
│   │   ├── (dashboard)/overview/
│   │   ├── subscriptions/
│   │   └── budgets/
│   ├── components/
│   │   ├── spending-chart/
│   │   └── budget-progress/
│   └── lib/categorizer.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with client-side CSV parsing to ensure sensitive raw files never leave the browser unencrypted.",
    testingGuide: "Run 'npm test' for financial categorization rules and budget limit warning trigger tests.",
    sourceCodeFileName: "personal-finance-manager-v1.0.zip",
    sourceCodeSnippet: `// lib/categorizer.ts
export async function categorizeTransaction(description: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = \`Classify this transaction into [Dining, Groceries, Utilities, Transport, Entertainment, Shopping]: "\${description}". Return only category name.\`;
  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 460,
    published: true,
  },

  {
    id: "proj-20-contractor-marketplace",
    slug: "on-demand-home-services-booking-platform",
    title: "On-Demand Home Services & Contractor Booking Platform",
    shortDescription: "Service booking marketplace connecting homeowners with verified local plumbers, electricians, and technicians.",
    fullDescription: "A full-stack on-demand service marketplace. Allows customers to book home service appointments, track contractor ETA on an interactive map, and pay securely upon job completion.",
    problemStatement: "Finding trusted, background-verified home repair technicians with transparent upfront pricing is tedious and unreliable.",
    solution: "A localized contractor platform featuring fixed-price service catalogs, verified customer ratings, real-time booking dispatch, and escrow payments.",
    keyFeatures: [
      "Fixed-price home service catalog (Plumbing, Electrical, AC Repair, Cleaning)",
      "Instant contractor availability scheduler with calendar time slots",
      "Technician mobile app accepting/declining nearby job requests",
      "Live GPS tracking of technician en route to customer home",
      "In-app messaging between homeowner and assigned technician",
      "Razorpay payment integration with escrow completion release",
      "Before/After work completion photo upload for quality assurance",
      "Verified customer review and 5-star rating feedback system"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Cloud Firestore", "Razorpay"],
    category: "Business Applications",
    difficulty: "INTERMEDIATE",
    estimatedDuration: "6-8 Weeks",
    learningOutcomes: [
      "Design two-sided marketplace transaction lifecycles",
      "Implement service job dispatch state machines in Firestore",
      "Integrate before/after photo verification into payment release flows",
      "Structure rating and review algorithms for service provider trust scores"
    ],
    prerequisites: ["React", "TypeScript", "Firestore basics"],
    architecture: `[Homeowner / Contractor UI] ↔ [Next.js API Routes]
                                   ↓
[Cloud Firestore (Jobs, Services, Contractors)] ↔ [Razorpay Escrow Payment]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/home-services-marketplace.git",
      "cd home-services-marketplace",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_RAZORPAY_KEY_ID": "rzp_live_your_public_key_id",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- services/{serviceId}: { name, category, standardPrice, estimatedMinutes }
- contractors/{conId}: { name, trade, rating: 4.8, isOnline: boolean }
- bookings/{bookId}: { customerId, contractorId, serviceId, scheduledDate, status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED", paymentStatus: "PAID" }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/bookings/create", description: "Creates service booking and dispatches alerts to nearby contractors." },
      { method: "POST", endpoint: "/api/bookings/complete-job", description: "Submits work completion photos and releases payment." }
    ],
    folderStructure: `home-services/
├── src/
│   ├── app/
│   │   ├── (customer)/services/
│   │   ├── (contractor)/jobs/
│   │   └── booking/[id]/
│   ├── components/
│   │   ├── service-grid/
│   │   └── job-tracker/
│   └── lib/booking-state.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Razorpay test credentials for seamless booking testing.",
    testingGuide: "Run 'npm test' for booking lifecycle transitions and contractor rating calculations.",
    sourceCodeFileName: "home-services-marketplace-v1.0.zip",
    sourceCodeSnippet: `// lib/booking-state.ts
export function canTransitionBooking(currentStatus: string, nextStatus: string): boolean {
  const allowedTransitions: Record<string, string[]> = {
    "REQUESTED": ["ASSIGNED", "CANCELLED"],
    "ASSIGNED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED"],
    "COMPLETED": []
  };
  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}`,
    isPremium: true,
    accessLevel: "PREMIUM_399",
    downloadCount: 330,
    published: true,
  },

  // ==========================================
  // 3. BEGINNER PROJECTS (5 Projects)
  // ==========================================
  {
    id: "proj-21-developer-portfolio",
    slug: "developer-portfolio-and-resume-builder",
    title: "Developer Portfolio & Interactive Resume Builder",
    shortDescription: "High-converting developer portfolio template with dynamic project showcases, interactive skill charts, and contact form.",
    fullDescription: "A modern developer portfolio website template built with Next.js 14 and Tailwind CSS. Features dynamic GitHub project repository embedding, downloadable PDF resume generator, and automated contact form submissions.",
    problemStatement: "Students struggle to showcase their projects cleanly to hiring managers with slow, generic static templates.",
    solution: "A responsive portfolio template with dark mode aesthetics, GitHub API integration, and verifiable digital certificate badges.",
    keyFeatures: [
      "Dynamic GitHub repository cards fetching stars and language breakdown",
      "Interactive technical skill proficiency tags with filtering",
      "Embedded project showcase with live demo links and screenshots",
      "Contact form with automated email dispatch via serverless functions",
      "Mobile-optimized responsive design with smooth scroll navigation",
      "Dark and light theme toggle with system preference detection",
      "SEO metadata tags and Open Graph social sharing cards",
      "Clean modular code structure ready to deploy on Vercel in 1 click"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Framer Motion", "Lucide Icons"],
    category: "Full Stack Development",
    difficulty: "BEGINNER",
    estimatedDuration: "2-4 Weeks",
    learningOutcomes: [
      "Master Next.js 14 App Router and Tailwind CSS responsive styling",
      "Fetch and display public GitHub API repository statistics",
      "Implement dark mode toggles with local storage persistence",
      "Deploy custom web applications to Vercel in minutes"
    ],
    prerequisites: ["HTML/CSS", "JavaScript/TypeScript basics", "React basics"],
    architecture: `[Next.js Client] ↔ [GitHub REST API (Repo Stats)] ↔ [Vercel Serverless Contact API]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/developer-portfolio.git",
      "cd developer-portfolio",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GITHUB_USERNAME": "your_github_handle",
      "CONTACT_EMAIL_RECEIVER": "your_email@domain.com"
    },
    databaseSchema: "Stateless / Client-side with optional Firestore contact submission logging.",
    apiDocumentation: [
      { method: "POST", endpoint: "/api/contact", description: "Sends email notification when recruiter fills contact form." }
    ],
    folderStructure: `dev-portfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── api/contact/
│   ├── components/
│   │   ├── project-showcase/
│   │   └── hero-section/
│   └── data/portfolio-data.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy in 1-click on Vercel by importing the repository from GitHub.",
    testingGuide: "Run 'npm run lint' and test contact form submission validation.",
    sourceCodeFileName: "developer-portfolio-v1.0.zip",
    sourceCodeSnippet: `// data/portfolio-data.ts
export const DEVELOPER_PROFILE = {
  name: "Alex Developer",
  role: "Full-Stack Engineer",
  skills: ["React", "Next.js", "TypeScript", "Node.js", "Firebase", "Tailwind CSS"],
  githubUrl: "https://github.com/username"
};`,
    isPremium: false,
    accessLevel: "FREE",
    downloadCount: 890,
    published: true,
  },

  {
    id: "proj-22-markdown-blog",
    slug: "static-markdown-blog-and-knowledge-base",
    title: "Static Markdown Tech Blog & Knowledge Base Engine",
    shortDescription: "Ultra-fast developer blogging platform reading local MDX markdown files with syntax highlighting and reading time calculation.",
    fullDescription: "A developer blog engine that renders MDX markdown files with syntax-highlighted code blocks, automated table of contents, and search indexing.",
    problemStatement: "Medium and third-party blogging platforms own your content and distract readers with paywalls.",
    solution: "A self-hosted markdown blog template that compiles local .mdx files into lightning-fast static pages with 100/100 Google Lighthouse scores.",
    keyFeatures: [
      "MDX support for embedding interactive React components inside blog posts",
      "Automated reading time calculation and word counter",
      "Syntax-highlighted code blocks with copy-to-clipboard button",
      "Dynamic Table of Contents linking to heading anchors",
      "Category and tag filtering with search bar",
      "RSS 2.0 Feed and XML Sitemap auto-generation for SEO",
      "Social sharing buttons (Twitter/X, LinkedIn, WhatsApp)",
      "Zero database dependency — all articles stored as local Git files"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "MDX", "Tailwind CSS", "Rehype/Remark"],
    category: "Developer Tools",
    difficulty: "BEGINNER",
    estimatedDuration: "2-4 Weeks",
    learningOutcomes: [
      "Parse and transform local Markdown files into React virtual DOM elements",
      "Generate static routes with Next.js generateStaticParams()",
      "Implement RSS feeds and dynamic sitemaps for search engine indexing",
      "Style prose typography with @tailwindcss/typography"
    ],
    prerequisites: ["Markdown basics", "React/Next.js basics"],
    architecture: `[Local Markdown .mdx Files in /content] → [MDX Compiler & Rehype Highlight] → [Static HTML Pages]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/markdown-tech-blog.git",
      "cd markdown-tech-blog",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "SITE_URL": "http://localhost:3000"
    },
    databaseSchema: "No database required. Files stored in /content/posts/*.mdx.",
    apiDocumentation: [
      { method: "GET", endpoint: "/feed.xml", description: "Returns RSS 2.0 feed XML for feed readers." }
    ],
    folderStructure: `markdown-blog/
├── content/
│   └── posts/
│       ├── getting-started-with-nextjs.mdx
│       └── mastering-typescript.mdx
├── src/
│   ├── app/
│   │   ├── blog/[slug]/
│   │   └── sitemap.ts
│   └── lib/mdx-parser.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel or GitHub Pages as an optimized static export.",
    testingGuide: "Run 'npm run build' to verify all MDX files compile without syntax errors.",
    sourceCodeFileName: "markdown-tech-blog-v1.0.zip",
    sourceCodeSnippet: `// lib/mdx-parser.ts
import fs from "fs";
import matter from "gray-matter";
export function getPostBySlug(slug: string) {
  const fileContent = fs.readFileSync(\`content/posts/\${slug}.mdx\`, "utf8");
  const { data, content } = matter(fileContent);
  return { metadata: data, content };
}`,
    isPremium: false,
    accessLevel: "FREE",
    downloadCount: 710,
    published: true,
  },

  {
    id: "proj-23-task-tracker",
    slug: "collaborative-kanban-task-tracker",
    title: "Personal Productivity & Kanban Task Tracker",
    shortDescription: "Trello-style drag-and-drop task board with priority labels, subtask checklists, and due date reminders.",
    fullDescription: "A personal productivity application featuring customizable task columns (To Do, In Progress, Done), priority labels (High, Medium, Low), task checklists, and dark mode support.",
    problemStatement: "Cluttered sticky notes and disorganized to-do lists lead to missed deadlines and productivity bottlenecks.",
    solution: "A visual task tracker with drag-and-drop organization, subtask completion progress bars, and cloud persistence in Firestore.",
    keyFeatures: [
      "Drag-and-drop task column reordering",
      "Priority badges with color coding (Urgent, High, Normal, Low)",
      "Subtask checklist with visual completion progress percentage",
      "Due date selector with overdue task highlights",
      "Cloud sync with Firebase Firestore and offline local storage fallback",
      "Quick task search and tag filtering",
      "Export task list to CSV or JSON format",
      "Responsive layout for mobile and desktop screens"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Cloud Firestore", "Firebase Auth"],
    category: "Full Stack Development",
    difficulty: "BEGINNER",
    estimatedDuration: "2-4 Weeks",
    learningOutcomes: [
      "Manage interactive UI state with React useState and useReducer",
      "Perform basic Firestore CRUD operations (Create, Read, Update, Delete)",
      "Implement drag-and-drop list reordering without external bulky dependencies",
      "Build accessible modal dialogs with keyboard navigation"
    ],
    prerequisites: ["JavaScript/TypeScript", "React basics", "Firebase Auth"],
    architecture: `[Next.js Client UI] ↔ [Cloud Firestore (users/{userId}/tasks/{taskId})]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/kanban-task-tracker.git",
      "cd kanban-task-tracker",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- users/{userId}/tasks/{taskId}: { title, description, column: "TODO" | "PROGRESS" | "DONE", priority: "HIGH", dueDate: Timestamp, subtasks: [] }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/tasks/create", description: "Creates a new task in user workspace." }
    ],
    folderStructure: `task-tracker/
├── src/
│   ├── app/
│   │   └── dashboard/
│   ├── components/
│   │   ├── task-board/
│   │   └── task-modal/
│   └── lib/firebase.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Firebase credentials configured in environment variables.",
    testingGuide: "Run 'npm test' for task state management and filter logic unit tests.",
    sourceCodeFileName: "kanban-task-tracker-v1.0.zip",
    sourceCodeSnippet: `// components/task-board/TaskCard.tsx
export function TaskCard({ task, onStatusChange }: { task: Task, onStatusChange: Function }) {
  return <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
    <div className="text-xs font-bold text-white">{task.title}</div>
    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold">{task.priority}</span>
  </div>;
}`,
    isPremium: false,
    accessLevel: "FREE",
    downloadCount: 650,
    published: true,
  },

  {
    id: "proj-24-weather-telemetry",
    slug: "realtime-weather-telemetry-and-air-quality-dashboard",
    title: "Real-Time Weather Telemetry & Air Quality Dashboard",
    shortDescription: "Geospatial meteorological dashboard with 7-day weather forecasting, Air Quality Index (AQI) radar, and precipitation charts.",
    fullDescription: "A modern meteorological dashboard that queries Open-Meteo / OpenWeather APIs to display real-time weather conditions, 7-day temperature trends, wind speed compasses, and Air Quality Index (AQI) pollutant breakdowns.",
    problemStatement: "Standard weather apps are cluttered with intrusive ads and lack detailed air quality pollutant data (PM2.5, PM10, NO2).",
    solution: "A clean, ad-free meteorological telemetry dashboard featuring hourly precipitation curves, AQI health advisory cards, and dynamic weather animations.",
    keyFeatures: [
      "GPS Geolocation auto-detection with city search autocomplete",
      "7-day hourly temperature and precipitation forecast charts",
      "Air Quality Index (AQI) gauge breakdown (PM2.5, PM10, CO, Ozone)",
      "Dynamic weather condition animations (Rain, Thunderstorm, Sunny, Snow)",
      "UV Index and sunrise/sunset astronomical tracker",
      "Severe weather alert banners for incoming heatwaves or storms",
      "Temperature unit toggle (Celsius / Fahrenheit)",
      "PWA support for installing as a mobile app on iOS and Android"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Recharts", "Open-Meteo API"],
    category: "Data Analytics",
    difficulty: "BEGINNER",
    estimatedDuration: "2-4 Weeks",
    learningOutcomes: [
      "Consume and transform third-party REST API payloads with Next.js",
      "Render responsive multi-axis area charts using Recharts",
      "Handle browser Geolocation API permissions gracefully",
      "Configure Progressive Web App (PWA) manifest and service workers"
    ],
    prerequisites: ["JavaScript/TypeScript", "Fetch API", "React Hooks"],
    architecture: `[Client Geolocation] → [Next.js Weather API Route] → [Open-Meteo Public API]
                                   ↓
[Dynamic Weather Dashboard & Recharts Forecast Trends]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/weather-telemetry-dashboard.git",
      "cd weather-telemetry-dashboard",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "NEXT_PUBLIC_APP_URL": "http://localhost:3000"
    },
    databaseSchema: "Client-side cached queries / NoSQL user favorite cities storage.",
    apiDocumentation: [
      { method: "GET", endpoint: "/api/weather?lat=13.08&lng=80.27", description: "Fetches hourly forecast and AQI data for coordinates." }
    ],
    folderStructure: `weather-app/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── api/weather/
│   ├── components/
│   │   ├── aqi-gauge/
│   │   └── forecast-chart/
│   └── lib/weather-api.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel as a static Progressive Web App (PWA).",
    testingGuide: "Run 'npm test' for temperature conversion functions and AQI color threshold tests.",
    sourceCodeFileName: "weather-telemetry-dashboard-v1.0.zip",
    sourceCodeSnippet: `// lib/weather-api.ts
export async function getWeatherData(lat: number, lng: number) {
  const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lng}&hourly=temperature_2m,precipitation_probability,pm2_5\`;
  const res = await fetch(url);
  return res.json();
}`,
    isPremium: false,
    accessLevel: "FREE",
    downloadCount: 780,
    published: true,
  },

  {
    id: "proj-25-recipe-nutrition-finder",
    slug: "ai-recipe-generator-and-nutrition-calculator",
    title: "AI Recipe Generator & Nutritional Macro Calculator",
    shortDescription: "Culinary assistant generating personalized healthy recipes based on ingredients currently in your fridge, complete with macro breakdown.",
    fullDescription: "An AI culinary assistant that solves the 'what can I cook today?' problem. Users input their available pantry ingredients and dietary preferences (Keto, Vegan, High-Protein), and Gemini AI generates step-by-step recipes with accurate calorie and macronutrient estimations.",
    problemStatement: "Home cooks waste pantry ingredients and struggle to track daily protein, carb, and calorie macros for their home-cooked meals.",
    solution: "An ingredient-driven AI recipe architect that drafts creative recipes, calculates nutritional macro breakdowns, and generates organized grocery shopping lists.",
    keyFeatures: [
      "Pantry ingredient input tagger with allergen exclusions",
      "AI recipe generation with prep time, difficulty, and cooking instructions",
      "Nutritional Macro Breakdown pie chart (Calories, Protein, Carbs, Fat)",
      "Dietary filter presets (High-Protein, Vegan, Gluten-Free, Low-Carb)",
      "Save favorite recipes to personal cookbook in Firestore",
      "One-click grocery shopping list generator for missing items",
      "Portion size scaling calculator dynamically updating ingredient measurements",
      "Printable recipe card view for easy kitchen reference"
    ],
    technologyStack: ["Next.js 14", "TypeScript", "Gemini 1.5 Flash", "Cloud Firestore", "Tailwind CSS", "Recharts"],
    category: "Generative AI",
    difficulty: "BEGINNER",
    estimatedDuration: "2-4 Weeks",
    learningOutcomes: [
      "Build structured prompt pipelines with Gemini 1.5 to return typed JSON objects",
      "Construct dynamic nutritional breakdown graphs using Recharts",
      "Implement ingredient tag inputs with auto-suggest chips in React",
      "Manage user recipe bookmarking collections in Cloud Firestore"
    ],
    prerequisites: ["React", "TypeScript", "Prompt Engineering"],
    architecture: `[Pantry Ingredients Input] → [Gemini AI Recipe Prompt] 
                                    ↓
[Structured Recipe JSON & Macro Calculation] → [Cloud Firestore Cookbook]`,
    installationSteps: [
      "git clone https://github.com/sctech-org/ai-recipe-calculator.git",
      "cd ai-recipe-calculator",
      "npm install",
      "npm run dev"
    ],
    environmentVariables: {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "FIREBASE_PROJECT_ID": "scmain-b2cde"
    },
    databaseSchema: `Collections:
- savedRecipes/{recipeId}: { userId, title, ingredients: [], calories, proteinGrams, carbsGrams, fatGrams, instructions: [] }`,
    apiDocumentation: [
      { method: "POST", endpoint: "/api/recipes/generate", description: "Generates recipe and macro breakdown from ingredient list." }
    ],
    folderStructure: `recipe-ai/
├── src/
│   ├── app/
│   │   ├── (cook)/generator/
│   │   └── cookbook/
│   ├── components/
│   │   ├── macro-chart/
│   │   └── recipe-card/
│   └── lib/recipe-prompt.ts
├── package.json
└── README.md`,
    deploymentGuide: "Deploy on Vercel with Gemini API key set in project environment settings.",
    testingGuide: "Run 'npm test' for ingredient scaling arithmetic and macro percentage calculator tests.",
    sourceCodeFileName: "ai-recipe-calculator-v1.0.zip",
    sourceCodeSnippet: `// lib/recipe-prompt.ts
export async function generateRecipe(ingredients: string[], diet: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = \`Create a \${diet} recipe using: \${ingredients.join(", ")}. Return JSON with { title, calories, protein, instructions: [] }\`;
  const res = await model.generateContent(prompt);
  return JSON.parse(res.response.text());
}`,
    isPremium: false,
    accessLevel: "FREE",
    downloadCount: 620,
    published: true,
  }
];
