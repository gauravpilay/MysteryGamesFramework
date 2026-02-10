# AI Build Wizard - Mode Selection Update

## 🎯 What Changed

Added a **mode selection screen** to the AI Build Wizard, allowing users to choose between two creation modes:

### 1. **Quick Mode** 🚀
- **Purpose**: Fast, simple mystery creation
- **Input**: Natural language story description + learning objectives
- **Best For**: Quick prototypes, entertainment-focused games, simple scenarios
- **Time**: Instant generation
- **Features**:
  - Natural language input
  - AI handles all structure automatically
  - 3-5 suspects with unique personalities
  - 4-6 evidence nodes
  - Logic-based progression
  - Final accusation node

### 2. **Training Mode** ⚙️
- **Purpose**: Professional gamified training platform
- **Input**: Industry context, game mechanics, detailed learning objectives
- **Best For**: Corporate training, compliance training, educational programs
- **Time**: 15-45 seconds (more complex generation)
- **Features**:
  - Industry-specific context (8 industries)
  - Sequential suspect unlock mechanism
  - Evidence-based assessment (3 documents per suspect)
  - Fill-in-the-blank questions with feedback
  - Randomized culprit position
  - Diversity & inclusion options
  - Comprehensive learning objective mapping

---

## 🎨 User Experience

### Mode Selection Screen

When users click "AI Build", they now see:

```
┌─────────────────────────────────────────────────────┐
│         Choose Your Creation Mode                   │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Quick Mode     │  │  Training Mode   │        │
│  │   🚀 Fast        │  │  ⚙️ Pro          │        │
│  │                  │  │                  │        │
│  │ Natural language │  │ Industry context │        │
│  │ Instant gen      │  │ Sequential unlock│        │
│  └──────────────────┘  └──────────────────┘        │
│                                                      │
│  💡 Both modes use the same powerful AI!            │
└─────────────────────────────────────────────────────┘
```

### Quick Mode Flow

```
1. Select "Quick Mode"
   ↓
2. Enter Story Description
   ↓
3. Enter Learning Objectives
   ↓
4. Click "Generate Mystery"
   ↓
5. AI creates complete mystery
```

### Training Mode Flow

```
1. Select "Training Mode"
   ↓
2. Step 1: Industry Context
   - Select industry
   - Enter topic (4 lines)
   - Specify location & date
   ↓
3. Step 2: Game Mechanics
   - Choose difficulty
   - Set suspect count
   - Enable/disable diversity
   ↓
4. Step 3: Learning Objectives
   - Add multiple objectives
   - Detailed descriptions
   ↓
5. Step 4: Review & Generate
   - Confirm configuration
   - Generate mystery
```

---

## 🔄 Navigation Features

### Back to Mode Selection
- Users can go back to mode selection from Quick Mode
- Training Mode has step-by-step navigation (Previous/Next)
- Clear progress indicators show current step

### Progress Tracking
- **Quick Mode**: Shows "Quick Mode" badge
- **Training Mode**: Shows "Training Mode - Step X of 4" with progress bar

---

## 📊 Comparison

| Feature | Quick Mode | Training Mode |
|---------|-----------|---------------|
| **Input Method** | Natural language | Structured wizard |
| **Steps** | 1 screen | 4-step wizard |
| **Industry Context** | ❌ | ✅ 8 industries |
| **Sequential Unlock** | ❌ | ✅ Evidence-based |
| **Randomized Culprit** | ❌ | ✅ Random position |
| **Evidence Structure** | Variable | ✅ 3 per suspect |
| **Question Format** | Variable | ✅ Fill-in-the-blank |
| **Feedback System** | Basic | ✅ Comprehensive |
| **Diversity Options** | ❌ | ✅ Toggle |
| **Learning Objectives** | Simple text | ✅ Multiple detailed |
| **Generation Time** | ~10-15 sec | ~15-45 sec |
| **Best For** | Quick games | Professional training |

---

## 💡 Design Decisions

### Why Two Modes?

1. **Flexibility**: Different users have different needs
2. **Accessibility**: Quick Mode lowers barrier to entry
3. **Power**: Training Mode provides professional features
4. **Choice**: Users can pick based on project requirements

### Visual Design

- **Quick Mode**: Indigo/Purple gradient (Fast badge)
- **Training Mode**: Purple/Pink gradient (Pro badge)
- **Hover Effects**: Scale and glow on hover
- **Icons**: Rocket (Quick) vs Settings (Training)

### User Guidance

- Clear descriptions for each mode
- Feature checkmarks showing capabilities
- Tip at bottom: "Both modes use the same powerful AI"
- Back navigation available from both modes

---

## 🚀 Technical Implementation

### State Management

```javascript
const [mode, setMode] = useState(null); // null, 'quick', or 'training'
const [step, setStep] = useState(1); // For training mode
const [quickStory, setQuickStory] = useState('');
const [quickObjectives, setQuickObjectives] = useState('');
// ... training mode states
```

### Conditional Rendering

```javascript
{!mode && <ModeSelectionScreen />}
{mode === 'quick' && <QuickModeForm />}
{mode === 'training' && <TrainingModeSteps />}
```

### Separate Generation Functions

- `handleQuickGenerate()`: Simple prompt for quick mode
- `handleTrainingGenerate()`: Complex prompt with all directives
- `handleGenerate()`: Routes to appropriate function based on mode

---

## ✅ Benefits

### For Users

1. **Choice**: Pick the right tool for the job
2. **Speed**: Quick Mode for rapid prototyping
3. **Power**: Training Mode for professional projects
4. **Learning Curve**: Start with Quick, graduate to Training

### For Training Designers

1. **Professional Features**: Industry context, sequential unlock, assessment
2. **Quality Control**: Structured inputs ensure better AI output
3. **Consistency**: Standardized format for training content

### For Casual Users

1. **Simplicity**: Just describe your story
2. **No Overwhelm**: Single screen, minimal inputs
3. **Fast Results**: Instant mystery generation

---

## 📝 Usage Examples

### Quick Mode Example

**Story:**
```
A cybersecurity breach at a tech startup. Someone leaked source code 
to competitors. Players must interview suspects, analyze logs, and 
identify the insider threat.
```

**Objectives:**
```
Teach players about social engineering tactics, secure coding 
practices, and incident response procedures.
```

**Result:** Complete mystery with suspects, evidence, and puzzles

---

### Training Mode Example

**Industry:** Technology & IT
**Topic:**
```
A ransomware attack on a healthcare provider's patient database.
IT team must trace the attack vector and identify the entry point.
Players learn about network security and incident response.
Attack exploited a zero-day vulnerability in legacy systems.
```

**Location:** Seattle, USA
**Date:** 2024-02-10
**Difficulty:** Medium (4-5 suspects, 3 questions per document)
**Suspects:** 4
**Diversity:** Enabled

**Objectives:**
1. Identify ransomware attack vectors and entry points
2. Understand network segmentation failures
3. Apply incident response procedures

**Result:** Professional training scenario with sequential progression, evidence-based assessment, and comprehensive feedback

---

## 🎓 Recommendations

### When to Use Quick Mode

- ✅ Prototyping new ideas
- ✅ Entertainment-focused mysteries
- ✅ Simple educational games
- ✅ Time-constrained projects
- ✅ First-time users learning the system

### When to Use Training Mode

- ✅ Corporate training programs
- ✅ Compliance training
- ✅ Industry-specific education
- ✅ Assessment-driven learning
- ✅ Professional development
- ✅ Certification preparation

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Save mode preference
- [ ] Templates for each mode
- [ ] Mode-specific examples
- [ ] Hybrid mode (combine features)
- [ ] Import/export configurations

---

## ✨ Summary

The mode selection update provides:

1. **Flexibility**: Two distinct creation modes
2. **Accessibility**: Easy entry point with Quick Mode
3. **Power**: Professional features in Training Mode
4. **User Choice**: Pick based on project needs
5. **Seamless UX**: Beautiful, intuitive interface

Users now have the best of both worlds: **speed when they need it, power when they want it**! 🚀
