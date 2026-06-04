import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import type { Schema } from '../../data/resource';

const stsClient = new STSClient({});

export const handler: Schema['uploadToGlacier']['functionHandler'] = async (event) => {
  const { fileName, fileContent, folderPath, contentType } = event.arguments;

  const crossAccountRoleArn = process.env.CROSS_ACCOUNT_ROLE_ARN;
  const crossAccountBucket = process.env.CROSS_ACCOUNT_BUCKET;
  const crossAccountRegion = process.env.CROSS_ACCOUNT_REGION || 'us-east-1';

  if (!crossAccountRoleArn || !crossAccountBucket) {
    throw new Error('Cross-account configuration missing. Set CROSS_ACCOUNT_ROLE_ARN and CROSS_ACCOUNT_BUCKET');
  }

  // Get user identity
  const identity = event.identity as any;
  const userSub = identity?.sub || identity?.claims?.sub || 'anonymous';

  console.log('Upload request:', {
    fileName,
    folderPath: folderPath || 'root',
    userSub,
    bucket: crossAccountBucket,
  });

  try {
    // Assume cross-account role
    const assumeRoleResponse = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: crossAccountRoleArn,
        RoleSessionName: `glacier-upload-${userSub}-${Date.now()}`,
        DurationSeconds: 900,
      })
    );

    const credentials = assumeRoleResponse.Credentials!;

    // Create S3 client with assumed role credentials
    const s3Client = new S3Client({
      region: crossAccountRegion,
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!,
      },
    });

    // Build S3 key with user isolation
    const s3Key = folderPath
      ? `${userSub}/${folderPath}/${fileName}`
      : `${userSub}/${fileName}`;

    // Decode base64 file content
    const buffer = Buffer.from(fileContent, 'base64');

    console.log('Uploading to S3 with Glacier storage:', {
      bucket: crossAccountBucket,
      key: s3Key,
      size: buffer.length,
      storageClass: 'GLACIER',
    });

    // Upload to S3 with GLACIER storage class
    await s3Client.send(
      new PutObjectCommand({
        Bucket: crossAccountBucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        StorageClass: 'GLACIER', // Use GLACIER storage class
        Metadata: {
          uploadedBy: userSub,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    console.log('Upload successful');

    return {
      success: true,
      key: s3Key,
      bucket: crossAccountBucket,
      storageClass: 'GLACIER',
      message: 'File uploaded successfully to Glacier storage',
    };
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
  }
};
