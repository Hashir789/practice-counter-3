#!/bin/bash

# Initial setup script for EC2 server
# Run this script once on your EC2 instance to set up the environment

set -e

echo "Setting up EC2 server for deployment..."

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (for potential server-side needs)
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
  echo "Installing Nginx..."
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
  sudo systemctl start nginx
fi

# Create app directories
mkdir -p ~/app/frontend
mkdir -p ~/app/backups

# Copy deployment script to server
if [ -f "./scripts/deploy.sh" ]; then
  cp ./scripts/deploy.sh ~/app/deploy.sh
  chmod +x ~/app/deploy.sh
  echo "Deployment script installed at ~/app/deploy.sh"
fi

# Set up firewall (if ufw is available)
if command -v ufw &> /dev/null; then
  echo "Configuring firewall..."
  sudo ufw allow 22/tcp  # SSH
  sudo ufw allow 80/tcp  # HTTP
  sudo ufw allow 443/tcp # HTTPS
  echo "Firewall rules added (review with: sudo ufw status)"
fi

echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your domain name in /etc/nginx/sites-available/frontend"
echo "2. Set up SSL with Let's Encrypt: sudo apt-get install certbot python3-certbot-nginx"
echo "3. Add your SSH public key to ~/.ssh/authorized_keys for GitHub Actions"
echo "4. Set up GitHub Actions secrets:"
echo "   - EC2_HOST: your EC2 public IP or domain"
echo "   - EC2_USER: your EC2 username (usually ubuntu or ec2-user)"
echo "   - EC2_SSH_PRIVATE_KEY: your SSH private key for EC2"

