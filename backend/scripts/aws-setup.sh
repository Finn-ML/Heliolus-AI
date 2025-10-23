#!/bin/bash

# Heliolus Platform - AWS S3 Setup Script
# This script configures AWS S3 bucket for production use

set -e

# Configuration
BUCKET_NAME="heliolus-documents"
REGION="us-east-1"
IAM_USER="heliolus-app-user"

echo "🌩️ Setting up AWS S3 for Heliolus Platform..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI first."
    echo "📖 Installation guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "👤 Current AWS identity:"
aws sts get-caller-identity

echo ""
read -p "🤔 Continue with S3 setup? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled."
    exit 1
fi

# Create S3 bucket
echo "🪣 Creating S3 bucket: $BUCKET_NAME"
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ Bucket $BUCKET_NAME already exists"
else
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    echo "✅ Created bucket: $BUCKET_NAME"
fi

# Enable versioning
echo "📦 Enabling versioning..."
aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" --versioning-configuration Status=Enabled
echo "✅ Versioning enabled"

# Configure bucket policy
echo "🔒 Configuring bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://aws/s3/bucket-policy.json
echo "✅ Bucket policy configured"

# Configure CORS
echo "🌐 Configuring CORS..."
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://aws/s3/cors-configuration.json
echo "✅ CORS configured"

# Configure lifecycle rules
echo "♻️ Configuring lifecycle rules..."
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --lifecycle-configuration file://aws/s3/lifecycle-configuration.json
echo "✅ Lifecycle rules configured"

# Enable server-side encryption
echo "🔐 Enabling server-side encryption..."
aws s3api put-bucket-encryption --bucket "$BUCKET_NAME" --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }
  ]
}'
echo "✅ Encryption enabled"

# Block public access (security)
echo "🛡️ Configuring public access block..."
aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
echo "✅ Public access configured"

# Create IAM user
echo "👤 Creating IAM user: $IAM_USER"
if aws iam get-user --user-name "$IAM_USER" 2>/dev/null; then
    echo "✅ IAM user $IAM_USER already exists"
else
    aws iam create-user --user-name "$IAM_USER"
    echo "✅ Created IAM user: $IAM_USER"
fi

# Attach IAM policy
echo "📋 Attaching IAM policy..."
aws iam put-user-policy --user-name "$IAM_USER" --policy-name HeliolusS3Access --policy-document file://aws/iam-policy.json
echo "✅ IAM policy attached"

# Create access keys
echo "🔑 Creating access keys..."
if aws iam list-access-keys --user-name "$IAM_USER" --query 'AccessKeyMetadata[0].AccessKeyId' --output text 2>/dev/null | grep -q "AKIA"; then
    echo "⚠️ Access keys already exist for user $IAM_USER"
    read -p "🤔 Create new access keys (this will require updating existing keys)? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        KEYS=$(aws iam create-access-key --user-name "$IAM_USER")
        echo "✅ New access keys created"
        echo ""
        echo "🔑 SAVE THESE CREDENTIALS:"
        echo "AWS_ACCESS_KEY_ID=$(echo $KEYS | jq -r '.AccessKey.AccessKeyId')"
        echo "AWS_SECRET_ACCESS_KEY=$(echo $KEYS | jq -r '.AccessKey.SecretAccessKey')"
    fi
else
    KEYS=$(aws iam create-access-key --user-name "$IAM_USER")
    echo "✅ Access keys created"
    echo ""
    echo "🔑 SAVE THESE CREDENTIALS:"
    echo "AWS_ACCESS_KEY_ID=$(echo $KEYS | jq -r '.AccessKey.AccessKeyId')"
    echo "AWS_SECRET_ACCESS_KEY=$(echo $KEYS | jq -r '.AccessKey.SecretAccessKey')"
fi

# Create folder structure
echo "📁 Creating folder structure..."
aws s3api put-object --bucket "$BUCKET_NAME" --key documents/ --content-length 0
aws s3api put-object --bucket "$BUCKET_NAME" --key uploads/ --content-length 0
aws s3api put-object --bucket "$BUCKET_NAME" --key temp/ --content-length 0
aws s3api put-object --bucket "$BUCKET_NAME" --key logs/ --content-length 0
aws s3api put-object --bucket "$BUCKET_NAME" --key backups/ --content-length 0
echo "✅ Folder structure created"

# Test bucket access
echo "🧪 Testing bucket access..."
echo "Test file" | aws s3 cp - "s3://$BUCKET_NAME/test.txt"
aws s3 rm "s3://$BUCKET_NAME/test.txt"
echo "✅ Bucket access test successful"

echo ""
echo "🎉 AWS S3 setup completed successfully!"
echo ""
echo "📝 Configuration Summary:"
echo "  - Bucket Name: $BUCKET_NAME"
echo "  - Region: $REGION"
echo "  - IAM User: $IAM_USER"
echo "  - Versioning: Enabled"
echo "  - Encryption: AES-256"
echo "  - CORS: Configured"
echo "  - Lifecycle Rules: Configured"
echo ""
echo "🔧 Next Steps:"
echo "  1. Add the access keys to your production environment variables"
echo "  2. Update your .env file with the S3 configuration"
echo "  3. Test S3 integration in your application"
echo ""
echo "⚠️ Security Reminders:"
echo "  - Never commit access keys to version control"
echo "  - Use IAM roles in production when possible"
echo "  - Regularly rotate access keys"
echo "  - Monitor CloudTrail for S3 access logs"