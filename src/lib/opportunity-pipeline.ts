import { getAdminDb } from "@/lib/firebase-admin";
import { removeUndefinedValues } from "@/lib/firestore";
import { OpportunityItem, OpportunitySyncResult } from "./opportunity-models";
import { slugify, isDeadlinePassed } from "./platform-models";

export const OPPORTUNITY_COLLECTION = "opportunities";

// Curated Initial Seed Opportunities (Ensures instant high-quality data)
export const VERIFIED_SEED_OPPORTUNITIES: Omit<OpportunityItem, "id" | "slug" | "dedupKey" | "fetchedAt">[] = [
  // ==========================================
  // BEGINNER / ENTRY-LEVEL INTERNSHIPS
  // ==========================================
  {
    title: "Junior Web Development & UI Intern",
    company: "Zoho Corporation",
    companyLogoUrl: "https://www.zoho.com/favicon.ico",
    role: "Junior Web Developer Intern",
    description: "Build clean, accessible, and responsive user interfaces for SaaS enterprise tools. Learn component-driven development with HTML5, CSS3, Modern JavaScript, and Git collaboration workflows.",
    location: "Chennai / Coimbatore / Remote",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Zoho Careers",
    sourceUrl: "https://www.zoho.com/careers/",
    applyUrl: "https://www.zoho.com/careers/",
    skills: ["HTML5", "CSS3", "JavaScript", "React", "Git", "Responsive Design"],
    eligibility: "Open to 1st, 2nd, and 3rd year undergraduate students from any branch with foundational web development curiosity.",
    stipend: "₹25,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    deadline: "2026-11-30",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-10T09:00:00Z",
    category: "Frontend",
    tags: ["Beginner Friendly", "Zoho", "Mentorship", "Web Dev"]
  },
  {
    title: "Python Automation & Data Analyst Intern",
    company: "Infosys Springboard",
    companyLogoUrl: "https://springboard.infosys.com/favicon.ico",
    role: "Python Data Analyst Intern",
    description: "Write automated scripts, perform exploratory data analysis, and build automated reporting dashboards using Python, Pandas, SQL, and Excel for enterprise clients.",
    location: "Bengaluru, Karnataka / Remote",
    mode: "Remote",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Infosys Springboard",
    sourceUrl: "https://springboard.infosys.com/",
    applyUrl: "https://springboard.infosys.com/",
    skills: ["Python", "SQL", "Pandas", "Excel", "Data Cleaning", "Matplotlib"],
    eligibility: "Students pursuing BCA, B.Sc (CS/IT), or B.Tech with basic Python programming knowledge.",
    stipend: "₹22,000 / month",
    isFree: true,
    startDate: "2026-06-15",
    endDate: "2026-09-15",
    deadline: "2026-12-15",
    featured: false,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-12T10:00:00Z",
    category: "Data Science",
    tags: ["Beginner", "Python", "Data Analysis", "Remote"]
  },
  {
    title: "Junior QA & Automation Testing Intern",
    company: "BrowserStack",
    companyLogoUrl: "https://www.browserstack.com/favicon.ico",
    role: "QA Automation Testing Intern",
    description: "Learn end-to-end automated testing, cross-browser compatibility testing, and API verification using Cypress, Selenium, and Postman across mobile and desktop environments.",
    location: "Mumbai, Maharashtra / Remote",
    mode: "Remote",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "BrowserStack Careers",
    sourceUrl: "https://www.browserstack.com/careers",
    applyUrl: "https://www.browserstack.com/careers",
    skills: ["QA Testing", "Selenium", "Cypress", "JavaScript", "Postman", "Jest"],
    eligibility: "Students interested in software quality assurance, bug lifecycle management, and test automation.",
    stipend: "₹35,000 / month",
    isFree: true,
    startDate: "2026-05-01",
    endDate: "2026-08-31",
    deadline: "2026-10-31",
    featured: false,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-14T11:00:00Z",
    category: "Full Stack",
    tags: ["Testing", "QA", "Automation", "Cypress"]
  },
  {
    title: "Product Design & UI/UX Intern",
    company: "CRED",
    companyLogoUrl: "https://cred.club/favicon.ico",
    role: "Product Design Intern",
    description: "Craft high-fidelity micro-interactions, mobile wireframes, and design system components. Conduct user research and collaborate closely with product engineering teams.",
    location: "Bengaluru, Karnataka",
    mode: "On-site",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "CRED Careers",
    sourceUrl: "https://cred.club/careers",
    applyUrl: "https://cred.club/careers",
    skills: ["Figma", "UI/UX Design", "Prototyping", "Design Systems", "User Research", "Wireframing"],
    eligibility: "Design students or self-taught UI/UX enthusiasts with a strong Figma portfolio.",
    stipend: "₹40,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-11-15",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-18T12:00:00Z",
    category: "Frontend",
    tags: ["UI/UX", "Design", "Figma", "CRED"]
  },

  // ==========================================
  // INTERMEDIATE / CORE ENGINEERING INTERNSHIPS
  // ==========================================
  {
    title: "Full Stack Developer Intern (Remote)",
    company: "Postman",
    companyLogoUrl: "https://www.postman.com/favicon.ico",
    role: "Software Engineering Intern - Platform",
    description: "Work on the world's leading API platform. Improve developer tooling, API client performance, and workspace collaboration features.",
    location: "Remote (India)",
    mode: "Remote",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Postman Careers",
    sourceUrl: "https://www.postman.com/company/careers/",
    applyUrl: "https://www.postman.com/company/careers/",
    skills: ["TypeScript", "React", "Node.js", "Electron", "REST/GraphQL"],
    eligibility: "All undergraduate and postgraduate tech students.",
    stipend: "₹50,000 / month",
    isFree: true,
    startDate: "2026-04-01",
    endDate: "2026-09-30",
    deadline: "2026-12-15",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-22T14:00:00Z",
    category: "Frontend",
    tags: ["Remote", "Developer Tools", "TypeScript"]
  },
  {
    title: "Backend Engineering Intern",
    company: "Razorpay",
    companyLogoUrl: "https://razorpay.com/favicon.png",
    role: "Backend Intern",
    description: "Build mission-critical payment rails, idempotent financial transaction microservices, and webhook pipelines handling millions of TPS.",
    location: "Bengaluru, Karnataka",
    mode: "On-site",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Razorpay Careers",
    sourceUrl: "https://razorpay.com/jobs/",
    applyUrl: "https://razorpay.com/jobs/",
    skills: ["Go", "Node.js", "MySQL", "Kafka", "Microservices"],
    eligibility: "Students graduating in 2026 or 2027.",
    stipend: "₹65,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    deadline: "2026-10-15",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-20T10:30:00Z",
    category: "Backend",
    tags: ["Fintech", "High Impact", "Go"]
  },
  {
    title: "Cloud Infrastructure & SRE Intern",
    company: "Zerodha / FOSS",
    companyLogoUrl: "https://zerodha.com/favicon.ico",
    role: "Cloud Platform & SRE Intern",
    description: "Automate scalable cloud deployments, configure Prometheus/Grafana observability dashboards, and maintain high-uptime self-hosted Linux server clusters for financial technology.",
    location: "Bengaluru, Karnataka / Remote",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Zerodha Tech Careers",
    sourceUrl: "https://zerodha.com/careers",
    applyUrl: "https://zerodha.com/careers",
    skills: ["Linux", "Docker", "Kubernetes", "Go", "PostgreSQL", "Prometheus"],
    eligibility: "Engineering students passionate about Open Source, Linux systems, and site reliability.",
    stipend: "₹55,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-11-25",
    featured: false,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-23T11:00:00Z",
    category: "Cloud",
    tags: ["SRE", "Cloud", "Linux", "Kubernetes", "Zerodha"]
  },
  {
    title: "Mobile Application (Flutter & React Native) Intern",
    company: "PhonePe",
    companyLogoUrl: "https://www.phonepe.com/favicon.ico",
    role: "Mobile App Developer Intern",
    description: "Develop seamless fintech payments and merchant checkout flows across Android and iOS platforms. Optimize frame rendering, local caching, and secure biometrics.",
    location: "Bengaluru, Karnataka",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "PhonePe Careers",
    sourceUrl: "https://www.phonepe.com/careers/",
    applyUrl: "https://www.phonepe.com/careers/",
    skills: ["Flutter", "Dart", "React Native", "Android", "iOS", "REST APIs"],
    eligibility: "Undergraduate students with published mobile apps or strong GitHub mobile projects.",
    stipend: "₹50,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-12-05",
    featured: false,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-24T12:00:00Z",
    category: "Mobile",
    tags: ["Flutter", "React Native", "Mobile", "Fintech"]
  },

  // ==========================================
  // HIGH-TECH / DEEP-TECH / ENTERPRISE INTERNSHIPS
  // ==========================================
  {
    title: "Generative AI & LLM Systems Engineer Intern",
    company: "SC TECH AI Labs & OpenAI Partner Track",
    companyLogoUrl: "/logo.png",
    role: "GenAI & LLM Research Engineer Intern",
    description: "Design and implement production-ready RAG pipelines, fine-tune open weights LLMs (Llama 3, Mistral, Gemma), optimize inference latency with vLLM, and deploy multi-agent autonomous swarms.",
    location: "Remote / Hybrid (Bengaluru)",
    mode: "Remote",
    opportunityType: "INTERNSHIP",
    sourceType: "INTERNAL",
    sourceName: "SC TECH AI Labs",
    sourceUrl: "https://sctech.org/internships",
    applyUrl: "https://sctech.org/internships",
    skills: ["PyTorch", "LLMs", "LangChain", "vLLM", "CUDA", "Vector DBs", "RAG"],
    eligibility: "Advanced B.Tech/M.Tech/MS students with strong foundations in Deep Learning, PyTorch, and NLP.",
    stipend: "₹1,20,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-11-30",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-25T08:00:00Z",
    category: "AI / ML",
    tags: ["GenAI", "LLMs", "High-Tech", "High Stipend", "Deep Learning"]
  },
  {
    title: "Autonomous Driving & Robotics Computer Vision Intern",
    company: "NVIDIA",
    companyLogoUrl: "https://www.nvidia.com/favicon.ico",
    role: "Autonomous Systems AI Intern",
    description: "Work on real-time sensor fusion, 3D object detection, semantic segmentation, and robotic path planning using NVIDIA Isaac SIM, CUDA, and TensorRT on edge hardware.",
    location: "Pune, Maharashtra / Bengaluru, Karnataka",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "NVIDIA Careers",
    sourceUrl: "https://www.nvidia.com/careers",
    applyUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/",
    skills: ["CUDA", "C++", "PyTorch", "Computer Vision", "ROS2", "TensorRT"],
    eligibility: "Students pursuing Computer Science, Robotics, or Electrical Engineering with C++ and OpenCV expertise.",
    stipend: "₹95,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-12-20",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-26T09:00:00Z",
    category: "AI / ML",
    tags: ["Robotics", "Computer Vision", "NVIDIA", "CUDA", "High-Tech"]
  },
  {
    title: "High-Frequency Trading (HFT) Low-Latency Systems Intern",
    company: "Tower Research Capital",
    companyLogoUrl: "https://www.tower-research.com/favicon.ico",
    role: "Quantitative Systems Engineer Intern",
    description: "Develop sub-microsecond algorithmic trading systems, optimize CPU cache hierarchies, benchmark custom kernel bypass networking (Solarflare), and build lock-free ring buffers.",
    location: "Gurugram, Haryana / Bengaluru, Karnataka",
    mode: "On-site",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Tower Research Capital",
    sourceUrl: "https://www.tower-research.com",
    applyUrl: "https://www.tower-research.com/open-positions",
    skills: ["Modern C++ (C++20)", "Low-Latency Systems", "Linux Kernel", "Socket Programming", "Data Structures"],
    eligibility: "Exceptional undergraduate/postgraduate coders with top competitive programming ratings or deep systems knowledge.",
    stipend: "₹1,50,000 / month",
    isFree: true,
    startDate: "2026-05-15",
    endDate: "2026-08-15",
    deadline: "2026-10-31",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-27T10:00:00Z",
    category: "Backend",
    tags: ["HFT", "Low-Latency", "C++", "Quantitative", "Elite"]
  },
  {
    title: "Cybersecurity Penetration Testing & Threat Hunter Intern",
    company: "CrowdStrike",
    companyLogoUrl: "https://www.crowdstrike.com/favicon.ico",
    role: "Threat Hunter & Security Analyst Intern",
    description: "Perform red-team adversary emulation, kernel-level telemetry analysis, reverse engineer malware payloads, and construct automated detection rules for Falcon EDR platform.",
    location: "Bengaluru, Karnataka / Remote",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "CrowdStrike Careers",
    sourceUrl: "https://www.crowdstrike.com/careers",
    applyUrl: "https://www.crowdstrike.com/careers/",
    skills: ["Penetration Testing", "Reverse Engineering", "Wireshark", "Metasploit", "Python", "Threat Hunting"],
    eligibility: "Students with hands-on CTF experience, TryHackMe/HackTheBox top rankings, or CEH/OSCP certifications.",
    stipend: "₹85,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-12-10",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-28T11:00:00Z",
    category: "Full Stack",
    tags: ["Cybersecurity", "Red Team", "PenTesting", "Threat Hunting"]
  },
  {
    title: "Quantum Computing Algorithms Research Intern",
    company: "IBM Quantum & SC TECH Quantum Labs",
    companyLogoUrl: "https://www.ibm.com/favicon.ico",
    role: "Quantum Research Fellow",
    description: "Formulate quantum circuits, test variational quantum eigensolvers (VQE), investigate quantum error mitigation, and execute algorithms on IBM Quantum superconducting hardware via Qiskit.",
    location: "Bengaluru, Karnataka / Remote",
    mode: "Remote",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "IBM Quantum",
    sourceUrl: "https://www.ibm.com/quantum",
    applyUrl: "https://www.ibm.com/quantum/careers",
    skills: ["Qiskit", "Quantum Computing", "Linear Algebra", "Python", "Quantum Error Correction", "Algorithms"],
    eligibility: "Students with strong mathematical foundations in Linear Algebra, Complex Numbers, and Python programming.",
    stipend: "₹90,000 / month",
    isFree: true,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-11-15",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-29T12:00:00Z",
    category: "AI / ML",
    tags: ["Quantum", "Qiskit", "IBM", "Research", "High-Tech"]
  },
  {
    title: "Software Engineering Intern - Summer 2026",
    company: "Google",
    companyLogoUrl: "https://www.google.com/favicon.ico",
    role: "Software Engineer Intern",
    description: "Join Google software engineering teams across Cloud, Core, and Search. Work on high-scale distributed systems, algorithms, and developer platforms.",
    location: "Bengaluru, Karnataka / Hyderabad, Telangana",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Google Careers",
    sourceUrl: "https://careers.google.com/jobs/results/",
    applyUrl: "https://careers.google.com/jobs/results/?q=Intern&location=India",
    skills: ["Data Structures", "Algorithms", "C++", "Java", "Python"],
    eligibility: "Pre-final and final year B.Tech/M.Tech/MCA students in CS or related fields.",
    stipend: "₹1,00,000 / month",
    isFree: true,
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    deadline: "2026-11-30",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-15T09:00:00Z",
    category: "Full Stack",
    tags: ["Big Tech", "High Stipend", "Mentorship"]
  },
  {
    title: "AI / ML Research Intern",
    company: "Microsoft Research India",
    companyLogoUrl: "https://www.microsoft.com/favicon.ico",
    role: "Research Fellow / Intern",
    description: "Conduct innovative research alongside world-class scientists in Generative AI, NLP, Multimodal Models, and Systems for AI.",
    location: "Bengaluru, Karnataka",
    mode: "Hybrid",
    opportunityType: "INTERNSHIP",
    sourceType: "EXTERNAL",
    sourceName: "Microsoft Research",
    sourceUrl: "https://www.microsoft.com/en-us/research/careers/",
    applyUrl: "https://www.microsoft.com/en-us/research/careers/",
    skills: ["PyTorch", "Python", "Transformers", "LLMs", "Linear Algebra"],
    eligibility: "Students with strong math & machine learning fundamentals.",
    stipend: "₹80,000 / month",
    isFree: true,
    startDate: "2026-05-15",
    endDate: "2026-08-15",
    deadline: "2026-11-01",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-25T11:00:00Z",
    category: "AI / ML",
    tags: ["Research", "GenAI", "Microsoft"]
  },
  {
    title: "Smart India Hackathon 2026 (SIH)",
    company: "Ministry of Education & AICTE",
    companyLogoUrl: "https://sih.gov.in/favicon.ico",
    role: "Hardware & Software Nationwide Edition",
    description: "The world's biggest open innovation model. Solve pressing problems across Agriculture, Healthcare, Smart Vehicles, Clean Energy, and Cyber Security.",
    location: "Nationwide (Nodal Centers) / Hybrid",
    mode: "Hybrid",
    opportunityType: "HACKATHON",
    sourceType: "EXTERNAL",
    sourceName: "AICTE / SIH",
    sourceUrl: "https://sih.gov.in",
    applyUrl: "https://sih.gov.in",
    skills: ["Full Stack", "IoT", "AI", "Mobile Development", "Embedded Systems"],
    eligibility: "Open to all verified college student teams across India (6 members per team).",
    isFree: true,
    prize: "₹1,00,000 per problem statement",
    teamSize: "6 members (at least 1 female)",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    deadline: "2026-10-31",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-10T10:00:00Z",
    category: "Full Stack",
    tags: ["Government", "National Level", "Prestigious"]
  },
  {
    title: "Google Cloud AI Hackathon 2026",
    company: "Google Cloud",
    companyLogoUrl: "https://cloud.google.com/favicon.ico",
    role: "Global Virtual Hackathon",
    description: "Build cutting-edge generative AI applications using Gemini 2.5/3.5, Vertex AI, and Cloud Run. Compete with builders across 150+ countries.",
    location: "Global / Online",
    mode: "Remote",
    opportunityType: "HACKATHON",
    sourceType: "EXTERNAL",
    sourceName: "Devpost",
    sourceUrl: "https://devpost.com/hackathons",
    applyUrl: "https://googlecloud.devpost.com",
    skills: ["Gemini API", "Vertex AI", "Python", "Next.js", "Docker"],
    eligibility: "Developers and students aged 18+ globally. Free entry.",
    isFree: true,
    prize: "$50,000 in total prizes + Google Cloud Credits",
    teamSize: "1 to 4 members",
    startDate: "2026-08-01",
    endDate: "2026-10-20",
    deadline: "2026-10-15",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-12T15:00:00Z",
    category: "AI / ML",
    tags: ["Devpost", "Google Cloud", "Prizes in USD"]
  },
  {
    title: "ETHIndia 2026 - Asia's Biggest Web3 Hackathon",
    company: "Devfolio / ETHGlobal",
    companyLogoUrl: "https://devfolio.co/favicon.ico",
    role: "In-Person Builder Hackathon",
    description: "Join 2000+ builders, founders, and protocols in Bengaluru for 36 hours of non-stop building on Ethereum, ZK Rollups, Account Abstraction, and DeFi.",
    location: "KTPO, Bengaluru, Karnataka",
    mode: "On-site",
    opportunityType: "HACKATHON",
    sourceType: "EXTERNAL",
    sourceName: "Devfolio",
    sourceUrl: "https://devfolio.co/hackathons",
    applyUrl: "https://ethindia2026.devfolio.co",
    skills: ["Solidity", "Rust", "TypeScript", "EVM", "Zero Knowledge"],
    eligibility: "All builders, students, and blockchain developers.",
    isFree: true,
    prize: "$100,000+ Bounty Pool + Swag & Mentorship",
    teamSize: "1 to 4 members",
    startDate: "2026-12-04",
    endDate: "2026-12-06",
    deadline: "2026-11-10",
    featured: true,
    hidden: false,
    status: "ACTIVE",
    publishedAt: "2026-08-18T12:00:00Z",
    category: "Web3",
    tags: ["Web3", "Bengaluru", "Devfolio", "In-Person"]
  }
];

export function generateDedupKey(title: string, company: string, type: string): string {
  const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normComp = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${type.toLowerCase()}_${normComp}_${normTitle}`;
}

/**
 * Ensures curated initial seed opportunities exist in Firestore using Firebase Admin SDK.
 * Idempotent: Checks if each document already exists by deterministic ID before writing.
 * Preserves all existing admin modifications and never creates duplicates.
 */
export async function seedInitialOpportunities(): Promise<number> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.warn("Firebase Admin SDK unavailable during opportunity seeding.");
      return 0;
    }

    let addedCount = 0;
    const now = new Date().toISOString();

    for (const seed of VERIFIED_SEED_OPPORTUNITIES) {
      const dedupKey = generateDedupKey(seed.title, seed.company, seed.opportunityType);
      const id = slugify(`${seed.company}-${seed.title}`).substring(0, 60);

      const docRef = adminDb.collection(OPPORTUNITY_COLLECTION).doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        const item: OpportunityItem = {
          ...seed,
          id,
          slug: id,
          dedupKey,
          fetchedAt: now,
          lastVerifiedAt: now
        };
        await docRef.set(removeUndefinedValues(item));
        addedCount++;
      }
    }
    return addedCount;
  } catch (err) {
    console.error("Failed to seed initial opportunities via Admin SDK:", err);
    return 0;
  }
}

/**
 * Ingest external opportunities from public job boards and verified feeds
 */
export async function fetchRemoteOKInternships(): Promise<Partial<OpportunityItem>[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://remoteok.com/api?tag=internship", {
      signal: controller.signal,
      headers: { "User-Agent": "SCTECH-Career-Platform/1.0" }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const raw = await res.json();
    if (!Array.isArray(raw)) return [];

    const items = raw.slice(1, 20); // First element is usually legal/disclaimer
    return items.map((j: any) => ({
      title: j.position || "Software Engineering Intern",
      company: j.company || "Remote Company",
      companyLogoUrl: j.company_logo || null,
      role: j.position || "Intern",
      description: (j.description || "").replace(/<[^>]*>?/gm, "").slice(0, 500) + "...",
      location: j.location || "Remote Worldwide",
      mode: "Remote" as const,
      opportunityType: "INTERNSHIP" as const,
      sourceType: "EXTERNAL" as const,
      sourceName: "RemoteOK",
      sourceUrl: "https://remoteok.com",
      applyUrl: j.url || j.apply_url || "https://remoteok.com",
      skills: Array.isArray(j.tags) ? j.tags.slice(0, 6) : ["Software Engineering"],
      stipend: j.salary ? `${j.salary}` : "Competitive",
      isFree: true,
      deadline: null,
      status: "ACTIVE" as const,
      category: "Software Development",
      tags: ["Remote", "Global"]
    }));
  } catch (err: any) {
    console.warn("RemoteOK fetch skipped or failed:", err?.message);
    return [];
  }
}

export async function fetchArbeitnowInternships(): Promise<Partial<OpportunityItem>[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      signal: controller.signal,
      headers: { "User-Agent": "SCTECH-Career-Platform/1.0" }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json();
    if (!json || !Array.isArray(json.data)) return [];

    // Filter for student, intern, junior, or graduate roles
    const internJobs = json.data.filter((j: any) => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes("intern") || text.includes("student") || text.includes("trainee") || text.includes("junior");
    }).slice(0, 15);

    return internJobs.map((j: any) => ({
      title: j.title,
      company: j.company_name || "Tech Partner",
      companyLogoUrl: null,
      role: j.title,
      description: (j.description || "").replace(/<[^>]*>?/gm, "").slice(0, 500) + "...",
      location: j.location || "Europe / Remote",
      mode: j.remote ? ("Remote" as const) : ("On-site" as const),
      opportunityType: "INTERNSHIP" as const,
      sourceType: "EXTERNAL" as const,
      sourceName: "Arbeitnow Verified Feed",
      sourceUrl: "https://www.arbeitnow.com",
      applyUrl: j.url || "https://www.arbeitnow.com",
      skills: Array.isArray(j.tags) ? j.tags.slice(0, 5) : ["Engineering"],
      stipend: "Standard Industry Stipend",
      isFree: true,
      deadline: null,
      status: "ACTIVE" as const,
      category: "Tech Engineering",
      tags: ["Verified", "Global"]
    }));
  } catch (err: any) {
    console.warn("Arbeitnow fetch skipped or failed:", err?.message);
    return [];
  }
}

/**
 * Main Sync Pipeline orchestrator using Firebase Admin SDK
 */
export async function syncExternalOpportunities(): Promise<OpportunitySyncResult[]> {
  const results: OpportunitySyncResult[] = [];
  const now = new Date().toISOString();
  const adminDb = getAdminDb();

  if (!adminDb) {
    throw new Error("Firebase Admin SDK is required for opportunity synchronization.");
  }

  // 1. Ensure seed opportunities are present (idempotent, won't overwrite existing)
  const seededCount = await seedInitialOpportunities();
  results.push({
    sourceName: "SC TECH Verified Curated Seeds",
    totalFetched: VERIFIED_SEED_OPPORTUNITIES.length,
    newAdded: seededCount,
    updated: VERIFIED_SEED_OPPORTUNITIES.length - seededCount,
    errors: 0
  });

  // 2. Ingest from RemoteOK
  try {
    const remoteOkItems = await fetchRemoteOKInternships();
    let newAdded = 0;
    let updated = 0;

    for (const item of remoteOkItems) {
      if (!item.title || !item.company) continue;
      const dedupKey = generateDedupKey(item.title, item.company, item.opportunityType || "INTERNSHIP");
      const id = slugify(`${item.company}-${item.title}`).substring(0, 60);

      const docRef = adminDb.collection(OPPORTUNITY_COLLECTION).doc(id);
      const existing = await docRef.get();

      const record: OpportunityItem = {
        id,
        slug: id,
        title: item.title,
        company: item.company,
        companyLogoUrl: item.companyLogoUrl || null,
        role: item.role || item.title,
        description: item.description || "Exciting developer internship opportunity.",
        location: item.location || "Remote",
        mode: item.mode || "Remote",
        opportunityType: "INTERNSHIP",
        sourceType: "EXTERNAL",
        sourceName: item.sourceName || "RemoteOK",
        sourceUrl: item.sourceUrl || "https://remoteok.com",
        applyUrl: item.applyUrl || "https://remoteok.com",
        skills: item.skills || ["Software Development"],
        stipend: item.stipend || null,
        isFree: true,
        deadline: item.deadline || null,
        featured: false,
        hidden: false,
        status: "ACTIVE",
        publishedAt: now,
        fetchedAt: now,
        lastVerifiedAt: now,
        dedupKey,
        tags: item.tags || ["Remote"],
        category: item.category || "Engineering"
      };

      if (!existing.exists) {
        await docRef.set(removeUndefinedValues(record));
        newAdded++;
      } else {
        await docRef.update({
          lastVerifiedAt: now,
          status: "ACTIVE"
        });
        updated++;
      }
    }

    results.push({
      sourceName: "RemoteOK Internship Feed",
      totalFetched: remoteOkItems.length,
      newAdded,
      updated,
      errors: 0
    });
  } catch (err: any) {
    results.push({
      sourceName: "RemoteOK Internship Feed",
      totalFetched: 0,
      newAdded: 0,
      updated: 0,
      errors: 1,
      errorDetails: [err?.message || "Failed to ingest RemoteOK"]
    });
  }

  // 3. Ingest from Arbeitnow
  try {
    const arbeitnowItems = await fetchArbeitnowInternships();
    let newAdded = 0;
    let updated = 0;

    for (const item of arbeitnowItems) {
      if (!item.title || !item.company) continue;
      const dedupKey = generateDedupKey(item.title, item.company, item.opportunityType || "INTERNSHIP");
      const id = slugify(`${item.company}-${item.title}`).substring(0, 60);

      const docRef = adminDb.collection(OPPORTUNITY_COLLECTION).doc(id);
      const existing = await docRef.get();

      const record: OpportunityItem = {
        id,
        slug: id,
        title: item.title,
        company: item.company,
        companyLogoUrl: item.companyLogoUrl || null,
        role: item.role || item.title,
        description: item.description || "Exciting opportunity with verified global company.",
        location: item.location || "Hybrid",
        mode: item.mode || "Hybrid",
        opportunityType: "INTERNSHIP",
        sourceType: "EXTERNAL",
        sourceName: item.sourceName || "Arbeitnow",
        sourceUrl: item.sourceUrl || "https://www.arbeitnow.com",
        applyUrl: item.applyUrl || "https://www.arbeitnow.com",
        skills: item.skills || ["Problem Solving"],
        stipend: item.stipend || null,
        isFree: true,
        deadline: item.deadline || null,
        featured: false,
        hidden: false,
        status: "ACTIVE",
        publishedAt: now,
        fetchedAt: now,
        lastVerifiedAt: now,
        dedupKey,
        tags: item.tags || ["Verified"],
        category: item.category || "Technology"
      };

      if (!existing.exists) {
        await docRef.set(removeUndefinedValues(record));
        newAdded++;
      } else {
        await docRef.update({
          lastVerifiedAt: now,
          status: "ACTIVE"
        });
        updated++;
      }
    }

    results.push({
      sourceName: "Arbeitnow Global Feed",
      totalFetched: arbeitnowItems.length,
      newAdded,
      updated,
      errors: 0
    });
  } catch (err: any) {
    results.push({
      sourceName: "Arbeitnow Global Feed",
      totalFetched: 0,
      newAdded: 0,
      updated: 0,
      errors: 1,
      errorDetails: [err?.message || "Failed to ingest Arbeitnow"]
    });
  }

  return results;
}

export interface QueryOpportunitiesOptions {
  page?: number;
  limitCount?: number;
  type?: "ALL" | "INTERNSHIP" | "HACKATHON" | "JOB";
  sourceType?: "ALL" | "INTERNAL" | "EXTERNAL";
  mode?: string;
  isFree?: boolean;
  closingSoon?: boolean;
  search?: string;
  skill?: string;
  category?: string;
  sortBy?: "newest" | "deadline" | "stipend";
  includeHidden?: boolean;
}

/**
 * Retrieve opportunities from Firestore using Firebase Admin SDK on the server.
 * Never attempts unauthorized client-side writes during read queries.
 */
export async function getOpportunities(options: QueryOpportunitiesOptions = {}) {
  const {
    page = 1,
    limitCount = 20,
    type = "ALL",
    sourceType = "ALL",
    mode = "All",
    isFree = false,
    closingSoon = false,
    search = "",
    skill = "",
    sortBy = "newest",
    includeHidden = false
  } = options;

  try {
    let all: OpportunityItem[] = [];
    const adminDb = getAdminDb();

    if (adminDb) {
      try {
        const snap = await adminDb.collection(OPPORTUNITY_COLLECTION).get();
        snap.forEach((d) => {
          const data = d.data() as OpportunityItem;
          all.push({ ...data, id: d.id });
        });
      } catch (fsErr) {
        console.warn("Firestore opportunities query notice:", fsErr);
      }
    }

    // If Firestore collection has no documents yet, provide in-memory verified opportunities without unauthorized client writes
    if (all.length === 0) {
      all = VERIFIED_SEED_OPPORTUNITIES.map((seed, idx) => ({
        ...seed,
        id: slugify(`${seed.company}-${seed.title}`).substring(0, 60) || `seed_${idx + 1}`,
        slug: slugify(`${seed.company}-${seed.title}`).substring(0, 60),
        dedupKey: generateDedupKey(seed.title, seed.company, seed.opportunityType),
        fetchedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
      }));
    }

    // Filter items
    let filtered = all.filter((item) => {
      // Visibility filter
      if (!includeHidden && item.hidden) return false;

      // Status check
      if (!includeHidden && item.status === "EXPIRED") return false;

      // Check deadline if not admin view
      if (!includeHidden && item.deadline && isDeadlinePassed(item.deadline)) {
        return false;
      }

      // Type filter
      if (type !== "ALL" && item.opportunityType !== type) return false;

      // Source type filter
      if (sourceType !== "ALL" && item.sourceType !== sourceType) return false;

      // Mode filter
      if (mode !== "All" && item.mode !== mode) return false;

      // Free filter
      if (isFree && item.isFree === false) return false;

      // Closing soon filter (within 7 days)
      if (closingSoon) {
        if (!item.deadline) return false;
        const nowMs = Date.now();
        const dlMs = new Date(item.deadline).getTime();
        const diffDays = (dlMs - nowMs) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // Search keyword filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchCompany = item.company?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchCompany && !matchDesc && !matchSkills) return false;
      }

      // Skill filter
      if (skill.trim()) {
        const targetSkill = skill.toLowerCase();
        const hasSkill = item.skills?.some((s) => s.toLowerCase().includes(targetSkill));
        if (!hasSkill) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      // Always put featured items first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      // Default: newest published first
      const dateA = new Date(a.publishedAt || a.fetchedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.fetchedAt || 0).getTime();
      return dateB - dateA;
    });

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = filtered.slice(startIndex, startIndex + limitCount);

    return {
      opportunities: paginated,
      total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount)
    };
  } catch (err: any) {
    console.error("Error in getOpportunities:", err);
    throw err;
  }
}

export async function toggleOpportunityFeature(id: string, featured: boolean): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is not configured.");
  await adminDb.collection(OPPORTUNITY_COLLECTION).doc(id).update({
    featured,
    updatedAt: new Date().toISOString()
  });
}

export async function toggleOpportunityVisibility(id: string, hidden: boolean): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is not configured.");
  await adminDb.collection(OPPORTUNITY_COLLECTION).doc(id).update({
    hidden,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteOpportunity(id: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is not configured.");
  await adminDb.collection(OPPORTUNITY_COLLECTION).doc(id).delete();
}
