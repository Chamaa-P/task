#!/bin/bash

# Docker Swarm Secrets Deployment Script
# This script creates Docker secrets on the Swarm cluster

set -e

MANAGER_IP="${1:-138.197.152.191}"
SSH_KEY="${2:-$HOME/.ssh/id_rsa}"

echo "🔐 TaskCollab Docker Secrets Deployment"
echo "========================================="
echo ""
echo "Manager IP: $MANAGER_IP"
echo "SSH Key: $SSH_KEY"
echo ""

# Check if secrets directory exists
if [ ! -d "secrets" ]; then
    echo "❌ Error: secrets/ directory not found"
    echo "Please create secret files first:"
    echo "  mkdir -p secrets"
    echo "  echo 'taskuser' > secrets/postgres_user.txt"
    echo "  openssl rand -base64 24 > secrets/postgres_password.txt"
    echo "  openssl rand -base64 32 > secrets/jwt_secret.txt"
    echo "  echo 'YourStrongPassword' > secrets/grafana_admin_password.txt"
    exit 1
fi

# Verify all required secrets exist
REQUIRED_SECRETS=(
    "postgres_user.txt"
    "postgres_password.txt"
    "jwt_secret.txt"
    "grafana_admin_password.txt"
)

echo "📋 Checking secret files..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "secrets/$secret" ]; then
        echo "❌ Missing: secrets/$secret"
        exit 1
    else
        echo "✅ Found: secrets/$secret"
    fi
done

echo ""
echo "📤 Copying secrets to manager node..."

# Create secrets directory on manager
ssh -i "$SSH_KEY" root@$MANAGER_IP "mkdir -p /root/taskcollab/secrets"

# Copy secret files
scp -i "$SSH_KEY" secrets/*.txt root@$MANAGER_IP:/root/taskcollab/secrets/

echo ""
echo "🔒 Creating Docker secrets..."

# Create secrets on Swarm
ssh -i "$SSH_KEY" root@$MANAGER_IP << 'EOF'
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
EOF

echo ""
echo "✅ Secrets deployment complete!"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Secret files are stored only in Docker's encrypted secret store"
echo "2. Keep local secrets/ directory secure (never commit to git)"
echo "3. Change default passwords in production"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the stack: docker stack deploy -c docker-compose.swarm.yml taskcollab"
echo "2. Verify services: docker service ls"
echo "3. Check logs for successful secret loading"
