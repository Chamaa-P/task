# Docker Swarm Secrets Deployment Script (PowerShell)
# This script creates Docker secrets on the Swarm cluster

param(
    [string]$ManagerIP = "138.197.152.191",
    [string]$SSHKey = "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh"
)

Write-Host "🔐 TaskCollab Docker Secrets Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manager IP: $ManagerIP"
Write-Host "SSH Key: $SSHKey"
Write-Host ""

# Check if secrets directory exists
if (-not (Test-Path "secrets")) {
    Write-Host "❌ Error: secrets/ directory not found" -ForegroundColor Red
    Write-Host "Please create secret files first:"
    Write-Host '  mkdir secrets'
    Write-Host '  echo "taskuser" > secrets/postgres_user.txt'
    Write-Host '  # Generate strong passwords - see SECURITY.md'
    exit 1
}

# Verify all required secrets exist
$RequiredSecrets = @(
    "postgres_user.txt",
    "postgres_password.txt",
    "jwt_secret.txt",
    "grafana_admin_password.txt"
)

Write-Host "📋 Checking secret files..."
foreach ($secret in $RequiredSecrets) {
    if (-not (Test-Path "secrets\$secret")) {
        Write-Host "❌ Missing: secrets\$secret" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Found: secrets\$secret" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📤 Copying secrets to manager node..." -ForegroundColor Yellow

# Create secrets directory on manager
ssh -i $SSHKey root@$ManagerIP "mkdir -p /root/taskcollab/secrets"

# Copy secret files
scp -i $SSHKey secrets/*.txt root@${ManagerIP}:/root/taskcollab/secrets/

Write-Host ""
Write-Host "🔒 Creating Docker secrets..." -ForegroundColor Yellow

# Create secrets on Swarm
$commands = @"
cd /root/taskcollab/secrets

# Remove existing secrets if they exist
docker secret rm postgres_user 2>/dev/null || true
docker secret rm postgres_password 2>/dev/null || true
docker secret rm jwt_secret 2>/dev/null || true
docker secret rm grafana_admin_password 2>/dev/null || true

# Create new secrets
docker secret create postgres_user postgres_user.txt
docker secret create postgres_password postgres_password.txt
docker secret create jwt_secret jwt_secret.txt
docker secret create grafana_admin_password grafana_admin_password.txt

# Clean up secret files on manager node (security best practice)
rm -f postgres_user.txt postgres_password.txt jwt_secret.txt grafana_admin_password.txt

echo ""
echo "📊 Docker secrets created:"
docker secret ls
"@

ssh -i $SSHKey root@$ManagerIP $commands

Write-Host ""
Write-Host "✅ Secrets deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
Write-Host "1. Secret files are stored only in Docker's encrypted secret store"
Write-Host "2. Keep local secrets\ directory secure (never commit to git)"
Write-Host "3. Change default passwords in production"
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "1. Deploy the stack: ssh root@$ManagerIP 'docker stack deploy -c /root/taskcollab/docker-compose.swarm.yml taskcollab'"
Write-Host "2. Verify services: ssh root@$ManagerIP 'docker service ls'"
Write-Host "3. Check logs for successful secret loading"
