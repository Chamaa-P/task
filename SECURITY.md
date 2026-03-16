# Security Implementation Guide

## Overview

This document describes the security enhancements implemented in the TaskCollab application, including HTTPS support, Docker secrets management, and enhanced security headers.

## Security Features Implemented

### ✅ 1. HTTPS/TLS Encryption

**Status**: Implemented with self-signed certificates

#### Configuration
- **HTTP (Port 80)**: Automatically redirects to HTTPS
- **HTTPS (Port 443)**: Serves application with TLS 1.2/1.3
- **SSL Protocols**: TLS 1.2, TLS 1.3 (no older protocols)
- **Cipher Suites**: Strong ciphers only (HIGH:!aNULL:!MD5)

#### Self-Signed Certificate (Development)
The frontend Dockerfile automatically generates a self-signed certificate during build:
```dockerfile
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=CA/ST=Ontario/L=Toronto/O=TaskCollab/CN=localhost"
```

#### Production SSL with Let's Encrypt (Recommended)

For production deployments, use Let's Encrypt with Certbot:

```bash
# Install Certbot on manager node
sudo apt-get update
sudo apt-get install -y certbot

# Generate Let's Encrypt certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved to:
# - Certificate: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# - Private Key: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Update `docker-compose.swarm.yml` to mount Let's Encrypt certificates:
```yaml
frontend:
  volumes:
    - /etc/letsencrypt/live/yourdomain.com/fullchain.pem:/etc/nginx/ssl/nginx.crt:ro
    - /etc/letsencrypt/live/yourdomain.com/privkey.pem:/etc/nginx/ssl/nginx.key:ro
```

Auto-renewal with cron:
```bash
# Add to crontab (runs twice daily)
0 0,12 * * * certbot renew --quiet && docker service update --force taskcollab_frontend
```

---

### ✅ 2. Docker Secrets Management

**Status**: Implemented for all sensitive data

#### Secrets Stored Securely
- `postgres_user` - Database username
- `postgres_password` - Database password
- `jwt_secret` - JWT signing key
- `grafana_admin_password` - Grafana admin password

#### Secret File Locations
```
secrets/
├── postgres_user.txt
├── postgres_password.txt
├── jwt_secret.txt
└── grafana_admin_password.txt
```

⚠️ **IMPORTANT**: These files are excluded from git via `.gitignore`. Never commit secrets to version control.

#### Deployment Process

1. **Create Production Secrets**
   ```bash
   # Generate strong JWT secret (minimum 32 characters)
   openssl rand -base64 32 > secrets/jwt_secret.txt
   
   # Generate strong database password
   openssl rand -base64 24 > secrets/postgres_password.txt
   
   # Set Grafana admin password
   echo "YourStrongPassword123!" > secrets/grafana_admin_password.txt
   ```

2. **Deploy Secrets to Swarm**
   ```bash
   # On manager node, create Docker secrets
   docker secret create postgres_user secrets/postgres_user.txt
   docker secret create postgres_password secrets/postgres_password.txt
   docker secret create jwt_secret secrets/jwt_secret.txt
   docker secret create grafana_admin_password secrets/grafana_admin_password.txt
   ```

3. **Verify Secrets**
   ```bash
   docker secret ls
   ```

4. **Deploy Stack**
   ```bash
   docker stack deploy -c docker-compose.swarm.yml taskcollab
   ```

#### How Services Use Secrets

**Backend Service**:
- Reads secrets from `/run/secrets/` directory
- Falls back to environment variables for local development
- Uses `readSecret()` utility function in `backend/src/utils/secrets.ts`

```typescript
// Example: Reading JWT secret
import { getJwtSecret } from '../utils/secrets';
const jwtSecret = getJwtSecret(); // Reads from file or env var
```

**PostgreSQL Service**:
- Uses `POSTGRES_USER_FILE` and `POSTGRES_PASSWORD_FILE`
- Native Docker secrets support in PostgreSQL image

---

### ✅ 3. Enhanced Security Headers

**Status**: Fully implemented in nginx

#### Headers Configured

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Browser XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disables unnecessary features |
| `Content-Security-Policy` | See below | Controls resource loading |

#### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
frame-ancestors 'self';
```

**Note**: `unsafe-inline` and `unsafe-eval` are currently needed for React/Vite. For production, consider implementing nonces or hashes.

#### Testing Security Headers

```bash
# Test HTTP to HTTPS redirect
curl -I http://your-domain.com

# Test security headers
curl -I https://your-domain.com

# Use online tools
# - https://securityheaders.com
# - https://observatory.mozilla.org
```

---

### ✅ 4. JWT Authentication

**Status**: Implemented with secure secret management

#### Features
- Tokens signed with secure secret from Docker secrets
- 7-day token expiration (configurable)
- Bearer token authentication
- Protected API routes via middleware

#### Security Best Practices
- Use strong JWT secret (minimum 32 characters)
- Rotate JWT secret periodically
- Token expiration enforced
- HTTPS-only transmission

---

## Security Checklist

### Production Deployment

- [ ] Replace self-signed certificate with Let's Encrypt or commercial CA
- [ ] Generate strong production secrets (minimum 32 characters)
- [ ] Change default Grafana admin password
- [ ] Enable firewall rules (allow only ports 80, 443, 22)
- [ ] Configure fail2ban for SSH protection
- [ ] Set up automated security updates
- [ ] Enable Docker Content Trust (DCT)
- [ ] Regular security audits and dependency updates
- [ ] Implement rate limiting on API endpoints
- [ ] Set up Web Application Firewall (WAF)
- [ ] Configure log aggregation and monitoring
- [ ] Implement intrusion detection system (IDS)

### Application Security

- [ ] Input validation on all forms
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection (React escaping + CSP)
- [ ] CSRF protection for state-changing operations
- [ ] Password hashing (bcrypt implemented)
- [ ] Session management and token revocation
- [ ] API rate limiting
- [ ] Database connection pooling limits

### Infrastructure Security

- [ ] Regular OS and package updates
- [ ] Minimal container images (Alpine-based)
- [ ] Non-root containers where possible
- [ ] Network segmentation (overlay network)
- [ ] Secrets rotation policy
- [ ] Backup encryption
- [ ] Access logging and monitoring

---

## Troubleshooting

### Browser Shows "Not Secure" Warning

**Cause**: Self-signed certificate not trusted by browser

**Solutions**:
1. **Development**: Accept the risk in browser (not recommended for production)
2. **Production**: Use Let's Encrypt or commercial CA certificate
3. **Local Testing**: Add certificate to system trust store

### Service Can't Read Secrets

**Error**: `Error reading secret from /run/secrets/...`

**Solutions**:
1. Verify secret exists: `docker secret ls`
2. Check secret is attached to service in `docker-compose.swarm.yml`
3. Verify secret file path is correct
4. Check service logs: `docker service logs <service-name>`

### HTTPS Redirect Loop

**Cause**: Reverse proxy or load balancer already handling HTTPS

**Solution**: Update nginx config to check `X-Forwarded-Proto` header:
```nginx
if ($http_x_forwarded_proto = "http") {
    return 301 https://$host$request_uri;
}
```

### Database Connection Fails After Secrets Implementation

**Cause**: PostgreSQL still trying to read environment variables

**Solution**: Ensure using `_FILE` environment variables:
```yaml
POSTGRES_USER_FILE: /run/secrets/postgres_user
POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [Content Security Policy](https://content-security-policy.com/)

---

## Security Contact

For security issues, please contact the development team or create a private security advisory on GitHub.

**Last Updated**: March 2026
