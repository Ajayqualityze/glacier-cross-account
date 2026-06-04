import { defineFunction } from '@aws-amplify/backend';

export const listCrossAccountFolders = defineFunction({
  name: 'listCrossAccountFolders',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  // Environment variables are set in Amplify Console → App settings → Environment variables
  // Add these 3 variables in the console:
  // CROSS_ACCOUNT_ROLE_ARN = arn:aws:iam::YOUR-ACCOUNT:role/CrossAccountS3GlacierRole
  // CROSS_ACCOUNT_BUCKET = your-bucket-name
  // CROSS_ACCOUNT_REGION = us-east-1
});
