# Counter App - React + TypeScript + Vite

A simple React counter application that increments a counter and resets to 0 after reaching 10. This project demonstrates best practices for:

- React development with TypeScript
- End-to-end testing with Playwright
- Code quality tools (ESLint, Prettier)
- CI/CD pipeline with GitHub Actions
- AWS S3 + CloudFront deployment

## Features

- ✅ Counter that increments on button click
- ✅ Automatic reset to 0 after 10 presses
- ✅ Playwright E2E tests
- ✅ ESLint and Prettier code quality checks
- ✅ Automated CI/CD pipeline
- ✅ AWS S3 + CloudFront deployment automation

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD pipeline
├── scripts/
│   ├── deploy.sh              # Deployment script for EC2 (legacy)
│   └── setup-ec2.sh           # Initial EC2 setup script (legacy)
├── src/
│   ├── App.tsx                # Main counter component
│   ├── App.css                # Component styles
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── tests/
│   └── counter.spec.ts        # Playwright E2E tests
├── .eslintrc.js               # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── playwright.config.ts       # Playwright configuration
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 24.x (latest)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run Playwright tests with UI mode
- `npm run test:headed` - Run Playwright tests in headed mode

## Testing

### Playwright Tests

The project includes comprehensive Playwright tests that verify:

- Initial counter display
- Increment functionality
- Reset behavior after 10 presses
- Multiple reset cycles
- UI elements visibility

Run tests with:
```bash
npm run test
```

Run tests with UI mode for debugging:
```bash
npm run test:ui
```

## Code Quality

### ESLint

ESLint is configured with TypeScript and React rules. Run:
```bash
npm run lint
```

### Prettier

Prettier ensures consistent code formatting. Format code with:
```bash
npm run format
```

Check formatting without making changes:
```bash
npm run format:check
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. **Lint & Format Check** - Runs ESLint and Prettier checks
2. **Test** - Runs Playwright tests automatically
3. **Build** - Builds the project for production
4. **Deploy** - Deploys to AWS S3 and invalidates CloudFront cache (only on main branch)

### Quick Start Guides

**Already have AWS set up?** → See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for connecting your existing AWS resources to GitHub Actions.

**Need to set up AWS from scratch?** → See [AWS_SETUP.md](./AWS_SETUP.md) for complete AWS infrastructure setup.

### Setting Up GitHub Actions

1. **Configure GitHub Secrets:**

   Go to your repository settings → Secrets and variables → Actions, and add:

   - `AWS_ACCESS_KEY_ID`: Your AWS IAM user access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS IAM user secret key
   - `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
   - `AWS_S3_BUCKET`: Your S3 bucket name
   - `AWS_CLOUDFRONT_DISTRIBUTION_ID`: Your CloudFront distribution ID

2. **Setup AWS Resources:**

   - **New to AWS?** See [AWS_SETUP.md](./AWS_SETUP.md) for detailed instructions
   - **Already have AWS?** See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for next steps

## AWS S3 + CloudFront Deployment

### Quick Start

**Already have AWS infrastructure?** → Jump to [CI_CD_SETUP.md](./CI_CD_SETUP.md)

**Need to set up AWS?** Follow these steps:

1. **Follow the AWS Setup Guide:**
   - See [AWS_SETUP.md](./AWS_SETUP.md) for complete instructions
   - Create S3 bucket and CloudFront distribution
   - Configure IAM user with proper permissions

2. **Connect to CI/CD:**
   - See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for connecting your AWS resources to GitHub Actions
   - Configure GitHub Secrets with your AWS credentials

3. **Push to main branch:**
   ```bash
   git push origin main
   ```

4. **Monitor Deployment:**
   - Check GitHub Actions tab for workflow status
   - Wait for CloudFront invalidation (1-2 minutes)
   - Visit your CloudFront distribution URL

### Manual Deployment

If you need to deploy manually:

```bash
# Build the project
npm run build

# Configure AWS credentials
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Build Output Directory

The workflow automatically detects:
- `build/` directory (Create React App default)
- `dist/` directory (Vite default)

If your build outputs to a different directory, update the workflow file.

## Best Practices Implemented

1. **Type Safety**: Full TypeScript support
2. **Code Quality**: ESLint + Prettier integration
3. **Testing**: Comprehensive E2E tests with Playwright
4. **CI/CD**: Automated pipeline with quality gates
5. **Deployment**: Automated deployment with rollback capability
6. **Security**: SSH key-based authentication
7. **Monitoring**: Build artifacts and test reports saved

## Troubleshooting

### Playwright Tests Fail

- Ensure the dev server is running: `npm run dev`
- Check browser installation: `npx playwright install`

### Deployment Fails

- Verify AWS credentials are correctly added to GitHub Secrets
- Check IAM user has S3 and CloudFront permissions
- Verify S3 bucket name matches exactly (case-sensitive)
- Ensure AWS region matches bucket region
- Check CloudFront distribution ID is correct
- Review AWS CloudWatch logs for detailed errors

### Build Fails

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version matches (24.x)
- Verify build output directory exists (`build/` or `dist/`)

### Files Not Updating After Deployment

- Wait 1-2 minutes for CloudFront invalidation to complete
- Check CloudFront invalidation status in AWS Console
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Verify cache headers are set correctly

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass: `npm run test`
5. Format code: `npm run format`
6. Submit a pull request
