# Security Enhancements Deployment Guide

## Quick Start

This guide walks through deploying the security-enhanced TaskCollab application with HTTPS and Docker secrets.

## What's New

### ✅ Security Features Implemented

1. **HTTPS/SSL Encryption**
   - HTTP automatically redirects to HTTPS
   - TLS 1.2/1.3 support
   - Self-signed certificates (development) or Let's Encrypt (production)

2. **Docker Secrets Management**
   - Database credentials stored securely
   - JWT secret in encrypted Docker secrets
   - No hardcoded passwords in compose files

3. **Enhanced Security Headers**
   - HSTS (HTTP Strict Transport Security)
   - Content Security Policy (CSP)
   - XSS Protection
   - Clickjacking prevention

4. **Updated Backend Security**
   - Secrets read from encrypted files
   - Fallback to environment variables for development
   - Secure JWT token generation

## Deployment Steps

### Step 1: Build Updated Images

The frontend and backend have been updated with security enhancements.

```powershell
# Build backend
cd backend
docker build -t chamaap/task-collab-backend:latest .
docker push chamaap/task-collab-backend:latest

# Build frontend (with HTTPS support)
cd ../frontend
docker build -t chamaap/task-collab-frontend:latest .
docker push chamaap/task-collab-frontend:latest
```

### Step 2: Create Secret Files

```powershell
# Create secrets directory
mkdir secrets

# Create secret files with secure values
# IMPORTANT: Use strong passwords in production!

# Database user
echo "taskuser" > secrets/postgres_user.txt

# Database password (generate a strong one)
# Example: openssl rand -base64 24
echo "taskpass" > secrets/postgres_password.txt

# JWT secret (minimum 32 characters)
# Example: openssl rand -base64 32
echo "your-super-secret-jwt-key-change-in-production-min-32-chars" > secrets/jwt_secret.txt

# Grafana admin password
echo "admin" > secrets/grafana_admin_password.txt
```

**Production Note**: For production, generate cryptographically secure passwords:
```powershell
# On Linux/Mac/WSL:
openssl rand -base64 24 > secrets/postgres_password.txt
openssl rand -base64 32 > secrets/jwt_secret.txt
```

### Step 3: Deploy Secrets to Swarm

#### Option A: Automated Deployment (Recommended)

```powershell
# Run the deployment script
.\deploy-secrets.ps1 -ManagerIP "138.197.152.191" -SSHKey "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh"
```

#### Option B: Manual Deployment

```powershell
# Copy docker-compose.swarm.yml to manager
scp -i "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh" docker-compose.swarm.yml root@138.197.152.191:/root/taskcollab/

# Copy secret files
scp -i "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh" secrets/*.txt root@138.197.152.191:/root/taskcollab/secrets/

# SSH to manager and create secrets
ssh -i "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh" root@138.197.152.191

# On manager node:
cd /root/taskcollab/secrets

# Create Docker secrets
docker secret create postgres_user postgres_user.txt
docker secret create postgres_password postgres_password.txt
docker secret create jwt_secret jwt_secret.txt
docker secret create grafana_admin_password grafana_admin_password.txt

# Verify secrets created
docker secret ls

# Clean up local secret files (security best practice)
rm -f *.txt
```

### Step 4: Deploy Stack

```powershell
# SSH to manager
ssh -i "C:\Users\patri\Documents\UOfT\IntroToCloudComputing\ssh" root@138.197.152.191

# Deploy the stack
cd /root/taskcollab
docker stack deploy -c docker-compose.swarm.yml taskcollab
```

### Step 5: Verify Deployment

```bash
# Check service status
docker service ls

# All services should show desired replicas
# Example output:
# NAME                       REPLICAS
# taskcollab_backend         3/3
# taskcollab_frontend        2/2
# taskcollab_postgres        1/1
# taskcollab_autoscaler      1/1
# ...

# Check backend logs for successful secret loading
docker service logs taskcollab_backend --tail 20

# Should see: "Database connection has been established successfully."

# Check frontend is serving HTTPS
curl -I https://138.197.152.191
# Should return: HTTP/2 200 (with security headers)
```

### Step 6: Test Security Features

```powershell
# Test HTTP -> HTTPS redirect
curl -I http://138.197.152.191
# Should return: 301 Moved Permanently
# Location: https://138.197.152.191/

# Test HTTPS with security headers
curl -k -I https://138.197.152.191
# Should include headers:
# - strict-transport-security
# - x-frame-options
# - x-content-type-options
# - content-security-policy

# Test application
# Open browser: https://138.197.152.191
# You'll see a certificate warning (self-signed cert) - this is expected
# Click "Advanced" -> "Proceed to site"
```

## Troubleshooting

### Browser Shows "Your connection is not private"

**Expected**: This happens with self-signed certificates.

**Development**: Click "Advanced" → "Proceed to 138.197.152.191 (unsafe)"

**Production**: Use Let's Encrypt - see [SECURITY.md](SECURITY.md#production-ssl-with-lets-encrypt-recommended)

### Service Fails to Start After Secrets Deployment

```bash
# Check service logs
docker service logs taskcollab_backend --tail 50
docker service logs taskcollab_postgres --tail 50

# Verify secrets exist and are attached
docker secret ls
docker service inspect taskcollab_backend --format '{{.Spec.TaskTemplate.ContainerSpec.Secrets}}'
```

### Database Connection Errors

```bash
# Check if secrets are being read correctly
docker service logs taskcollab_backend | grep -i "database\|secret\|error"

# Verify postgres container has secrets
docker service inspect taskcollab_postgres --format '{{.Spec.TaskTemplate.ContainerSpec.Secrets}}'

# Check postgres logs
docker service logs taskcollab_postgres --tail 30
```

### HTTPS Not Working

```bash
# Check frontend logs
docker service logs taskcollab_frontend --tail 30

# Verify port 443 is exposed
docker service inspect taskcollab_frontend --format '{{.Endpoint.Ports}}'

# Test SSL certificate
openssl s_client -connect 138.197.152.191:443 -servername localhost
```

## Production Checklist

Before going to production, complete these security tasks:

- [ ] Replace self-signed certificates with Let's Encrypt or commercial CA
- [ ] Generate strong production secrets (32+ characters)
- [ ] Change all default passwords
- [ ] Update `secrets/jwt_secret.txt` with cryptographically secure value
- [ ] Update `secrets/postgres_password.txt` with strong password
- [ ] Update `secrets/grafana_admin_password.txt` 
- [ ] Verify `.gitignore` excludes `secrets/` directory
- [ ] Set up firewall rules (allow only 22, 80, 443)
- [ ] Enable automated SSL certificate renewal
- [ ] Implement rate limiting on API endpoints
- [ ] Set up monitoring alerts for security events
- [ ] Regular security audits and dependency updates

## Files Modified

### Backend
- `backend/src/utils/secrets.ts` - New file for reading Docker secrets
- `backend/src/database/connection.ts` - Updated to use secrets
- `backend/src/middleware/auth.ts` - Updated to use secure JWT secret
- `backend/src/controllers/auth.controller.ts` - Updated to use secure JWT secret

### Frontend
- `frontend/Dockerfile` - Added SSL certificate generation
- `frontend/nginx.conf` - Added HTTPS support and security headers

### Infrastructure
- `docker-compose.swarm.yml` - Updated to use Docker secrets
- `secrets/*.txt` - Secret value files (not committed to git)
- `.gitignore` - Updated to exclude secrets

### Documentation
- `SECURITY.md` - Comprehensive security documentation
- `DEPLOYMENT_SECURITY.md` - This deployment guide
- `deploy-secrets.ps1` - PowerShell deployment script
- `deploy-secrets.sh` - Bash deployment script
- `generate-ssl.sh` - SSL certificate generation script

## Next Steps

1. **For Development**: You can proceed with the self-signed certificates
2. **For Production**: Follow the Let's Encrypt setup in [SECURITY.md](SECURITY.md)
3. **Monitoring**: Access Grafana at `http://138.197.152.191:3000` (username: admin, password: from secrets)
4. **Testing**: Run load tests to verify auto-scaling works with new security features

## Need Help?

- See [SECURITY.md](SECURITY.md) for detailed security documentation
- See [MONITORING.md](MONITORING.md) for monitoring setup
- Check service logs: `docker service logs <service-name>`
- Review Docker secrets: `docker secret ls`

---

**Last Updated**: March 2026
