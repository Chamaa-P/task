# DigitalOcean Docker Swarm Deployment Guide

This guide demonstrates deploying the application to DigitalOcean using Docker Swarm for orchestration with persistent storage.

## Prerequisites

1. DigitalOcean account
2. SSH key added to DigitalOcean
3. Docker Hub account (for image registry) or use DigitalOcean Container Registry
4. Local Docker installed

## Architecture

- **Swarm Cluster**: 1 Manager node + 2 Worker nodes
- **Services**: PostgreSQL (1 replica), Backend (3 replicas), Frontend (2 replicas), Visualizer (1 replica)
- **Persistent Storage**: DigitalOcean Volume attached to manager node for PostgreSQL data
- **Load Balancing**: Automatic via Swarm's ingress network

---

## Step 1: Create DigitalOcean Droplets

### Using DigitalOcean Web Console:

1. Go to https://cloud.digitalocean.com/droplets
2. Click "Create" → "Droplets"

**Create Manager Node:**
- **Image**: Ubuntu 22.04 LTS
- **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU, 25GB SSD)
- **Hostname**: `swarm-manager`
- **Select your SSH key**
- Click "Create Droplet"

**Create Worker Nodes:** (Repeat 2 times)
- **Image**: Ubuntu 22.04 LTS
- **Plan**: Basic ($6/month)
- **Hostname**: `swarm-worker-1` and `swarm-worker-2`
- **Select your SSH key**
- Click "Create Droplet"

### Using DigitalOcean CLI (doctl):

```bash
# Install doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Create manager
doctl compute droplet create swarm-manager \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header)

# Create workers
doctl compute droplet create swarm-worker-1 swarm-worker-2 \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header)

# Get IP addresses
doctl compute droplet list
```

**Note the IP addresses** - you'll need them.

---

## Step 2: Install Docker on All Nodes

Run these commands on **each droplet** (manager and both workers):

```bash
# SSH into each droplet
ssh root@<DROPLET_IP>

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Enable Docker service
systemctl enable docker
systemctl start docker

# Verify installation
docker --version

# Exit
exit
```

**Tip**: Use a script to automate this for all nodes:

```powershell
# Save IPs to variables
$MANAGER_IP = "165.227.xxx.xxx"
$WORKER1_IP = "165.227.xxx.xxx"
$WORKER2_IP = "165.227.xxx.xxx"

# Install Docker on all nodes
foreach ($IP in @($MANAGER_IP, $WORKER1_IP, $WORKER2_IP)) {
    ssh root@$IP "curl -fsSL https://get.docker.com | sh && systemctl enable docker"
}
```

---

## Step 3: Initialize Docker Swarm

### On the Manager Node:

```bash
ssh root@<MANAGER_IP>

# Initialize swarm (use private IP if available, otherwise public IP)
docker swarm init --advertise-addr <MANAGER_PRIVATE_IP>

# This will output a command like:
# docker swarm join --token SWMTKN-1-xxx... <MANAGER_IP>:2377
```

**Copy the join token command** - you'll need it for workers.

### On Each Worker Node:

```bash
ssh root@<WORKER1_IP>

# Paste the join command from manager
docker swarm join --token SWMTKN-1-xxx... <MANAGER_IP>:2377

# Exit and repeat for worker-2
```

### Verify Swarm Cluster:

Back on the manager:

```bash
ssh root@<MANAGER_IP>

docker node ls
# Should show 3 nodes: 1 Leader (manager), 2 Reachable (workers)
```

---

## Step 4: Create DigitalOcean Volume for PostgreSQL

### Using Web Console:

1. Go to https://cloud.digitalocean.com/volumes
2. Click "Create Volume"
3. **Volume Name**: `postgres-data`
4. **Size**: 10 GB
5. **Region**: Same as your droplets
6. **Attach to Droplet**: `swarm-manager`
7. Click "Create Volume"

### Using doctl:

```bash
# Create volume
doctl compute volume create postgres-data \
  --region nyc1 \
  --size 10GiB \
  --desc "PostgreSQL data for Task Collab"

# Attach to manager
doctl compute volume-action attach <VOLUME_ID> <MANAGER_DROPLET_ID>
```

### Mount the Volume on Manager Node:

```bash
ssh root@<MANAGER_IP>

# Create mount point
mkdir -p /mnt/postgres-data

# Find the volume device (usually /dev/disk/by-id/scsi-0DO_Volume_postgres-data)
ls -la /dev/disk/by-id/

# Format volume (ONLY do this once!)
mkfs.ext4 /dev/disk/by-id/scsi-0DO_Volume_postgres-data

# Mount volume
mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_postgres-data /mnt/postgres-data

# Auto-mount on reboot
echo '/dev/disk/by-id/scsi-0DO_Volume_postgres-data /mnt/postgres-data ext4 defaults,nofail,discard 0 2' | tee -a /etc/fstab

# Verify mount
df -h | grep postgres-data
```

---

## Step 5: Build and Push Docker Images

You need to push your images to a registry (Docker Hub or DigitalOcean Container Registry).

### Option A: Docker Hub (Free)

```powershell
# Login to Docker Hub
docker login

# Build and tag images
cd backend
docker build -t yourusername/task-collab-backend:latest .

cd ../frontend
docker build --build-arg VITE_API_URL=http://<MANAGER_PUBLIC_IP>:5000 -t yourusername/task-collab-frontend:latest .

# Push images
docker push yourusername/task-collab-backend:latest
docker push yourusername/task-collab-frontend:latest
```

### Option B: DigitalOcean Container Registry

```bash
# Create registry in DigitalOcean console
# Then authenticate
doctl registry login

# Build and tag
docker build -t registry.digitalocean.com/your-registry/task-collab-backend:latest ./backend
docker build --build-arg VITE_API_URL=http://<MANAGER_PUBLIC_IP>:5000 -t registry.digitalocean.com/your-registry/task-collab-frontend:latest ./frontend

# Push
docker push registry.digitalocean.com/your-registry/task-collab-backend:latest
docker push registry.digitalocean.com/your-registry/task-collab-frontend:latest
```

---

## Step 6: Update Swarm Configuration for DigitalOcean

Create a new file `docker-compose.digitalocean.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: taskcollab
    volumes:
      - type: bind
        source: /mnt/postgres-data
        target: /var/lib/postgresql/data
    networks:
      - task-network
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == manager

  backend:
    image: yourusername/task-collab-backend:latest  # Update with your image
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://taskuser:${POSTGRES_PASSWORD}@postgres:5432/taskcollab
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    networks:
      - task-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  frontend:
    image: yourusername/task-collab-frontend:latest  # Update with your image
    ports:
      - "80:80"
    networks:
      - task-network
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.25'
          memory: 256M

  visualizer:
    image: dockersamples/visualizer:latest
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - task-network
    deploy:
      placement:
        constraints:
          - node.role == manager

networks:
  task-network:
    driver: overlay
    attachable: true
```

---

## Step 7: Deploy Stack to Swarm

### Copy compose file to manager:

```powershell
# From your local machine
scp docker-compose.digitalocean.yml root@<MANAGER_IP>:/root/
```

### Deploy on manager:

```bash
ssh root@<MANAGER_IP>

# Set environment variables
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"

# Deploy stack
docker stack deploy -c docker-compose.digitalocean.yml taskcollab

# Check services
docker service ls

# Check service logs
docker service logs taskcollab_backend
docker service logs taskcollab_frontend
docker service logs taskcollab_postgres

# Check specific service details
docker service ps taskcollab_backend
```

---

## Step 8: Verify Deployment

### Check Service Status:

```bash
# List all services
docker service ls

# See which nodes are running which services
docker service ps taskcollab_backend
docker service ps taskcollab_frontend

# Check service logs
docker service logs -f taskcollab_backend
```

### Access the Application:

- **Frontend**: http://<MANAGER_PUBLIC_IP>
- **Visualizer**: http://<MANAGER_PUBLIC_IP>:8080

The visualizer will show your services distributed across the swarm cluster.

### Test Load Balancing:

```bash
# Scale backend service
docker service scale taskcollab_backend=5

# Watch replicas distribute
docker service ps taskcollab_backend

# Scale back down
docker service scale taskcollab_backend=3
```

---

## Step 9: Test Persistence

### Create Test Data:

1. Access application at http://<MANAGER_IP>
2. Register a user
3. Create projects and tasks

### Test Container Restart:

```bash
# Remove a backend container (will auto-restart)
docker service update --force taskcollab_backend

# Remove postgres container (will restart)
docker service update --force taskcollab_postgres

# Wait for services to restart
docker service ls

# Verify data is still present in the application
```

### Test Complete Redeployment:

```bash
# Remove entire stack
docker stack rm taskcollab

# Wait for cleanup (30 seconds)
sleep 30

# Redeploy
docker stack deploy -c docker-compose.digitalocean.yml taskcollab

# Data should still be in /mnt/postgres-data and persist
```

---

## Step 10: Configure Firewall (Optional but Recommended)

```bash
# On manager
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 2377/tcp  # Swarm management
ufw allow 7946/tcp  # Swarm communication
ufw allow 7946/udp  # Swarm communication
ufw allow 4789/udp  # Overlay network
ufw allow 8080/tcp  # Visualizer
ufw enable

# On workers
ufw allow 22/tcp    # SSH
ufw allow 2377/tcp  # Swarm management
ufw allow 7946/tcp  # Swarm communication
ufw allow 7946/udp  # Swarm communication
ufw allow 4789/udp  # Overlay network
ufw enable
```

---

## Useful Commands

### Service Management:

```bash
# List services
docker service ls

# Inspect service
docker service inspect taskcollab_backend

# View service logs
docker service logs -f taskcollab_backend

# Scale service
docker service scale taskcollab_backend=5

# Update service (rolling update)
docker service update --image yourusername/task-collab-backend:v2 taskcollab_backend

# Remove service
docker service rm taskcollab_backend
```

### Stack Management:

```bash
# Deploy/Update stack
docker stack deploy -c docker-compose.digitalocean.yml taskcollab

# List stacks
docker stack ls

# List stack services
docker stack services taskcollab

# List stack tasks
docker stack ps taskcollab

# Remove stack
docker stack rm taskcollab
```

### Node Management:

```bash
# List nodes
docker node ls

# Inspect node
docker node inspect swarm-manager

# Promote worker to manager
docker node promote swarm-worker-1

# Demote manager to worker
docker node demote swarm-worker-1

# Drain node (no new tasks)
docker node update --availability drain swarm-worker-1

# Activate node
docker node update --availability active swarm-worker-1

# Remove node
docker node rm swarm-worker-1
```

### Monitoring:

```bash
# Check cluster-wide stats
docker node ls
docker service ls
docker stack ps taskcollab

# Check resource usage on node
docker stats

# View overlay network
docker network ls
docker network inspect taskcollab_task-network
```

---

## Demonstrating Orchestration Features

### 1. Service Replication:

```bash
# Show current replicas
docker service ls

# Scale up
docker service scale taskcollab_backend=5
docker service scale taskcollab_frontend=3

# Watch distribution across nodes
watch -n 1 'docker service ps taskcollab_backend'
```

### 2. Load Balancing:

The swarm automatically load balances requests across all replicas. Test by:

```bash
# Make requests to the frontend
curl http://<MANAGER_IP>/

# Each request is distributed across frontend replicas
# Backend APIs are also load balanced across 3 replicas
```

### 3. Rolling Updates:

```bash
# Update backend image
docker service update \
  --image yourusername/task-collab-backend:v2 \
  --update-parallelism 1 \
  --update-delay 10s \
  taskcollab_backend

# Watch rolling update
docker service ps taskcollab_backend
```

### 4. Failure Recovery:

```bash
# Get a container ID
docker ps

# Kill a container
docker kill <CONTAINER_ID>

# Watch swarm automatically restart it
docker service ps taskcollab_backend
```

### 5. High Availability:

With multiple replicas, even if one node fails, the service continues:

```bash
# Drain a worker node
docker node update --availability drain swarm-worker-1

# Watch tasks migrate to other nodes
docker service ps taskcollab_backend
```

---

## Cost Estimate

Monthly costs on DigitalOcean:

- **3 Droplets** (1GB RAM each): $6 × 3 = $18/month
- **10GB Volume**: $1/month
- **Total**: ~$19/month

You can destroy everything after demo to avoid charges:

```bash
# From manager
docker stack rm taskcollab
docker swarm leave --force

# From workers
docker swarm leave

# Then destroy droplets and volume via DigitalOcean console
```

---

## Cleanup

```bash
# Remove stack
docker stack rm taskcollab

# Leave swarm on all nodes
docker swarm leave --force  # On manager
docker swarm leave          # On workers

# Destroy droplets via DigitalOcean console or:
doctl compute droplet delete swarm-manager swarm-worker-1 swarm-worker-2

# Delete volume
doctl compute volume delete postgres-data
```

---

## Troubleshooting

### Services not starting:

```bash
docker service ls  # Check REPLICAS column
docker service ps taskcollab_backend --no-trunc  # See full error messages
docker service logs taskcollab_backend
```

### Network issues:

```bash
docker network ls
docker network inspect taskcollab_task-network
```

### Volume issues:

```bash
# Check if volume is mounted
df -h | grep postgres-data

# Check permissions
ls -la /mnt/postgres-data
```

### Worker can't join swarm:

```bash
# On manager, get new join token
docker swarm join-token worker

# Check firewall rules (ports 2377, 7946, 4789)
```

---

## Validation Checklist

✅ **Orchestration**: Docker Swarm with 3-node cluster

✅ **Service Replication**: Backend (3), Frontend (2), Postgres (1)

✅ **Load Balancing**: Automatic via swarm ingress network

✅ **Persistent Storage**: DigitalOcean Volume mounted to `/mnt/postgres-data`

✅ **High Availability**: Multi-node cluster with automatic failover

✅ **Rolling Updates**: Configured with parallelism and delays

✅ **Resource Limits**: CPU and memory constraints on services

✅ **Monitoring**: Visualizer showing cluster state

This deployment fully satisfies the orchestration requirement by implementing Docker Swarm with service replication, load balancing, and persistent storage.
