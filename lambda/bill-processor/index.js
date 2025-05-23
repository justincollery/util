const AWS = require('aws-sdk');
const pdf = require('pdf-parse');

const s3 = new AWS.S3();
const bedrock = new AWS.BedrockRuntime({ region: process.env.BEDROCK_REGION || process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Lambda triggered with event:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                await processBillUpload(record.s3);
            }
        }
        
        return { statusCode: 200, body: 'Processing completed' };
    } catch (error) {
        console.error('Error processing bills:', error);
        throw error;
    }
};

async function processBillUpload(s3Event) {
    const bucket = s3Event.bucket.name;
    const key = s3Event.object.key;
    
    console.log(`Processing file: ${bucket}/${key}`);
    
    if (!key.toLowerCase().endsWith('.pdf')) {
        console.log('Skipping non-PDF file');
        return;
    }
    
    try {
        const extractedText = await extractTextFromPDF(bucket, key);
        const billData = await analyzeBillWithBedrock(extractedText);
        await storeBillData(key, billData, extractedText);
        
        console.log('Bill processing completed successfully');
    } catch (error) {
        console.error(`Error processing bill ${key}:`, error);
        throw error;
    }
}

async function extractTextFromPDF(bucket, key) {
    console.log('Extracting text from PDF...');
    
    const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const pdfData = await pdf(s3Object.Body);
    
    console.log(`Extracted ${pdfData.text.length} characters from PDF`);
    return pdfData.text;
}

async function analyzeBillWithBedrock(text) {
    console.log('Analyzing bill with Bedrock...');
    
    const prompt = `Please analyze this utility bill text and extract the following information in JSON format:
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

If any field cannot be determined, use null. Here is the bill text:

${text}`;

    const params = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    };

    const response = await bedrock.invokeModel(params).promise();
    const responseBody = JSON.parse(response.body.toString());
    
    let billData;
    try {
        billData = JSON.parse(responseBody.content[0].text);
    } catch (parseError) {
        console.error('Failed to parse Bedrock response as JSON:', responseBody.content[0].text);
        throw new Error('Invalid JSON response from Bedrock');
    }
    
    console.log('Extracted bill data:', JSON.stringify(billData, null, 2));
    return billData;
}

async function storeBillData(s3Key, billData, rawText) {
    console.log('Storing bill data in DynamoDB...');
    
    const keyParts = s3Key.split('/');
    const userId = keyParts[1];
    const utilityType = keyParts[3];
    const fileName = keyParts[4];
    
    const item = {
        userId: userId,
        billId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        s3Key: s3Key,
        fileName: fileName,
        uploadDate: new Date().toISOString(),
        utilityType: utilityType,
        extractedData: billData,
        rawText: rawText,
        processingStatus: 'completed'
    };
    
    const params = {
        TableName: process.env.BILLS_TABLE_NAME,
        Item: item
    };
    
    await dynamodb.put(params).promise();
    console.log('Bill data stored successfully');
}