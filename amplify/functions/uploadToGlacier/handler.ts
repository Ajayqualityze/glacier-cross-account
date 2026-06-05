import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import * as crypto from 'crypto';
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
    const makeRoleSessionName = (prefix: string, user: string) => {
      const maxLen = 64;
      const ts = String(Date.now());
      const normalized = (user || 'anonymous').replace(/[^A-Za-z0-9=,.@_\-]/g, '-');
      let candidate = `${prefix}-${normalized}-${ts}`;
      if (candidate.length <= maxLen) return candidate;
      const reserved = `${prefix}--${ts}`.length; // dashes included
      const maxUser = Math.max(1, maxLen - reserved);
      if (maxUser > 0) {
        const truncated = normalized.slice(0, maxUser);
        candidate = `${prefix}-${truncated}-${ts}`;
        if (candidate.length <= maxLen) return candidate;
      }
      const hash = crypto.createHash('sha256').update(user + ts).digest('hex').slice(0, 16);
      return `${prefix}-${hash}`;
    };

    const assumeRoleResponse = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: crossAccountRoleArn,
        RoleSessionName: makeRoleSessionName('glacier-upload', userSub),
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
