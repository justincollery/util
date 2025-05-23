# Serverless Bill Processing Setup

This document describes the serverless architecture for processing utility bills uploaded to S3.

## Architecture Overview

```
S3 Bucket → Lambda Function → Bedrock (Claude) → DynamoDB
    ↓              ↓              ↓              ↓
  PDF Upload → Text Extract → Data Extract → Store Results
```

## Components

### 1. S3 Bucket Event Trigger
- Monitors uploads to `users/{userId}/bills/{utilityType}/` prefix
- Triggers Lambda function on PDF uploads

### 2. Lambda Function (`lambda/bill-processor/`)
- Extracts text from PDF using `pdf-parse`
- Sends text to AWS Bedrock with Claude model
- Stores extracted data in DynamoDB

### 3. AWS Bedrock Integration
- Uses `anthropic.claude-3-sonnet-20240229-v1:0` model
- Extracts structured data from bill text
- Returns JSON with utility details

### 4. DynamoDB Table (`UtilityBills`)
- Stores processed bill data
- Indexed by `userId` and `billId`
- Supports querying by date

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- AWS account with Bedrock enabled

### Environment Variables Required
Add to your environment:
```bash
export BILLS_TABLE_NAME=UtilityBills
export AWS_REGION=us-east-1
export S3_BUCKET_NAME=your-utility-bills-bucket
```

### Deployment Steps

1. **Deploy Infrastructure**:
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/bill-processor-stack.yaml \
     --stack-name bill-processor-stack \
     --parameter-overrides S3BucketName=your-utility-bills-bucket \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Install Lambda Dependencies**:
   ```bash
   cd lambda/bill-processor
   npm install --production
   cd ../..
   ```

3. **Deploy Lambda Function**:
   ```bash
   cd lambda/bill-processor
   zip -r bill-processor.zip .
   aws lambda update-function-code \
     --function-name bill-processor \
     --zip-file fileb://bill-processor.zip
   cd ../..
   ```

4. **Configure S3 Event Notification**:
   - Go to AWS S3 Console
   - Select your bucket
   - Navigate to Properties → Event notifications
   - Create event notification:
     - Name: `bill-processor-trigger`
     - Prefix: `users/`
     - Suffix: `.pdf`
     - Event types: `s3:ObjectCreated:*`
     - Destination: Lambda function `bill-processor`

### Quick Deploy Script
```bash
# Make executable and run
chmod +x scripts/deploy-lambda.sh
./scripts/deploy-lambda.sh your-bucket-name
```

## Data Extraction Schema

The Lambda function extracts the following data from utility bills:

```json
{
  "utilityType": "electricity|gas|water|internet|phone",
  "supplier": "supplier name",
  "billDate": "YYYY-MM-DD",
  "billingPeriod": {
    "from": "YYYY-MM-DD", 
    "to": "YYYY-MM-DD"
  },
  "units": {
    "consumed": "number",
    "unit": "kWh|m3|gallons|GB|minutes"
  },
  "costs": {
    "totalAmount": "number",
    "standingCharge": "number", 
    "unitRate": "number",
    "vatAmount": "number"
  },
  "tariff": "tariff name or plan",
  "meterReading": {
    "previous": "number",
    "current": "number"
  },
  "accountNumber": "account number",
  "address": "billing address"
}
```

## Frontend Integration

The dashboard automatically fetches processed bills via `/api/bills` endpoint:

- Displays extracted bill data
- Shows processing status
- Updates in real-time as bills are processed

## Monitoring

Monitor the system using:
- CloudWatch Logs for Lambda function
- DynamoDB metrics for storage
- S3 event notifications for triggers

## Troubleshooting

### Common Issues

1. **Lambda timeout**: Increase timeout to 300 seconds for large PDFs
2. **Bedrock access**: Ensure IAM role has `bedrock:InvokeModel` permission
3. **S3 notifications**: Verify event notification is configured correctly
4. **PDF parsing**: Some PDFs may require OCR for image-based text

### Logs
Check CloudWatch logs for the Lambda function:
```bash
aws logs tail /aws/lambda/bill-processor --follow
```

## Security Considerations

- Lambda function has minimal IAM permissions
- S3 bucket should have proper access controls
- DynamoDB table is encrypted at rest
- API endpoints require authentication
- No sensitive data in logs

## Cost Optimization

- Lambda charges per invocation and duration
- DynamoDB on-demand pricing scales with usage
- Bedrock charges per token processed
- Estimated cost: ~$0.01-0.05 per bill processed