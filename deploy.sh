#!/bin/bash
set -e

# Configuration
ENV_FILE=${1:-.env}
DEFAULT_SERVICE_NAME="mystery-games-framework"
DEFAULT_REGION="us-east1"
REPO_NAME="mystery-games"

echo "=================================================="
echo "   Mystery Games Framework - Deployment Tool"
echo "=================================================="

# Check for gcloud
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    echo "Please visit https://cloud.google.com/sdk/docs/install to install it."
    exit 1
fi

# Get Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo "❌ Error: No Google Cloud Project set."
    echo "Please run: gcloud config set project [PROJECT_ID]"
    exit 1
fi

# Load environment variables from the specified env file
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Environment file '$ENV_FILE' not found."
    exit 1
else
    echo "📋 Loading environment variables from $ENV_FILE..."
    # Export variables, ignoring comments and empty lines
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Set Service Name (allow override from env file)
SERVICE_NAME=${SERVICE_NAME:-$DEFAULT_SERVICE_NAME}
# Ask for region if not set
REGION=${REGION:-$DEFAULT_REGION}

echo "✅ Environment: $ENV_FILE"
echo "✅ Service:     $SERVICE_NAME"
echo "✅ Project ID:  $PROJECT_ID"
echo "✅ Region:      $REGION"
echo "--------------------------------------------------"

# Define Image Tag for Artifact Registry
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"

echo "🔨 Building and Pushing Image to Artifact Registry..."
echo "This might take a few minutes..."

# Check if repo exists, create if not
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "📦 Creating Artifact Registry repository: $REPO_NAME..."
    gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Mystery Games Framework Repository"
fi

# Build using Cloud Build
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
echo "✅ Deployment Successful!"
echo "=================================================="
