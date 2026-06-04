import { defineFunction } from '@aws-amplify/backend';

export const uploadToGlacier = defineFunction({
  name: 'uploadToGlacier',
  entry: './handler.ts',
  timeoutSeconds: 900,
  runtime: 20,
  environment: {
    CROSS_ACCOUNT_ROLE_ARN: '', // Set this in environment or via secrets
    CROSS_ACCOUNT_BUCKET: '', // e.g., my-glacier-bucket
    CROSS_ACCOUNT_REGION: 'us-east-1',
  },
});
