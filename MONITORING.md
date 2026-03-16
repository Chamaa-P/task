# Monitoring and Observability Setup

## Overview
This deployment includes comprehensive monitoring using both DigitalOcean built-in monitoring and a custom Prometheus + Grafana stack.

## DigitalOcean Monitoring

### Installed Components
- **DigitalOcean Monitoring Agent**: Installed on all 3 droplets (manager + 2 workers)
- Collects CPU, memory, disk, and network metrics
- Automatically sends metrics to DigitalOcean cloud dashboard

### Access DigitalOcean Metrics
1. Log in to your DigitalOcean account
2. Navigate to **Manage → Droplets**
3. Click on any of your droplets:
   - `swarm-manager` (138.197.152.191)
   - `swarm-worker-1` (159.89.113.54)
   - `swarm-worker-2` (159.203.3.95)
4. Go to the **Graphs** tab to see:
   - CPU usage
   - Memory usage  
   - Disk I/O
   - Network bandwidth
   - Disk usage

### Setting Up Alerts (Optional)
1. In DigitalOcean Dashboard, go to **Manage → Monitoring → Alerts**
2. Click **Create Alert Policy**
3. Configure alerts for:
   - **CPU**: Alert when > 80% for 5 minutes
   - **Memory**: Alert when > 85% for 5 minutes
   - **Disk**: Alert when > 90% used
4. Set notification email

## Prometheus + Grafana Stack

### Deployed Services

#### 1. Prometheus (Port 9090)
- **URL**: http://138.197.152.191:9090
- **Purpose**: Metrics collection and time-series database
- **Collects from**:
  - Node Exporter (system metrics)
  - cAdvisor (container metrics)
  - Backend application (when metrics endpoint is added)

#### 2. Grafana (Port 3000)
- **URL**: http://138.197.152.191:3000
- **Default Login**: 
  - Username: `admin`
  - Password: `admin`
- **Purpose**: Visualization dashboards

#### 3. cAdvisor (Port 8081)
- **URL**: http://138.197.152.191:8081
- **Purpose**: Container performance metrics (CPU, memory, network, disk per container)
- **Runs on**: All 3 nodes (global mode)

#### 4. Node Exporter (Port 9100)
- **URL**: http://138.197.152.191:9100/metrics
- **Purpose**: System-level metrics (CPU, memory, disk, network)
- **Runs on**: All 3 nodes (global mode)

## Quick Start Guide

### 1. Access Prometheus
```bash
# Open in browser
http://138.197.152.191:9090
```

**Sample Queries:**
- `rate(container_cpu_usage_seconds_total[5m])` - Container CPU usage
- `container_memory_usage_bytes` - Container memory usage
- `node_cpu_seconds_total` - Node CPU time
- `node_memory_MemAvailable_bytes` - Available memory

### 2. Access Grafana
```bash
# Open in browser
http://138.197.152.191:3000

# Login credentials
Username: admin
Password: admin
```

**First-time Setup:**
1. After logging in, add Prometheus as a data source:
   - Click **⚙️ Configuration → Data Sources**
   - Click **Add data source**
   - Select **Prometheus**
   - Set URL to: `http://prometheus:9090`
   - Click **Save & Test**

2. Import pre-built dashboards:
   - Click **+ → Import**
   - Import these dashboard IDs:
     - **1860** - Node Exporter Full (system metrics)
     - **193** - Docker Dashboard
     - **14282** - cAdvisor exporter

### 3. Access cAdvisor
```bash
# Open in browser
http://138.197.152.191:8081
```

View real-time container metrics:
- CPU usage per container
- Memory usage per container
- Network I/O
- Filesystem usage

### 4. Access Docker Visualizer
```bash
# Open in browser
http://138.197.152.191:8080
```

See visual representation of:
- Which containers are running on which nodes
- Service distribution across the cluster

## Key Metrics to Monitor

### Application Health
- **Backend replicas**: Should be 3/3
- **Frontend replicas**: Should be 2/2
- **Database status**: Should be 1/1
- **Response times**: Monitor backend API latency

### System Resources
- **CPU Usage**: Should stay below 70%
- **Memory Usage**: Should stay below 80%
- **Disk Usage**: Should stay below 85%
- **Network I/O**: Monitor for unusual spikes

### Container Metrics
- **Container restarts**: Should be 0 (check in cAdvisor)
- **Memory per container**: Watch for memory leaks
- **CPU throttling**: Check if containers are being throttled

## Troubleshooting

### Check if monitoring agents are running:
```bash
# On manager node
systemctl status do-agent

# Check Docker services
docker service ls | grep -E 'prometheus|grafana|cadvisor|node-exporter'
```

### View Prometheus targets:
```bash
# Open in browser
http://138.197.152.191:9090/targets
```
All targets should show as "UP"

### Check Grafana logs:
```bash
ssh root@138.197.152.191 "docker service logs taskcollab_grafana --tail 50"
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   DigitalOcean Cloud                    │
│              (Built-in Monitoring Dashboard)            │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ (DO Agent sends metrics)
                            │
┌─────────────────────────────────────────────────────────┐
│                    Docker Swarm Cluster                 │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Manager   │  │  Worker 1   │  │  Worker 2   │   │
│  │             │  │             │  │             │   │
│  │ Prometheus  │  │  cAdvisor   │  │  cAdvisor   │   │
│  │  Grafana    │  │ Node Exp.   │  │ Node Exp.   │   │
│  │  cAdvisor   │  │  Backend    │  │  Backend    │   │
│  │ Node Exp.   │  │  Frontend   │  │  Frontend   │   │
│  │ PostgreSQL  │  │             │  │             │   │
│  │ Visualizer  │  │             │  │             │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Demo Checklist

✅ DigitalOcean monitoring agent installed on all nodes  
✅ Prometheus collecting metrics (http://138.197.152.191:9090)  
✅ Grafana dashboards available (http://138.197.152.191:3000)  
✅ cAdvisor showing container metrics (http://138.197.152.191:8081)  
✅ Node exporters on all nodes providing system metrics  
✅ Docker Visualizer showing cluster topology (http://138.197.152.191:8080)  

## Next Steps for Production

1. **Set up alerting rules in Prometheus**
2. **Configure email/Slack notifications in Grafana**
3. **Enable HTTPS for all monitoring endpoints**
4. **Set up log aggregation (ELK/Loki)**
5. **Configure automated dashboards**
6. **Set up retention policies for metrics**
