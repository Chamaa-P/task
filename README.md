# Task Collaboration Platform

A full-stack task management application built with React, Node.js, and PostgreSQL.

## 🛠 Setup & Installation

Follow these steps if you have just cloned the repository to set up your local environment.

### 1. Open Backend Terminal: Download Dependencies

```
cd backend
npm install
```

### 2. Open Frontend Terminal: Download Dependencies

#### Note: Start another terminal, will be useful later

```
cd frontend
npm install
```

## 🚀 How to Run the Project

Use this method for active coding. Open two separate terminal windows:

**In Backend Terminal:**

```
npm run build
npm run dev
```

**In Frontend Terminal:**

```
npm run dev
```

Use this to run the entire stack (Frontend, Backend, and Database) in isolated containers. Run these commands from the root folder:

#### Stop any existing containers, force a clean build, start the stack

**In Root /task Terminal:**

```
docker-compose down
docker-compose build --no-cache backend
docker-compose up
```

## ⚠️ Critical Troubleshooting for Mac Users

If you encounter "Port already in use" errors, check the following:

1. Port 5432 (Postgres): Your local Postgres is likely running. Stop it with 'brew services stop postgresql' or quit Postgres.app.
2. Port 5000 (Backend): macOS uses this for AirPlay. Go to System Settings > General > AirPlay & Handoff and turn off AirPlay Receiver.

## 📁 Project Structure

- **/frontend**: React + Vite + Tailwind CSS
- **/backend**: Node.js + Express + Sequelize (PostgreSQL)
- **/database**: PostgreSQL container configuration
- **docker-compose.yml**: Production container orchestration
- **docker-compose.dev.yml**: Development with hot reload
- **docker-compose.swarm.yml**: Docker Swarm orchestration
- **docker-compose.digitalocean.yml**: DigitalOcean Swarm deployment

## 🚢 Deployment Options

This application can be deployed in multiple ways:

### Option 1: Fly.io (PaaS Deployment)
Deploy to Fly.io with persistent volumes.

📖 **Guide**: See [FLY_DEPLOYMENT.md](FLY_DEPLOYMENT.md)

**Features:**
- ✅ Edge/PaaS platform
- ✅ Fly Volumes for PostgreSQL persistence
- ✅ Multi-region deployment capability
- ✅ Automatic HTTPS

**Quick Start:**
```bash
cd database && fly launch
cd ../backend && fly launch
cd ../frontend && fly launch
```

### Option 2: DigitalOcean with Docker Swarm (Orchestration)
Deploy to DigitalOcean droplets using Docker Swarm for orchestration.

📖 **Guide**: See [DIGITALOCEAN_SWARM_DEPLOYMENT.md](DIGITALOCEAN_SWARM_DEPLOYMENT.md)

**Features:**
- ✅ Docker Swarm orchestration (3-node cluster)
- ✅ Service replication and load balancing
- ✅ DigitalOcean Volumes for persistence
- ✅ High availability and auto-recovery
- ✅ Rolling updates

**Quick Start:**
```powershell
# Update configuration in deploy-swarm.ps1, then:
.\deploy-swarm.ps1 -Action full-deploy
```

**Quick Reference:** [SWARM_QUICK_REFERENCE.md](SWARM_QUICK_REFERENCE.md)

### Local Development Modes

**Development Mode** (Hot reload):
```bash
docker-compose -f docker-compose.dev.yml up
```

**Production Mode** (Local):
```bash
docker-compose up
```

**Swarm Mode** (Local testing):
```bash
docker swarm init
docker stack deploy -c docker-compose.swarm.yml taskcollab
```

## 🏗 Architecture

### Services
- **PostgreSQL**: Relational database with persistent storage
- **Backend API**: Node.js/Express REST API with WebSocket support
- **Frontend**: React SPA with Vite build system
- **Visualizer** (Swarm only): Visual representation of service distribution

### Persistent Storage
- **Local**: Docker volumes
- **Fly.io**: Fly Volumes mounted to PostgreSQL container
- **DigitalOcean**: Block Storage Volume attached to Swarm manager

### Orchestration
- **Docker Compose**: Local multi-container orchestration
- **Docker Swarm**: Production orchestration with:
  - Backend: 3 replicas
  - Frontend: 2 replicas
  - PostgreSQL: 1 replica (on manager node)
  - Automatic load balancing
  - Rolling updates
  - Health checks and auto-recovery
