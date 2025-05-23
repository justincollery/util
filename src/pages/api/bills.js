import AWS from 'aws-sdk';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    switch (req.method) {
      case 'GET':
        return await getBills(req, res, userId);
      case 'DELETE':
        return await deleteBill(req, res, userId);
      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBills(req, res, userId) {
  const { utilityType, limit = 50, lastKey } = req.query;

  const params = {
    TableName: process.env.BILLS_TABLE_NAME || 'UtilityBills',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false,
    Limit: parseInt(limit),
  };

  if (utilityType) {
    params.FilterExpression = 'utilityType = :utilityType';
    params.ExpressionAttributeValues[':utilityType'] = utilityType;
  }

  if (lastKey) {
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
  }

  const result = await dynamodb.query(params).promise();

  const response = {
    bills: result.Items.map(item => ({
      billId: item.billId,
      fileName: item.fileName,
      uploadDate: item.uploadDate,
      utilityType: item.utilityType,
      processingStatus: item.processingStatus,
      extractedData: item.extractedData,
      s3Key: item.s3Key,
    })),
  };

  if (result.LastEvaluatedKey) {
    response.nextPageToken = encodeURIComponent(JSON.stringify(result.LastEvaluatedKey));
  }

  return res.status(200).json(response);
}

async function deleteBill(req, res, userId) {
  const { billId } = req.query;

  if (!billId) {
    return res.status(400).json({ error: 'billId is required' });
  }

  const params = {
    TableName: process.env.BILLS_TABLE_NAME || 'UtilityBills',
    Key: {
      userId,
      billId,
    },
  };

  await dynamodb.delete(params).promise();

  return res.status(200).json({ message: 'Bill deleted successfully' });
}