# Customer Deployment Guide: Mystery Games Framework

This guide provides instructions on how to deploy the Mystery Games Framework to your Google Cloud Platform (GCP) environment.

## Prerequisites

1.  **Google Cloud Project**: You must have a GCP project with billing enabled.
2.  **Google Cloud SDK**: Install and initialize the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
3.  **Terraform**: Install [Terraform](https://developer.hashicorp.com/terraform/downloads) for infrastructure provisioning.
4.  **Firebase Project**: Ensure you have a Firebase project set up (can be the same as your GCP project) and have the following configuration details:
    *   API Key
    *   Auth Domain
    *   Project ID
    *   Storage Bucket
    *   Messaging Sender ID
    *   App ID

## Deployment Steps

### 1. Configure Environment Variables

Create a `terraform/terraform.tfvars` file (or copy the example) with your specific values:

```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"

firebase_api_key             = "..."
firebase_auth_domain         = "..."
firebase_project_id          = "..."
firebase_storage_bucket      = "..."
firebase_messaging_sender_id = "..."
firebase_app_id              = "..."
ai_api_key                   = "..."
```

### 2. Build and Push the Container Image

Use the provided `deploy.sh` script to build the image using Cloud Build and deploy it. This script will:
1. Build the Docker image.
2. Push it to Google Container Registry (or Artifact Registry).
3. Deploy to Cloud Run.

```bash
./deploy.sh
```

### 3. Alternative: Infrastructure as Code (Terraform)

For more controlled deployments, use the Terraform files in the `terraform/` directory:

```bash
cd terraform
terraform init
terraform apply
```

This will automatically:
- Enable required APIs (Cloud Run, Artifact Registry).
- Create a Docker repository.
- Deploy the Cloud Run service with the correct environment variables.

## Troubleshooting

- **Permissions**: Ensure the user running the scripts has `Project Editor` or `Owner` permissions, or specifically `roles/run.admin`, `roles/artifactregistry.admin`, and `roles/resourcemanager.projectIamAdmin`.
- **API Activation**: If deployment fails with an "API not enabled" error, wait a few minutes after running Terraform or manually enable them in the GCP Console.
- **Firebase Rules**: Don't forget to deploy your Firestore rules using `firebase deploy --only firestore:rules`.

## Updating the Service

To deploy a new version:
1. Run `./deploy.sh` again, or
2. Update the `image_tag` in `terraform.tfvars` and run `terraform apply`.
