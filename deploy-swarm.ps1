# DigitalOcean Swarm Deployment Script
# This script helps you deploy to DigitalOcean Docker Swarm

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help"
)

# Configuration - UPDATED WITH YOUR VALUES
$MANAGER_IP = "138.197.152.191"
$WORKER1_IP = "159.89.113.54"
$WORKER2_IP = "159.203.3.95"
$DOCKER_USERNAME = "chamaap"
$POSTGRES_PASSWORD = "taskcollab-secure-pass-2026"
$JWT_SECRET = "jwt-super-secret-key-taskcollab-2026"
$SSH_KEY = "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh"

function Install-DockerOnNodes {
    Write-Host "Installing Docker on all nodes..." -ForegroundColor Green
    
    $script = @"
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
"@
    
    foreach ($IP in @($MANAGER_IP, $WORKER1_IP, $WORKER2_IP)) {
        Write-Host "Installing on $IP..." -ForegroundColor Yellow
        ssh -i $SSH_KEY root@$IP $script
    }
    
    Write-Host "Docker installed on all nodes!" -ForegroundColor Green
}

function Initialize-Swarm {
    Write-Host "Initializing Docker Swarm..." -ForegroundColor Green
    
    # Initialize on manager
    $initOutput = ssh -i $SSH_KEY root@$MANAGER_IP "docker swarm init --advertise-addr $MANAGER_IP"
    
    # Extract join token
    $joinCommand = ($initOutput | Select-String "docker swarm join").ToString().Trim()
    
    Write-Host "Swarm initialized. Joining workers..." -ForegroundColor Yellow
    
    # Join workers
    ssh -i $SSH_KEY root@$WORKER1_IP $joinCommand
    ssh -i $SSH_KEY root@$WORKER2_IP $joinCommand
    
    Write-Host "Swarm cluster created!" -ForegroundColor Green
    ssh -i $SSH_KEY root@$MANAGER_IP "docker node ls"
}

function Build-Images {
    Write-Host "Building Docker images..." -ForegroundColor Green
    
    # Build backend
    Write-Host "Building backend..." -ForegroundColor Yellow
    docker build -t ${DOCKER_USERNAME}/task-collab-backend:latest ./backend
    
    # Build frontend with relative API paths so nginx can proxy /api to the backend service
    Write-Host "Building frontend..." -ForegroundColor Yellow
    docker build -t ${DOCKER_USERNAME}/task-collab-frontend:latest ./frontend
    
    Write-Host "Images built successfully!" -ForegroundColor Green
}

function Push-Images {
    Write-Host "Pushing images to Docker Hub..." -ForegroundColor Green
    
    docker login
    docker push ${DOCKER_USERNAME}/task-collab-backend:latest
    docker push ${DOCKER_USERNAME}/task-collab-frontend:latest
    
    Write-Host "Images pushed!" -ForegroundColor Green
}

function Deploy-Stack {
    Write-Host "Deploying stack to Swarm..." -ForegroundColor Green
    
    # Update compose file with username
    $composeContent = Get-Content docker-compose.digitalocean.yml -Raw
    $composeContent = $composeContent -replace 'yourusername', $DOCKER_USERNAME
    $composeContent | Set-Content docker-compose.digitalocean.yml.tmp
    
    # Copy to manager
    scp -i $SSH_KEY docker-compose.digitalocean.yml.tmp root@${MANAGER_IP}:/root/docker-compose.yml
    
    # Deploy
    ssh -i $SSH_KEY root@$MANAGER_IP @"
export POSTGRES_PASSWORD='$POSTGRES_PASSWORD'
export JWT_SECRET='$JWT_SECRET'
docker stack deploy -c /root/docker-compose.yml taskcollab
"@
    
    # Cleanup
    Remove-Item docker-compose.digitalocean.yml.tmp
    
    Write-Host "Stack deployed! Waiting for services..." -ForegroundColor Green
    Start-Sleep -Seconds 10
    
    ssh -i $SSH_KEY root@$MANAGER_IP "docker service ls"
}

function Show-Status {
    Write-Host "Checking stack status..." -ForegroundColor Green
    ssh -i $SSH_KEY root@$MANAGER_IP "docker service ls; echo ''; docker stack ps taskcollab"
}

function Show-Logs {
    param([string]$Service = "backend")
    Write-Host "Showing logs for $Service..." -ForegroundColor Green
    ssh -i $SSH_KEY root@$MANAGER_IP "docker service logs -f taskcollab_$Service"
}

function Scale-Service {
    param(
        [string]$Service,
        [int]$Replicas
    )
    Write-Host "Scaling $Service to $Replicas replicas..." -ForegroundColor Green
    ssh -i $SSH_KEY root@$MANAGER_IP "docker service scale taskcollab_${Service}=$Replicas"
}

function Remove-Stack {
    Write-Host "Removing stack..." -ForegroundColor Yellow
    ssh -i $SSH_KEY root@$MANAGER_IP "docker stack rm taskcollab"
    Write-Host "Stack removed!" -ForegroundColor Green
}

function Show-Help {
    Write-Host @"
DigitalOcean Swarm Deployment Helper

Usage: .\deploy-swarm.ps1 -Action <action>

Actions:
  install-docker   - Install Docker on all nodes
  init-swarm      - Initialize Docker Swarm cluster
  build           - Build Docker images locally
  push            - Push images to Docker Hub
  deploy          - Deploy stack to Swarm
  status          - Show service status
  logs            - Show service logs (default: backend)
  scale           - Scale a service
  remove          - Remove the stack
  full-deploy     - Build, push, and deploy (complete workflow)
  help            - Show this help

Examples:
  .\deploy-swarm.ps1 -Action install-docker
  .\deploy-swarm.ps1 -Action init-swarm
  .\deploy-swarm.ps1 -Action full-deploy
  .\deploy-swarm.ps1 -Action status
  .\deploy-swarm.ps1 -Action logs

Before running, update the configuration variables at the top of this script!
"@ -ForegroundColor Cyan
}

# Main execution
switch ($Action.ToLower()) {
    "install-docker" { Install-DockerOnNodes }
    "init-swarm" { Initialize-Swarm }
    "build" { Build-Images }
    "push" { Push-Images }
    "deploy" { Deploy-Stack }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "scale" { 
        $service = Read-Host "Service name (backend/frontend)"
        $replicas = Read-Host "Number of replicas"
        Scale-Service -Service $service -Replicas $replicas
    }
    "remove" { Remove-Stack }
    "full-deploy" {
        Build-Images
        Push-Images
        Deploy-Stack
        Show-Status
    }
    default { Show-Help }
}
