import { defineFunction } from '@aws-amplify/backend';

export const listCrossAccountFolders = defineFunction({
  name: 'listCrossAccountFolders',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  environment: {
    CROSS_ACCOUNT_ROLE_ARN: process.env.CROSS_ACCOUNT_ROLE_ARN || '',
    CROSS_ACCOUNT_BUCKET: process.env.CROSS_ACCOUNT_BUCKET || '',
    CROSS_ACCOUNT_REGION: process.env.CROSS_ACCOUNT_REGION || 'us-east-1',
  },
});



