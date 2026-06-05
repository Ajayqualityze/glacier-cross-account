import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listCrossAccountFolders } from './functions/listCrossAccountFolders/resource';
import { uploadToGlacier } from './functions/uploadToGlacier/resource';

const backend = defineBackend({
  auth,
  data,
  listCrossAccountFolders,
  uploadToGlacier,
});

// Require the cross-account role ARN from environment variables
const crossAccountRoleArn = process.env.CROSS_ACCOUNT_ROLE_ARN;
if (!crossAccountRoleArn) {
  throw new Error('CROSS_ACCOUNT_ROLE_ARN must be set in the environment before synthesizing the backend');
}

// Add sts:AssumeRole permission to the listCrossAccountFolders function
const listFunction = backend.listCrossAccountFolders.resources.lambda;
listFunction.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['sts:AssumeRole'],
  resources: [crossAccountRoleArn],
}));

// Add sts:AssumeRole permission to the uploadToGlacier function
const uploadFunction = backend.uploadToGlacier.resources.lambda;
uploadFunction.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['sts:AssumeRole'],
  resources: [crossAccountRoleArn],
}));
