variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy to"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "mystery-games-framework"
}

variable "image_tag" {
  description = "The container image tag to deploy"
  type        = string
}

variable "firebase_api_key" {
  type      = string
  sensitive = true
}

variable "firebase_auth_domain" {
  type = string
}

variable "firebase_project_id" {
  type = string
}

variable "firebase_storage_bucket" {
  type = string
}

variable "firebase_messaging_sender_id" {
  type = string
}

variable "firebase_app_id" {
  type = string
}

variable "ai_api_key" {
  type      = string
  sensitive = true
}

variable "max_ai_requests" {
  type    = string
  default = "5"
}
