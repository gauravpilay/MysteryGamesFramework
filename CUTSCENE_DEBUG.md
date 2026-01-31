# Cutscene Debugging Guide

## Issue
Cutscene dialogue text was not rendering properly.

## Fixes Applied

### 1. Improved Text Parsing (CinematicCutscene.jsx)
- Made text parsing more robust with fallback logic
- Now handles text without punctuation
- Handles empty text with default message
- Added console logging for debugging

### 2. Enhanced Text Display
- Added fallback "Loading dialogue..." message if text is empty
- Improved conditional rendering

## How to Test

### Step 1: Create a Cutscene Node
1. Open the editor
2. Drag a "Cinematic Cutscene" node onto the canvas
3. Configure it with:
   - **Text**: "This is a test cutscene. It should display this text with a typewriter effect."
   - **Mood**: Select any (e.g., "dramatic")
   - **Camera Angle**: Select any (e.g., "medium")
   - **Character Name** (optional): "Detective Morgan"
   - **Character Image** (optional): Upload an image

### Step 2: Connect and Test
1. Connect the cutscene node to your game flow
2. Click "Preview" to test the game
3. Navigate to the cutscene node

### Step 3: Check Console
Open browser console (F12) and look for:
```
Cutscene - Current segment: [your text]
Cutscene - All segments: [array of text segments]
```

## Expected Behavior

✅ **Working Correctly:**
- Full-screen cinematic view appears
- Text appears with typewriter effect
- Progress indicators show at bottom
- Playback controls visible
- Text advances automatically through segments

❌ **If Still Not Working:**
1. Check console for the debug logs
2. Verify `currentNode.data.text` has content
3. Check if cutscene is actually being triggered (showCutscene state)

## Common Issues & Solutions

### Issue: No text appears at all
**Solution:** Check that the cutscene node has text in the `data.text` field

### Issue: Text appears but doesn't animate
**Solution:** Check `isPlaying` state - it should be `true` by default

### Issue: Cutscene doesn't show
**Solution:** Verify `showCutscene` state is being set to `true` when cutscene node is reached

## Debug Checklist

- [ ] Cutscene node has text configured
- [ ] Node is properly connected in the flow
- [ ] Console shows "Cutscene - Current segment" logs
- [ ] `textSegments` array is not empty
- [ ] `displayedText` state is updating
- [ ] Full-screen overlay is visible

## Code Changes Summary

**File: `/src/components/CinematicCutscene.jsx`**
- Lines 36-50: Improved text parsing with React.useMemo and fallback logic
- Lines 121-123: Added console.log debugging
- Lines 312-327: Added conditional rendering with fallback message

The cutscene should now display text correctly. If you still see issues, check the browser console for the debug logs to see what's being passed to the component.
