export interface RoleTemplate {
  id: string;
  roleTitle: string;
  department: string;
  duration: string;
  defaultStipend: string;
  workingHours: string;
  mentorName: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  skillsArea: string;
  certificateTitle: string;
  awardTitle: string;
  certificateBodyTemplate: string;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "fullstack",
    roleTitle: "Full-Stack Web Developer",
    department: "Software Engineering & Web Technologies",
    duration: "3 Months",
    defaultStipend: "Performance-Based / ₹12,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Lead Full-Stack Architect",
    workMode: "Remote",
    skillsArea: "Next.js, React, Node.js, TypeScript, PostgreSQL & REST APIs",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Full-Stack Engineering",
    certificateBodyTemplate: "For successfully completing the Full-Stack Web Developer Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "backend",
    roleTitle: "Backend & API Engineer",
    department: "Core Systems & Distributed Architecture",
    duration: "3 Months",
    defaultStipend: "Performance-Based / ₹12,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Senior Backend Lead",
    workMode: "Remote",
    skillsArea: "Node.js, Express, PostgreSQL, Redis, Microservices & Docker",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Backend Architecture",
    certificateBodyTemplate: "For successfully completing the Backend & API Engineer Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "frontend",
    roleTitle: "Frontend & UI/UX Specialist",
    department: "Product Design & Client Engineering",
    duration: "2 Months",
    defaultStipend: "Performance-Based / ₹10,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Senior Product Designer",
    workMode: "Remote",
    skillsArea: "React, TailwindCSS, Figma, Framer Motion & Responsive Systems",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in UI/UX & Frontend Engineering",
    certificateBodyTemplate: "For successfully completing the Frontend & UI/UX Specialist Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "ai-ml",
    roleTitle: "AI / Machine Learning Engineer",
    department: "Data Science & Applied Intelligence",
    duration: "3 Months",
    defaultStipend: "Performance-Based / ₹15,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Chief AI Research Engineer",
    workMode: "Remote",
    skillsArea: "Python, PyTorch, Large Language Models, NLP & Computer Vision",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Applied AI & Deep Learning",
    certificateBodyTemplate: "For successfully completing the AI / Machine Learning Engineer Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "cloud-devops",
    roleTitle: "Cloud & DevOps Engineer",
    department: "Infrastructure & Cloud Operations",
    duration: "2 Months",
    defaultStipend: "Performance-Based / ₹12,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "DevOps & SRE Lead",
    workMode: "Remote",
    skillsArea: "AWS, Docker, Kubernetes, CI/CD GitHub Actions & Terraform",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Cloud Infrastructure",
    certificateBodyTemplate: "For successfully completing the Cloud & DevOps Engineer Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "cybersecurity",
    roleTitle: "Cybersecurity Analyst",
    department: "Information Security & SecOps",
    duration: "3 Months",
    defaultStipend: "Performance-Based / ₹12,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Senior Security Specialist",
    workMode: "Remote",
    skillsArea: "Vulnerability Scanning, Penetration Testing, OWASP & Network Security",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Information Security",
    certificateBodyTemplate: "For successfully completing the Cybersecurity Analyst Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "mobile-app",
    roleTitle: "Mobile App Developer",
    department: "Mobile Engineering & Apps",
    duration: "3 Months",
    defaultStipend: "Performance-Based / ₹10,000/mo",
    workingHours: "Flexible 15-20 Hours / Week",
    mentorName: "Mobile Solutions Architect",
    workMode: "Remote",
    skillsArea: "React Native, Flutter, Expo, Native APIs & State Management",
    certificateTitle: "CERTIFICATE OF INTERNSHIP COMPLETION",
    awardTitle: "Excellence in Mobile App Development",
    certificateBodyTemplate: "For successfully completing the Mobile App Developer Internship Program at SC TECH from [Start Date] to [End Date]. During the internship, the candidate demonstrated dedication, technical skills and a strong willingness to learn.",
  },
  {
    id: "hackathon-winner",
    roleTitle: "Hackathon Innovator & Finalist",
    department: "SC TECH Open Innovation & Hackathons",
    duration: "48 Hours Live Hackathon",
    defaultStipend: "Cash Prize & Internship Fast-track",
    workingHours: "Intensive 48 Hours Sprint",
    mentorName: "Jury & Technical Evaluation Board",
    workMode: "Remote",
    skillsArea: "Rapid Prototyping, Product Innovation & System Design",
    certificateTitle: "CERTIFICATE OF ACHIEVEMENT",
    awardTitle: "Hackathon Finalist & Innovation Award",
    certificateBodyTemplate: "For outstanding performance and technical innovation in the SC TECH National Hackathon 2026 from [Start Date] to [End Date]. The candidate demonstrated remarkable problem-solving and rapid engineering capabilities.",
  },
];

export interface DocumentData {
  documentType: "OFFER_LETTER" | "CERTIFICATE";
  roleId: string;
  studentName: string;
  candidateId: string;
  offerId: string;
  certificateId: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  customStipend?: string;
  customWorkMode?: string;
  customMentor?: string;
  customDepartment?: string;
}

export const DEFAULT_DOCUMENT_DATA: DocumentData = {
  documentType: "OFFER_LETTER",
  roleId: "fullstack",
  studentName: "Your Name Here",
  candidateId: "SCT-STU-2026-089",
  offerId: "SCT-OFFER-2026-000123",
  certificateId: "SCT-CERT-2026-000789",
  issueDate: "09 September 2026",
  startDate: "15 September 2026",
  endDate: "15 December 2026",
  customStipend: "Performance-Based / ₹12,000/mo",
  customWorkMode: "Remote",
  customMentor: "Lead Full-Stack Architect",
  customDepartment: "Software Engineering & Web Technologies",
};

export function getRoleTemplate(roleId: string): RoleTemplate {
  const found = ROLE_TEMPLATES.find((r) => r.id === roleId);
  return found || ROLE_TEMPLATES[0];
}
