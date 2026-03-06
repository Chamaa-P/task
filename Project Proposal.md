# TaskCollab — Cloud-Native Task Collaboration Platform (Project Proposal)

## Team Members
- Arooj Ilyas (1012872900)
- Adam Pietrewicz (1004401818)
- Patrick Chamaa (1012574233)

---

## 1. Motivation
Modern student teams and small project groups frequently struggle with lightweight coordination: assigning tasks, tracking progress, avoiding duplicated effort, and keeping everyone aligned when work happens asynchronously. While there are many mature project-management tools, they are often either:
- too heavyweight for small teams (complex setup, steep learning curves, over-featured)
- not designed to demonstrate cloud-native concepts like orchestration, persistent state, observability, and resilient deployment.

Our TaskCollab project addresses this need by providing a simple, focused, collaboration-first task management service that supports real-time updates and team-based workflows while remaining intentionally scoped for a course project.

**Why it is worth pursuing**
- It is a stateful application where correctness depends on persistent data (users, teams, tasks, activity history).
- It naturally demonstrates multi-container development, database persistence, orchestration, monitoring, and secure deployment.
- Collaboration features allow a clear, compelling demo (multiple users interacting simultaneously).

**Target users**
- Small teams (2–10 people), such as students, clubs, or early-stage project groups.
- Users who want quick task tracking with live updates and a simple workflow.

**Existing solutions and limitations**
- Tools like Trello/Jira/Asana are widely used, but they are not built to illustrate the underlying deployment and infrastructure decisions we must implement (Swarm/Kubernetes, persistent volumes, provider monitoring, CI/CD, etc.)
- Our goal is not to compete on features, but to build a polished, cloud-native system that demonstrates the required engineering concepts.
- Existing solutions are sometimes too complex to quickly pick up and use, and don't provide much customization

---

## 2. Objective and Key Features
### Objective
Build and deploy a **cloud-native, stateful task-collaboration web service** that allows teams to create workspaces, manage tasks, and receive live updates from the website and by email. The system will be containerized for local development, use PostgreSQL for persistence, run under real orchestration using Docker Swarm, be deployed using Digital Ocean, and include monitoring plus some advanced custom features.

### Core Features (Functional)
- **User Accounts** register/login and team/workspace membership.
- **Workspaces/Projects**: create projects, invite members (by email or invite token).
- **Task Lifecycle**: create tasks, assign users, set due dates, labels/tags, and update status (e.g, To Do / In Progress / Done).
- **Comments / Activity Feed**: track changes and discussion on tasks.
- **Search & Filters**: by assignee, status, label, due date.

### Containerization & Local Development (Core Requirement 1)
- **Docker** images for each component.
- **Docker Compose** for local multi-container workflow:
  - `api` (backend)
  - `db` (PostgreSQL)
  - optional: `frontend` (simple UI) for the website, login page
- Local development includes hot-reload for API and easy database bootstrapping/migrations.

### State Management (Core Requirement 2)
- We will use PostgreSQL + persistent storage (Digital Ocean Volume)
- PostgreSQL stores all durable states.
- In Docker Swarm:
  - PostgreSQL runs as a Swarm service with placement constraints to ensure data locality.
  - A **named Docker volume** provides durable storage so data survives container restarts and redeployment.
  - Volume driver ensures persistence across node failures.
- Backups: will be an “Advanced feature”, discussed below in that section.


#### Database schema (High-Level)
We will implement a relational schema emphasizing collaboration and auditability:

- **users**
  - id, name, email (unique), password_hash, created_at
- **workspaces**
  - id, name, owner_id, created_at
- **workspace_members**
  - workspace_id, user_id, role (owner/admin/member), joined_at
- **tasks**
  - id, workspace_id, title, description, status, priority, due_date, created_by, assigned_to, created_at, updated_at
- **task_comments**
  - id, task_id, author_id, body, created_at
- **task_activity**
  - id, task_id, actor_id, action_type, metadata (JSON), created_at
- **invites** (optional if time allows)
  - id, workspace_id, invite_token, email, role, expires_at, created_at

This schema supports: team membership, assignment, discussion, and an activity feed.

### Deployment Provider (Core Requirement 3)
**DigitalOcean**
- our team is most familiar and comfortable with Digital Ocean at the moment, compared to Kubernetes
- aligns well with course requirements and provides:
  - Docker-ready droplets for Docker Swarm deployment,
  - built-in metrics/alerts,
  - straightforward persistent volume support,
  - optional managed PostgreSQL or self-managed Postgres with volumes (we will use Postgres in a container with persistent volume to clearly demonstrate storage).

### Orchestration Approach (Core Requirement 4)
**Docker Swarm**
- **Local**: Docker Swarm mode on local machine for development and testing of stack files.
- **Cloud**: Docker Swarm on DigitalOcean droplets for final deployment.
- Docker Swarm resources to include:
  - **Services** (API server, database, optional frontend)
  - **Networks** (overlay networks for service communication)
  - **Volumes** (named volumes for PostgreSQL states)
  - **Configs/Secrets** for configuration and credentials for each user based on what team they are a part of
  - **Stack files** (docker-compose.yml for Swarm deployment)

This satisfies the course requirement because we are implementing Docker Swarm orchestration directly with multi-node deployment capabilities.

### Monitoring and Observability (Core Requirement 5)
- Use **DigitalOcean Monitoring**:
  - dashboards for CPU/memory of droplets and containers,
  - alerts for high CPU/memory, container restarts, and disk usage.
- Application-level observability:
  - structured logs from API (request id, route, latency, status code),
  - health endpoints (healthchecks in Docker Swarm services),
  - optional lightweight metrics endpoint (if feasible) to make the demo clearer.

### Planned Advanced Features
We are hoping to implement at least three advanced features to reduce these user/application risks:

1) **Security enhancements (Auth + HTTPS + secrets management)**
   - Authentication with secure password hashing and session/JWT strategy.
   - Role-based access control at the API layer (workspace roles).
   - Docker Swarm Secrets for DB credentials and application secrets.
   - HTTPS via reverse proxy (Traefik or nginx) + TLS (Let's Encrypt) or DigitalOcean load balancer with TLS.

2) **CI/CD pipeline (GitHub Actions)**
   - On push to main: run tests + lint + build Docker image(s).
   - Push images to a container registry.
   - Deploy to Docker Swarm using stack files (docker stack deploy) via SSH or Docker context.
   - This ensures repeatable deployments and demonstrates real-world workflow.

3) **Backup and recovery**
   - Scheduled PostgreSQL backups (e.g, cron job or scheduled container running `pg_dump`).
   - Store backups in an S3-compatible bucket (DigitalOcean Spaces).
   - Document and test a restore procedure (restore into a fresh Postgres instance and verify app functionality).

4) **Real-time functionality (Optional)**
   - WebSockets to broadcast task updates/comments to connected clients in the same workspace.
   - Demo: two browsers; updates appear instantly without refresh.

We will prioritize features 1) + 2) + 3) as the guaranteed advanced features. Feature 4) is a stretch goal depending on if the team has enough time.

### Feasibility and scope
The scope we defined for the project is intentionally bounded for the 4 week period we have for completion:
- We will focus on the core collaboration workflow (workspaces + tasks + comments).
- UI can be minimal; the backend, deployment, orchestration, persistence, and observability are the primary grading focus.
- Advanced features are selected to align with cloud-native learning goals and to be realistically deliverable within 4 weeks.

---

## 3. Tentative Plan
*(Exact dates omitted per instructions; this is a week-by-week outline.)*
Responsibilities are designed to parallelize work while keeping integration manageable.

### Roles (3-member allocation)
- **Arooj Ilyas — Platform/DevOps Lead**
  - Docker/Docker Compose setup
  - Docker Swarm stack files and deployment
  - Reverse proxy/TLS setup
  - Monitoring dashboards/alerts

- **Adam Pietrewicz — Backend Lead**
  - API design (REST endpoints)
  - PostgreSQL schema + migrations
  - Business logic (tasks, workspaces, membership)
  - Unit/integration tests

- **Patrick Chamaa — CI/CD + Reliability + Frontend**
  - GitHub Actions pipeline
  - Container registry integration
  - Backup automation + Spaces integration
  - Minimal UI for demo (or API demo scripts)
  - Documentation for restore/runbooks

### Week-by-Week Plan (4 or 5 weeks total)
**Week 1: Project setup + design + database**
- Finalize provider/orchestration choice (DigitalOcean + Docker Swarm).
- Agree on MVP user stories and API contracts.
- Set up repo structure, issue board, and coding standards.
- Create Dockerfiles + Docker Compose for API + Postgres.
- Implement database schema and migrations.

**Week 2: Core backend + authentication**
- Implement workspace + membership + task CRUD.
- Add authentication (register/login) with password hashing.
- Basic logging + health endpoints.
- Unit tests for core functionality.

**Week 3: Docker Swarm deployment + persistence**
- Create Docker Swarm stack files for local deployment.
- Deploy to DigitalOcean Swarm cluster with PostgreSQL persistent volume.
- Configure overlay networks and service discovery.
- Confirm state persistence across container restarts.
- Set up reverse proxy with HTTPS/TLS.

**Week 4: CI/CD + observability + security**
- GitHub Actions pipeline (test/build/push/deploy to Swarm).
- DigitalOcean monitoring dashboards/alerts configured.
- Docker Swarm secrets management implemented.
- Role-based authorization checks verified.
- Backup automation to DigitalOcean Spaces.

**Week 5: Testing + recovery + polish + presentation**
- Run backup recovery drill (restore to new DB volume).
- Integration testing and bug fixes.
- Performance improvements and stability testing.
- Finalize documentation (deployment guide, runbooks).
- Prepare demo and presentation materials.

---

## 4. Initial Independent Reasoning (Before Using AI)
### Architecture Choices
Before consulting any AI tools, our initial plan was to build a task collaboration service because it naturally requires persistent states and supports a clear multi-user demo. We also initially leaned towards using DigitalOcean because we are most familiar with it after completing Assignments 1 and 2, and provides straightforward monitoring and storage options. For orchestration, we chose Docker Swarm because (again) we are most familiar with it after completing the class assignments so far, and it offers a simpler deployment model while still demonstrating orchestration concepts like service management, overlay networking, and persistent volumes. Using local Docker Swarm + DigitalOcean Swarm cluster provides a realistic path from development to production. For persistence, we planned PostgreSQL with a persistent volume using Digital Ocean volumes so the application state would survive restarts and redeployments.

### Anticipated Challenges
We expected the hardest parts would be:
- **Docker Swarm stateful persistence**: getting PostgreSQL volumes and service updates correct without data loss.
- **Reverse proxy/TLS configuration**: ensuring secure HTTPS access and dealing with certificates and DNS.
- **Reliable CI/CD**: making deployments repeatable while avoiding broken releases, especially when DB migrations are involved.
- **Backups/restores**: implementing and validating recovery, not just creating backups.

We chose these challenges intentionally because they map directly to cloud-native learning goals and course requirements.

### Early Development Approach
Our initial strategy was to implement an MVP backend first (workspaces + tasks + auth) in Docker Compose so the team could move quickly and test locally. In parallel, we planned infrastructure work (Docker Swarm stack files) to reduce end-of-project deployment risk. We intended to divide responsibilities so that backend development could proceed independently of Swarm setup, with early integration checkpoints to ensure configuration (ports, env vars, migrations) matched across environments. In summary, we made sure that all team members would have a chance to work on back end and cloud application concepts that we are learning in this class. And so that is why we decided the front-end work would be done near the end of our timeline, where we will make our project presentable and engaging to demo. Some members have good front-end experience which is helpfull as well.

---

## 5. AI Assistance Disclosure
### Which parts were developed without AI assistance?
- The initial project idea (task collaboration) and our intent to prioritize cloud-native requirements over UI complexity.
- The provider/orchestration direction (DigitalOcean + Docker Swarm) and the rationale that Docker Swarm provides a streamlined orchestration approach while satisfying course constraints.
- The identification of likely challenges (persistence, reverse proxy/TLS, CI/CD, backups).

### If AI was used, what did it help with?
AI assistance was used for:
- helping draft and structure the proposal into the required five sections.
- suggesting a clear, course-aligned set of advanced features (security, CI/CD, backups) to gather some more options.
- proposing a reasonable high-level database schema and a week-by-week plan format.

### One AI-influenced idea and our decision process
- **AI suggestion:** Include backup and recovery as a primary advanced feature implemented via scheduled `pg_dump` backups stored in object storage (DigitalOcean Spaces), with a documented restore procedure.
- **Our additional considerations/tradeoffs:** We discussed whether backups would be too time-consuming compared to real-time features. We decided to adopt backups because they directly demonstrate reliability engineering and persistent-state mastery, are highly relevant to real cloud deployments, and can be implemented in a controlled way (scheduled backup container + storage). We kept real-time updates as a stretch goal to avoid risking core requirements.
