#!/bin/bash

# Deployment script for EC2 server
# This script should be placed on the EC2 server at ~/app/deploy.sh

set -e

APP_DIR=~/app/frontend
BACKUP_DIR=~/app/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting deployment at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current deployment if it exists
if [ -d "$APP_DIR" ]; then
  echo "Creating backup..."
  tar -czf "$BACKUP_DIR/frontend_backup_$TIMESTAMP.tar.gz" -C ~/app frontend
  echo "Backup created: frontend_backup_$TIMESTAMP.tar.gz"
fi

# Ensure the app directory exists
mkdir -p "$APP_DIR"

# Check if nginx is installed and running
if command -v nginx &> /dev/null; then
  echo "Nginx is installed"
  
  # Update nginx configuration if needed
  if [ ! -f /etc/nginx/sites-available/frontend ]; then
    echo "Creating nginx configuration..."
    sudo tee /etc/nginx/sites-available/frontend > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    root $APP_DIR;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    sudo ln -sf /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
  fi
  
  # Test nginx configuration
  sudo nginx -t
  
  # Reload nginx
  sudo systemctl reload nginx
  echo "Nginx reloaded successfully"
else
  echo "Warning: Nginx is not installed. Please install and configure it manually."
fi

echo "Deployment completed successfully at $(date)"

