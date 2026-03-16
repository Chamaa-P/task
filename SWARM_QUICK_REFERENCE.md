# Docker Swarm Quick Reference

## Essential Commands

### Service Management
```bash
# List all services
docker service ls

# List tasks for a service
docker service ps taskcollab_backend

# View service logs
docker service logs -f taskcollab_backend

# Scale a service
docker service scale taskcollab_backend=5

# Update service image (rolling update)
docker service update --image user/backend:v2 taskcollab_backend

# Force recreate service
docker service update --force taskcollab_backend

# Remove service
docker service rm taskcollab_backend
```

### Stack Management
```bash
# Deploy stack
docker stack deploy -c docker-compose.digitalocean.yml taskcollab

# List stacks
docker stack ls

# List stack services
docker stack services taskcollab

# List all tasks in stack
docker stack ps taskcollab

# Remove stack
docker stack rm taskcollab
```

### Node Management
```bash
# List nodes
docker node ls

# View node details
docker node inspect swarm-manager

# Update node availability
docker node update --availability drain swarm-worker-1
docker node update --availability active swarm-worker-1

# Promote/demote nodes
docker node promote swarm-worker-1
docker node demote swarm-worker-1

# Remove node (must drain first)
docker node update --availability drain swarm-worker-1
docker node rm swarm-worker-1
```

### Network Management
```bash
# List networks
docker network ls

# Inspect overlay network
docker network inspect taskcollab_task-network

# Create overlay network
docker network create --driver overlay my-network
```

### Monitoring
```bash
# Real-time stats
docker stats

# Watch service status
watch -n 2 'docker service ls'

# See which tasks are on which nodes
docker service ps taskcollab_backend

# View cluster events
docker events

# Check node resource usage
docker node ps swarm-manager
```

## Troubleshooting

### Service Won't Start
```bash
# Check service status
docker service ps taskcollab_backend --no-trunc

# View detailed logs
docker service logs taskcollab_backend --tail 100

# Inspect service
docker service inspect taskcollab_backend
```

### Network Issues
```bash
# Check network connectivity
docker exec <container_id> ping postgres

# Verify overlay network
docker network inspect taskcollab_task-network

# Test service resolution
docker exec <container_id> nslookup postgres
```

### Rolling Back Updates
```bash
# Automatic rollback on failure
docker service update --rollback taskcollab_backend

# Manual rollback to previous image
docker service update --image user/backend:v1 taskcollab_backend
```

### Node Not Joining
```bash
# On manager, regenerate join token
docker swarm join-token worker

# Check swarm status
docker info | grep Swarm

# Leave swarm (worker)
docker swarm leave

# Leave swarm (manager, force)
docker swarm leave --force
```

## Quick Deployment Workflow

### Initial Setup
```bash
# 1. Initialize swarm on manager
docker swarm init --advertise-addr <MANAGER_IP>

# 2. Join workers (use token from above)
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

# 3. Build and push images
docker build -t user/backend:latest ./backend
docker push user/backend:latest

# 4. Deploy stack
docker stack deploy -c compose.yml taskcollab
```

### Update Workflow
```bash
# 1. Build new image
docker build -t user/backend:v2 ./backend

# 2. Push to registry
docker push user/backend:v2

# 3. Update service (rolling)
docker service update --image user/backend:v2 taskcollab_backend

# 4. Monitor update
watch docker service ps taskcollab_backend
```

### Scale Workflow
```bash
# Scale up
docker service scale taskcollab_backend=5

# Watch distribution
docker service ps taskcollab_backend

# Scale down
docker service scale taskcollab_backend=2
```

## Useful One-Liners

```bash
# Get all container IDs for a service
docker service ps -q taskcollab_backend

# See resource limits for all services
docker service ls --format "table {{.Name}}\t{{.Replicas}}"

# Get logs from all backend replicas
docker service logs $(docker service ps -q taskcollab_backend)

# List all tasks running on current node
docker node ps $(docker info -f '{{.Swarm.NodeID}}')

# Kill all containers on current node (emergency)
docker kill $(docker ps -q)

# View all overlay networks
docker network ls --filter driver=overlay

# Get public IPs of all swarm nodes
docker node ls -q | xargs docker node inspect -f '{{.Status.Addr}}'
```

## Testing High Availability

### Test Container Failure
```bash
# 1. Get a container ID
docker ps | grep taskcollab_backend

# 2. Kill it
docker kill <container_id>

# 3. Watch swarm restart it
docker service ps taskcollab_backend
```

### Test Node Failure
```bash
# 1. Drain a node
docker node update --availability drain swarm-worker-1

# 2. Watch tasks migrate
docker service ps taskcollab_backend

# 3. Reactivate node
docker node update --availability active swarm-worker-1
```

### Test Rolling Update
```bash
# Update with health checks
docker service update \
  --image user/backend:v2 \
  --update-parallelism 1 \
  --update-delay 10s \
  --update-failure-action rollback \
  taskcollab_backend
```

## Service Constraints Examples

```yaml
# Run only on manager nodes
deploy:
  placement:
    constraints:
      - node.role == manager

# Run only on specific node
deploy:
  placement:
    constraints:
      - node.hostname == swarm-worker-1

# Run on nodes with SSD
deploy:
  placement:
    constraints:
      - node.labels.disk == ssd

# Spread across availability zones
deploy:
  placement:
    preferences:
      - spread: node.labels.zone
```

## Environment Variables

```bash
# Set via command line
docker service create \
  --env NODE_ENV=production \
  --env PORT=5000 \
  myimage

# Set via file
docker service create --env-file .env myimage

# Update environment variables
docker service update --env-add NEW_VAR=value taskcollab_backend
```

## Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Accessing Services

```bash
# From outside swarm
http://<ANY_NODE_IP>:80

# From inside swarm (service discovery)
curl http://backend:5000
curl http://postgres:5432

# Internal service (no published ports)
# Only accessible within overlay network
```

## Ports

Required ports for swarm:
- **2377/tcp**: Swarm management
- **7946/tcp,udp**: Node communication
- **4789/udp**: Overlay network traffic

## Best Practices

1. **Always use image tags** (not `latest`)
2. **Set resource limits** to prevent resource exhaustion
3. **Use health checks** for automatic recovery
4. **Implement rolling updates** for zero-downtime
5. **Use secrets** for sensitive data
6. **Label your nodes** for better placement control
7. **Monitor regularly** with visualizer or Prometheus
8. **Back up volumes** on manager nodes
9. **Keep odd number of managers** (1, 3, 5) for quorum
10. **Test failure scenarios** before production
