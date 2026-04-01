# TaskCollab Final Report

TaskCollab is a cloud-native task collaboration platform for small teams. The system supports authenticated project and task management, day-based due date tracking, real-time updates, persistent PostgreSQL storage, and a monitored Docker Swarm deployment on DigitalOcean.

## Team Information

| Team Member     | Student Number | Email                            |
| --------------- | -------------- | -------------------------------- |
| Arooj Ilyas     | 1012872900     | arooj-ilyas@hotmail.com          |
| Adam Pietrewicz | 1004401818     | adam.pietrewicz@mail.utoronto.ca |
| Patrick Chamaa  | 1012574233     | p.chamaa@mail.utoronto.ca        |

## Motivation

Our team chose this project because lightweight coordination is a real problem for student groups and small teams. We wanted to build something that is easy to demonstrate from a user perspective, but also strong from a cloud-computing perspective: persistent state, multi-container development, secure deployment, orchestration, monitoring, and real-time collaboration. TaskCollab addresses the need for a focused workspace where teams can create projects, assign work, track progress, and stay aligned without the overhead of a large enterprise project-management tool.

## Objectives

The main objectives of the project were to:

1. Build a stateful web application for collaborative task management.
2. Use PostgreSQL and persistent storage so application state survives restarts and redeployments.
3. Containerize the full application for local development and deployment.
4. Deploy the application on an approved cloud provider using a real orchestration platform.
5. Add advanced features that improve realism and usability, especially real-time synchronization, monitoring, autoscaling, and security.
6. Produce a deployment and development workflow that is reproducible.

## Technical Stack

| Area                     | Technologies                                                         | Notes                                                                          |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend                 | React, Vite, TypeScript, React Router, Socket.IO client              | Browser UI for authentication, dashboards, projects, tasks, and calendar views |
| Backend                  | Node.js, Express, TypeScript, Sequelize, Socket.IO, JWT, prom-client | REST API, authentication, real-time events, and metrics                        |
| Database                 | PostgreSQL 15                                                        | Stores users, projects, tasks, and assignees                                   |
| Local container workflow | Docker, Docker Compose                                               | Used for local multi-container development and verification                    |
| Orchestration approach   | Docker Swarm                                                         | Chosen orchestration platform for the course-compliant deployment              |
| Cloud provider           | DigitalOcean Droplets + Block Storage                                | Production cluster with persistent storage mounted at `/mnt/postgres-data`     |
| Web serving and TLS      | Nginx                                                                | Serves the frontend and proxies API/WebSocket traffic                          |
| Monitoring               | Prometheus, Grafana, cAdvisor, node-exporter                         | Collects application, container, and node metrics                              |
| Scaling                  | Custom Python autoscaler                                             | Adjusts frontend/backend Swarm replicas using Prometheus metrics               |
| Deployment support       | Docker Hub images, `deploy-swarm.ps1`                                | Helps build, push, and deploy the Swarm stack                                  |

## Core Features

The implemented features satisfy the project core feature requirements for containerization, persistence, orchestration, monitoring, and advanced functionality.

1. Project management
   - Users can create projects with names, descriptions, and color tags.
   - Each project groups related tasks and gives teams a simple workspace structure.
2. Task assignment and lifecycle tracking
   - Tasks support title, description, priority, status, assignee, and due date.
   - Status updates include `todo`, `in_progress`, `completed`, and `archived`.
   - The Projects page can assign the same task to multiple users in one action.
3. Day-based calendar view
   - Due dates are displayed on a calendar UI, easy to time manage.
   - The calendar groups tasks by date and makes overlapping deadlines from multiple projects easy to see; intuitive for users.
4. Persistent state
   - PostgreSQL stores all durable application data.
   - Local development uses Docker volumes, while production uses DigitalOcean Block Storage mounted at `/mnt/postgres-data`.
5. Monintoring & Observability
   - Prometheus and Grafana expose service and infrastructure metrics.

## Advanced Features

1. Authentication and protected access
   - Users can register and log in.
   - JWT-based authentication protects API routes and frontend pages.
   - Production secrets are provided through Docker Swarm secrets instead of hard-coded credentials.
2. Real-time synchronization
   - Socket.IO broadcasts task changes so multiple clients see updates without refreshing.
3. Autoscaling
   - cAdvisor and node-exporter provide container and host visibility.
   - A custom autoscaler monitors load and can adjust Swarm service replicas.
4. Security Enhancements
   - Password hashing, JWT authentication, HTTP security headers, Docker secrets, and HTTPS support are included.

## User Guide

1. Register and log in
   - Open the live URL.
   - Create an account on the Register page, then sign in.
2. Use the Dashboard
   - The Dashboard summarizes total tasks, projects, in-progress work, completed work, recent tasks, and project counts.
3. Create a project
   - Go to the Projects page.
   - Create a project by entering a name, description, and color.
4. Add assignees and create tasks
   - On the Projects page, add assignees.
   - Choose a project, enter a task title/description, set priority and day-based due date, then assign that task to one or more assignees.
5. Manage task progress
   - Open the Tasks page to view all tasks.
   - Filter by status or priority and update each task's status from the inline dropdown.
   - Overdue tasks are highlighted automatically.
6. Review deadlines in the calendar
   - Open the Calendar page to view all due dates in a month-style layout.
   - Tasks due on the same day are grouped so overlapping project deadlines remain visible.
7. Observe real-time behavior
   - If two users are connected at the same time, task changes made by one user should appear for the other without a manual refresh.

## Development

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop or Docker Engine

### Environment configuration

Frontend and backend example environment files are included:

- `backend/.env.example`
- `frontend/.env.example`

Typical local values are:

```env
# backend/.env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://taskuser:taskpass@localhost:5432/taskcollab
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# frontend/.env
VITE_API_URL=http://localhost:5000
```

If you want to use the repository's environment check script, create a root `.env` that defines `DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL`, and `PORT`.

### Local development with Docker Compose

Run the development stack with hot reload from the repository root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:

- PostgreSQL on port `5432`
- Backend API on port `5000`
- Frontend dev server on port `3000`

### Source-based local development

If you want to run the app outside the development containers:

```bash
cd backend
npm install
npm run build
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run build
npm run dev
```

You will also need a PostgreSQL instance running locally or via Docker with the connection string expected by `backend/.env`.

### Database and storage

- Local development uses Docker-managed volumes such as `postgres-dev-data` or `postgres-data`.
- Production PostgreSQL storage is mounted from the provider volume at `/mnt/postgres-data`.
- The DigitalOcean production stack constrains PostgreSQL to the manager node so the volume stays attached to the correct host.

### Local testing and verification

Recommended checks after setup:

1. Confirm the frontend builds with `cd frontend && npm run build`.
2. Confirm the backend builds with `cd backend && npm run build`.
3. Visit `http://localhost:3000` and exercise register, project creation, task assignment, task status updates, and the calendar view.
4. Confirm the backend health endpoint at `http://localhost:5000/health`.
5. Confirm the backend metrics endpoint at `http://localhost:5000/metrics`.
6. Use the supplemental scripts under `test_scripts/` if you want additional environment, endpoint, database, WebSocket, or autoscaler checks.

## Deployment Information

The live application URL is:

- [https://138.197.152.191](https://138.197.152.191)

The production deployment uses DigitalOcean Docker Swarm with one manager node, two worker nodes, replicated frontend services, a backend API service, a PostgreSQL service pinned to the manager, and a provider-backed storage mount at `/mnt/postgres-data`.

Important deployment files:

- `docker-compose.digitalocean.yml`
- `deploy-swarm.ps1`
- `DIGITALOCEAN_SWARM_DEPLOYMENT.md`
- `DIGITALOCEAN_VOLUME_MIGRATION.md`

## AI Assistance and Verification Summary

AI tools were used, but only as support. We reviewed the output and verified changes before implementing and merging to main.

1. Where AI meaningfully contributed
   - Architecture and repository-compliance review against the course handout
   - Docker Swarm, secrets, persistence, and deployment-documentation refinement
   - Debugging and refactoring for changing calendar inputs from time-limited to all-day events
   - Documentation updates for grading and reproducibility
2. One representative limitation in AI output
   - AI could suggest a compliant deployment path and make repository changes, but it could not guarantee that the already-running production cluster matched those assumptions. We still had to verify the actual live Swarm state, mounted volume path, and service behavior ourselves. Concrete examples are recorded in `ai-session.md`.
3. How correctness was verified
   - Backend and frontend builds
   - `/health` and `/metrics` monitoring endpoint checks
   - Manual UI inspection of user flow; authentication, project creation, task creation, status updates, and calendar rendering
   - Swarm service and node inspection for deployment topology and persistence configuration
   - Monitoring and logs through Prometheus, Grafana, cAdvisor, node-exporter, and container output

See `ai-session.md` for the concrete interaction record rather than full prompts or raw responses.

## Individual Contributions

- Arooj Ilyas
  - Led most of the frontend application work, including app routing, dashboard, login/register pages, projects/tasks/calendar pages, layout components, frontend Docker/dev configuration, and repeated README updates.
- Adam Pietrewicz
  - Contributed to the backend foundation, including API routing, backend startup wiring, Docker development files, task/project deletion and Compose-based local workflow setup.
- Patrick Chamaa
  - Led the DigitalOcean Swarm deployment path, monitoring stack, autoscaler integration, production security/secrets work, calendar and due-date refactor, deployment scripts, and most of the late-stage compliance/documentation updates.

Overall, the frontend, backend, and infrastructure work were distributed across the team, with responsibilities aligning well to the final system architecture.

## Lessons Learned and Concluding Remarks

This project reinforced that cloud deployment is not just about getting containers to run. The harder and more valuable work was making stateful services reliable, keeping configuration consistent across environments, and verifying that documentation matched the real deployment. We also learned that advanced features such as monitoring, autoscaling, and real-time updates add integration complexity, especially when persistence and security must remain correct at the same time.

In conclusion, we learnt a lot building this project. TaskCollab met our main goals: it is a stateful, cloud-native application with a clear user-facing workflow, a reproducible local setup, and a course-compliant Docker Swarm deployment on DigitalOcean. Just as importantly, the project gave us practical experience connecting application development with deployment, observability, persistence, and operational verification.
