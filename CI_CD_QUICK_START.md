# CI/CD Quick Start Guide

## 🚀 Quick Setup Checklist

### 1. AWS Setup (One-time)

- [ ] Create S3 bucket (see [AWS_SETUP.md](./AWS_SETUP.md))
- [ ] Create CloudFront distribution
- [ ] Create IAM user with S3 and CloudFront permissions
- [ ] Save AWS credentials (Access Key ID and Secret Access Key)

### 2. GitHub Secrets Setup

Go to: **Repository Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `my-react-app-production` |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` |

### 3. Test the Pipeline

```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

### 4. Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Watch the workflow run:
   - ✅ Lint and Format Check
   - ✅ Playwright Tests
   - ✅ Build Project
   - ✅ Deploy to AWS S3 and CloudFront
3. Wait 1-2 minutes for CloudFront invalidation
4. Visit your CloudFront URL

## 📋 Pipeline Flow

```
Push to main branch
    ↓
Lint & Format Check (ESLint + Prettier)
    ↓
Playwright Tests (runs in parallel)
    ↓
Build Project (npm run build)
    ↓
Deploy to S3 + CloudFront Invalidation
    ↓
✅ Live!
```

## 🔧 What Happens on Each Push

1. **Code Quality**: ESLint and Prettier ensure clean code
2. **Testing**: Playwright tests verify functionality
3. **Build**: Production build is created
4. **Deploy**: Files uploaded to S3 with optimized cache headers
5. **Cache Invalidation**: CloudFront cache cleared for instant updates

## 📝 Notes

- **Node.js Version**: 24.x (latest)
- **Build Output**: Automatically detects `build/` or `dist/` directory
- **Deployment**: Only runs on pushes to `main` branch
- **Cache Strategy**:
  - Static assets (JS, CSS, images): 1 year cache
  - HTML files: No cache (always fresh)

## 🆘 Troubleshooting

See [README.md](./README.md) troubleshooting section or [AWS_SETUP.md](./AWS_SETUP.md) for detailed help.

## 📚 Full Documentation

- **Setup Guide**: [AWS_SETUP.md](./AWS_SETUP.md)
- **Main README**: [README.md](./README.md)
- **Workflow File**: [.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml)

