# DigitalOcean Docker Swarm Deployment Guide

This guide documents the course-compliant production deployment path for this project: DigitalOcean droplets plus Docker Swarm plus PostgreSQL persistence on a DigitalOcean Block Storage volume.

## Target Topology

- 1 swarm manager
- 2 swarm workers
- PostgreSQL pinned to the manager
- replicated backend and frontend services
- Prometheus, Grafana, cAdvisor, node-exporter, autoscaler, and swarm visualizer

## Prerequisites

- three Ubuntu droplets on DigitalOcean
- Docker installed on all nodes
- a DigitalOcean Block Storage volume attached to the manager
- the volume mounted on the manager at `/mnt/postgres-data`
- a Docker Hub account or another registry that your swarm nodes can pull from
- local access to the SSH private key used for the droplets

## Required Repository Files

Before deploying, ensure these files exist locally:

- `prometheus.yml`
- `secrets/postgres_user.txt`
- `secrets/postgres_password.txt`
- `secrets/jwt_secret.txt`
- `secrets/grafana_admin_password.txt`

The deployment helper script uses these files directly:

- `deploy-swarm.ps1`

## Step 1: Prepare the Droplets

Install Docker on the manager and both workers.

You can use:

```powershell
.\deploy-swarm.ps1 -Action install-docker
```

Or do it manually on each node:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

## Step 2: Initialize the Swarm

Create the swarm on the manager and join the workers:

```powershell
.\deploy-swarm.ps1 -Action init-swarm
```

Verify on the manager:

```bash
docker node ls
```

## Step 3: Attach and Mount the DigitalOcean Volume

Attach a DigitalOcean Block Storage volume to the manager and mount it at:

```text
/mnt/postgres-data
```

Typical manager-side steps:

```bash
mkdir -p /mnt/postgres-data
ls -la /dev/disk/by-id/
mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_postgres-data /mnt/postgres-data
chown 999:999 /mnt/postgres-data
chmod 700 /mnt/postgres-data
```

To persist the mount across reboots, add it to `/etc/fstab`.

## Step 4: Configure the Deployment Script

Open `deploy-swarm.ps1` and confirm:

- manager IP
- worker IPs
- Docker Hub username
- SSH key path

The script already expects:

- `docker-compose.digitalocean.yml`
- `prometheus.yml`
- the secrets directory listed above

## Step 5: Build and Push Images

Build:

```powershell
.\deploy-swarm.ps1 -Action build
```

Push:

```powershell
.\deploy-swarm.ps1 -Action push
```

The script builds and pushes:

- backend image
- frontend image
- autoscaler image

## Step 6: Deploy the Swarm Stack

Deploy:

```powershell
.\deploy-swarm.ps1 -Action deploy
```

Or run the full workflow:

```powershell
.\deploy-swarm.ps1 -Action full-deploy
```

The deployment helper copies:

- `docker-compose.digitalocean.yml`
- `prometheus.yml`
- the required secret files

to the manager and runs:

```bash
docker stack deploy -c /root/docker-compose.yml taskcollab
```

## Step 7: Verify the Deployment

On the manager:

```bash
docker service ls
docker service ps taskcollab_backend
docker service ps taskcollab_frontend
docker service ps taskcollab_postgres
docker service inspect taskcollab_postgres --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
```

The PostgreSQL service should show a bind mount from:

```text
/mnt/postgres-data
```

Expected replica targets in the repository:

- backend: 3
- frontend: 2
- postgres: 1

Note that the autoscaler may later adjust frontend and backend replica counts within configured limits.

## Step 8: Validate Persistence

Create or update some project and task data, then test that the data survives:

- stack updates
- backend/frontend restarts
- a PostgreSQL service restart

Useful check:

```bash
docker service update --force taskcollab_postgres
```

If data remains after the PostgreSQL service restarts, the provider-backed storage path is working.

## Existing Live Deployment Using a Local Docker Volume

If you deployed an older version of the stack before the repository was updated, the live PostgreSQL service may still be using a local Docker volume such as `taskcollab_postgres-data`.

That is not the intended final DigitalOcean storage path for this repository.

Use this guide before redeploying:

- `DIGITALOCEAN_VOLUME_MIGRATION.md`

## Monitoring Endpoints

Default exposed ports in the DigitalOcean swarm stack:

- frontend HTTP: `80`
- frontend HTTPS: `443`
- visualizer: `8080`
- cAdvisor: `8081`
- Grafana: `3000`
- Prometheus: `9090`
- node-exporter: `9100`

## Related Files

- `README.md`
- `docker-compose.digitalocean.yml`
- `deploy-swarm.ps1`
- `prometheus.yml`
- `DIGITALOCEAN_VOLUME_MIGRATION.md`
