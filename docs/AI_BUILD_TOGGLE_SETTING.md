# ⚙️ AI Build Feature Toggle - Settings Documentation

## Overview

Administrators can now **enable or disable the AI Build feature** globally through the System Settings panel. This gives you control over whether users can access the AI-powered case generation feature.

## 🎯 Purpose

This setting allows you to:
- **Control feature access** - Enable/disable AI Build for all users
- **Manage API costs** - Turn off AI Build to prevent API usage
- **Testing environments** - Disable in production, enable in development
- **Educational control** - Force students to build cases manually when needed

## 🚀 How to Use

### Accessing Settings

1. **Open Dashboard** - Go to the main page
2. **Click Settings Icon** (⚙️) in the top navigation
3. **System Settings Modal** opens

### Toggle AI Build Feature

In the System Settings modal, you'll find:

**Section**: "Global Architecture Override"

**Setting**: "AI Build Feature"
- **Icon**: Brain (🧠)
- **Description**: "Enable/Disable the AI-powered case generation feature. When disabled, the AI Build button will be hidden from the Editor."
- **Toggle**: ON (indigo) / OFF (gray)

### What Happens When Toggled

**When ENABLED (default):**
- ✅ AI Build button appears in Editor toolbar
- ✅ Users can click "AI Build" to generate cases
- ✅ Quick Start and Advanced modes available
- ✅ Evidence images auto-generated

**When DISABLED:**
- ❌ AI Build button hidden from Editor toolbar
- ❌ Users must create cases manually
- ❌ No AI API calls made
- ❌ Cost savings on API usage

## 🔧 Technical Details

### Configuration Storage

**Location**: Firebase Firestore
- **Collection**: `system_config`
- **Document**: `app_settings`
- **Field**: `enableAIBuild` (boolean)

**Default Value**: `true`

### Code Implementation

**Config Provider** (`src/lib/config.jsx`):
```javascript
const [settings, setSettings] = useState({
    aiApiKey: import.meta.env.VITE_AI_API_KEY || '',
    maxAIRequests: parseInt(import.meta.env.VITE_MAX_AI_REQUESTS) || 10,
    enableAIBuild: true, // ← New setting
});
```

**Editor** (`src/pages/Editor.jsx`):
```javascript
const { settings } = useConfig();

// Conditionally render AI Build button
{settings.enableAIBuild !== false && (
    <Button onClick={() => setShowAIGenerator(true)}>
        <Brain className="w-4 h-4" />
        <span>AI Build</span>
    </Button>
)}
```

**Settings Modal** (`src/components/SystemSettingsModal.jsx`):
```javascript
<button
    onClick={() => setFormData(prev => ({ 
        ...prev, 
        enableAIBuild: !prev.enableAIBuild 
    }))}
    className={`toggle ${formData.enableAIBuild ? 'bg-indigo-600' : 'bg-zinc-800'}`}
>
    <div className={`toggle-knob ${formData.enableAIBuild ? 'translate-x-6' : 'translate-x-0'}`} />
</button>
```

## 📊 Use Cases

### 1. Cost Management
**Scenario**: You want to control API costs during off-peak hours

**Action**: 
- Disable AI Build when not needed
- Enable only during class/work hours
- Monitor usage and toggle accordingly

### 2. Educational Control
**Scenario**: Students should learn to build cases manually first

**Action**:
- Disable AI Build for beginners
- Enable after they master manual creation
- Use as a reward/advanced feature

### 3. Testing & Development
**Scenario**: Different environments need different features

**Action**:
- Enable in development for testing
- Disable in production until ready
- Toggle per environment

### 4. API Quota Management
**Scenario**: Approaching API quota limits

**Action**:
- Disable AI Build to prevent quota exhaustion
- Re-enable when quota resets
- Temporary cost-saving measure

## 🎨 UI Design

### Settings Modal Toggle

**Visual States:**

**Enabled (ON):**
```
┌─────────────────────────────────────────┐
│ 🧠 AI Build Feature          ●─────○   │
│ Enable/Disable the AI-powered case      │
│ generation feature...                   │
└─────────────────────────────────────────┘
     Indigo background, toggle right
```

**Disabled (OFF):**
```
┌─────────────────────────────────────────┐
│ 🧠 AI Build Feature          ○─────●   │
│ Enable/Disable the AI-powered case      │
│ generation feature...                   │
└─────────────────────────────────────────┘
     Gray background, toggle left
```

### Editor Toolbar

**When Enabled:**
```
[Help] [Validate] | [🧠 AI Build] | [Settings] [Save]
                    ↑ Visible
```

**When Disabled:**
```
[Help] [Validate] | [Settings] [Save]
                    ↑ Hidden (no divider either)
```

## 🔐 Permissions

**Who Can Toggle:**
- ✅ **Admins** - Full access to System Settings
- ❌ **Regular Users** - Cannot access System Settings

**Note**: Only users with `role: 'Admin'` can modify this setting.

## 🧪 Testing

### Test the Toggle

1. **Login as Admin**
2. **Open System Settings**
3. **Toggle AI Build OFF**
4. **Click "Sync Configuration"**
5. **Open any case in Editor**
6. **Verify**: AI Build button is hidden
7. **Return to Settings**
8. **Toggle AI Build ON**
9. **Click "Sync Configuration"**
10. **Refresh Editor**
11. **Verify**: AI Build button appears

### Expected Behavior

**After Disabling:**
- AI Build button disappears immediately (or on next page load)
- No error messages
- Other toolbar buttons remain functional
- Manual case creation still works

**After Enabling:**
- AI Build button reappears
- Clicking opens AI Generator modal
- All AI features work normally

## 📝 Database Schema

**Firestore Document**: `system_config/app_settings`

```json
{
  "aiApiKey": "your-api-key-here",
  "maxAIRequests": 10,
  "systemName": "Mystery Architect Central",
  "enableThreeD": true,
  "enableAIBuild": true  // ← New field
}
```

## 🚨 Important Notes

### Default Behavior
- **Default**: `enableAIBuild: true`
- If setting is missing from database → Defaults to `true`
- Backwards compatible with existing installations

### Real-time Updates
- Settings sync in real-time via Firestore
- Changes apply immediately (may require page refresh)
- All users see updated settings

### No Breaking Changes
- Existing cases unaffected
- Manual case creation always available
- Only affects visibility of AI Build button

## 🎯 Benefits

### For Administrators:
- ✅ **Cost Control** - Manage API usage and costs
- ✅ **Feature Gating** - Control when users access AI features
- ✅ **Flexibility** - Enable/disable as needed
- ✅ **Simple Toggle** - One click to change

### For Users:
- ✅ **Clear UI** - Button only shows when available
- ✅ **No Confusion** - No disabled/grayed-out buttons
- ✅ **Seamless** - Manual creation always works

### For the Platform:
- ✅ **Scalability** - Easy to add more feature toggles
- ✅ **Maintainability** - Centralized configuration
- ✅ **Flexibility** - Per-environment settings

## 🔄 Migration

### Existing Installations

**No migration needed!**

- Default value is `true` (enabled)
- Existing behavior unchanged
- Setting automatically added on first admin login

### New Installations

- Setting included in initial config
- Default: `enableAIBuild: true`
- Ready to use immediately

## 📚 Related Features

This setting works alongside:
- **AI API Key** - Required for AI Build to function
- **Max AI Requests** - Limits AI usage per session
- **3D Neural Reconstruction** - Another feature toggle
- **System Codename** - Platform branding

## 🎉 Summary

The **AI Build Feature Toggle** gives administrators complete control over the AI-powered case generation feature. With a simple toggle in System Settings, you can:

- ✅ Enable/disable AI Build globally
- ✅ Control API costs and usage
- ✅ Manage feature access for users
- ✅ Adapt to different environments

**Status**: ✅ Deployed and ready to use!

---

**Access**: Dashboard → Settings (⚙️) → System Configuration → AI Build Feature
