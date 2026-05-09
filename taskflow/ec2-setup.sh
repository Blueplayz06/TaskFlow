#!/bin/bash
# ============================================================
#  TaskFlow — EC2 Setup Script
#  Run this ONCE on a fresh Ubuntu 24.04 EC2 instance
#  Usage: chmod +x ec2-setup.sh && ./ec2-setup.sh
# ============================================================

set -e
echo "🚀 Setting up TaskFlow on EC2..."

# ── Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# ── Install Docker
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ── Allow ubuntu user to run Docker without sudo
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# ── Create app directory
mkdir -p ~/taskflow
cd ~/taskflow

# ── Download production compose file from your GitHub repo
curl -o docker-compose.prod.yml \
  https://raw.githubusercontent.com/Blueplayz06/taskflow/main/docker-compose.prod.yml

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create ~/taskflow/.env.production with your secrets"
echo "  2. Run: docker compose -f docker-compose.prod.yml up -d"
echo "  3. App will be live at http://$(curl -s ifconfig.me)"
