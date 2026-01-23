#!/bin/bash
set -e

# Configuration
SERVICE_NAME="mystery-games-framework"
REGION="us-central1"

echo "=================================================="
echo "   Deploying Mystery Games Framework to Cloud Run"
echo "=================================================="

# Get Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Google Cloud Project set."
    echo "Please set your project ID using: gcloud config set project [PROJECT_ID]"
    exit 1
fi

echo "✅ Using Project ID: $PROJECT_ID"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "--------------------------------------------------"
echo "🔨 Building Container Image using Cloud Build..."
echo "--------------------------------------------------"
gcloud builds submit --tag "$IMAGE_TAG" .

echo "--------------------------------------------------"
echo "🚀 Deploying to Cloud Run..."
echo "--------------------------------------------------"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080

echo "=================================================="
echo "✅ Deployment Complete!"
echo "   Service URL should be listed above."
echo "=================================================="
