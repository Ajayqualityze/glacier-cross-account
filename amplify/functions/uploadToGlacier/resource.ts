import { defineFunction } from '@aws-amplify/backend';

export const uploadToGlacier = defineFunction({
  name: 'uploadToGlacier',
  entry: './handler.ts',
  timeoutSeconds: 900,
  runtime: 20,
  environment: {
    CROSS_ACCOUNT_ROLE_ARN: process.env.CROSS_ACCOUNT_ROLE_ARN || 'arn:aws:iam::767900165297:role/CrossAccountS3GlacierRole',
    CROSS_ACCOUNT_BUCKET: process.env.CROSS_ACCOUNT_BUCKET || 'my-glacier-bucket-2026',
    CROSS_ACCOUNT_REGION: process.env.CROSS_ACCOUNT_REGION || 'us-east-1',
  },
});



