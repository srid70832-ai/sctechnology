const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SC TECH database seed...");

  // 1. Clean existing records safely
  await prisma.auditLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sessionRegistration.deleteMany();
  await prisma.hRSession.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.hackathonPrize.deleteMany();
  await prisma.hackathonWinner.deleteMany();
  await prisma.hackathonScore.deleteMany();
  await prisma.hackathonJudge.deleteMany();
  await prisma.hackathonSubmission.deleteMany();
  await prisma.hackathonRegistration.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.internshipEvaluation.deleteMany();
  await prisma.internshipOffer.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.internshipApplication.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.company.deleteMany();
  await prisma.projectDownloadLog.deleteMany();
  await prisma.projectAccess.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.judgeProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // 2. Create Users for all 6 Roles
  const studentUser = await prisma.user.create({
    data: {
      email: "student@sctech.com",
      passwordHash,
      name: "Arun Kumar",
      role: "STUDENT",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      studentProfile: {
        create: {
          username: "arunkumar",
          mobile: "+91 9876543210",
          college: "Anna University",
          department: "Computer Science & Engineering",
          year: "4th Year",
          skills: JSON.stringify(["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"]),
          github: "https://github.com/arunkumar-tech",
          linkedin: "https://linkedin.com/in/arunkumar-dev",
          portfolio: "https://arunkumar.dev",
          resumeUrl: "https://sctech.io/resumes/arunkumar_resume.pdf",
          bio: "Aspiring Full Stack Engineer passionate about high-scale distributed web applications and modern developer tooling.",
          profileScore: 85,
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@sctech.com",
      passwordHash,
      name: "SC TECH Admin",
      role: "ADMIN",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@sctech.com",
      passwordHash,
      name: "Super Administrator",
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  const judgeUser = await prisma.user.create({
    data: {
      email: "judge@sctech.com",
      passwordHash,
      name: "Dr. Sarah Chen",
      role: "JUDGE",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      judgeProfile: {
        create: {
          title: "Principal Research Scientist",
          organization: "AI Systems Research Lab",
          bio: "12+ years evaluating top engineering systems, hackathons, and innovative open-source architectures.",
          expertise: "Web Architectures, Scalability, AI/ML, Code Quality",
        },
      },
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      email: "hr@sctech.com",
      passwordHash,
      name: "Rohan Sharma",
      role: "HR",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const companyUser = await prisma.user.create({
    data: {
      email: "company@sctech.com",
      passwordHash,
      name: "TechNova Talent Team",
      role: "COMPANY",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      company: {
        create: {
          name: "TechNova Solutions",
          logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
          description: "Enterprise SaaS and high-performance developer tools building digital futures across 40+ countries.",
          website: "https://technova-example.io",
          location: "Bengaluru, Karnataka (Remote First)",
          industry: "Software & Technology",
          contactEmail: "careers@technova-example.io",
          verified: true,
        },
      },
    },
  });

  // Additional companies
  const scTechCompany = await prisma.company.create({
    data: {
      userId: adminUser.id,
      name: "SC TECH",
      logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80",
      description: "Official technology and engineering team powering the SC TECH ecosystem and skill acceleration programs.",
      website: "https://sctech.io",
      location: "Bengaluru / Hyderabad (Remote)",
      industry: "EdTech & Software Engineering",
      contactEmail: "careers@sctech.io",
      verified: true,
    },
  });

  const byteVisionCompany = await prisma.company.create({
    data: {
      userId: hrUser.id,
      name: "ByteVision",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
      description: "Design-first software studio crafting bespoke user interfaces and interactive web applications.",
      website: "https://bytevision.io",
      location: "Mumbai (Hybrid)",
      industry: "Product Design & Web Studio",
      contactEmail: "hr@bytevision.io",
      verified: true,
    },
  });

  const dataMindsCompany = await prisma.company.create({
    data: {
      userId: superAdmin.id,
      name: "DataMinds",
      logoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80",
      description: "Data intelligence, machine learning analytics, and high-frequency predictive modeling systems.",
      website: "https://dataminds.ai",
      location: "Chennai (Remote)",
      industry: "Artificial Intelligence & Analytics",
      contactEmail: "hiring@dataminds.ai",
      verified: true,
    },
  });

  // 3. Subscription Plans
  const starterPlan = await prisma.plan.create({
    data: {
      name: "Starter",
      code: "STARTER",
      price: 299,
      interval: "monthly",
      tagline: "Essential starter pack for tech learners",
      features: JSON.stringify([
        "Access to 50+ Beginner Projects",
        "Community Discord & Forum Access",
        "Weekly Newsletter & Tech Curations",
        "Basic Internship Board Access",
        "Public Portfolio Profile",
      ]),
      projectAccess: true,
      certificateAccess: false,
      hrSessionAccess: false,
      isPopular: false,
    },
  });

  const plusPlan = await prisma.plan.create({
    data: {
      name: "Plus",
      code: "PLUS",
      price: 399,
      interval: "monthly",
      tagline: "Accelerated learning with project source codes",
      features: JSON.stringify([
        "All Starter Features",
        "Full Source Code Access for 150+ Projects",
        "Verified Hackathon Participation",
        "Monthly Live Coding Webinars",
        "Resume Builder & Portfolio Review",
      ]),
      projectAccess: true,
      certificateAccess: true,
      hrSessionAccess: false,
      isPopular: false,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: "PRO",
      code: "PRO",
      price: 499,
      interval: "monthly",
      tagline: "Most popular for ambitious developers & job seekers",
      features: JSON.stringify([
        "All Plus Features",
        "Full Source Code Access for 500+ Projects",
        "Verified Digital Certificates with QR Code",
        "Priority Internship Application Review",
        "Exclusive HR Interaction & Mentorship Sessions",
        "Free Entry to Monthly SC TECH Hackathons",
        "AI Mock Interview Simulator",
      ]),
      projectAccess: true,
      certificateAccess: true,
      hrSessionAccess: true,
      isPopular: true,
    },
  });

  const careerPlan = await prisma.plan.create({
    data: {
      name: "Career",
      code: "CAREER",
      price: 599,
      interval: "monthly",
      tagline: "Comprehensive career launch & personalized guidance",
      features: JSON.stringify([
        "All PRO Plan Features",
        "1-on-1 Mentorship & Code Review Monthly",
        "Direct HR Referral Pool to Partner Companies",
        "Guaranteed Verified Certificates for All Completed Tracks",
        "Exclusive Masterclasses & Workshop Recordings",
        "Priority 24/7 Technical Support",
      ]),
      projectAccess: true,
      certificateAccess: true,
      hrSessionAccess: true,
      isPopular: false,
    },
  });

  // Create Active Subscription for Arun Kumar (PRO Plan valid till Dec 25, 2026)
  const payment = await prisma.payment.create({
    data: {
      orderId: "order_PRO_2026_98124",
      paymentId: "pay_rzp_mock_98124_approved",
      signature: "sig_verified_mock_98124_sha256",
      userId: studentUser.id,
      planId: proPlan.id,
      amount: 499,
      currency: "INR",
      status: "SUCCESS",
      gateway: "RAZORPAY",
      verifiedAt: new Date(),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: studentUser.id,
      planId: proPlan.id,
      paymentId: payment.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-25"),
      status: "ACTIVE",
      autoRenew: true,
    },
  });

  // 4. Create Internships
  const internship1 = await prisma.internship.create({
    data: {
      companyId: scTechCompany.id,
      title: "Full Stack Developer Intern",
      role: "Full Stack Developer Intern",
      slug: "full-stack-developer-intern-sctech",
      description: "Join the core engineering team at SC TECH to design, architect, and ship high-impact features for thousands of active student developers.",
      responsibilities: JSON.stringify([
        "Build scalable REST and Server Action APIs using Next.js, Node.js, and Prisma.",
        "Implement responsive, polished user interfaces using Tailwind CSS and React.",
        "Collaborate with product designers and engineering leads on weekly product sprints.",
        "Write clean, maintainable, and well-tested code with automated unit and integration tests.",
      ]),
      requirements: JSON.stringify([
        "Strong foundation in JavaScript/TypeScript, React, and modern CSS.",
        "Hands-on experience with SQL databases and ORM tools (Prisma/PostgreSQL).",
        "Familiarity with Git, GitHub workflows, and CI/CD pipelines.",
        "Eagerness to learn, iterate fast, and take ownership of user-facing features.",
      ]),
      skills: JSON.stringify(["React", "Next.js", "Node.js", "Prisma", "PostgreSQL", "TypeScript"]),
      location: "Remote",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 15000,
      stipendType: "Fixed",
      openings: 8,
      deadline: new Date("2026-09-30"),
      startDate: new Date("2026-10-05"),
      status: "ACTIVE",
    },
  });

  const internship2 = await prisma.internship.create({
    data: {
      companyId: (await prisma.company.findFirst({ where: { name: "TechNova Solutions" } })).id,
      title: "Frontend Developer Intern",
      role: "Frontend Developer Intern",
      slug: "frontend-developer-intern-technova",
      description: "Work with TechNova Solutions frontend engineering team crafting state-of-the-art SaaS user interfaces.",
      skills: JSON.stringify(["React", "Tailwind CSS", "TypeScript", "Redux Toolkit", "Figma"]),
      location: "Remote",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 10000,
      openings: 5,
      deadline: new Date("2026-09-25"),
      startDate: new Date("2026-10-01"),
      status: "ACTIVE",
    },
  });

  const internship3 = await prisma.internship.create({
    data: {
      companyId: byteVisionCompany.id,
      title: "UI/UX Design Intern",
      role: "UI/UX Design Intern",
      slug: "ui-ux-design-intern-bytevision",
      description: "Craft modern product interfaces, intuitive wireframes, interactive design prototypes, and design systems for enterprise clients.",
      skills: JSON.stringify(["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems"]),
      location: "Remote",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 8000,
      openings: 4,
      deadline: new Date("2026-09-28"),
      startDate: new Date("2026-10-05"),
      status: "ACTIVE",
    },
  });

  const internship4 = await prisma.internship.create({
    data: {
      companyId: dataMindsCompany.id,
      title: "Data Analyst Intern",
      role: "Data Analyst Intern",
      slug: "data-analyst-intern-dataminds",
      description: "Analyze large-scale transactional datasets, create impactful business intelligence dashboards, and generate predictive insights.",
      skills: JSON.stringify(["Python", "SQL", "Tableau", "Pandas", "PowerBI"]),
      location: "Remote",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 12000,
      openings: 6,
      deadline: new Date("2026-09-29"),
      startDate: new Date("2026-10-10"),
      status: "ACTIVE",
    },
  });

  const internship5 = await prisma.internship.create({
    data: {
      companyId: scTechCompany.id,
      title: "Backend Developer Intern",
      role: "Backend Developer Intern",
      slug: "backend-developer-intern-sctech",
      description: "Design high-throughput distributed microservices, caching layers, and asynchronous job processing pipelines.",
      skills: JSON.stringify(["Java", "Spring Boot", "PostgreSQL", "Redis", "Docker"]),
      location: "Remote",
      mode: "Remote",
      duration: "8 Weeks",
      stipend: 15000,
      openings: 5,
      deadline: new Date("2026-10-15"),
      startDate: new Date("2026-10-20"),
      status: "ACTIVE",
    },
  });

  const internship6 = await prisma.internship.create({
    data: {
      companyId: dataMindsCompany.id,
      title: "Machine Learning Intern",
      role: "Machine Learning Intern",
      slug: "machine-learning-intern-dataminds",
      description: "Train and evaluate LLM fine-tuning pipelines, transformer models, and real-time computer vision inference services.",
      skills: JSON.stringify(["Python", "PyTorch", "Scikit-Learn", "FastAPI", "Docker"]),
      location: "Remote",
      mode: "Remote",
      duration: "10 Weeks",
      stipend: 18000,
      openings: 3,
      deadline: new Date("2026-10-20"),
      startDate: new Date("2026-10-25"),
      status: "ACTIVE",
    },
  });

  // Create an existing application for student
  const app1 = await prisma.internshipApplication.create({
    data: {
      internshipId: internship1.id,
      studentId: studentUser.id,
      resumeUrl: "https://sctech.io/resumes/arunkumar_resume.pdf",
      coverLetter: "I am passionate about full stack web development and eager to contribute to SC TECH's engineering initiatives.",
      github: "https://github.com/arunkumar-tech",
      portfolio: "https://arunkumar.dev",
      status: "SHORTLISTED",
      reviewedAt: new Date(),
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: app1.id,
      scheduledAt: new Date("2026-09-20T10:00:00Z"),
      meetingLink: "https://meet.google.com/sct-tech-interview",
      interviewerName: "Lead Engineer Arun Patel",
      status: "SCHEDULED",
      notes: "Technical round focused on React, TypeScript, and database architecture.",
    },
  });

  // 5. Create Hackathons
  const hackathon1 = await prisma.hackathon.create({
    data: {
      title: "SC TECH HACKATHON 2026",
      slug: "sc-tech-hackathon-2026",
      tagLine: "Code. Innovate. Elevate.",
      description: "The flagship annual hackathon of SC TECH inviting student innovators and developers across the country to build game-changing applications.",
      problemStatement: "Build a modern full-stack web or mobile application that solves real-world technical or educational workflow bottlenecks with verifiable authenticity and robust data protection.",
      problemReleasedAt: new Date("2026-09-15T10:00:00Z"),
      problemPublished: true,
      entryFee: 35,
      prizePool: 50000,
      startDate: new Date("2026-09-15T10:00:00Z"),
      endDate: new Date("2026-09-17T22:00:00Z"),
      registrationDeadline: new Date("2026-09-10T23:59:59Z"),
      maxTeamSize: 4,
      rules: JSON.stringify([
        "All code must be written during the hackathon timeframe.",
        "Teams can have 1 to 4 members.",
        "Submissions must include a public GitHub repository with comprehensive README.",
        "Working live demo URL and video walkthrough (under 3 minutes) are required.",
        "Plagiarism or submission of pre-built commercial products will lead to instant disqualification.",
      ]),
      judgingCriteria: JSON.stringify([
        { criterion: "Problem Understanding & Impact", maxScore: 20 },
        { criterion: "Technical Execution & Functionality", maxScore: 25 },
        { criterion: "Code Quality & Architecture", maxScore: 20 },
        { criterion: "UI/UX & User Experience", maxScore: 15 },
        { criterion: "Innovation & Originality", maxScore: 10 },
        { criterion: "Presentation & Documentation", maxScore: 10 },
      ]),
      eligibility: "Open to all enrolled college students, recent graduates (within 1 year), and independent self-taught developers across India.",
      faqs: JSON.stringify([
        { q: "What is the registration fee?", a: "₹35 per participant, which covers verified digital certificate, submission evaluation, and access to all judging rounds." },
        { q: "Can I participate individually?", a: "Yes, solo participants and teams up to 4 members are fully supported." },
        { q: "How are prizes distributed?", a: "Cash prizes are credited directly via bank transfer/UPI after identity and project verification by the admin panel." },
        { q: "Will everyone receive a certificate?", a: "Yes, all verified participants who submit a valid project will receive a cryptographic SC TECH Certificate of Participation." },
      ]),
      bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
      status: "UPCOMING",
    },
  });

  const hackathon2 = await prisma.hackathon.create({
    data: {
      title: "AI Innovation Sprint 2026",
      slug: "ai-innovation-sprint-2026",
      tagLine: "Building Next-Gen Intelligent Autonomous Agents",
      description: "Develop generative AI workflows, computer vision tools, or autonomous agent applications solving critical industry challenges.",
      entryFee: 50,
      prizePool: 75000,
      startDate: new Date("2026-10-01T09:00:00Z"),
      endDate: new Date("2026-10-03T21:00:00Z"),
      registrationDeadline: new Date("2026-09-28T23:59:59Z"),
      maxTeamSize: 4,
      bannerUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80",
      status: "UPCOMING",
    },
  });

  // Register Arun Kumar for SC TECH Hackathon 2026
  const hackReg = await prisma.hackathonRegistration.create({
    data: {
      hackathonId: hackathon1.id,
      userId: studentUser.id,
      registrationNo: "REG-SCTECH-7842",
      status: "CONFIRMED",
    },
  });

  // Assign Judge to Hackathon
  await prisma.hackathonJudge.create({
    data: {
      hackathonId: hackathon1.id,
      judgeId: judgeUser.id,
    },
  });

  // 6. Create Projects with Source Code
  const p1 = await prisma.project.create({
    data: {
      title: "E-Commerce Web Platform",
      slug: "e-commerce-web-platform",
      shortDesc: "Complete full-stack e-commerce marketplace with cart, checkout, payment gateway, and order tracking.",
      description: "A production-ready e-commerce platform built with React, Node.js, Express, and MongoDB. Features role-based auth, product inventory catalog, image uploads, coupon code engine, Stripe/Razorpay payment integration, and transactional email notifications.",
      problemStatement: "Small businesses need a fast, SEO-friendly, and cost-effective e-commerce solution with integrated payments and dashboard analytics.",
      features: JSON.stringify([
        "Authentication with JWT and secure password hashing",
        "Product catalog with category filter, sorting, and full-text search",
        "Persistent cart and wishlist across user sessions",
        "Multi-step checkout with server-side inventory reservation",
        "Admin analytics dashboard for sales, revenue, and inventory alerts",
      ]),
      techStack: JSON.stringify(["React", "Node.js", "MongoDB", "Express", "Tailwind CSS", "Redux"]),
      difficulty: "Intermediate",
      category: "Web Development",
      isPremium: true,
      thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?w=600&auto=format&fit=crop&q=80",
      demoUrl: "https://demo-ecommerce.sctech.io",
      githubUrl: "https://github.com/sctech-projects/ecommerce-platform",
      sourceCodeZipUrl: "/downloads/projects/ecommerce-platform-v1.zip",
      installation: "npm install\ncp .env.example .env\nnpm run dev",
      downloadCount: 412,
    },
  });

  const p2 = await prisma.project.create({
    data: {
      title: "Banking & Financial Ledger System",
      slug: "banking-financial-ledger-system",
      shortDesc: "Double-entry bookkeeping financial ledger system with ACID transactions, audit logs, and analytics.",
      description: "Enterprise-grade financial banking ledger written in Java Spring Boot with MySQL and Redis. Supports multi-currency transfers, balance inquiries, fraud detection rules, and immutable transaction audit journals.",
      techStack: JSON.stringify(["Java", "Spring Boot", "MySQL", "Redis", "Docker", "JUnit"]),
      difficulty: "Advanced",
      category: "FinTech & Systems",
      isPremium: true,
      thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      demoUrl: "https://demo-banking.sctech.io",
      githubUrl: "https://github.com/sctech-projects/banking-ledger",
      sourceCodeZipUrl: "/downloads/projects/banking-ledger-v1.zip",
      installation: "./mvnw spring-boot:run",
      downloadCount: 285,
    },
  });

  const p3 = await prisma.project.create({
    data: {
      title: "Task Management & Team Workflow App",
      slug: "task-management-workflow-app",
      shortDesc: "Kanban board task manager with drag-and-drop, sprint boards, labels, and real-time member updates.",
      description: "A fluid productivity tool built with Next.js, Firebase, and Tailwind CSS. Helps agile teams manage sprints, prioritize backlogs, assign tickets, and generate burn-down velocity charts.",
      techStack: JSON.stringify(["Next.js", "Firebase", "React Beautiful DND", "Tailwind CSS"]),
      difficulty: "Beginner",
      category: "Productivity",
      isPremium: false,
      thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&auto=format&fit=crop&q=80",
      demoUrl: "https://demo-taskflow.sctech.io",
      githubUrl: "https://github.com/sctech-projects/taskflow-kanban",
      sourceCodeZipUrl: "/downloads/projects/taskflow-kanban-v1.zip",
      installation: "npm install && npm run dev",
      downloadCount: 890,
    },
  });

  const p4 = await prisma.project.create({
    data: {
      title: "Realtime Chat & Collaboration Application",
      slug: "realtime-chat-collaboration-app",
      shortDesc: "Slack-like team collaboration hub featuring channels, direct messages, file sharing, and online presence.",
      description: "High-performance messaging application powered by Socket.io, Node.js, and Redis pub/sub. Features rich-text Markdown message formatting, emoji reactions, voice notes, and typing indicators.",
      techStack: JSON.stringify(["Socket.io", "Node.js", "React", "Tailwind CSS", "Redis"]),
      difficulty: "Intermediate",
      category: "Communications",
      isPremium: true,
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      demoUrl: "https://demo-chat.sctech.io",
      githubUrl: "https://github.com/sctech-projects/realtime-chat",
      sourceCodeZipUrl: "/downloads/projects/realtime-chat-v1.zip",
      installation: "npm install && npm run dev",
      downloadCount: 520,
    },
  });

  // 7. Create HR Interaction Sessions
  await prisma.hRSession.create({
    data: {
      title: "HR Session with Amazon: Cracking Tech Interviews",
      speakerName: "Ananya Sengupta",
      speakerRole: "Senior Tech Recruiter & Talent Partner",
      speakerCompany: "Amazon India",
      speakerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      topic: "Insider secrets on resume screening, leadership principles, behavioral questions, and live coding interview tips.",
      scheduledAt: new Date("2026-09-18T18:00:00Z"),
      durationMinutes: 75,
      meetUrl: "https://meet.google.com/sct-hr-amazon-live",
      maxAttendees: 250,
      isRecorded: true,
      status: "UPCOMING",
    },
  });

  await prisma.hRSession.create({
    data: {
      title: "Web Development Career Workshop & Live Q&A",
      speakerName: "Arun Patel",
      speakerRole: "Lead Architect",
      speakerCompany: "SC TECH",
      speakerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      topic: "Roadmap to becoming a high-paid Full Stack Engineer in 2026: projects that get you noticed.",
      scheduledAt: new Date("2026-09-22T17:30:00Z"),
      durationMinutes: 60,
      meetUrl: "https://meet.google.com/sct-webdev-workshop",
      maxAttendees: 300,
      status: "UPCOMING",
    },
  });

  // 8. Create Verifiable Digital Certificates
  await prisma.certificate.create({
    data: {
      certificateNo: "SCT-HACK-2026-000123",
      studentId: studentUser.id,
      studentName: "Arun Kumar",
      title: "CERTIFICATE OF PARTICIPATION",
      eventName: "SC TECH HACKATHON 2026",
      type: "HACKATHON_PARTICIPATION",
      issueDate: new Date("2026-09-17"),
      qrCodeData: "http://localhost:3000/verify/SCT-HACK-2026-000123",
      status: "VERIFIED",
      metadata: JSON.stringify({
        hackathonName: "SC TECH HACKATHON 2026",
        issuedBy: "SC TECH Examination & Award Board",
        authorizedSignatory: "Director of Technology, SC TECH",
      }),
    },
  });

  await prisma.certificate.create({
    data: {
      certificateNo: "SCT-INT-2026-000456",
      studentId: studentUser.id,
      studentName: "Arun Kumar",
      title: "CERTIFICATE OF EXCELLENCE",
      eventName: "Full Stack Developer Internship",
      type: "INTERNSHIP_COMPLETION",
      issueDate: new Date("2026-08-30"),
      qrCodeData: "http://localhost:3000/verify/SCT-INT-2026-000456",
      status: "VERIFIED",
      metadata: JSON.stringify({
        program: "SC TECH Engineering Internship Track",
        performanceRating: "Top 5% Performer",
      }),
    },
  });

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser.id,
        title: "PRO Plan Activated",
        message: "Your subscription to SC TECH PRO plan has been successfully activated. Enjoy full access to all project source codes and premium HR sessions.",
        type: "PAYMENT",
        link: "/my-plan",
        isRead: false,
      },
      {
        userId: studentUser.id,
        title: "Hackathon Registration Confirmed",
        message: "You are successfully registered for SC TECH HACKATHON 2026. Problem statement will be unlocked on 15 Sep 2026 at 10:00 AM.",
        type: "HACKATHON",
        link: "/my-hackathons",
        isRead: false,
      },
      {
        userId: studentUser.id,
        title: "Application Shortlisted!",
        message: "Great news! Your application for 'Full Stack Developer Intern' at SC TECH has been shortlisted for technical interview.",
        type: "INTERNSHIP",
        link: "/my-internships",
        isRead: false,
      },
    ],
  });

  // 10. Create Support Ticket
  await prisma.supportTicket.create({
    data: {
      userId: studentUser.id,
      name: "Arun Kumar",
      email: "student@sctech.com",
      subject: "Certificate ID Verification query",
      category: "Hackathon",
      message: "Can I share my SC TECH Hackathon digital certificate on LinkedIn directly with the verification URL?",
      status: "RESOLVED",
      adminNotes: "Yes, verified certificates can be embedded or shared directly via the unique URL /verify/[certificateId].",
    },
  });

  // 11. Create Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actorRole: "ADMIN",
      action: "PLAN_CREATED",
      entity: "Plan",
      entityId: proPlan.id,
      details: JSON.stringify({ name: "PRO", price: 499 }),
    },
  });

  console.log("✅ SC TECH database seeded successfully with realistic test records!");
  console.log("-------------------------------------------------------------------");
  console.log("🔑 Test Logins (Password for all accounts: Password@123):");
  console.log("  1. Student:     student@sctech.com");
  console.log("  2. Admin:       admin@sctech.com");
  console.log("  3. Super Admin: superadmin@sctech.com");
  console.log("  4. Judge:       judge@sctech.com");
  console.log("  5. HR:          hr@sctech.com");
  console.log("  6. Company:     company@sctech.com");
  console.log("-------------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
