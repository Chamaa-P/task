# Fly.io Deployment Guide with Persistent Volumes

This guide demonstrates how to deploy the application to Fly.io with persistent storage using Fly Volumes.

## Prerequisites

1. Install Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Login: `fly auth login`

## Step 1: Deploy PostgreSQL Database with Persistent Volume

```powershell
# Navigate to database directory
cd database

# Create the Fly app for database
fly apps create task-collab-db

# Create a persistent volume (adjust size as needed)
fly volumes create postgres_data --region iad --size 1

# Deploy the database
fly deploy

# Set database password as secret
fly secrets set POSTGRES_PASSWORD=your-secure-password-here
```

**Important**: The volume `postgres_data` is mounted to `/var/lib/postgresql/data` ensuring data persists across restarts and redeployments.

## Step 2: Deploy Backend API

```powershell
# Navigate to backend directory
cd ../backend

# Create the Fly app for backend
fly apps create task-collab-backend

# Set secrets (replace with your actual values)
fly secrets set DATABASE_URL="postgresql://taskuser:your-secure-password-here@task-collab-db.internal:5432/taskcollab"
fly secrets set JWT_SECRET="your-jwt-secret-here"

# Deploy backend
fly deploy
```

**Note**: The database is accessible internally via `task-collab-db.internal` within the Fly network.

## Step 3: Deploy Frontend

```powershell
# Navigate to frontend directory
cd ../frontend

# Create the Fly app for frontend
fly apps create task-collab-frontend

# Deploy frontend
fly deploy
```

## Step 4: Verify Deployment

```powershell
# Check database status
fly status -a task-collab-db

# Check volume is attached
fly volumes list -a task-collab-db

# Check backend status
fly status -a task-collab-backend

# View backend logs
fly logs -a task-collab-backend

# Open frontend in browser
fly open -a task-collab-frontend
```

## Volume Management

### List volumes
```powershell
fly volumes list -a task-collab-db
```

### Create backup (snapshot)
```powershell
fly volumes snapshots create postgres_data -a task-collab-db
```

### View snapshots
```powershell
fly volumes snapshots list postgres_data -a task-collab-db
```

## Testing Persistence

To verify data persists across restarts:

1. Create some data (users, projects, tasks)
2. Restart the database: `fly apps restart task-collab-db`
3. Wait for restart: `fly status -a task-collab-db`
4. Verify data is still present

## Scaling

```powershell
# Scale backend (multiple instances share the same database)
fly scale count 2 -a task-collab-backend

# Scale frontend
fly scale count 2 -a task-collab-frontend
```

## Cleanup

```powershell
# Destroy apps (WARNING: This will delete data!)
fly apps destroy task-collab-frontend
fly apps destroy task-collab-backend
fly apps destroy task-collab-db
```

## Cost Considerations

- **Volume**: ~$0.15/GB/month for persistent storage
- **Database VM**: 512MB memory, shared CPU
- **Backend VM**: 512MB memory, shared CPU  
- **Frontend VM**: 256MB memory, shared CPU

Free tier includes 3GB of persistent storage across all volumes.

## Key Points for Project Requirements

✅ **Persistent Storage**: Using Fly Volumes (`postgres_data`) mounted to `/var/lib/postgresql/data`

✅ **Demonstrates Volume Management**: Data survives container restarts and redeployments

✅ **Not Using Managed Database**: Running PostgreSQL as a containerized service with manual volume management

This implementation demonstrates understanding of stateful storage in containerized environments.
