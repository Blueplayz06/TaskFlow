# GitHub Actions Secrets — Setup Guide
# ======================================
# Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret
# Add each of these:

# ── Docker Hub
DOCKER_USERNAME=devansh2121
DOCKER_PASSWORD=<your Docker Hub password or access token>
# Get a token: hub.docker.com → Account Settings → Security → New Access Token

# ── EC2 (fill in after Step 5 when EC2 is created)
EC2_HOST=<your EC2 public IP, e.g. 13.233.45.67>
EC2_USER=ubuntu
EC2_SSH_KEY=<contents of your .pem key file — the whole thing including BEGIN/END lines>

# ── Database (AWS RDS — fill in after Step 5)
DB_HOST=<your RDS endpoint, e.g. taskflow.abc123.ap-south-1.rds.amazonaws.com>
DB_USER=taskflow_user
DB_PASSWORD=<strong password>

# ── App secrets
JWT_SECRET=<long random string, e.g. run: openssl rand -hex 32>
CORS_ORIGIN=<your CloudFront URL, e.g. https://d1abc123.cloudfront.net>
