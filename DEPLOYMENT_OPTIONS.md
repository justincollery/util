# Frontend Deployment Options

This Next.js application can be deployed using several AWS services. Here are the options with their deployment commands:

## Option 1: AWS Amplify (Recommended for Static/SSG)

### Prerequisites:
- Amplify app already created: `d19e1k446kz9c7`
- Default URL: `https://d19e1k446kz9c7.amplifyapp.com`

### Deployment Commands:
```bash
# The Amplify app is created and configured
# Deployment failed due to build configuration issues
# Needs: Git repository or corrected amplify.yml configuration
```

### Current Status: 
❌ **Failed** - Build configuration needs adjustment

## Option 2: AWS Elastic Beanstalk (Recommended for SSR)

### Prerequisites:
Add these IAM policies to your user:
- `AWSElasticBeanstalkFullAccess`
- `AmazonEC2FullAccess`  
- `AmazonVPCFullAccess`

### Deployment Commands:
```bash
# Create EB application
aws elasticbeanstalk create-application \
  --application-name irish-utility-compare \
  --description "Irish Utility Bill Comparison Platform" \
  --region eu-west-1

# Create environment
aws elasticbeanstalk create-environment \
  --application-name irish-utility-compare \
  --environment-name production \
  --solution-stack-name "64bit Amazon Linux 2 v5.8.4 running Node.js 18" \
  --region eu-west-1

# Deploy application
aws elasticbeanstalk create-application-version \
  --application-name irish-utility-compare \
  --version-label v1.0.0 \
  --source-bundle S3Bucket=utility-bills-1747952656-2924,S3Key=deployments/eb-deploy.zip \
  --region eu-west-1

aws elasticbeanstalk update-environment \
  --environment-name production \
  --version-label v1.0.0 \
  --region eu-west-1
```

### Current Status:
⏳ **Ready to Deploy** - Requires additional permissions

## Option 3: Manual Deployment (Alternative)

### Using your own server or container platform:

1. **Build the application:**
```bash
npm install
npm run build
npm start
```

2. **Environment Variables:**
```bash
export NEXTAUTH_URL=https://your-domain.com
export NEXTAUTH_SECRET=your-secret-key
export NEXT_PUBLIC_AWS_REGION=eu-west-1
export NEXT_PUBLIC_AWS_S3_BUCKET=utility-bills-1747952656-2924
export BILLS_TABLE_NAME=UtilityBills
```

## Current Infrastructure Summary

✅ **Backend Services (Deployed):**
- Lambda Function: `bill-processor`
- DynamoDB Table: `UtilityBills`
- S3 Bucket: `utility-bills-1747952656-2924`
- Event Trigger: S3 → Lambda (PDF processing)

⏳ **Frontend Deployment (Pending):**
- Package ready: `eb-deploy.zip`
- Amplify app created but needs configuration fix
- EB deployment ready pending permissions

## Next Steps

1. **If using Elastic Beanstalk:** Add the required permissions and run the EB deployment commands above
2. **If using Amplify:** Fix the amplify.yml configuration or use a Git repository
3. **If using manual deployment:** Set up your own server with Node.js 18+

All backend services are fully operational and ready to process uploaded bills!