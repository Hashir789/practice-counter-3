# Deployment Guide

This guide provides detailed instructions for deploying the Counter App to AWS EC2.

## Prerequisites

- An AWS account
- EC2 instance launched (Ubuntu 22.04 LTS recommended)
- Domain name (optional, but recommended)
- SSH access to EC2 instance

## Step 1: Launch EC2 Instance

1. Log in to AWS Console
2. Navigate to EC2 → Instances → Launch Instance
3. Choose Ubuntu Server 22.04 LTS
4. Select instance type (t2.micro is sufficient for testing)
5. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere (optional)
6. Create or select a key pair for SSH access
7. Launch the instance

## Step 2: Initial Server Setup

### Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Run Setup Script

On your local machine:

```bash
# Copy setup script to EC2
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@your-ec2-ip:~/

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run setup
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Or manually install:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create app directories
mkdir -p ~/app/frontend
mkdir -p ~/app/backups

# Copy deployment script
# (copy scripts/deploy.sh to ~/app/deploy.sh)
chmod +x ~/app/deploy.sh
```

## Step 3: Configure Nginx

### Basic Configuration

```bash
sudo nano /etc/nginx/sites-available/frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one
    
    root /home/ubuntu/app/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 4: Set Up SSL (Optional but Recommended)

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Step 5: Configure GitHub Actions

### Generate SSH Key for GitHub Actions

On your local machine:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f github-actions-key
```

### Add Public Key to EC2

```bash
# Copy public key to EC2
cat github-actions-key.pub | ssh -i your-key.pem ubuntu@your-ec2-ip "cat >> ~/.ssh/authorized_keys"
```

### Add Private Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

   - **EC2_HOST**: Your EC2 public IP or domain name
   - **EC2_USER**: `ubuntu` (or your EC2 username)
   - **EC2_SSH_PRIVATE_KEY**: Content of `github-actions-key` (the private key)

   ```bash
   # Copy private key content
   cat github-actions-key
   # Copy the entire output including -----BEGIN and -----END lines
   ```

## Step 6: Test Deployment

### Manual Test

1. Build the project locally:
   ```bash
   npm run build
   ```

2. Copy to EC2:
   ```bash
   scp -r dist/* ubuntu@your-ec2-ip:~/app/frontend/
   ```

3. Reload Nginx:
   ```bash
   ssh ubuntu@your-ec2-ip "sudo systemctl reload nginx"
   ```

4. Visit `http://your-ec2-ip` in your browser

### Automated Deployment

1. Push to the `main` branch:
   ```bash
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Run linting and formatting checks
   - Build the project
   - Run tests
   - Deploy to EC2

3. Monitor the workflow in GitHub Actions tab

## Step 7: Verify Deployment

1. Check application is accessible:
   ```bash
   curl http://your-ec2-ip
   ```

2. Check Nginx status:
   ```bash
   ssh ubuntu@your-ec2-ip "sudo systemctl status nginx"
   ```

3. Check application logs (if any):
   ```bash
   ssh ubuntu@your-ec2-ip "ls -la ~/app/frontend/"
   ```

## Troubleshooting

### Deployment Script Fails

- Check script permissions: `chmod +x ~/app/deploy.sh`
- Verify Nginx is installed: `which nginx`
- Check Nginx configuration: `sudo nginx -t`

### GitHub Actions Deployment Fails

- Verify SSH key is correctly added to secrets
- Check EC2 security group allows SSH from GitHub Actions
- Test SSH connection manually:
  ```bash
  ssh -i github-actions-key ubuntu@your-ec2-ip
  ```

### Nginx 502 Bad Gateway

- Check file permissions: `sudo chown -R ubuntu:ubuntu ~/app/frontend`
- Verify files exist: `ls -la ~/app/frontend/`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Application Not Loading

- Check Nginx is running: `sudo systemctl status nginx`
- Verify port 80 is open: `sudo ufw status`
- Check browser console for errors

## Maintenance

### Updating the Application

Simply push to the `main` branch. GitHub Actions will handle the deployment.

### Manual Rollback

```bash
ssh ubuntu@your-ec2-ip
cd ~/app/backups
ls -la  # List available backups
tar -xzf frontend_backup_YYYYMMDD_HHMMSS.tar.gz -C ~/app/
sudo systemctl reload nginx
```

### Monitoring

- Check Nginx access logs: `sudo tail -f /var/log/nginx/access.log`
- Monitor server resources: `htop` or `top`
- Check disk space: `df -h`

## Security Considerations

1. **Firewall**: Configure UFW to only allow necessary ports
2. **SSH**: Disable password authentication, use keys only
3. **SSL**: Always use HTTPS in production
4. **Updates**: Regularly update system packages
5. **Backups**: Keep deployment backups in `~/app/backups`

## Cost Optimization

- Use t2.micro or t3.micro for small projects (free tier eligible)
- Enable CloudWatch alarms for cost monitoring
- Use S3 for static assets if needed (cheaper than EC2 storage)
- Consider using AWS Lightsail for simpler pricing

