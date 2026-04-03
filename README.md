# TaskCollab Final Report

TaskCollab is a cloud-native task collaboration platform for small teams. It supports authenticated project and task management, day-based due dates, real-time updates, persistent PostgreSQL storage, and a monitored Docker Swarm deployment on DigitalOcean.

## Team Information

| Team Member     | Student Number | Email                            |
| --------------- | -------------- | -------------------------------- |
| Arooj Ilyas     | 1012872900     | arooj.ilyas@mail.utoronto.ca     |
| Adam Pietrewicz | 1004401818     | adam.pietrewicz@mail.utoronto.ca |
| Patrick Chamaa  | 1012574233     | p.chamaa@mail.utoronto.ca        |

## Motivation

Our team chose this project because lightweight coordination is a real problem for student groups and small teams. We wanted something with a clear user-facing workflow, but also a strong cloud-computing story: persistent state, multi-container development, orchestration, monitoring, and secure deployment. TaskCollab addresses the need for a focused workspace where teams can create projects, assign work, track progress, and stay aligned without the overhead of a large enterprise platform.

## Objectives

1. Build a stateful web application for collaborative task management.
2. Use PostgreSQL and persistent storage so application data survives restarts and redeployments.
3. Containerize the full stack for reproducible local development.
4. Deploy the application to an approved provider using Docker Swarm.
5. Add advanced features that improve realism and usability, especially real-time synchronization, monitoring, autoscaling, security, and CI/CD.
6. Document the system clearly enough that another developer can reproduce the setup.

## Technical Stack

| Area                   | Technologies                                                         | Notes                                                                          |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend               | React, Vite, TypeScript, React Router, Socket.IO client              | Browser UI for authentication, dashboards, projects, tasks, and calendar views |
| Backend                | Node.js, Express, TypeScript, Sequelize, Socket.IO, JWT, prom-client | REST API, authentication, real-time events, and metrics                        |
| Database               | PostgreSQL 15                                                        | Stores users, projects, tasks, and assignees                                   |
| Local development      | Docker, Docker Compose                                               | Reproducible multi-container development workflow                              |
| Orchestration          | Docker Swarm                                                         | Production clustering, replication, and service management                     |
| Cloud provider         | DigitalOcean Droplets and Block Storage                              | Production deployment with persistent storage mounted at `/mnt/postgres-data`  |
| Web serving and TLS    | Nginx                                                                | Serves the frontend and proxies API and WebSocket traffic                      |
| Monitoring             | Prometheus, Grafana, cAdvisor, node-exporter                         | Application, container, and node-level monitoring                              |
| Autoscaling            | Python, Docker SDK, Prometheus queries                               | Custom autoscaler adjusts Swarm replicas based on load                         |
| Continuous integration | GitHub Actions                                                       | Automated backend/frontend build checks and optional image publishing          |

## Features

Primary programming languages used in this project are TypeScript (frontend and backend) and Python (autoscaler).

### Core Requirement Coverage

1. Docker containerization and local multi-container development
   - `backend/`, `frontend/`, and `autoscaler/` each include Docker support.
   - `docker-compose.dev.yml` starts PostgreSQL, the backend, and the frontend for local development.
2. PostgreSQL state management and persistence
   - Application state is stored in PostgreSQL.
   - Local development uses Docker volumes.
   - Production uses a DigitalOcean volume mounted at `/mnt/postgres-data`.
3. Approved cloud deployment and orchestration
   - The final deployment target is DigitalOcean.
   - Docker Swarm provides clustering, service replication, and load balancing.
4. Monitoring and observability
   - The backend exposes Prometheus metrics at `/metrics`.
   - Prometheus, Grafana, cAdvisor, and node-exporter provide service and infrastructure visibility.

### Main Application Features

1. Project management
   - Users can create projects with names, descriptions, and color tags.
2. Task assignment and lifecycle tracking
   - Tasks support title, description, priority, status, assignee, and due date.
   - Status values include `todo`, `in_progress`, `completed`, and `archived`.
   - Multiple assignees can be attached to the same task.
3. Day-based calendar view
   - Due dates are treated as calendar days instead of timestamps.
   - The calendar groups tasks by date so overlapping deadlines remain easy to review.
4. Persistent state
   - Data survives container restarts locally and redeployments in production.

### Advanced Features

1. Authentication and protected access
   - Users can register and log in.
   - JWT-based authentication protects API routes and frontend routes.
2. Real-time synchronization
   - Socket.IO broadcasts task changes so multiple clients stay in sync without refreshing.
3. Autoscaling
   - A custom Python autoscaler monitors Prometheus metrics and adjusts Swarm replica counts within configured bounds.
4. Security enhancements
   - Password hashing, JWT authentication, HTTP security headers, Docker secrets, and HTTPS support are included.
5. CI/CD support
   - GitHub Actions builds the backend and frontend automatically and can publish Docker images when Docker Hub secrets are configured.

## User Guide

1. Register and log in
   - Open the live URL.
   - Create an account on the Register page, then sign in.
2. Use the dashboard
   - The Dashboard summarizes projects, recent tasks, and task status counts.
3. Create a project
   - Open the Projects page and add a project name, description, and color.
4. Add assignees and create tasks
   - Add assignees to a project.
   - Create tasks with a title, description, priority, due date, and one or more assignees.
5. Manage task progress
   - Use the Tasks page to filter tasks and update status inline.
   - Overdue tasks are highlighted automatically.
6. Review deadlines in the calendar
   - Open the Calendar page to see all due dates in a month layout.
7. Observe real-time updates
   - If two users are connected at the same time, task changes made by one user appear for the other without a manual refresh.

## Development Guide

### Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Node.js 20 or newer and `npm` if running the frontend/backend outside containers

### Environment Configuration

Example environment files are included:

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

### Local Execution With Docker Compose

From the repository root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- Backend API on `localhost:5000`
- Frontend development server on `localhost:3000`

Stop the stack with:

```bash
docker compose -f docker-compose.dev.yml down
```

If you want to remove the local database volume as well:

```bash
docker compose -f docker-compose.dev.yml down -v
```

### Source-Based Local Execution

If you want to run the app outside the development containers, start PostgreSQL first:

```bash
docker run --name taskcollab-postgres -e POSTGRES_USER=taskuser -e POSTGRES_PASSWORD=taskpass -e POSTGRES_DB=taskcollab -p 5432:5432 -v taskcollab-postgres:/var/lib/postgresql/data -d postgres:15-alpine
```

Then run the backend:

```bash
cd backend
npm install
npm run build
npm run dev
```

In a second terminal, run the frontend:

```bash
cd frontend
npm install
npm run build
npm run dev
```

### Local Testing and Verification

Recommended checks after setup:

1. Visit `http://localhost:3000` and exercise register, login, project creation, task creation, task status updates, and calendar rendering.
2. Confirm the backend health endpoint at `http://localhost:5000/health`.
3. Confirm the backend metrics endpoint at `http://localhost:5000/metrics`.
4. Build the backend with `cd backend && npm run build`.
5. Build the frontend with `cd frontend && npm run build`.
6. Use the supplemental scripts under `test_scripts/` if additional endpoint, database, WebSocket, or autoscaler checks are needed.

### Manual DigitalOcean Swarm Deployment

The repository no longer depends on a PowerShell deployment helper. The deployment can be reproduced directly with the checked-in files.

1. Build and push the images that will be referenced by `docker-compose.digitalocean.yml`:

```bash
docker build -t <dockerhub-user>/task-collab-backend:<tag> ./backend
docker build -t <dockerhub-user>/task-collab-frontend:<tag> ./frontend
docker build -t <dockerhub-user>/task-collab-autoscaler:<tag> ./autoscaler
docker push <dockerhub-user>/task-collab-backend:<tag>
docker push <dockerhub-user>/task-collab-frontend:<tag>
docker push <dockerhub-user>/task-collab-autoscaler:<tag>
```

2. If you change the image names or tags, update them in `docker-compose.digitalocean.yml`.

3. On the DigitalOcean manager node, prepare storage and clone the repository:

```bash
sudo mkdir -p /mnt/postgres-data
sudo chown 999:999 /mnt/postgres-data
git clone <repo-url>
cd task
```

4. Create the production secret files expected by `docker-compose.digitalocean.yml`:

```bash
mkdir -p secrets
printf '%s' '<postgres-user>' > secrets/postgres_user.txt
printf '%s' '<postgres-password>' > secrets/postgres_password.txt
printf '%s' '<jwt-secret>' > secrets/jwt_secret.txt
printf '%s' '<grafana-admin-password>' > secrets/grafana_admin_password.txt
```

5. Initialize Swarm on the manager and join the workers:

```bash
docker swarm init --advertise-addr <manager-ip>
docker swarm join-token worker
```

Run the printed `docker swarm join ...` command on each worker node.

6. Deploy the stack from the manager:

```bash
docker stack deploy -c docker-compose.digitalocean.yml taskcollab
docker service ls
docker stack services taskcollab
docker node ls
```

If production redeployment requires secrets that are not included in the repository, send them to the TA separately as required by the handout.

## Deployment Information

Live application URL:

- [https://138.197.152.191](https://138.197.152.191)

Production deployment summary:

- One DigitalOcean manager node and two worker nodes
- Docker Swarm overlay network for service communication
- Replicated frontend service behind Swarm load balancing
- Backend API service with Prometheus metrics
- PostgreSQL pinned to the manager node with persistent storage at `/mnt/postgres-data`
- Prometheus, Grafana, cAdvisor, and node-exporter for monitoring
- Python autoscaler service connected to Prometheus and the Docker socket

## AI Assistance & Verification

AI tools were used as implementation support, not as a substitute for design or verification. We reviewed the suggestions, rejected parts that did not fit the project, and validated the final system ourselves.

1. Where AI meaningfully contributed
   - Calendar and due-date refactoring
   - Deployment and repository-compliance cleanup
   - Documentation refinement for reproducibility
2. One representative limitation in AI output
   - Some AI suggestions were too generic, such as assuming every helper script should stay in the repository or assuming a deployment path without confirming the exact DigitalOcean layout. We still had to trim the repository, confirm which files were actually needed, and verify the real deployment topology ourselves.
3. How correctness was verified
   - Backend and frontend production builds
   - Manual UI testing of login, project creation, task creation, task updates, and calendar rendering
   - `/health` and `/metrics` endpoint checks
   - Swarm, monitoring, and service inspection using container output and dashboards

See `ai-session.md` for 1-3 concrete interaction records.

## Individual Contributions

- Arooj Ilyas
  - Led much of the frontend implementation, including routing, dashboard, login and register pages, projects, tasks, calendar pages, layout components, and frontend container configuration.
- Adam Pietrewicz
  - Contributed to the backend foundation, including API routing, backend startup wiring, Docker development files, task and project deletion support, and local workflow setup.
- Patrick Chamaa
  - Led the DigitalOcean Swarm deployment path, monitoring stack, autoscaler integration, production secrets work, calendar and due-date refactor, and final compliance and documentation cleanup.

## Lessons Learned and Concluding Remarks

This project reinforced that cloud deployment is not only about getting containers to start. The more difficult work was making stateful services reliable, keeping configuration consistent across environments, and making sure documentation matched the real system. We also learned that advanced features such as monitoring, autoscaling, real-time updates, and secrets management add meaningful integration complexity, especially when persistence and security need to stay correct at the same time.

TaskCollab met our main goals: it is a stateful, cloud-native application with a clear user workflow, reproducible local setup, and a course-compliant Docker Swarm deployment on DigitalOcean. More importantly, the project gave us practical experience connecting application development with deployment, observability, persistence, and operational verification.

## Video Demo

Add the final 1-5 minute demo URL here before submission.
