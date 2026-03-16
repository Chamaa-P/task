# Next Steps: Deployment Guide

You now have everything configured for Docker Swarm on DigitalOcean! Here's what to do next.

## Prerequisites Checklist

Before deploying, make sure you have:

- [ ] DigitalOcean account created
- [ ] SSH key generated and added to DigitalOcean
- [ ] Docker Hub account (or DigitalOcean Container Registry)
- [ ] Docker Desktop running locally
- [ ] Credit card added to DigitalOcean (for droplets)

## Option 1: Quick Automated Deployment

### Step 1: Update Configuration

Edit `deploy-swarm.ps1` and update these values:
```powershell
$MANAGER_IP = "YOUR_MANAGER_IP"          # Will get after creating droplets
$WORKER1_IP = "YOUR_WORKER1_IP"          # Will get after creating droplets
$WORKER2_IP = "YOUR_WORKER2_IP"          # Will get after creating droplets
$DOCKER_USERNAME = "YOUR_DOCKER_USERNAME" # Your Docker Hub username
$POSTGRES_PASSWORD = "secure-password-123"
$JWT_SECRET = "super-secret-jwt-key-456"
```

### Step 2: Create Droplets

Go to https://cloud.digitalocean.com/droplets and create 3 droplets:
- **Name**: swarm-manager, swarm-worker-1, swarm-worker-2
- **Image**: Ubuntu 22.04 LTS
- **Size**: Basic ($6/month - 1GB RAM)
- **Region**: New York 1 (or your preferred region)
- **Add your SSH key**

**Copy the IP addresses** and update `deploy-swarm.ps1`!

### Step 3: Run Automated Deployment

```powershell
# Install Docker on all nodes
.\deploy-swarm.ps1 -Action install-docker

# Initialize Swarm cluster
.\deploy-swarm.ps1 -Action init-swarm

# Build, push, and deploy everything
.\deploy-swarm.ps1 -Action full-deploy

# Check status
.\deploy-swarm.ps1 -Action status
```

### Step 4: Access Your Application

- **Frontend**: http://YOUR_MANAGER_IP
- **Visualizer**: http://YOUR_MANAGER_IP:8080

---

## Option 2: Manual Step-by-Step Deployment

Follow the complete guide in [DIGITALOCEAN_SWARM_DEPLOYMENT.md](DIGITALOCEAN_SWARM_DEPLOYMENT.md)

This is recommended if:
- You want to understand each step
- You're troubleshooting issues
- You need to customize the configuration

---

## Cost Estimate

**DigitalOcean Monthly Costs:**
- 3 Droplets × $6 = $18/month
- 10GB Volume = $1/month
- **Total**: ~$19/month

**To minimize costs:**
1. Deploy and demo
2. Take screenshots
3. Destroy resources: `docker stack rm taskcollab`
4. Delete droplets and volume in DigitalOcean console

**Free tier**: DigitalOcean gives $200 credit for 60 days with new accounts!

---

## Testing Checklist

After deployment, verify these features:

### 1. Services Running
```bash
ssh root@<MANAGER_IP>
docker service ls
# All services should show X/X replicas
```

### 2. Load Balancing
- Access frontend multiple times
- Check visualizer to see requests distributed

### 3. Service Replication
```bash
docker service scale taskcollab_backend=5
docker service ps taskcollab_backend
# Should see 5 replicas across nodes
```

### 4. Persistent Storage
1. Create a user account
2. Restart database: `docker service update --force taskcollab_postgres`
3. Confirm data persists

### 5. High Availability
```bash
# Kill a backend container
docker kill <container_id>
# Watch it auto-restart
docker service ps taskcollab_backend
```

### 6. Rolling Updates
```bash
# Trigger an update
docker service update --force taskcollab_backend
# Watch rolling update in visualizer
```

---

## Screenshots to Take for Documentation

1. **Visualizer** showing services across 3 nodes
2. **Service list** (`docker service ls`)
3. **Service replication** (`docker service ps taskcollab_backend`)
4. **Frontend** running in browser
5. **Application** with data (users, projects, tasks)
6. **Logs** showing successful deployment
7. **Scaling** demonstration (before/after scale command)
8. **Volume** mounted on manager node (`df -h`)

---

## Troubleshooting Common Issues

### Droplets can't communicate
**Fix**: Check firewall rules, ensure ports 2377, 7946, 4789 are open

### Services won't start
```bash
docker service ps taskcollab_backend --no-trunc
docker service logs taskcollab_backend
```

### Can't push to Docker Hub
```bash
docker login
# Enter username and password
```

### Volume not mounted
```bash
ssh root@<MANAGER_IP>
df -h | grep postgres
# Should see /mnt/postgres-data
```

### Workers can't join swarm
```bash
# On manager, get new token
docker swarm join-token worker
# Use the command on workers
```

---

## After Deployment: Cleanup

### Keep Running (For Demo)
- Leave everything running
- Share URL with instructor
- Monitor costs in DigitalOcean

### Destroy Everything (Save Money)
```bash
# Remove stack
ssh root@<MANAGER_IP> "docker stack rm taskcollab"

# In DigitalOcean console:
# 1. Destroy all 3 droplets
# 2. Delete the volume
# 3. Delete container registry (if used)
```

---

## For Grading/Demo

### What to Show

1. **Architecture Diagram** (from visualizer)
2. **Running Services** (`docker service ls`)
3. **Service Distribution** (which services on which nodes)
4. **Application Working** (create user, project, task)
5. **Persistence Test** (restart service, data survives)
6. **Scaling Test** (scale up/down, watch distribution)
7. **Load Balancing** (multiple replicas handling requests)
8. **Logs** (showing healthy services)

### Key Talking Points

- ✅ "I containerized all components with Docker"
- ✅ "I use Docker Compose for local development"
- ✅ "PostgreSQL data persists using DigitalOcean Volumes"
- ✅ "Deployed to DigitalOcean using Docker Swarm"
- ✅ "3-node cluster with service replication"
- ✅ "Automatic load balancing across replicas"
- ✅ "Rolling updates for zero-downtime deployments"
- ✅ "Also deployed to Fly.io with Fly Volumes"

---

## Alternative: Fly.io Deployment

If you prefer Fly.io (simpler, potentially cheaper):

```bash
# Follow FLY_DEPLOYMENT.md
cd database
fly apps create task-collab-db
fly volumes create postgres_data --size 1
fly deploy

cd ../backend
fly apps create task-collab-backend
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy

cd ../frontend
fly apps create task-collab-frontend
fly deploy
```

**Note**: Fly.io alone doesn't satisfy the orchestration requirement. You still need Docker Swarm on DigitalOcean to demonstrate service replication and load balancing.

---

## Questions?

**Common Questions:**

**Q: Can I use both Fly.io and DigitalOcean?**
A: Yes! Use Fly.io for the deployment requirement and DigitalOcean Swarm for orchestration.

**Q: Do I need 3 nodes?**
A: Recommended. Minimum is 1 manager + 1 worker, but 3 nodes better demonstrates load balancing.

**Q: How long does deployment take?**
A: About 20-30 minutes for first-time setup.

**Q: What if I get stuck?**
A: Check DIGITALOCEAN_SWARM_DEPLOYMENT.md troubleshooting section or search error messages.

**Q: Can I test locally first?**
A: Yes! Run `docker swarm init` and `docker stack deploy -c docker-compose.swarm.yml taskcollab` on your local machine.

---

## Ready to Deploy?

Start with Option 1 (automated) if you want to move quickly, or Option 2 (manual) if you want to understand every step.

Good luck! 🚀
