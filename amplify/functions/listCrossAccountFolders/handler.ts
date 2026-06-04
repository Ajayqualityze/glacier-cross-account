import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import type { Schema } from '../../data/resource';

const stsClient = new STSClient({});

export const handler: Schema['listCrossAccountFolders']['functionHandler'] = async (event) => {
  const { prefix } = event.arguments;

  const crossAccountRoleArn = process.env.CROSS_ACCOUNT_ROLE_ARN;
  const crossAccountBucket = process.env.CROSS_ACCOUNT_BUCKET;
  const crossAccountRegion = process.env.CROSS_ACCOUNT_REGION || 'us-east-1';

  if (!crossAccountRoleArn || !crossAccountBucket) {
    throw new Error('Cross-account configuration missing');
  }

  const identity = event.identity as any;
  const userSub = identity?.sub || identity?.claims?.sub || 'anonymous';

  // Build prefix with user isolation
  const fullPrefix = prefix ? `${userSub}/${prefix}` : `${userSub}/`;

  console.log('List request:', {
    userSub,
    prefix: fullPrefix,
    bucket: crossAccountBucket,
  });

  try {
    // Assume cross-account role
    const assumeRoleResponse = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: crossAccountRoleArn,
        RoleSessionName: `glacier-list-${userSub}-${Date.now()}`,
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

    const folders: string[] = [];
    const files: Array<{
      key: string;
      size: number;
      lastModified: string;
      storageClass: string;
    }> = [];

    let continuationToken: string | undefined;

    // Paginate through all objects
    do {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: crossAccountBucket,
          Prefix: fullPrefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        })
      );

      // Collect folders (CommonPrefixes)
      if (response.CommonPrefixes) {
        for (const commonPrefix of response.CommonPrefixes) {
          if (commonPrefix.Prefix) {
            // Remove user prefix for display
            const displayPath = commonPrefix.Prefix.replace(`${userSub}/`, '');
            folders.push(displayPath);
          }
        }
      }

      // Collect files
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && !object.Key.endsWith('/')) {
            const displayPath = object.Key.replace(`${userSub}/`, '');
            files.push({
              key: displayPath,
              size: object.Size || 0,
              lastModified: object.LastModified?.toISOString() || '',
              storageClass: object.StorageClass || 'STANDARD',
            });
          }
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log(`Found ${folders.length} folders and ${files.length} files`);

    return {
      folders,
      files,
      bucket: crossAccountBucket,
    };
  } catch (error) {
    console.error('List failed:', error);
    throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : String(error)}`);
  }
};
