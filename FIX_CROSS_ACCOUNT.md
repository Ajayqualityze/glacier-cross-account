# Fix Cross-Account Role Setup

This guide fixes the error:

> One of the entities that you specified for this operation does not exist.
> - The role with name CrossAccountS3GlacierRole cannot be found.

## Step 0: Verify which account you are using

Run this in the terminal:

```bash
chmod +x scripts/aws-account-info.sh
scripts/aws-account-info.sh
```

- If the account is `767900165297`, you are in the **target account**.
- If the account is `322736531566`, you are in the **source account**.

## Step 1: Create/update the target role in the target account

The target role must exist in account `767900165297`.

If you are already in the target account, run:

```bash
chmod +x scripts/create-cross-account-role.sh
scripts/create-cross-account-role.sh 322736531566 my-glacier-bucket-2026
```

This creates or updates:
- `CrossAccountS3GlacierRole`
- trust policy allowing the source account `322736531566`
- S3 access policy for `my-glacier-bucket-2026`

## Step 2: Confirm the target role trust policy

The trust policy for `CrossAccountS3GlacierRole` should look like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::322736531566:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Step 3: Attach source role policy in the source account

You must switch to the source account `322736531566` for this.

Then attach the policy to the source Lambda role, for example:

```bash
chmod +x scripts/attach-assume-policy.sh
scripts/attach-assume-policy.sh amplify-d1uayzli2ilhs7-ma-listCrossAccountFoldersla-rneeOyxxxkta
```

If that role name is not found, list the available source Amplify roles:

```bash
aws iam list-roles --query "Roles[?contains(RoleName,'amplify-d1uayzli2ilhs7')].RoleName" --output text
```

## Step 4: Configure Amplify env vars

In Amplify Console, set:

- `CROSS_ACCOUNT_ROLE_ARN` = ARN from Step 1
- `CROSS_ACCOUNT_BUCKET` = `my-glacier-bucket-2026`
- `CROSS_ACCOUNT_REGION` = `us-east-1`

Then redeploy your Amplify app.

## Notes

- `CrossAccountS3GlacierRole` must exist in the **target account**.
- The source Lambda role must exist in the **source account**.
- The CLI output shows the current account, so check carefully before attaching policies.
