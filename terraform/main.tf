terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable necessary APIs
resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "mystery-games"
  description   = "Docker repository for Mystery Games Framework"
  format        = "DOCKER"
  depends_on    = [google_project_service.artifact_registry_api]
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.image_tag
      ports {
        container_port = 8080
      }
      # These are build-time vars for the frontend, but we can also set them as runtime env vars
      # for the container if the app was designed to read them at runtime.
      # However, since it's a static build inside Nginx, these won't do much at runtime.
      # I'll include them just in case or for future-proofing.
      env {
        name  = "VITE_FIREBASE_API_KEY"
        value = var.firebase_api_key
      }
      env {
        name  = "VITE_AI_API_KEY"
        value = var.ai_api_key
      }
    }
  }

  depends_on = [google_project_service.run_api]
}

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "noauth" {
  location = google_cloud_run_v2_service.default.location
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
