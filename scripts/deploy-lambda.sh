#!/bin/bash

# Deployment script for bill processor Lambda function

set -e

LAMBDA_DIR="lambda/bill-processor"
FUNCTION_NAME="bill-processor"
STACK_NAME="bill-processor-stack"
S3_BUCKET_NAME=${1:-"your-utility-bills-bucket"}

echo "🚀 Deploying Bill Processor Infrastructure..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Deploy CloudFormation stack
echo "📦 Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file infrastructure/bill-processor-stack.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides S3BucketName=$S3_BUCKET_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${AWS_DEFAULT_REGION:-us-east-1}

echo "✅ CloudFormation stack deployed"

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd $LAMBDA_DIR
npm install --production
cd ../..

# Package Lambda function
echo "📦 Packaging Lambda function..."
cd $LAMBDA_DIR
zip -r bill-processor.zip . -x "*.git*" "node_modules/.cache/*"
cd ../..

# Update Lambda function code
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://$LAMBDA_DIR/bill-processor.zip \
    --region ${AWS_DEFAULT_REGION:-us-east-1}

# Clean up
rm $LAMBDA_DIR/bill-processor.zip

echo "✅ Lambda function deployed successfully"

# Configure S3 bucket notification (manual step required)
echo "⚠️  MANUAL STEP REQUIRED:"
echo "Configure S3 bucket notification in AWS Console:"
echo "1. Go to S3 bucket: $S3_BUCKET_NAME"
echo "2. Properties -> Event notifications -> Create event notification"
echo "3. Name: bill-processor-trigger"
echo "4. Prefix: users/"
echo "5. Suffix: .pdf"
echo "6. Event types: s3:ObjectCreated:*"
echo "7. Destination: Lambda function -> $FUNCTION_NAME"

echo "🎉 Deployment completed!"