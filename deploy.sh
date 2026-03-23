#!/bin/bash
set -e

# Configuration
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

# 1. Select Environment Profile
echo "📁 Available Environment Profiles:"
profiles=($(ls .env* | grep -v ".example"))
for i in "${!profiles[@]}"; do
    echo "  [$((i+1))] ${profiles[$i]}"
done

read -p "Select profile [1-${#profiles[@]}] (default 1): " profile_idx
profile_idx=${profile_idx:-1}
ENV_FILE=${profiles[$((profile_idx-1))]}

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Invalid selection or file not found."
    exit 1
fi

echo "📋 Loading environment variables from $ENV_FILE..."
# Robust way to load env variables, handling quotes and comments
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^# && "$line" =~ = ]]; then
        # Strip quotes from the value
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key"="$value"
    fi
done < "$ENV_FILE"

# 2. Select Google Cloud Project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
echo ""
echo "🆔 Google Cloud Projects:"
gcloud projects list --format="table(projectId, name)" --limit=10

read -p "Enter Project ID (default '$CURRENT_PROJECT'): " SELECTED_PROJECT
PROJECT_ID=${SELECTED_PROJECT:-$CURRENT_PROJECT}

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo "❌ Error: No Project ID specified."
    exit 1
fi

gcloud config set project $PROJECT_ID

# 3. Select Region
echo ""
echo "🌍 Common Regions:"
echo "  [1] us-east1 (South Carolina)"
echo "  [2] us-central1 (Iowa)"
echo "  [3] europe-west1 (Belgium)"
echo "  [4] asia-east1 (Taiwan)"
echo "  [5] Custom..."

read -p "Select region [1-5] (default 1): " region_idx
region_idx=${region_idx:-1}

case $region_idx in
    1) REGION="us-east1" ;;
    2) REGION="us-central1" ;;
    3) REGION="europe-west1" ;;
    4) REGION="asia-east1" ;;
    5) read -p "Enter custom region: " REGION ;;
    *) REGION="us-east1" ;;
esac

# Set Service Name (allow override from env file)
SERVICE_NAME=${SERVICE_NAME:-$DEFAULT_SERVICE_NAME}

echo ""
echo "--------------------------------------------------"
echo "✅ Environment: $ENV_FILE"
echo "✅ Service:     $SERVICE_NAME"
echo "✅ Project ID:  $PROJECT_ID"
echo "✅ Region:      $REGION"
echo "--------------------------------------------------"

# Define Image Tag for Artifact Registry (using version tag)
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$VITE_APP_VERSION"

# Prepare a clean revision suffix (letters, numbers, hyphens only)
CLEAN_VERSION=$(echo "$VITE_APP_VERSION" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
REVISION_SUFFIX="v${CLEAN_VERSION}-$(date +%M%S)"

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
  --substitutions=_IMAGE_TAG="$IMAGE_TAG",_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID",_VITE_AI_API_KEY="$VITE_AI_API_KEY",_VITE_MAX_AI_REQUESTS="$VITE_MAX_AI_REQUESTS",_VITE_FIREBASE_DATABASE_ID="$VITE_FIREBASE_DATABASE_ID",_VITE_APP_VERSION="$VITE_APP_VERSION"

echo "--------------------------------------------------"
echo "🚀 Deploying to Cloud Run..."
echo "--------------------------------------------------"

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --revision-suffix "$REVISION_SUFFIX"

echo "=================================================="
echo "✅ Deployment Successful!"
echo "=================================================="
