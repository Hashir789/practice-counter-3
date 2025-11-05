# AWS S3 + CloudFront Setup Guide

This guide will help you set up AWS S3 and CloudFront for hosting your React application using the AWS Free Tier.

## Prerequisites

- An AWS account (Free Tier eligible)
- Basic understanding of AWS services
- Your React app ready to deploy

## Step 1: Create S3 Bucket

1. **Navigate to S3 Console:**
   - Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
   - Click "Create bucket"

2. **Configure Bucket:**
   - **Bucket name**: Choose a unique name (e.g., `my-react-app-production`)
   - **Region**: Choose your preferred region (us-east-1 recommended for lower latency)
   - **Block Public Access**: Uncheck "Block all public access" (we'll configure this properly)
   - **Bucket Versioning**: Optional (recommended for production)
   - Click "Create bucket"

3. **Enable Static Website Hosting:**
   - Select your bucket
   - Go to "Properties" tab
   - Scroll to "Static website hosting"
   - Click "Edit"
   - Enable static website hosting
   - Set:
     - **Index document**: `index.html`
     - **Error document**: `index.html` (for React Router)
   - Save changes

4. **Configure Bucket Policy:**
   - Go to "Permissions" tab
   - Scroll to "Bucket policy"
   - Click "Edit"
   - Add the following policy (replace `YOUR-BUCKET-NAME`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       }
     ]
   }
   ```

   - Save changes

5. **Configure CORS (if needed):**
   - Go to "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Add CORS configuration if your app makes API calls:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

## Step 2: Create CloudFront Distribution

1. **Navigate to CloudFront Console:**
   - Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
   - Click "Create distribution"

2. **Configure Origin:**
   - **Origin domain**: Select your S3 bucket (or use the S3 website endpoint)
   - **Origin path**: Leave empty
   - **Name**: Auto-populated
   - **Origin access**: Choose "Public"
   - **Origin Shield**: Disable (for Free Tier)

3. **Configure Default Cache Behavior:**
   - **Viewer protocol policy**: Redirect HTTP to HTTPS (recommended)
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS
   - **Cache policy**: CachingOptimized (or CachingDisabled for testing)
   - **Origin request policy**: None (for static sites)
   - **Response headers policy**: None (or create custom if needed)

4. **Configure Distribution Settings:**
   - **Price class**: Use Only North America and Europe (cheaper, Free Tier friendly)
   - **Alternate domain names (CNAMEs)**: Add your custom domain (optional)
   - **SSL certificate**: Default CloudFront certificate (or request ACM certificate for custom domain)
   - **Default root object**: `index.html`
   - **Custom error responses**: 
     - **HTTP error code**: 403
     - **Response page path**: `/index.html`
     - **HTTP response code**: 200
     - (Repeat for 404 errors)

5. **Create Distribution:**
   - Click "Create distribution"
   - Wait 5-15 minutes for distribution to deploy
   - Note your **Distribution ID** (you'll need this for GitHub Secrets)

## Step 3: Configure IAM User for GitHub Actions

1. **Create IAM User:**
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Create user"
   - **User name**: `github-actions-deploy`
   - **Access type**: Programmatic access
   - Click "Next"

2. **Set Permissions:**
   - Click "Attach policies directly"
   - Add these policies:
     - `AmazonS3FullAccess` (or create custom policy for specific bucket)
     - `CloudFrontFullAccess` (or create custom policy for specific distribution)
   - Click "Next" → "Create user"

3. **Save Credentials:**
   - **Access Key ID**: Copy this (you'll add to GitHub Secrets)
   - **Secret Access Key**: Copy this (you'll add to GitHub Secrets)
   - ⚠️ **Save these securely - you won't see the secret key again!**

### Alternative: Create Custom IAM Policy (More Secure)

For better security, create a custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 4: Configure GitHub Secrets

1. **Go to GitHub Repository:**
   - Navigate to your repository
   - Go to Settings → Secrets and variables → Actions

2. **Add the following secrets:**

   | Secret Name | Value | Example |
   |------------|-------|---------|
   | `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
   | `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
   | `AWS_REGION` | AWS region | `us-east-1` |
   | `AWS_S3_BUCKET` | S3 bucket name | `my-react-app-production` |
   | `AWS_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` |

3. **Get CloudFront Distribution ID:**
   - Go to CloudFront Console
   - Click on your distribution
   - The Distribution ID is shown in the details

## Step 5: Test the Pipeline

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Setup CI/CD for S3 + CloudFront"
   git push origin main
   ```

2. **Monitor GitHub Actions:**
   - Go to your repository → Actions tab
   - Watch the workflow run
   - Check each step:
     - ✅ Lint and Format Check
     - ✅ Playwright Tests
     - ✅ Build Project
     - ✅ Deploy to AWS S3 and CloudFront

3. **Verify Deployment:**
   - Wait for CloudFront invalidation to complete (1-2 minutes)
   - Visit your CloudFront distribution URL (found in CloudFront Console)
   - Your app should be live! 🎉

## Step 6: Custom Domain (Optional)

1. **Request ACM Certificate:**
   - Go to [ACM Console](https://console.aws.amazon.com/acm/)
   - Request certificate for your domain
   - Validate via DNS or email
   - Wait for certificate to be issued

2. **Update CloudFront Distribution:**
   - Go to CloudFront Console
   - Edit your distribution
   - Add your domain to "Alternate domain names"
   - Select your ACM certificate
   - Save changes

3. **Configure DNS:**
   - Go to your domain registrar
   - Add CNAME record:
     - **Name**: `www` (or `@` for root domain)
     - **Value**: Your CloudFront distribution domain name
     - **TTL**: 300

## Troubleshooting

### Deployment Fails

- **Check AWS credentials**: Verify secrets are correct
- **Check IAM permissions**: Ensure user has S3 and CloudFront permissions
- **Check bucket name**: Ensure it matches exactly (case-sensitive)
- **Check region**: Ensure region matches bucket region

### Files Not Updating

- **CloudFront cache**: Wait 1-2 minutes for invalidation
- **Check invalidation status**: CloudFront Console → Invalidations
- **Browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 404 Errors on Routes

- **Check error pages**: Ensure CloudFront is configured to return `index.html` for 403/404
- **Check S3 static hosting**: Ensure error document is set to `index.html`

### Build Directory Not Found

- The workflow automatically detects `build/` or `dist/` directories
- If using a different directory, update the workflow file

## Cost Optimization (Free Tier)

- **S3**: 5 GB storage, 20,000 GET requests/month free
- **CloudFront**: 50 GB data transfer, 2,000,000 HTTP/HTTPS requests/month free
- **IAM**: Free
- **Total**: Free for small to medium applications! 🎉

## Monitoring

- **CloudFront**: Monitor in CloudWatch (free tier)
- **S3**: View metrics in S3 Console
- **GitHub Actions**: Check workflow runs in Actions tab

## Security Best Practices

1. ✅ Use IAM user with minimal permissions (not root account)
2. ✅ Enable CloudFront HTTPS redirect
3. ✅ Use bucket policies instead of public access
4. ✅ Rotate access keys regularly
5. ✅ Monitor CloudWatch for unusual activity
6. ✅ Enable S3 bucket versioning for production

## Next Steps

- Set up custom domain
- Configure custom error pages
- Set up monitoring and alerts
- Configure backup strategy
- Set up staging environment (separate S3 bucket + CloudFront)

