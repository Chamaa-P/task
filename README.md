# Task Collaboration Platform

Task Collaboration Platform is a cloud-native team workspace for projects, tasks, due dates, assignees, and live updates. The application uses a React frontend, a Node.js/Express backend, and PostgreSQL for persistent state.

This repository contains:

- local Docker Compose workflows for development and source-based verification
- a DigitalOcean Docker Swarm deployment path for the course-compliant production environment
- monitoring, autoscaling, security, and real-time collaboration features

## Project Scope

Key product features:

- user authentication
- project creation and organization
- task creation, assignment, and status tracking
- day-only due dates with a calendar that groups multiple projects on the same date
- real-time updates through WebSockets
- PostgreSQL-backed persistence

## Course Requirement Mapping

This section maps the repository to the ECE1779 project handout requirements.

### Containerization and Local Development

- Dockerfiles:
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
  - `database/Dockerfile`
- Docker Compose:
  - `docker-compose.yml`
  - `docker-compose.dev.yml`
  - `docker-compose.swarm.yml`
  - `docker-compose.digitalocean.yml`

### State Management

- PostgreSQL is the relational database.
- Local persistence uses Docker volumes.
- The course-compliant DigitalOcean deployment uses a provider volume mounted at `/mnt/postgres-data`.
- Due dates are now stored and handled as calendar days rather than date-time values.

### Deployment Provider

- Official course-compliant path: DigitalOcean droplets plus Docker Swarm
- Optional alternate deployment artifacts: Fly.io configuration files are included, but Fly-only deployment does not satisfy the orchestration requirement by itself

### Orchestration

- Docker Swarm is the orchestration approach used for the course requirement.
- The production swarm topology is:
  - 1 manager node
  - 2 worker nodes
  - replicated backend and frontend services
  - a PostgreSQL service constrained to the manager node

### Monitoring and Observability

- Prometheus
- Grafana
- cAdvisor
- node-exporter
- backend Prometheus metrics endpoint

### Advanced Features Implemented

At least two advanced features are required. This project includes more than two:

- real-time updates with WebSockets
- autoscaling for frontend and backend swarm services
- security enhancements: JWT auth, Docker secrets, HTTPS, security headers
- monitoring dashboards and service metrics

## Architecture

Core services:

- `frontend`: React + Vite single-page application served by Nginx
- `backend`: Express API with Socket.IO and Prometheus metrics
- `postgres`: PostgreSQL 15 for persistent relational state
- `prometheus`: metrics collection
- `grafana`: dashboards
- `cadvisor`: container metrics
- `node-exporter`: host metrics
- `autoscaler`: Prometheus-driven replica adjustment for frontend and backend
- `visualizer`: Swarm visualization on the manager node

Important source files:

- backend entry point: `backend/src/index.ts`
- task model: `backend/src/models/Task.ts`
- task controller: `backend/src/controllers/task.controller.ts`
- day-only due date helpers: `frontend/src/lib/dates.ts`
- calendar page: `frontend/src/pages/Calendar.tsx`
- DigitalOcean swarm stack: `docker-compose.digitalocean.yml`
- deployment helper: `deploy-swarm.ps1`

## Calendar and Due Date Behavior

The calendar page is intentionally day-based.

- the calendar shows only days, not time slots
- due dates are treated as day-only values
- each due date is marked on the calendar
- if multiple tasks from the same project share a date, they are grouped together
- if multiple projects share a date, each project is shown clearly inside that day cell

Related files:

- `frontend/src/pages/Calendar.tsx`
- `frontend/src/lib/dates.ts`
- `frontend/src/pages/Tasks.tsx`
- `frontend/src/pages/Projects.tsx`
- `backend/src/models/Task.ts`
- `backend/src/controllers/task.controller.ts`

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop or Docker Engine

### Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### Run in Developer Mode

Backend:

```bash
cd backend
npm run build
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### Run the Local Container Stack

From the repository root:

```bash
docker-compose down
docker-compose up --build
```

Useful local URLs:

- frontend HTTP: `http://localhost:3000`
- frontend HTTPS: `https://localhost:3443`
- backend health: `http://localhost:5000/health`

## DigitalOcean Swarm Deployment

This is the course-compliant deployment path.

### Expected Production Topology

- manager droplet running swarm manager and PostgreSQL
- two worker droplets running replicated application services
- DigitalOcean Block Storage mounted on the manager at `/mnt/postgres-data`

### Required Local Files Before Deployment

The deployment helper expects:

- `prometheus.yml`
- `secrets/postgres_user.txt`
- `secrets/postgres_password.txt`
- `secrets/jwt_secret.txt`
- `secrets/grafana_admin_password.txt`

### Deploy

Update the IPs, Docker Hub username, and SSH key path in `deploy-swarm.ps1`, then run:

```powershell
.\deploy-swarm.ps1 -Action full-deploy
```

Or run the steps separately:

```powershell
.\deploy-swarm.ps1 -Action build
.\deploy-swarm.ps1 -Action push
.\deploy-swarm.ps1 -Action deploy
.\deploy-swarm.ps1 -Action status
```

### Verify the Swarm Stack

On the manager node:

```bash
docker node ls
docker service ls
docker service ps taskcollab_backend
docker service ps taskcollab_frontend
docker service inspect taskcollab_postgres --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
```

The PostgreSQL service should mount `/mnt/postgres-data` into `/var/lib/postgresql/data`.

### Important Persistence Note

If you deployed an older version of the stack before this repository was updated, your running PostgreSQL service may still be using a local Docker volume instead of the DigitalOcean volume mount. In that case, migrate or reset the live database before claiming full deployment compliance.

Migration guide:

- `DIGITALOCEAN_VOLUME_MIGRATION.md`

Detailed deployment guide:

- `DIGITALOCEAN_SWARM_DEPLOYMENT.md`

## Monitoring and Operations

Default swarm service ports:

- frontend: `80`, `443`
- visualizer: `8080`
- cAdvisor: `8081`
- Prometheus: `9090`
- node-exporter: `9100`
- Grafana: `3000`

Backend metrics endpoint:

- `/metrics`

## Additional Documentation

- `DIGITALOCEAN_SWARM_DEPLOYMENT.md`
- `DIGITALOCEAN_VOLUME_MIGRATION.md`
- `SWARM_QUICK_REFERENCE.md`
- `MONITORING.md`
- `SECURITY.md`
- `REQUIREMENTS_CHECKLIST.md`
- `ai-session.md`

## Submission Checklist

Before the final submission:

1. confirm the DigitalOcean swarm is using `/mnt/postgres-data`
2. ensure the latest frontend, backend, and autoscaler images are pushed and deployed
3. verify the README reflects the final deployment state
4. keep `ai-session.md` to 1 to 3 meaningful interactions
5. replace the placeholder video link below with the real demo URL

## Video Demo

Add your final video URL here before submission.
