# CI/CD Pipeline Setup - Next Steps

You already have your AWS infrastructure set up and your app is live at: **https://d1tdizimiz2qsf.cloudfront.net/**

Now let's connect it to GitHub Actions for automated deployments! 🚀

## Step 1: Gather Your AWS Information

You'll need to collect the following information from your AWS account:

### 1.1 Find Your S3 Bucket Name

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Note the bucket name that's hosting your app
   - It should be the one connected to your CloudFront distribution

### 1.2 Find Your CloudFront Distribution ID

1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Find your distribution (the one pointing to `d1tdizimiz2qsf.cloudfront.net`)
3. Copy the **Distribution ID** (starts with `E`, like `E1234567890ABC`)

### 1.3 Find Your AWS Region

1. Check your S3 bucket region
2. Common regions: `us-east-1`, `us-west-2`, `eu-west-1`, etc.

### 1.4 Get or Create IAM Credentials

**Option A: If you already have IAM user credentials:**
- You're ready to go! Skip to Step 2.

**Option B: If you need to create IAM user (recommended):**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. **User name**: `github-actions-deploy`
4. **Access type**: Select **Programmatic access**
5. Click **Next: Permissions**

6. **Attach policies directly**, then add:
   - `AmazonS3FullAccess` (or create custom policy for your specific bucket)
   - `CloudFrontFullAccess` (or create custom policy for your specific distribution)

7. Click **Next** → **Create user**

8. **IMPORTANT**: Copy these values immediately (you won't see the secret again):
   - **Access Key ID**: `AKIAIOSFODNN7EXAMPLE`
   - **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

   ⚠️ **Save these securely!**

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets:

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key | From Step 1.4 |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key | From Step 1.4 |
| `AWS_REGION` | Your AWS region | From Step 1.3 (e.g., `us-east-1`) |
| `AWS_S3_BUCKET` | Your S3 bucket name | From Step 1.1 |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront ID | From Step 1.2 |

### Example:
```
AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION = us-east-1
AWS_S3_BUCKET = my-react-app-production
AWS_CLOUDFRONT_DISTRIBUTION_ID = E1234567890ABC
```

✅ **All 5 secrets should be added before proceeding!**

## Step 3: Verify Your CI/CD Workflow

The workflow file is already set up at `.github/workflows/ci-cd.yml`. It will:

1. ✅ Run ESLint and Prettier checks
2. ✅ Run Playwright tests
3. ✅ Build your React project
4. ✅ Deploy to S3 and invalidate CloudFront

**No changes needed** - it's ready to go!

## Step 4: Test the Pipeline

1. **Make a small change to your code** (or just push if you haven't yet):
   ```bash
   git add .
   git commit -m "Setup CI/CD pipeline"
   git push origin main
   ```

2. **Monitor the deployment:**
   - Go to your repository on GitHub
   - Click the **Actions** tab
   - You should see a workflow run starting
   - Watch it progress through each step:
     - Lint and Format Check
     - Playwright Tests
     - Build Project
     - Deploy to AWS S3 and CloudFront

3. **Wait for completion:**
   - The entire process takes 3-5 minutes
   - CloudFront invalidation takes an additional 1-2 minutes
   - Look for the green checkmark ✅

## Step 5: Verify Deployment

1. **Wait 2-3 minutes** after the workflow completes (for CloudFront cache invalidation)
2. **Visit your site**: https://d1tdizimiz2qsf.cloudfront.net/
3. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) to see changes
4. **Check CloudFront Console**:
   - Go to CloudFront → Your Distribution → Invalidations
   - You should see a recent invalidation with status "Completed"

## 🎉 Success!

Your CI/CD pipeline is now active! Every time you push to the `main` branch:

- ✅ Code is automatically linted and formatted
- ✅ Tests run automatically
- ✅ App is built and deployed to S3
- ✅ CloudFront cache is invalidated
- ✅ Updates appear live within 2-3 minutes

## Troubleshooting

### Pipeline Fails with "Access Denied"

- Check IAM user has correct permissions
- Verify S3 bucket name is correct (case-sensitive)
- Ensure CloudFront distribution ID is correct

### Files Not Updating

- Wait 2-3 minutes for CloudFront invalidation
- Check invalidation status in CloudFront Console
- Hard refresh your browser (Ctrl+Shift+R)

### Build Directory Not Found

- The workflow automatically detects `build/` or `dist/` directories
- If your build outputs elsewhere, update `.github/workflows/ci-cd.yml`

### Want More Help?

- See [AWS_SETUP.md](./AWS_SETUP.md) for detailed AWS configuration
- See [README.md](./README.md) for full project documentation
- See [CI_CD_QUICK_START.md](./CI_CD_QUICK_START.md) for quick reference

## Next Steps (Optional)

- [ ] Set up custom domain (update CloudFront with your domain)
- [ ] Add staging environment (separate S3 bucket + CloudFront)
- [ ] Set up monitoring and alerts
- [ ] Configure branch protection rules in GitHub

---

**Your app is live at**: https://d1tdizimiz2qsf.cloudfront.net/

Happy deploying! 🚀

