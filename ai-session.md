# AI Interaction Record

This file records meaningful AI interactions that influenced the project, as required by the course handout.

## Interaction 1: Compliance Audit and Deployment Hardening

- Date: March 20, 2026
- Goal: Compare the repository against the ECE1779 project handout and make the repository easier to grade and reproduce.
- Prompt summary: Review the project against the course requirements, identify gaps, and make the repository compliant where possible.
- AI contribution:
  - audited the repository against the handout categories: containerization, Compose, PostgreSQL persistence, approved deployment provider, orchestration, monitoring, and advanced features
  - fixed source-level issues that blocked frontend verification builds
  - updated the DigitalOcean swarm deployment path to use Docker secrets and a provider volume mount at `/mnt/postgres-data`
  - improved `README.md`, the requirements checklist, and the deployment documentation so the repository itself documents the compliant path clearly
  - added a migration guide for moving a previously deployed PostgreSQL service from a local Docker volume to the DigitalOcean volume mount
- Human decisions and verification:
  - the project owner provided the live manager and worker IP addresses for the DigitalOcean swarm cluster
  - the project owner confirmed the frontend was already reachable on the droplet, which helped separate live deployment state from repository reproducibility
- Outcome:
  - the repository now presents a clearer and more reproducible course-compliant DigitalOcean swarm path

## Interaction 2: Calendar Refactor and Day-Only Due Dates

- Date: March 20, 2026
- Goal: Change the calendar and due-date model so deadlines are day-based instead of time-based.
- Prompt summary: Update the calendar to show only days, store due dates as day-only values, and clearly show when two or more projects are due on the same date.
- AI contribution:
  - refactored the calendar page into a month-style day grid with no time slots
  - grouped due items by date and by project so multiple projects on the same date appear clearly
  - added shared frontend helpers for parsing, formatting, and overdue checks using day-only logic
  - updated the backend task controller to normalize due dates to `YYYY-MM-DD`
  - updated the task model to use `DATEONLY`
  - updated the task creation UI to label the field as day-only
- Human decisions and verification:
  - the project owner explicitly chose a day-based calendar experience instead of a date-time schedule view
  - the project owner requested that overlapping project deadlines be visible and easy to distinguish on the same date
- Outcome:
  - the application now treats due dates consistently as calendar days across the backend, forms, task list, and calendar page

## Add One More Interaction If Needed

If you used AI for another meaningful decision or implementation step, you can add one more interaction below using the same structure.
