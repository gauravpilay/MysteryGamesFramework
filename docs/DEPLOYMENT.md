# Deployment Guide

## Overview
This guide explains how to deploy the Mystery Games Framework to Google Cloud Run in any region.

## Prerequisites
1. Google Cloud Project with billing enabled
2. `gcloud` CLI installed and authenticated
3. `.env` file configured with Firebase credentials (see `.env.example`)

## How It Works

### The Problem
When deploying to Cloud Run, the application is built in Google Cloud Build, which doesn't have access to your local `.env` file (which is correctly excluded from version control for security reasons).

Vite requires environment variables at **build time** to embed them into the JavaScript bundle. Without these variables, Firebase fails to initialize, causing the "Firebase Login Failed" error.

### The Solution
The deployment process now:
1. Reads your local `.env` file
2. Passes environment variables to Cloud Build as substitutions
3. Cloud Build passes them as Docker build arguments
4. Docker sets them as environment variables during the Vite build
5. Vite embeds them into the JavaScript bundle

## Deployment Steps

### 1. Configure Your Environment
Ensure your `.env` file exists and contains all required Firebase credentials:
```bash
cp .env.example .env
# Edit .env with your Firebase configuration
```

### 2. Set Your Google Cloud Project
```bash
gcloud config set project YOUR_PROJECT_ID
```

### 3. (Optional) Change Deployment Region
Edit `deploy.sh` and change the `REGION` variable:
```bash
REGION="us-central1"  # or any other region
```

Available regions include:
- `us-central1` (Iowa)
- `us-east1` (South Carolina)
- `us-west1` (Oregon)
- `europe-west1` (Belgium)
- `asia-south1` (Mumbai)
- `asia-southeast1` (Singapore)
- And many more...

### 4. Deploy
```bash
./deploy.sh
```

The script will:
- ✅ Validate that `.env` exists
- ✅ Load environment variables
- ✅ Build the container with Firebase configuration
- ✅ Deploy to Cloud Run in your chosen region

## Troubleshooting

### "Firebase Login Failed" Error
This means environment variables weren't properly passed during build. Verify:
1. Your `.env` file exists and is complete
2. The `deploy.sh` script successfully loaded the variables (check console output)
3. Cloud Build received the substitutions (check Cloud Build logs)

### Build Fails
- Check Cloud Build logs in Google Cloud Console
- Ensure all environment variables in `.env` are properly formatted (no spaces around `=`)
- Verify your Firebase configuration is correct

### Region-Specific Issues
- Some regions may have quota limits
- Ensure the region you're deploying to supports Cloud Run
- Check [Cloud Run locations](https://cloud.google.com/run/docs/locations) for availability

## Security Notes

⚠️ **Important**: 
- Never commit `.env` to version control
- Environment variables are embedded in the client-side JavaScript bundle
- Only use Firebase configuration for client-side apps (these are meant to be public)
- For sensitive server-side secrets, use Google Secret Manager instead

## Files Involved

- `deploy.sh` - Main deployment script
- `cloudbuild.yaml` - Cloud Build configuration
- `Dockerfile` - Multi-stage Docker build with build arguments
- `.env` - Local environment variables (not in git)
- `.env.example` - Template for environment variables (in git)
