import { defineBackend } from '@aws-amplify/backend';
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

// Grant Lambda functions permission to assume the cross-account role
const crossAccountRoleArn = process.env.CROSS_ACCOUNT_ROLE_ARN || 'arn:aws:iam::767900165297:role/CrossAccountS3GlacierRole';

// Add sts:AssumeRole permission to the listCrossAccountFolders function
const listFunction = backend.listCrossAccountFolders.resources.lambda;
listFunction.addToRolePolicy({
  Effect: 'Allow',
  Action: 'sts:AssumeRole',
  Resource: crossAccountRoleArn,
});

// Add sts:AssumeRole permission to the uploadToGlacier function
const uploadFunction = backend.uploadToGlacier.resources.lambda;
uploadFunction.addToRolePolicy({
  Effect: 'Allow',
  Action: 'sts:AssumeRole',
  Resource: crossAccountRoleArn,
});
