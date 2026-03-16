#!/bin/bash

# SSL Certificate Generation Script for TaskCollab
# This script generates SSL certificates for HTTPS support

echo "🔒 TaskCollab SSL Certificate Generator"
echo "========================================"
echo ""

# Configuration
DOMAIN=${1:-"localhost"}
CERT_DIR="./ssl-certs"
DAYS_VALID=365

echo "Generating SSL certificate for: $DOMAIN"
echo "Certificate validity: $DAYS_VALID days"
echo ""

# Create certificate directory
mkdir -p "$CERT_DIR"

# Generate self-signed certificate
openssl req -x509 -nodes -days $DAYS_VALID -newkey rsa:2048 \
    -keyout "$CERT_DIR/nginx.key" \
    -out "$CERT_DIR/nginx.crt" \
    -subj "/C=CA/ST=Ontario/L=Toronto/O=TaskCollab/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,DNS:localhost,IP:127.0.0.1"

echo "✅ SSL certificate generated successfully!"
echo ""
echo "Certificate location: $CERT_DIR/nginx.crt"
echo "Private key location: $CERT_DIR/nginx.key"
echo ""
echo "⚠️  Note: This is a self-signed certificate suitable for development."
echo "    For production, use Let's Encrypt or a trusted CA."
echo ""
echo "📋 Next steps:"
echo "1. Copy certificates to your server"
echo "2. Update nginx configuration to use these certificates"
echo "3. For production with Let's Encrypt, see SECURITY.md"
