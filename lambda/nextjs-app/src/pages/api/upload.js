import AWS from 'aws-sdk';
import { getSession } from 'next-auth/react';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize S3
const initS3 = () => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1',
    signatureVersion: 'v4'
  });
  return s3;
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getSession({ req });
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse form with formidable
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Error parsing form' });
      }

      try {
        // Log the files structure to understand its format
        console.log('Files received:', JSON.stringify(files));
        
        // In newer versions of formidable, files.file might be an array
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get utility type from the request
        const utilityType = fields.utilityType || 'all';
        const folderPath = fields.folderPath || `bills/${utilityType}/`;

        // Clean filename - handle different formidable versions
        const originalFilename = file.originalFilename || file.name || 'file';
        const fileName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Create key for S3
        const key = `users/${session.user.id}/${folderPath}${fileName}`;

        // Read file - handle different formidable versions
        const filePath = file.filepath || file.path;
        const fileContent = fs.readFileSync(filePath);

        // Initialize S3
        const s3 = initS3();

        // Upload to S3
        const params = {
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
          Key: key,
          Body: fileContent,
          ContentType: file.mimetype || file.type || 'application/octet-stream'
          // Removed ACL property as it's not supported by the bucket
        };

        const s3Response = await s3.upload(params).promise();

        // Format response URL
        const region = process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1';
        const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
        const location = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

        // Return success response
        res.status(200).json({
          success: true,
          key: key,
          location: location,
          etag: s3Response.ETag
        });
      } catch (uploadError) {
        console.error('Error uploading to S3:', uploadError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error uploading to S3', details: uploadError.message });
        }
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
}