import { REAL_WORLD_PROJECTS } from "./projects-data";

export type TaskDifficulty = "EASY" | "MEDIUM" | "HARD";

export type TaskStatus = 
  | "LOCKED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export interface ProjectTaskBlueprint {
  id: string; // e.g. task-01-01
  taskNumber: number; // 1 to 8
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  isImportant?: boolean;
  importanceRationale?: string;
  requirements: string[];
  expectedOutput: string;
  submissionType: "GITHUB_REPO" | "GITHUB_COMMIT" | "DEMO_URL" | "CODE_SNIPPET";
  evaluationCriteria: string[];
  skills: string[];
  estimatedHours: number;
}

export interface ProjectTaskSet {
  projectId: string;
  projectSlug: string;
  projectTitle: string;
  tasks: ProjectTaskBlueprint[];
}

// Helper to generate tailored 8 tasks for any project
export function generate8TasksForProject(
  projectId: string,
  slug: string,
  title: string,
  category: string,
  techStack: string[]
): ProjectTaskBlueprint[] {
  const stackStr = techStack.slice(0, 4).join(", ");
  const primaryTech = techStack[0] || "React";

  return [
    // 2 EASY TASKS (Tasks 1 & 2)
    {
      id: `${projectId}-task-1`,
      taskNumber: 1,
      title: `Setup Local Workspace & Configure Environment for ${title}`,
      description: `Clone the project repository, set up local environment variables, verify database connections, and ensure all build pipelines pass cleanly.`,
      difficulty: "EASY",
      isImportant: false,
      requirements: [
        `Clone the repository and install dependencies using npm/pnpm.`,
        `Configure the .env.local file with required mock/live API keys and database credentials.`,
        `Start the local development server and verify that the homepage renders with zero console errors.`
      ],
      expectedOutput: `A running local instance of ${title} with all environment variables loaded and clean browser console logs.`,
      submissionType: "GITHUB_REPO",
      evaluationCriteria: [
        "Repository compiles without errors",
        "Clean folder structure preserved",
        "Clear documentation in README.md"
      ],
      skills: ["Git", "Environment Configuration", primaryTech],
      estimatedHours: 4,
    },
    {
      id: `${projectId}-task-2`,
      taskNumber: 2,
      title: `Input Validation, Error Handling & Responsive UI Enhancements`,
      description: `Add client-side and server-side input validation, error boundary toasts, and optimize the responsive layout across mobile and tablet viewports.`,
      difficulty: "EASY",
      isImportant: false,
      requirements: [
        `Implement schema-based form validation (e.g., Zod / Yup) on all primary user inputs.`,
        `Display user-friendly error banners and feedback toasts for invalid inputs or network timeouts.`,
        `Test and refine mobile responsiveness down to 320px screen width.`
      ],
      expectedOutput: `Robust form validation with instant feedback toasts and seamless responsive styling on mobile devices.`,
      submissionType: "GITHUB_COMMIT",
      evaluationCriteria: [
        "Proper validation schema covering edge cases",
        "Non-blocking, accessible error notifications",
        "Flawless mobile viewport responsiveness"
      ],
      skills: ["UI/UX", "Form Validation", "Responsive Design"],
      estimatedHours: 6,
    },

    // 2 MEDIUM TASKS (Tasks 3 & 4)
    {
      id: `${projectId}-task-3`,
      taskNumber: 3,
      title: `Implement Real-Time Search, Filtering & Pagination Subsystem`,
      description: `Build an optimized multi-parameter search and filtering engine with debounce, memoized filters, and server-side pagination.`,
      difficulty: "MEDIUM",
      isImportant: false,
      requirements: [
        `Implement debounced search queries (300ms) with query params persistence in the URL.`,
        `Add category, tag, and sort filters with instantaneous UI updates.`,
        `Implement server-side pagination or cursor-based infinite scroll for high-volume record sets.`
      ],
      expectedOutput: `A high-performance search and filter bar supporting complex multi-attribute queries with smooth pagination.`,
      submissionType: "GITHUB_COMMIT",
      evaluationCriteria: [
        "Debounce implementation prevents redundant API calls",
        "URL query synchronization works on page reload",
        "Clean pagination metadata response"
      ],
      skills: ["API Optimization", "State Management", stackStr],
      estimatedHours: 8,
    },
    {
      id: `${projectId}-task-4`,
      taskNumber: 4,
      title: `Role-Based Access Control (RBAC) & Audit Logging Pipeline`,
      description: `Integrate granular role-based permissions (Admin, Moderator, Student/User) and append immutable audit log records for critical system actions.`,
      difficulty: "MEDIUM",
      isImportant: false,
      requirements: [
        `Secure backend API routes with role authorization middleware.`,
        `Conditionally render UI controls based on the active user's assigned role privileges.`,
        `Create an audit logging service that records timestamps, user IDs, IP addresses, and mutation details.`
      ],
      expectedOutput: `Protected administrative actions with role verification and an immutable audit log trail.`,
      submissionType: "GITHUB_COMMIT",
      evaluationCriteria: [
        "Strict middleware checks prevent privilege escalation",
        "Role-guarded UI components hide unauthorized actions",
        "Structured audit log entries with metadata"
      ],
      skills: ["Security", "RBAC", "Authentication"],
      estimatedHours: 10,
    },

    // 4 HARD TASKS (Tasks 5, 6, 7 & 8)
    {
      id: `${projectId}-task-5`,
      taskNumber: 5,
      title: `⭐ Core Engine & Intelligent Automation Pipeline Architecture`,
      description: `Architect the core domain logic for ${title}, integrating asynchronous workflow processing, batch operations, and smart algorithmic automation.`,
      difficulty: "HARD",
      isImportant: true,
      importanceRationale: `This is the foundational architectural backbone of ${title}. Mastering this task demonstrates production-grade system engineering and deep domain understanding.`,
      requirements: [
        `Design and implement the primary computational or processing pipeline for ${category}.`,
        `Handle asynchronous worker queues, background jobs, and error retry mechanisms.`,
        `Implement caching (e.g., Redis or in-memory) to achieve sub-100ms response times on frequently queried computations.`
      ],
      expectedOutput: `A high-throughput core processing engine capable of concurrent task execution with resilient error recovery.`,
      submissionType: "GITHUB_REPO",
      evaluationCriteria: [
        "High algorithmic efficiency and clean modular architecture",
        "Proper concurrency and background queue handling",
        "Comprehensive unit & integration test coverage"
      ],
      skills: ["System Architecture", "Performance Optimization", stackStr],
      estimatedHours: 16,
    },
    {
      id: `${projectId}-task-6`,
      taskNumber: 6,
      title: `Real-Time Event Dispatcher & WebSocket / SSE Notification Layer`,
      description: `Implement bidirectional real-time communication using WebSockets or Server-Sent Events (SSE) for live data synchronization and instant push notifications.`,
      difficulty: "HARD",
      isImportant: false,
      requirements: [
        `Set up a resilient WebSocket or SSE server channel with room/topic subscription support.`,
        `Broadcast live status changes, data updates, and system alerts to connected clients instantaneously.`,
        `Implement exponential backoff auto-reconnection and client offline queuing.`
      ],
      expectedOutput: `Zero-latency real-time updates and notification toasts appearing across multiple client tabs simultaneously.`,
      submissionType: "GITHUB_COMMIT",
      evaluationCriteria: [
        "Seamless live data syncing without manual page refresh",
        "Graceful handling of connection drops and reconnects",
        "Low server memory footprint per active connection"
      ],
      skills: ["WebSockets", "Real-Time Streaming", "Async Events"],
      estimatedHours: 14,
    },
    {
      id: `${projectId}-task-7`,
      taskNumber: 7,
      title: `⭐ Advanced Analytics, Telemetry & Interactive Visual Dashboard`,
      description: `Construct an enterprise analytics dashboard aggregating system metrics, performance telemetry, and predictive KPI charts.`,
      difficulty: "HARD",
      isImportant: true,
      importanceRationale: `Provides decision-makers and administrators with actionable real-time insights, demonstrating your ability to present complex data models intuitively.`,
      requirements: [
        `Aggregate complex metrics across time ranges (daily, weekly, monthly) using database grouping pipelines.`,
        `Build interactive visual charts (e.g., Recharts / Chart.js) with tooltips, legends, and export capabilities (CSV/PDF).`,
        `Implement real-time metric counters that update dynamically as system events occur.`
      ],
      expectedOutput: `A sleek, interactive analytics control center with rich visualization charts, filtering by date ranges, and CSV data export.`,
      submissionType: "GITHUB_COMMIT",
      evaluationCriteria: [
        "Performant aggregation queries that scale with large datasets",
        "Clean, intuitive visual hierarchy and responsive chart containers",
        "Functional data export feature"
      ],
      skills: ["Data Visualization", "Aggregation Pipelines", "UI Analytics"],
      estimatedHours: 14,
    },
    {
      id: `${projectId}-task-8`,
      taskNumber: 8,
      title: `Production Hardening, Automated E2E Testing & Cloud CI/CD Deployment`,
      description: `Finalize the production readiness of ${title} with security audits, end-to-end integration tests, containerization (Docker), and automated deployment pipelines.`,
      difficulty: "HARD",
      isImportant: false,
      requirements: [
        `Write automated end-to-end (E2E) test suites (e.g., Playwright / Cypress) covering critical user flows.`,
        `Perform security hardening: rate limiting, CORS configuration, sanitized inputs, and secret management.`,
        `Create a production Dockerfile and GitHub Actions workflow for automated testing and cloud deployment.`
      ],
      expectedOutput: `A production-ready, containerized application with automated passing CI/CD tests and a live deployment URL.`,
      submissionType: "DEMO_URL",
      evaluationCriteria: [
        "100% passing E2E test suite covering primary user journeys",
        "Robust security controls against common OWASP vulnerabilities",
        "Functional Docker container and automated deployment pipeline"
      ],
      skills: ["Docker", "CI/CD", "E2E Testing", "Cloud Deployment"],
      estimatedHours: 18,
    }
  ];
}

// Master Registry of Tasks for all 25 Real-World Projects
export const ALL_PROJECT_TASK_SETS: Record<string, ProjectTaskBlueprint[]> = {};

REAL_WORLD_PROJECTS.forEach((p) => {
  const tasks = generate8TasksForProject(
    p.id,
    p.slug,
    p.title,
    p.category,
    p.technologyStack || ["TypeScript", "Next.js", "Node.js"]
  );
  ALL_PROJECT_TASK_SETS[p.id] = tasks;
  if (p.slug) {
    ALL_PROJECT_TASK_SETS[p.slug] = tasks;
  }
});

export function getTasksForProject(projectIdOrSlug: string): ProjectTaskBlueprint[] {
  if (ALL_PROJECT_TASK_SETS[projectIdOrSlug]) {
    return ALL_PROJECT_TASK_SETS[projectIdOrSlug];
  }
  const found = REAL_WORLD_PROJECTS.find(
    (p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug
  );
  if (found) {
    return generate8TasksForProject(
      found.id,
      found.slug,
      found.title,
      found.category,
      found.technologyStack
    );
  }
  return generate8TasksForProject(
    projectIdOrSlug,
    projectIdOrSlug,
    "Real-World Engineering Project",
    "Full Stack Development",
    ["Next.js", "TypeScript", "Node.js", "PostgreSQL"]
  );
}
