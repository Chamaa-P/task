# AI Interaction Record

This file records meaningful AI interactions that influenced the project, as required by the course handout.

## Interaction 1: Compliance Audit and Deployment Hardening

### Prompt:

- Review the project against the course requirements, identify gaps, and make the repository compliant where possible.

### AI Response:

- Audited the repository against the handout categories: containerization, Compose, PostgreSQL persistence, approved deployment provider, orchestration, monitoring, and advanced features
- Fixed source-level issues that blocked frontend verification builds
- Updated the DigitalOcean swarm deployment path to use Docker secrets and a provider volume mount at `/mnt/postgres-data`
- Improved `README.md`, the requirements checklist, and the deployment documentation so the repository itself documents the compliant path clearly
- Added a migration guide for moving a previously deployed PostgreSQL service from a local Docker volume to the DigitalOcean volume mount

### What My Team Did With It:

- The project owner provided the live manager and worker IP addresses for the DigitalOcean swarm cluster
- The project owner confirmed the frontend was already reachable on the droplet, which helped separate live deployment state from repository reproducibility
- The repository now presents a clearer and more reproducible course-compliant DigitalOcean swarm path

## Interaction 2: Calendar Refactor and Day-Only Due Dates

### Prompt:

- Update the calendar to show only days, store due dates as day-only values, and clearly show when two or more projects are due on the same date.

### AI Response:

- Refactored the calendar page into a month-style day grid with no time slots
- Grouped due items by date and by project so multiple projects on the same date appear clearly
- Added shared frontend helpers for parsing, formatting, and overdue checks using day-only logic
- Updated the backend task controller to normalize due dates to `YYYY-MM-DD`
- Updated the task model to use `DATEONLY`
- Updated the task creation UI to label the field as day-only

### What My Team Did With It:

- The project owner explicitly chose a day-based calendar experience instead of a date-time schedule view
- The project owner requested that overlapping project deadlines be visible and easy to distinguish on the same date
- Outcome:
  - The application now treats due dates consistently as calendar days across the backend, forms, task list, and calendar page
