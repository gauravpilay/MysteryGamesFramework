# 🎨 AI-Generated Evidence Images Feature

## Overview

The AI Build feature now automatically generates **photorealistic evidence images** for every evidence node created during case generation! This enhancement makes mysteries more immersive and visually engaging.

## ✨ What's New

### Automatic Image Generation
When you use AI Build (Quick Start or Advanced Mode) to generate a mystery case:

1. **AI creates the case structure** (story, suspects, evidence, puzzles)
2. **For each evidence node**, the system:
   - Analyzes the evidence description
   - Generates a photorealistic image using Google Imagen AI
   - Uploads it to Firebase Storage
   - Attaches the image URL to the evidence node
3. **Players see beautiful evidence images** when they discover clues!

### Image Quality
- **Photorealistic**: Professional crime scene photography aesthetic
- **Contextual**: Images match the evidence description
- **Forensic Style**: Clear, well-lit, detailed
- **No Text**: Clean images without labels or watermarks
- **Neutral Backgrounds**: Evidence tables, forensic surfaces, crime scene contexts

## 🚀 How It Works

### Technical Flow

```
AI Case Generation
    ↓
Parse Evidence Nodes
    ↓
For Each Evidence:
    ├─ Create detailed image prompt
    ├─ Call Google Imagen API
    ├─ Generate photorealistic image
    ├─ Upload to Firebase Storage
    └─ Attach URL to node.data.imageUrl
    ↓
Evidence nodes now have images!
```

### Example

**Evidence Node:**
```javascript
{
  id: "evidence-1",
  type: "evidence",
  data: {
    label: "Bloody Knife",
    description: "A kitchen knife with dried blood on the blade, found near the crime scene",
    variableId: "has_knife",
    imageUrl: "https://firebasestorage.googleapis.com/..." // ← Auto-generated!
  }
}
```

**Generated Image Prompt:**
```
High-quality, photorealistic evidence photograph for a detective mystery game.

EVIDENCE: Bloody Knife
DESCRIPTION: A kitchen knife with dried blood on the blade, found near the crime scene

Style requirements:
- Professional crime scene photography aesthetic
- Clear, well-lit, forensic quality
- Detailed and realistic
- Suitable for a detective investigation
- No text or labels in the image
- Focus on the evidence item itself
- Neutral background (evidence table, forensic surface, or crime scene context)

The image should look like actual photographic evidence that would be collected and documented by investigators.
```

## 📁 Files Modified

### New Files
1. **`src/lib/evidenceImageGenerator.js`**
   - Main image generation and upload logic
   - Batch processing for multiple evidence items
   - Canvas fallback for when AI generation fails

### Modified Files
1. **`src/lib/ai.js`**
   - Added `generateImage()` function
   - Integrates with Google Imagen API
   - Handles base64 to blob conversion

2. **`src/components/AICaseGeneratorModalEnhanced.jsx`**
   - Accepts `projectId` prop
   - Calls image generation after AI creates nodes
   - Shows "Generating evidence images..." progress stage

3. **`src/pages/Editor.jsx`**
   - Passes `projectId` to AI Case Generator Modal

## 🎯 Key Features

### 1. Batch Processing
- Generates images in batches of 3 to avoid API rate limits
- 1-second delay between batches
- Parallel processing within batches for speed

### 2. Error Handling
- If AI generation fails → Falls back to canvas placeholder
- If upload fails → Evidence still works without image
- Graceful degradation ensures case generation always succeeds

### 3. Progress Tracking
- Shows "Generating evidence images..." stage
- Updates progress bar to 95% during image generation
- Completes at 100% when done

### 4. Storage Organization
```
Firebase Storage Structure:
cases/
  └── {caseId}/
      └── evidence/
          ├── evidence-{nodeId}-{timestamp}.png
          ├── evidence-{nodeId}-{timestamp}.png
          └── ...
```

## 🔧 API Integration

### Google Imagen API
The system uses Google's Imagen 3 model via the Gemini API:

**Endpoint:**
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages
```

**Configuration:**
- `aspect_ratio`: "4:3" (standard evidence photo format)
- `safety_filter_level`: "block_some"
- `person_generation`: "allow_adult" (for suspect photos if needed)
- `number_of_images`: 1

### API Key
Uses the same API key as the AI case generation (`settings.aiApiKey`)

## 📊 Performance

### Generation Time
- **Per Image**: ~2-5 seconds (AI generation + upload)
- **Batch of 3**: ~5-8 seconds
- **Typical Case** (4-6 evidence items): ~10-15 seconds total

### Cost Considerations
- Image generation uses Google Imagen API (paid service)
- Estimated cost: ~$0.02-0.04 per image
- Typical case with 5 evidence items: ~$0.10-0.20

### Optimization
- Batching reduces total time
- Parallel processing within batches
- Fallback to free canvas images if API fails

## 🎨 Fallback System

If AI image generation fails (no API key, API error, rate limit):

### Canvas Placeholder
A professional-looking placeholder is generated using HTML5 Canvas:
- Dark gradient background (#1a1a2e → #16213e)
- Gold border and "EVIDENCE" label
- Evidence name in large white text
- Case number at bottom
- 800x600px PNG format

**Example Placeholder:**
```
┌────────────────────────────────┐
│         EVIDENCE               │
│                                │
│      Bloody Knife              │
│                                │
│    CASE #123456                │
└────────────────────────────────┘
```

## 🧪 Testing

### Test the Feature

1. **Start the app**: `npm run dev`
2. **Open Editor** for any case
3. **Click "AI Build"**
4. **Select Quick Start Mode**
5. **Use this test story**:
   ```
   A scientist was found dead in their lab. Three pieces of evidence were discovered:
   a bloody scalpel, a torn lab coat, and a mysterious vial of blue liquid.
   ```
6. **Add objectives**: "Teach forensic science basics"
7. **Click "Generate Mystery"**
8. **Watch the progress**: You'll see "Generating evidence images..." stage
9. **Check the generated nodes**: Evidence nodes should have `imageUrl` properties
10. **Play the game**: Evidence images appear when players discover clues!

### Verify Images

**In Firebase Console:**
1. Go to Storage
2. Navigate to `cases/{your-case-id}/evidence/`
3. See the generated images!

**In the Game:**
1. Play the generated case
2. Collect evidence
3. See the beautiful AI-generated images!

## 🐛 Troubleshooting

### Images Not Generating?

**Check 1: API Key**
- Ensure `settings.aiApiKey` is set in config
- Verify it has Imagen API access enabled

**Check 2: Firebase Storage**
- Ensure Firebase Storage is initialized
- Check storage rules allow uploads

**Check 3: Console Logs**
```javascript
// Look for these logs:
"Generating AI image for evidence: {label}"
"Evidence image uploaded: {url}"
// Or errors:
"Image generation error: ..."
"AI generation failed, using placeholder for: {label}"
```

### Placeholder Images Appearing?

This means AI generation failed. Possible causes:
- No API key configured
- API quota exceeded
- API error (check console)
- Network issue

**Solution**: Check API key and quota, or use placeholders as intended fallback

## 🚀 Future Enhancements

### Potential Improvements

1. **Suspect Profile Images**
   - Generate AI portraits for suspects
   - Based on their description and personality

2. **Scene Images**
   - Generate crime scene images for story nodes
   - Atmospheric location shots

3. **Custom Styles**
   - Let users choose image style (noir, cyberpunk, etc.)
   - Match game genre aesthetically

4. **Image Caching**
   - Cache similar evidence images
   - Reduce API calls and costs

5. **Batch Upload Optimization**
   - Upload all images in parallel
   - Show individual progress for each image

6. **Image Editing**
   - Allow manual regeneration of specific images
   - Tweak prompts for better results

## 📝 Code Examples

### Generate Single Image
```javascript
import { generateAndUploadEvidenceImage } from './lib/evidenceImageGenerator';

const imageUrl = await generateAndUploadEvidenceImage(
  "A bloody knife with fingerprints", // description
  "Murder Weapon",                     // label
  "case-123",                          // caseId
  "node-abc",                          // nodeId
  apiKey                               // AI API key
);
```

### Batch Generate Images
```javascript
import { generateEvidenceImagesForNodes } from './lib/evidenceImageGenerator';

const evidenceNodes = [
  { id: "e1", data: { label: "Knife", description: "Bloody knife" } },
  { id: "e2", data: { label: "Note", description: "Threatening note" } }
];

const imageUrls = await generateEvidenceImagesForNodes(
  evidenceNodes,
  "case-123",
  apiKey
);

// imageUrls is a Map: nodeId → imageUrl
console.log(imageUrls.get("e1")); // URL for knife image
```

## 🎉 Benefits

### For Players
- ✅ **More Immersive**: Visual evidence makes mysteries feel real
- ✅ **Better Engagement**: Images are more memorable than text
- ✅ **Professional Quality**: AI-generated images look authentic
- ✅ **Consistent Style**: All evidence has the same forensic aesthetic

### For Creators
- ✅ **Zero Effort**: Images generated automatically
- ✅ **No Design Skills Needed**: AI handles all visual creation
- ✅ **Time Savings**: No need to find/create evidence images
- ✅ **Consistency**: All cases have high-quality visuals

### For the Platform
- ✅ **Differentiation**: Unique feature competitors don't have
- ✅ **Quality**: Every case looks professional
- ✅ **Scalability**: Works for any type of evidence
- ✅ **Reliability**: Fallback ensures it always works

---

**The AI-Generated Evidence Images feature is now live and ready to create stunning visual mysteries!** 🎨✨
