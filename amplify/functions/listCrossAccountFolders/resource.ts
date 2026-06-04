import { defineFunction } from '@aws-amplify/backend';

export const listCrossAccountFolders = defineFunction({
  name: 'listCrossAccountFolders',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  environmentVariables: {
    CROSS_ACCOUNT_ROLE_ARN: {
      type: 'string',
      value: process.env.CROSS_ACCOUNT_ROLE_ARN || 'arn:aws:iam::767900165297:role/CrossAccountS3GlacierRole',
    },
    CROSS_ACCOUNT_BUCKET: {
      type: 'string',
      value: process.env.CROSS_ACCOUNT_BUCKET || 'my-glacier-bucket-2026',
    },
    CROSS_ACCOUNT_REGION: {
      type: 'string',
      value: process.env.CROSS_ACCOUNT_REGION || 'us-east-1',
    },
  },
});

