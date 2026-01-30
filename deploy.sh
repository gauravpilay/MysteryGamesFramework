#!/bin/bash
set -e

# Configuration
SERVICE_NAME="mystery-games-framework"
REGION="us-east1"

echo "=================================================="
echo "   Deploying Mystery Games Framework to Cloud Run"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found."
    echo "Please create a .env file with your Firebase configuration."
    exit 1
fi

# Load environment variables from .env
echo "📋 Loading environment variables from .env..."
export $(grep -v '^#' .env | xargs)

# Get Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Google Cloud Project set."
    echo "Please set your project ID using: gcloud config set project [PROJECT_ID]"
    exit 1
fi

echo "✅ Using Project ID: $PROJECT_ID"
echo "✅ Using Region: $REGION"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "--------------------------------------------------"
echo "🔨 Building Container Image using Cloud Build..."
echo "--------------------------------------------------"
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_IMAGE_TAG="$IMAGE_TAG",_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID",_VITE_AI_API_KEY="$VITE_AI_API_KEY",_VITE_MAX_AI_REQUESTS="$VITE_MAX_AI_REQUESTS"


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
