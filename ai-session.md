# AI Interaction Record

This file documents three representative AI interactions that meaningfully influenced the project and the final submission. Each interaction shows how AI suggestions were reviewed, corrected when necessary, and verified against the actual codebase and deployment.

## Session 1: Calendar Refactor for Day-Only Due Dates

### Prompt

> Update the calendar flow so due dates are treated as calendar days instead of date-time values. The UI should make overlapping deadlines easy to read, and the backend should store due dates consistently.

### AI Response

- Suggested changing task due dates to day-only values instead of timestamps.
- Recommended a month-style calendar layout that groups tasks by date.
- Proposed normalizing due dates in the backend and sharing date helpers in the frontend.
- Identified the task model, task controller, task creation UI, and calendar page as the main files to update.

### What Your Team Did With It

- Useful: The suggestions correctly pointed to the main backend and frontend areas that needed to change for a day-only workflow.
- Incorrect, misleading, or not applicable: Some of the generated UI ideas were more complex than the project needed, so the team kept the simpler month-grid approach that fit the rest of the app.
- Verification and adaptation: The team updated the model and controller logic, tested task creation and status updates through the UI, and confirmed that overlapping due dates rendered correctly in the calendar without time-of-day inconsistencies.

## Session 2: Swarm Deployment Hardening and Secrets Handling

### Prompt

> Review the production deployment path for Docker Swarm on DigitalOcean. We need persistent PostgreSQL storage, Swarm-friendly configuration, and better handling of secrets for the backend and Grafana.

### AI Response

- Recommended moving production credentials out of hard-coded environment variables and into Docker secrets.
- Suggested pinning PostgreSQL to the manager node and mounting persistent storage at `/mnt/postgres-data`.
- Reviewed the monitoring stack and autoscaler dependencies in the Swarm compose file.
- Proposed documentation updates so the repository explained the deployment path more clearly.

### What Your Team Did With It

- Useful: The secrets-oriented review helped improve the production configuration and reduced the amount of sensitive information that would otherwise appear directly in deployment files.
- Incorrect, misleading, or not applicable: Some suggestions assumed the live cluster state matched the repository immediately, but the team still had to confirm the real manager and worker layout and the mounted storage path separately.
- Verification and adaptation: The team compared the compose configuration against the actual DigitalOcean setup, verified the intended storage mount path, and checked service behavior through Swarm inspection, logs, and monitoring.

## Session 3: Final Repository Cleanup and Report Compliance

### Prompt

> Compare the repository against the ECE1779 final project handout. Keep the files needed to build and run the project, remove extra submission clutter such as helper docs and PowerShell deployment scripts, move the run instructions into `README.md`, and make sure `ai-session.md` matches the required format.

### AI Response

- Identified `README.md` and `ai-session.md` as required submission files and treated the rest of the top-level markdown files as optional.
- Recommended removing script-centric deployment references and replacing them with direct commands in the final report.
- Suggested keeping the actual source code, Docker files, Compose files, monitoring assets, and CI workflow.
- Pointed out formatting issues in the existing `ai-session.md`, especially the need for clearer prompts, clearer limits of the AI output, and the exact `### What Your Team Did With It` heading.

### What Your Team Did With It

- Useful: The compliance pass helped separate genuinely required source/configuration files from extra notes, logs, and one-off deployment helpers that were no longer needed in the final submission.
- Incorrect, misleading, or not applicable: The first cleanup pass was too aggressive about removing every helper artifact, so the team kept the CI workflow and verification scripts because they still supported the project and demonstrated advanced-feature work.
- Verification and adaptation: The team manually reviewed which files were referenced by the codebase, rewrote `README.md` with direct local and deployment commands, checked that the remaining files still covered build and run needs, and revised this record to match the handout structure exactly.
