# DigitalOcean PostgreSQL Volume Migration Guide

Use this guide if your running swarm deployment still stores PostgreSQL data in a local Docker volume such as `taskcollab_postgres-data` instead of the DigitalOcean Block Storage mount at `/mnt/postgres-data`.

This is the safest path when you want the live deployment to match the repository's final DigitalOcean storage configuration.

## Before You Start

- perform this on the swarm manager
- schedule a short maintenance window
- make sure `/mnt/postgres-data` is mounted and writable
- confirm the PostgreSQL image version matches the service you are migrating

## 1. Inspect the Current PostgreSQL Service Mount

On the manager:

```bash
docker service inspect taskcollab_postgres --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
```

If the output shows a local Docker volume instead of `/mnt/postgres-data`, continue with this guide.

## 2. Create a Logical Backup

Find the running PostgreSQL container:

```bash
POSTGRES_CONTAINER=$(docker ps --filter name=taskcollab_postgres -q | head -n 1)
```

Create a SQL backup on the manager:

```bash
docker exec -t "$POSTGRES_CONTAINER" sh -lc 'pg_dumpall -U "$(cat /run/secrets/postgres_user 2>/dev/null || printf "%s" "$POSTGRES_USER")"' > /root/taskcollab-backup.sql
```

Optional sanity check:

```bash
ls -lh /root/taskcollab-backup.sql
head -n 20 /root/taskcollab-backup.sql
```

## 3. Stop the Application Stack

To avoid writes during migration:

```bash
docker stack rm taskcollab
```

Wait until all old containers are gone:

```bash
docker ps
```

## 4. Prepare the DigitalOcean Volume Mount

Ensure the mount point exists and has PostgreSQL ownership:

```bash
mkdir -p /mnt/postgres-data
chown 999:999 /mnt/postgres-data
chmod 700 /mnt/postgres-data
```

## 5. Redeploy the Updated Stack

From your local machine:

```powershell
.\deploy-swarm.ps1 -Action deploy
```

Wait for the new PostgreSQL service to start on the manager.

## 6. Restore the SQL Backup

Find the new PostgreSQL container:

```bash
NEW_POSTGRES_CONTAINER=$(docker ps --filter name=taskcollab_postgres -q | head -n 1)
```

Restore:

```bash
cat /root/taskcollab-backup.sql | docker exec -i "$NEW_POSTGRES_CONTAINER" sh -lc 'psql -U "$(cat /run/secrets/postgres_user 2>/dev/null || printf "%s" "$POSTGRES_USER")" postgres'
```

## 7. Verify the New Mount and Data

Confirm the live mount:

```bash
docker service inspect taskcollab_postgres --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
```

Confirm data is present through the application or with SQL:

```bash
docker exec -it "$NEW_POSTGRES_CONTAINER" sh -lc 'psql -U "$(cat /run/secrets/postgres_user 2>/dev/null || printf "%s" "$POSTGRES_USER")" -d taskcollab -c "\dt"'
```

## Fast Reset Option

If the current live data is disposable demo data and you do not need to preserve it, the shorter path is:

1. remove the old stack
2. ensure `/mnt/postgres-data` is mounted
3. redeploy using `deploy-swarm.ps1`
4. recreate demo data in the app

## Caution

Do not delete the old local Docker volume until:

- the new PostgreSQL service is running on `/mnt/postgres-data`
- the application data has been restored or intentionally reset
- you have verified the app works end-to-end
