import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import * as crypto from 'crypto';
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
    // Assume cross-account role (generate a safe RoleSessionName <= 64 chars)
    const makeRoleSessionName = (prefix: string, user: string) => {
      const maxLen = 64;
      const ts = String(Date.now());
      const normalized = (user || 'anonymous').replace(/[^A-Za-z0-9=,.@_\-]/g, '-');
      let candidate = `${prefix}-${normalized}-${ts}`;
      if (candidate.length <= maxLen) return candidate;
      const reserved = `${prefix}--${ts}`.length;
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
        RoleSessionName: makeRoleSessionName('glacier-list', userSub),
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
      foldersJson: JSON.stringify(folders),
      filesJson: JSON.stringify(files),
      bucket: crossAccountBucket,
    };
  } catch (error) {
    console.error('List failed:', error);
    throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : String(error)}`);
  }
};
