#!/bin/bash

# LocalStack initialization script for AWS S3 setup
# This script runs when LocalStack container is ready

echo "Initializing LocalStack S3 for Heliolus Platform..."

# Wait for LocalStack to be fully ready
sleep 10

# Create S3 bucket for documents
awslocal s3 mb s3://heliolus-documents

# Set bucket policy for development (public read access)
awslocal s3api put-bucket-policy --bucket heliolus-documents --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::heliolus-documents/*"
    }
  ]
}'

# Create some example folders
awslocal s3api put-object --bucket heliolus-documents --key documents/
awslocal s3api put-object --bucket heliolus-documents --key uploads/
awslocal s3api put-object --bucket heliolus-documents --key temp/

# Enable versioning
awslocal s3api put-bucket-versioning --bucket heliolus-documents --versioning-configuration Status=Enabled

# List buckets to confirm creation
echo "S3 Buckets created:"
awslocal s3 ls

echo "LocalStack S3 initialization completed!"