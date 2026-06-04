# Quick Start Guide

## 1. Prerequisites Check

```bash
node --version  # Should be 18+
aws --version   # AWS CLI should be configured
```

## 2. Set Up Cross-Account Role

In the **target AWS account** (where files will be stored):

```bash
# 1. Create S3 bucket
aws s3 mb s3://YOUR_BUCKET_NAME --region us-east-1

# 2. Create IAM role
# Replace YOUR_CURRENT_ACCOUNT_ID with your main AWS account ID
aws iam create-role \
  --role-name CrossAccountS3GlacierRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::YOUR_CURRENT_ACCOUNT_ID:root"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 3. Attach permissions
aws iam put-role-policy \
  --role-name CrossAccountS3GlacierRole \
  --policy-name S3GlacierAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }]
  }'

# 4. Note the Role ARN (you'll need this)
aws iam get-role --role-name CrossAccountS3GlacierRole --query 'Role.Arn' --output text
```

## 3. Configure Project

```bash
cd glacier-cross-account

# Install dependencies
npm install

# Update Lambda environment variables
# Edit these files:
# - amplify/functions/uploadToGlacier/resource.ts
# - amplify/functions/listCrossAccountFolders/resource.ts

# Set:
# CROSS_ACCOUNT_ROLE_ARN: arn:aws:iam::TARGET_ACCOUNT:role/CrossAccountS3GlacierRole
# CROSS_ACCOUNT_BUCKET: YOUR_BUCKET_NAME
# CROSS_ACCOUNT_REGION: us-east-1
```

## 4. Deploy Backend

```bash
npx ampx sandbox
```

Wait for deployment to complete. You'll see:
- ✅ Cognito User Pool created
- ✅ Lambda functions deployed
- ✅ API endpoints ready

## 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

## 6. Test the Application

1. **Sign up** with a new account
2. **Verify email** (check your inbox)
3. **Sign in**
4. **Upload a file** to test Glacier storage
5. **Browse folders** to see your files

## Common Issues

### "Module not found" errors

```bash
npm install --legacy-peer-deps
```

### Lambda deployment fails

Check your AWS credentials:

```bash
aws sts get-caller-identity
```

### Cross-account access denied

Verify:
1. Role ARN is correct
2. Trust policy includes your account ID
3. S3 permissions are attached to the role

## Next Steps

- [ ] Configure custom domain
- [ ] Set up CI/CD pipeline
- [ ] Add file download functionality
- [ ] Implement Glacier restore workflow
- [ ] Add file metadata/tagging

## Support

For issues, check:
- CloudWatch Logs (Lambda errors)
- Browser Console (frontend errors)
- AWS IAM Policy Simulator (permission issues)
