export const ENABLE_SAMPLE_PAST_STUDENTS = true;

export interface SamplePastStudent {
  id: string;
  rank: number;
  studentName: string;
  college: string;
  hackathonWins: number;
  projectsCompleted: number;
  certificates: number;
  score: number;
  specialization?: string;
  isSample: true;
}

export const SAMPLE_PAST_STUDENTS: SamplePastStudent[] = [
  {
    id: "sample-std-001",
    rank: 1,
    studentName: "Raj Kumar",
    college: "College of Engineering, Guindy (Anna University)",
    hackathonWins: 3,
    projectsCompleted: 12,
    certificates: 5,
    score: 985,
    specialization: "Full Stack & AI Systems",
    isSample: true
  },
  {
    id: "sample-std-002",
    rank: 2,
    studentName: "Arun Kumar",
    college: "PSG College of Technology, Coimbatore",
    hackathonWins: 3,
    projectsCompleted: 11,
    certificates: 5,
    score: 960,
    specialization: "Cloud Architecture & DevOps",
    isSample: true
  },
  {
    id: "sample-std-003",
    rank: 3,
    studentName: "Karthikeyan",
    college: "Madras Institute of Technology (MIT), Chennai",
    hackathonWins: 2,
    projectsCompleted: 10,
    certificates: 4,
    score: 945,
    specialization: "Computer Vision & Edge AI",
    isSample: true
  },
  {
    id: "sample-std-004",
    rank: 4,
    studentName: "Suresh Kumar",
    college: "SSN College of Engineering, Chennai",
    hackathonWins: 2,
    projectsCompleted: 9,
    certificates: 4,
    score: 920,
    specialization: "Distributed Systems & Web3",
    isSample: true
  },
  {
    id: "sample-std-005",
    rank: 5,
    studentName: "Praveen Kumar",
    college: "SASTRA Deemed University, Thanjavur",
    hackathonWins: 2,
    projectsCompleted: 8,
    certificates: 3,
    score: 895,
    specialization: "Cross-Platform Mobile Apps",
    isSample: true
  },
  {
    id: "sample-std-006",
    rank: 6,
    studentName: "Vignesh Raj",
    college: "Coimbatore Institute of Technology (CIT)",
    hackathonWins: 2,
    projectsCompleted: 8,
    certificates: 3,
    score: 880,
    specialization: "Cybersecurity & Pen Testing",
    isSample: true
  },
  {
    id: "sample-std-007",
    rank: 7,
    studentName: "Dinesh Kumar",
    college: "Sri Krishna College of Engg & Tech, Coimbatore",
    hackathonWins: 1,
    projectsCompleted: 7,
    certificates: 3,
    score: 865,
    specialization: "Data Engineering & Pipelines",
    isSample: true
  },
  {
    id: "sample-std-008",
    rank: 8,
    studentName: "Santhosh Kumar",
    college: "Thiagarajar College of Engineering, Madurai",
    hackathonWins: 1,
    projectsCompleted: 7,
    certificates: 3,
    score: 850,
    specialization: "IoT & Embedded Robotics",
    isSample: true
  },
  {
    id: "sample-std-009",
    rank: 9,
    studentName: "Hari Prasad",
    college: "GOVT College of Technology (GCT), Coimbatore",
    hackathonWins: 1,
    projectsCompleted: 6,
    certificates: 2,
    score: 835,
    specialization: "Scalable Backend Systems",
    isSample: true
  },
  {
    id: "sample-std-010",
    rank: 10,
    studentName: "Naveen Kumar",
    college: "Vel Tech Rangarajan Dr. Sagunthala R&D Institute",
    hackathonWins: 1,
    projectsCompleted: 6,
    certificates: 2,
    score: 820,
    specialization: "Generative AI & LLM Agents",
    isSample: true
  },
  {
    id: "sample-std-011",
    rank: 11,
    studentName: "Surya Prakash",
    college: "SRM Institute of Science and Technology, Kattankulathur",
    hackathonWins: 1,
    projectsCompleted: 5,
    certificates: 2,
    score: 805,
    specialization: "Modern Next.js & React Native",
    isSample: true
  },
  {
    id: "sample-std-012",
    rank: 12,
    studentName: "Mohan Raj",
    college: "Rajalakshmi Engineering College, Chennai",
    hackathonWins: 1,
    projectsCompleted: 5,
    certificates: 2,
    score: 790,
    specialization: "Microservices & Kubernetes",
    isSample: true
  },
  {
    id: "sample-std-013",
    rank: 13,
    studentName: "Ajay Kumar",
    college: "Sri Venkateswara College of Engineering (SVCE)",
    hackathonWins: 1,
    projectsCompleted: 4,
    certificates: 2,
    score: 775,
    specialization: "UI/UX & Frontend Engineering",
    isSample: true
  },
  {
    id: "sample-std-014",
    rank: 14,
    studentName: "Gokul Raj",
    college: "Kumaraguru College of Technology, Coimbatore",
    hackathonWins: 1,
    projectsCompleted: 4,
    certificates: 1,
    score: 760,
    specialization: "Automated Agent Workflows",
    isSample: true
  },
  {
    id: "sample-std-015",
    rank: 15,
    studentName: "Bala Murugan",
    college: "St. Joseph's College of Engineering, Chennai",
    hackathonWins: 1,
    projectsCompleted: 4,
    certificates: 1,
    score: 745,
    specialization: "CI/CD & Cloud Infrastructure",
    isSample: true
  }
];
