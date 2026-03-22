# Project Requirements Checklist

This checklist maps the repository to the ECE1779 course project handout as of March 20, 2026.

Handout:

- https://www.eecg.utoronto.ca/~cying/courses/ece1779-cloud/project/handout/

## Final Deliverable Files

Required final-deliverable artifacts in the repository:

- `README.md`: present
- `ai-session.md`: present
- `## Video Demo` section in `README.md`: present, but the real URL still needs to be added before submission

## Core Technical Requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
| Docker containerization | Complete in repo | `backend/Dockerfile`, `frontend/Dockerfile`, `database/Dockerfile` |
| Docker Compose multi-container setup | Complete in repo | `docker-compose.yml`, `docker-compose.dev.yml` |
| PostgreSQL persistence | Complete in repo | `backend/src/database/connection.ts`, `backend/src/models/Task.ts` |
| Persistent storage for DigitalOcean deployment | Complete in repo | `docker-compose.digitalocean.yml` mounts `/mnt/postgres-data` |
| Deployment to approved provider | Complete in repo | DigitalOcean swarm deployment path documented in `README.md` and `DIGITALOCEAN_SWARM_DEPLOYMENT.md` |
| Swarm or Kubernetes orchestration | Complete in repo | `docker-compose.swarm.yml`, `docker-compose.digitalocean.yml` |
| Service replication and load balancing | Complete in repo | frontend and backend replicas in swarm compose files |
| Monitoring and observability | Complete in repo | Prometheus, Grafana, cAdvisor, node-exporter, backend `/metrics` |

## Advanced Features

At least two advanced features are required. The repository includes:

- real-time functionality with WebSockets
  - `backend/src/websocket/socketHandler.ts`
- autoscaling and high availability
  - `autoscaler/autoscaler.py`
- security enhancements
  - `backend/src/middleware/auth.ts`
  - `frontend/nginx.conf`
  - Docker secrets in `docker-compose.digitalocean.yml`
- monitoring dashboards and metrics
  - `backend/src/index.ts`
  - `docker-compose.digitalocean.yml`

## Day-Only Due Date Compliance

The application now treats due dates as calendar days rather than date-time values.

- backend validation normalizes due dates to `YYYY-MM-DD`
  - `backend/src/controllers/task.controller.ts`
- task model uses `DATEONLY`
  - `backend/src/models/Task.ts`
- frontend formatting and overdue logic are day-based
  - `frontend/src/lib/dates.ts`
  - `frontend/src/pages/Tasks.tsx`
- the calendar is a day-grid view that groups multiple projects on the same date
  - `frontend/src/pages/Calendar.tsx`

## Verification Completed Locally

Successful checks run against the repository:

- `frontend`: `npm run build`
- `backend`: `npm run build`
- `autoscaler`: `python -m py_compile autoscaler/autoscaler.py`

## Live Deployment Note

The repository is configured for provider-backed PostgreSQL persistence on DigitalOcean. A running swarm deployment is only fully compliant if the live PostgreSQL service is actually using `/mnt/postgres-data`.

If the current live service is still mounted to a local Docker volume such as `taskcollab_postgres-data`, follow:

- `DIGITALOCEAN_VOLUME_MIGRATION.md`

## Remaining Manual Steps Before Submission

1. add the final video URL to `README.md`
2. confirm the live DigitalOcean PostgreSQL service is mounted from `/mnt/postgres-data`
3. redeploy the latest images so the live stack matches this repository state
4. review `ai-session.md` and keep it to the final 1 to 3 meaningful interactions you want to submit
