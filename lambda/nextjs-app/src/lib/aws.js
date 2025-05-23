import AWS from 'aws-sdk';

// Initialize AWS configuration
export const initAWS = () => {
  AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1', // Default to Ireland region
    signatureVersion: 'v4' // Required for eu-west-1
  });
  
  return AWS;
};

// Create S3 service object
export const getS3 = () => {
  const AWS = initAWS();
  
  return new AWS.S3({
    params: { Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET },
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1'
  });
};

// Upload file to S3
export const uploadToS3 = async (file, userId, options = {}) => {
  const s3 = getS3();
  
  // Create user-specific folder path with clean filename
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = userId 
    ? `users/${userId}/${options.folderPath || ''}${fileName}`
    : `uploads/${options.folderPath || ''}${fileName}`;
  
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read', // Making it public for easier testing
    ...options
  };
  
  try {
    console.log('Starting upload to S3 with params:', {
      bucket: params.Bucket,
      key: params.Key,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      fileType: file.type,
      fileSize: file.size
    });
    
    const startTime = Date.now();
    const upload = s3.upload(params);
    
    // Create a promise that will be resolved when the upload is complete
    // with progress tracking
    return new Promise((resolve, reject) => {
      // Setup progress tracking
      if (options.onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          const progressPercentage = Math.round((progress.loaded * 100) / progress.total);
          const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
          console.log(`Upload progress: ${progressPercentage}%`);
          options.onProgress({
            loaded: progress.loaded,
            total: progress.total,
            percentage: progressPercentage,
            elapsedTime
          });
        });
      }
      
      // Handle completion or failure
      upload.send((err, data) => {
        if (err) {
          console.error('Error uploading to S3:', err);
          reject(err);
          return;
        }
        
        console.log('Upload successful:', data);
        
        // Create properly formatted S3 URL
        const region = process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1';
        const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
        const properLocation = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
        
        resolve({
          key: key,
          location: properLocation,
          bucket: bucketName,
          etag: data.ETag
        });
      });
    });
  } catch (error) {
    console.error('Error in S3 upload:', error);
    throw error;
  }
};

// Get a signed URL to temporarily access a private file
export const getSignedUrl = (key, expirySeconds = 60) => {
  const s3 = getS3();
  
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Key: key,
    Expires: expirySeconds
  };
  
  return s3.getSignedUrl('getObject', params);
};

// List files in a user's folder
export const listUserFiles = async (userId, prefix = '') => {
  const s3 = getS3();
  
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Prefix: `users/${userId}/${prefix}`
  };
  
  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents || [];
  } catch (error) {
    console.error('Error listing user files:', error);
    throw error;
  }
};

// Delete a file from S3
export const deleteS3File = async (key) => {
  const s3 = getS3();
  
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Key: key
  };
  
  try {
    const data = await s3.deleteObject(params).promise();
    return data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};