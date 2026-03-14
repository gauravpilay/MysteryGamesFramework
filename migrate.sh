#!/bin/bash
set -e

# ==================================================
#   Mystery Games Framework - Multi-Account Migration
# ==================================================

echo "🚀 Starting Multi-Account Migration Process..."

# 1. Configuration
read -p "Enter SOURCE Project ID: " SOURCE_PROJECT
read -p "Enter SOURCE Storage Bucket: " SOURCE_BUCKET
echo ""
read -p "Enter DESTINATION Project ID: " DEST_PROJECT
read -p "Enter DESTINATION Storage Bucket: " DEST_BUCKET

LOCAL_TEMP="./migration_temp"

echo ""
echo "--------------------------------------------------"
echo "📋 Stage 1: Exporting from SOURCE"
echo "--------------------------------------------------"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "Current Account: $ACTIVE_ACCOUNT"
echo "Please ensure this account has access to the SOURCE project ($SOURCE_PROJECT)."
gcloud config set project $SOURCE_PROJECT

# Strip gs:// if the user included it
SOURCE_BUCKET=${SOURCE_BUCKET#gs://}
DEST_BUCKET=${DEST_BUCKET#gs://}

# 1. Get the official Firestore Service Agent identity
echo "🔍 Identifying Firestore Service Agent..."
# 'create' will effectively 'get' if it already exists and return the email
FS_AGENT=$(gcloud beta services identity create --service=firestore.googleapis.com --project=$SOURCE_PROJECT --format="value(email)" 2>/dev/null)

# Fallback if command fails
if [[ -z "$FS_AGENT" ]]; then
    SOURCE_PROJECT_NUMBER=$(gcloud projects describe $SOURCE_PROJECT --format="value(projectNumber)")
    FS_AGENT="service-$SOURCE_PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com"
fi
echo "  Identity to use: $FS_AGENT"

# 2. Create a TEMPORARY bucket for the export (this is much more reliable)
# We ask for region since Firestore exports must be in the same region/multi-region as the DB
read -p "Enter GCP Region for temporary bucket (e.g., asia-south1 or asia): " BUCKET_REGION
BUCKET_REGION=${BUCKET_REGION:-asia-south1}

TEMP_EXPORT_BUCKET="migration-temp-$SOURCE_PROJECT-$(date +%s)"
echo "📦 Creating temporary migration bucket in $BUCKET_REGION: gs://$TEMP_EXPORT_BUCKET..."
gcloud storage buckets create gs://$TEMP_EXPORT_BUCKET --project=$SOURCE_PROJECT --location=$BUCKET_REGION || true

echo "🔐 Granting $FS_AGENT Storage Admin on the temporary bucket..."
gcloud storage buckets add-iam-policy-binding gs://$TEMP_EXPORT_BUCKET \
    --member="serviceAccount:$FS_AGENT" \
    --role="roles/storage.admin" --quiet > /dev/null

echo "⏳ Waiting 10 seconds for permissions..."
sleep 10

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_PATH="firestore_export_$TIMESTAMP"

echo "📦 Exporting Firestore to gs://$TEMP_EXPORT_BUCKET/$EXPORT_PATH..."
gcloud firestore export gs://$TEMP_EXPORT_BUCKET/$EXPORT_PATH

echo "📥 Downloading Firestore export from temporary bucket..."
mkdir -p "$LOCAL_TEMP"
gcloud storage cp -r gs://$TEMP_EXPORT_BUCKET/$EXPORT_PATH "$LOCAL_TEMP/"

echo "📥 Downloading all other assets from your main bucket ($SOURCE_BUCKET)..."
# Use -r for recursive copy
gcloud storage cp -r gs://$SOURCE_BUCKET/* "$LOCAL_TEMP/" || echo "⚠️ Some files in $SOURCE_BUCKET could not be copied, continuing..."

# Cleanup temporary source bucket
echo "🧹 Deleting temporary source bucket..."
gcloud storage rm -r gs://$TEMP_EXPORT_BUCKET

echo "--------------------------------------------------"
echo "🔄 Stage 2: Switch to DESTINATION (Account B)"
echo "--------------------------------------------------"
echo "REQUIRED ACTION:"
echo "Please run 'gcloud auth login' in your terminal now if you haven't switched to the destination account yet."
echo ""
read -p "Press [Enter] after you have logged into the DESTINATION account..."

gcloud config set project $DEST_PROJECT

# Add permission for the firestore service agent on the destination bucket
echo "🔍 Identifying DESTINATION Firestore Service Agent..."
FIRESTORE_AGENT=$(gcloud beta services identity create --service=firestore.googleapis.com --project=$DEST_PROJECT --format="value(email)" 2>/dev/null)

if [[ -z "$FIRESTORE_AGENT" ]]; then
    PROJECT_NUMBER=$(gcloud projects describe $DEST_PROJECT --format="value(projectNumber)")
    FIRESTORE_AGENT="service-$PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com"
fi

echo "🔐 Granting Storage Object Viewer role to $FIRESTORE_AGENT..."
gcloud projects add-iam-policy-binding $DEST_PROJECT \
    --member="serviceAccount:$FIRESTORE_AGENT" \
    --role="roles/storage.objectViewer" --quiet || echo "⚠️ Could not add IAM binding automatically."

echo "📤 Uploading files to gs://$DEST_BUCKET/..."
gcloud storage cp -r "$LOCAL_TEMP"/* gs://$DEST_BUCKET/

echo "📥 Importing Firestore data into $DEST_PROJECT..."
gcloud firestore import gs://$DEST_BUCKET/$EXPORT_PATH

# Apply CORS
if [ -f "cors.json" ]; then
    echo "🌐 Applying CORS to $DEST_BUCKET..."
    gcloud storage buckets update gs://$DEST_BUCKET --cors-file=cors.json
fi

echo "🧹 Cleaning up local temporary files..."
rm -rf "$LOCAL_TEMP"

echo "=================================================="
echo "✅ Multi-Account Migration Completed!"
echo "=================================================="
