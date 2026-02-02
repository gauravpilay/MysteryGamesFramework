# Case Image Upload Feature

## Overview
Added the ability for admins to upload custom images for case cards on the dashboard. If no image is uploaded, the system continues to display the case initials as before.

## Changes Made

### 1. Dashboard.jsx Updates
- **Imports**: Added Firebase Storage imports (`ref`, `uploadBytes`, `getDownloadURL`) and new icons (`ImageIcon`, `Upload`)
- **State Management**: Added `imageUploadProject` and `uploadingImage` states to manage the upload modal
- **Image Upload Handler**: Created `handleImageUpload()` function that:
  - Uploads images to Firebase Storage under `case-images/{projectId}/{filename}`
  - Retrieves the download URL
  - Updates the Firestore document with the thumbnail URL
  - Handles errors gracefully

### 2. UI Components

#### Upload Button
- Added an image upload button (📷 icon) to each case card header
- Only visible to admins
- Positioned next to the status badge and lock/unlock button
- Hover effect changes color to indigo

#### Upload Modal
- Clean, modern modal design with:
  - Drag-and-drop style file input area
  - Preview of current image (if exists)
  - Upload progress indicator
  - File type restrictions (image/*)
  - Close button

### 3. Case Card Display Logic
The existing logic remains unchanged:
- **If thumbnail exists**: Display the uploaded image
- **If no thumbnail**: Display case initials with gradient background

## How to Use

1. **As an Admin**:
   - Navigate to the Dashboard
   - Find any case card (published or draft)
   - Click the 📷 (image) icon in the top-right corner
   - Click "Click to upload" in the modal
   - Select an image file (PNG, JPG, GIF)
   - Image uploads automatically and updates the case card

2. **Image Storage**:
   - Images are stored in Firebase Storage at: `case-images/{caseId}/{filename}`
   - The URL is saved in the Firestore `cases` collection under the `thumbnail` field

## Technical Details

- **Storage Path**: `case-images/{projectId}/{filename}`
- **Supported Formats**: All image formats (image/*)
- **File Size**: Up to 10MB (as indicated in UI)
- **Fallback**: Initials display if no image is uploaded
- **Update Trigger**: `updatedAt` timestamp is updated when image is uploaded

## Benefits

1. **Visual Appeal**: Custom images make cases more engaging
2. **Branding**: Allows for consistent visual identity
3. **Flexibility**: Admins can change images anytime
4. **Graceful Degradation**: Falls back to initials if no image
5. **User-Friendly**: Simple click-to-upload interface
6. **Clear Visibility**: Images are displayed at 90% opacity by default for excellent clarity

## Image Display Settings

- **Opacity**: 100% (full visibility, no dimming)
- **Scaling**: Subtle 1.05x zoom on hover for interactivity
- **Fit**: `object-cover` ensures images fill the card area perfectly
- **Overlays**: None - images display at full clarity with no gradient overlays
- **Dimensions**: 224px height (h-56), full width of card
- **Text Visibility**: All text in images (including small text like "Mumbai Ledger") is crystal clear and fully readable
