# Glacier Cross-Account Storage

A web application for uploading files to a cross-account S3 bucket with **Glacier storage class**, while displaying the folder structure from your current AWS account.

## Features

- ✅ **Cross-account S3 access** via IAM Role (AssumeRole)
- ✅ **Glacier storage class** for cost-effective long-term archival
- ✅ **File upload** with folder path support
- ✅ **Folder browser** with hierarchical navigation
- ✅ **User isolation** (files stored under user's Cognito sub)
- ✅ **Amplify authentication** (email/password)
- ✅ **Modern React UI** with Tailwind CSS

## Architecture

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│  React Frontend │   API    │  Lambda Function │  Assume  │  Cross-Account  │
│   (Vite + TS)   │─────────▶│  uploadToGlacier │─────────▶│   S3 Bucket     │
│                 │          │                  │   Role   │   (Glacier)     │
└─────────────────┘          └──────────────────┘          └─────────────────┘
        │                             │
        │                             │
        ▼                             ▼
┌─────────────────┐          ┌──────────────────┐
│  Cognito User   │          │  Current Account │
│      Pool       │          │   (Read folders) │
└─────────────────┘          └──────────────────┘
```

## Prerequisites

- **Node.js 18+** and npm
- **AWS Account** (current account)
- **Second AWS Account** (cross-account for S3 storage)
- **AWS CLI** configured with credentials

## Setup Instructions

### 1. Cross-Account IAM Role Configuration

In the **target AWS account** (where the S3 bucket will store files):

```bash
# Create S3 bucket
aws s3 mb s3://my-glacier-bucket --region us-east-1

# Create IAM role for cross-account access
```

Create a file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_CURRENT_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create the role:

```bash
aws iam create-role \
  --role-name CrossAccountS3GlacierRole \
  --assume-role-policy-document file://trust-policy.json

# Attach S3 permissions
aws iam put-role-policy \
  --role-name CrossAccountS3GlacierRole \
  --policy-name S3GlacierAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::my-glacier-bucket",
          "arn:aws:s3:::my-glacier-bucket/*"
        ]
      }
    ]
  }'
```

**Note the Role ARN** (e.g., `arn:aws:iam::123456789012:role/CrossAccountS3GlacierRole`)

### 2. Install Dependencies

```bash
cd glacier-cross-account
npm install
```

### 3. Configure Environment Variables

Update the Lambda environment variables in:
- `amplify/functions/uploadToGlacier/resource.ts`
- `amplify/functions/listCrossAccountFolders/resource.ts`

Set:
- `CROSS_ACCOUNT_ROLE_ARN`: The IAM role ARN from step 1
- `CROSS_ACCOUNT_BUCKET`: Your S3 bucket name (e.g., `my-glacier-bucket`)
- `CROSS_ACCOUNT_REGION`: AWS region (e.g., `us-east-1`)

### 4. Deploy Amplify Backend

```bash
npx ampx sandbox
```

This will:
- Create Cognito User Pool
- Deploy Lambda functions
- Generate `amplify_outputs.json`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Sign Up / Sign In

- Create a new account with email/password
- Verify your email
- Sign in

## Usage

### Upload Files

1. **Enter folder path** (optional, e.g., `documents/2024`)
2. **Select file** from your computer
3. Click **Upload to Cross-Account S3 (Glacier)**
4. File is uploaded with `GLACIER` storage class

### Browse Folders

- Navigate through folders by clicking on folder names
- View file details (name, size, storage class, last modified)
- Click breadcrumb path to navigate back
- Files show **GLACIER** badge for storage class

## File Storage Structure

Files are stored in S3 with user isolation:

```
s3://my-glacier-bucket/
  └── {user-cognito-sub}/
      ├── file1.pdf (Glacier)
      └── documents/
          └── 2024/
              └── report.pdf (Glacier)
```

## Storage Classes

| Storage Class | Use Case | Retrieval Time | Cost |
|---------------|----------|----------------|------|
| GLACIER | Long-term archives | Minutes to hours | Very low |
| STANDARD | Frequent access | Instant | Standard |

## Project Structure

```
glacier-cross-account/
├── amplify/
│   ├── auth/resource.ts          # Cognito authentication
│   ├── data/resource.ts          # API schema
│   ├── functions/
│   │   ├── uploadToGlacier/      # Upload Lambda
│   │   └── listCrossAccountFolders/  # List Lambda
│   └── backend.ts                # Amplify backend config
├── src/
│   ├── api/glacier.ts            # API client
│   ├── components/
│   │   ├── FileUpload.tsx        # Upload UI
│   │   └── FolderBrowser.tsx     # Folder navigation
│   ├── App.tsx                   # Main app
│   └── main.tsx                  # Entry point
├── package.json
├── vite.config.ts
└── README.md
```

## Troubleshooting

### "Cross-account configuration missing"

- Verify `CROSS_ACCOUNT_ROLE_ARN` is set in Lambda environment
- Check role ARN format: `arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME`

### "Access Denied" when uploading

- Verify trust policy allows your current account
- Check S3 bucket policy allows cross-account access
- Ensure role has `s3:PutObject` permission

### "No files or folders found"

- Upload at least one file first
- Check S3 bucket name is correct
- Verify role has `s3:ListBucket` permission

## Production Deployment

For production:

1. Deploy backend:
   ```bash
   npx ampx pipeline-deploy --branch main
   ```

2. Build frontend:
   ```bash
   npm run build
   ```

3. Deploy to:
   - AWS Amplify Hosting
   - Vercel
   - Netlify
   - S3 + CloudFront

## Security Notes

- ✅ User files are isolated by Cognito sub
- ✅ Cross-account access uses temporary STS credentials
- ✅ IAM role follows least-privilege principle
- ✅ Files encrypted at rest by default (S3)

## Cost Optimization

Glacier storage is **~$0.004/GB/month** (vs $0.023/GB for Standard)

Example:
- 1 TB stored for 1 year = **~$50** (Glacier) vs **~$280** (Standard)

## License

MIT

---

**Built with:** AWS Amplify, React, TypeScript, Vite, Tailwind CSS
