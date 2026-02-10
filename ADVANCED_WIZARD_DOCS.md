# Advanced AI Mystery Wizard - Enhancement Documentation

## Overview

The Advanced AI Mystery Wizard has been completely redesigned to create industry-specific, gamified mystery training platforms with sophisticated instructional design principles.

## Key Enhancements

### 1. **Industry-Specific Context**
- **Industry Selection**: 8 predefined industries (Finance, Healthcare, Technology, Manufacturing, Retail, Education, Government, Energy)
- **Topic Summary**: 4-line contextual summary of the training scenario
- **Location**: City/Country specification for realistic scenarios
- **Date**: Temporal context for the mystery

### 2. **Sequential Suspect Unlock Mechanism**
- **Progressive Revelation**: Suspects are NOT revealed all at once
- **Evidence-Based Unlocking**: Solving evidence for Suspect N unlocks Suspect N+1
- **First Suspect**: Always available (unlockCondition: null)
- **Subsequent Suspects**: Require completion of previous suspect's evidence

### 3. **Randomized Culprit System**
- **Mastermind Index**: AI randomly assigns culprit position (0 to suspectCount-1)
- **Unpredictable**: Culprit is NOT always the last suspect
- **Fair Design**: All suspects have equal probability of being the mastermind

### 4. **Evidence-Based Assessment Structure**

Each suspect has **exactly 3 evidence documents**:

```javascript
{
  "id": "evidence-1-1",
  "label": "Email Communication Log",
  "description": "Detailed description of what this evidence reveals",
  "imagePrompt": "AI image generation prompt for visual evidence",
  "questions": [...]
}
```

### 5. **Fill-in-the-Blank Question System**

Each question follows this structure:

```javascript
{
  "id": "q-1-1-1",
  "question": "Fill in the blank: The security protocol violated was ___________.",
  "correctAnswer": "Multi-Factor Authentication",
  "distractors": [
    "Single Sign-On",
    "Password Encryption", 
    "Biometric Verification"
  ],
  "hint": "Look at the authentication logs (max 2 lines)",
  "correctExplanation": "MFA was disabled, allowing unauthorized access (max 2 lines)",
  "distractorExplanations": [
    "SSO was properly configured and not the issue (max 2 lines)",
    "Passwords were encrypted correctly (max 2 lines)",
    "Biometric systems were not in use at this location (max 2 lines)"
  ],
  "learningObjective": "Identify authentication vulnerabilities in enterprise systems"
}
```

### 6. **Difficulty-Based Question Scaling**

| Difficulty | Suspects | Questions per Document |
|-----------|----------|----------------------|
| Beginner  | 2-3      | 2 questions          |
| Medium    | 4-5      | 3 questions          |
| Advanced  | 6-8      | 4 questions          |

### 7. **Distractor Logic (Medium Difficulty)**
- **Structural Similarity**: Distractors must be similar in format to correct answer
- **Plausibility**: All options should seem reasonable without context
- **Educational Value**: Wrong answers teach why alternatives don't work
- **No Repetition**: Questions never repeated across all documents

### 8. **Comprehensive Feedback Schema**

Every question includes:
- **Hint**: Max 2 lines, guides without revealing answer
- **Correct Explanation**: Max 2 lines, explains why answer is right
- **Distractor Explanations**: Max 2 lines each (3 explanations total)

### 9. **Learning Objective Mapping**
- Every question explicitly maps to a specific learning objective
- No question can be repeated
- AI ensures even distribution across objectives
- Objectives woven into suspect backgrounds and evidence

### 10. **Diversity & Bias Prevention**
- **Optional Toggle**: Enable/disable diverse identities
- **Varied Demographics**: Age (20s-60s), gender, ethnicity
- **Anti-Stereotyping**: Roles don't correlate with identity
- **Professional Realism**: Characters are realistic and professional

## Narrative Architecture Rules

### 1. **Tone & Style**
- Professional and engaging
- Polite interrogations (no aggressive language)
- Scripts max 20 lines
- Suspects NOT explicitly told what they did wrong
- Learner must deduce errors

### 2. **Abbreviation Policy**
- ALL technical abbreviations defined on first use
- Example: "MFA (Multi-Factor Authentication)"

### 3. **Story Flow**
```
Start Node
    ↓
Suspect 1 (unlockCondition: null)
    ↓
Evidence 1-1 → Questions → Evidence 1-2 → Questions → Evidence 1-3 → Questions
    ↓
Logic Node (check all evidence collected)
    ↓
Suspect 2 (unlockCondition: "evidence-1-3")
    ↓
Evidence 2-1 → Questions → Evidence 2-2 → Questions → Evidence 2-3 → Questions
    ↓
[Continue for all suspects]
    ↓
Identify Culprit Node
```

## AI Prompt Engineering

The system prompt includes:

1. **Exact JSON Schema**: Prevents formatting errors
2. **Configuration Parameters**: Industry, topic, location, date, difficulty
3. **Critical Guidelines**: 9 detailed sections covering all aspects
4. **Learning Integration**: Explicit instructions for objective mapping
5. **Sequential Unlock Logic**: Clear unlocking mechanism
6. **Randomization**: Mastermind index randomization
7. **Assessment Design**: Question structure and distractor rules
8. **Feedback Requirements**: Hint and explanation constraints

## Usage Example

### Step 1: Industry Context
```
Industry: Finance & Banking
Topic: A data breach at GlobalBank exposed 2M customer records. 
       Investigation reveals insider involvement with external hackers.
       Players identify the culprit and learn about security protocols.
Location: London, UK
Date: 2024-03-15
```

### Step 2: Game Mechanics
```
Difficulty: Medium (4-5 suspects, 3 questions per document)
Number of Suspects: 4
Diverse Identities: Enabled
```

### Step 3: Learning Objectives
```
1. Identify common social engineering tactics used in financial fraud
2. Understand multi-factor authentication bypass techniques
3. Recognize insider threat indicators in access logs
4. Apply incident response procedures for data breaches
```

### Step 4: Review & Generate
The AI generates a complete mystery with:
- 4 suspects (1 random culprit)
- 12 evidence documents (3 per suspect)
- 36 questions total (3 per document)
- Sequential unlock mechanism
- Full feedback system

## Technical Implementation

### Component: `AICaseGeneratorModalAdvanced.jsx`

**Key Features:**
- 4-step wizard interface
- Real-time validation
- Progress tracking
- Error handling
- Form reset on close
- Responsive design

### Integration with Editor

The component integrates seamlessly with the existing Editor:
```javascript
<AICaseGeneratorModal
    isOpen={showAIGenerator}
    onClose={() => setShowAIGenerator(false)}
    projectId={projectId}
    onGenerate={(newNodes, newEdges, metadata) => {
        // Handle generated content
        // metadata includes: caseTitle, caseDescription, mastermindIndex, suspects
    }}
/>
```

## Best Practices

### For Instructional Designers

1. **Be Specific with Objectives**: Vague objectives lead to generic content
2. **Use Industry Terminology**: Helps AI generate realistic scenarios
3. **Provide Context**: 4-line topic summary should set clear scene
4. **Choose Appropriate Difficulty**: Match to learner skill level

### For AI Generation

1. **Question Quality**: AI creates conversational, not formal questions
2. **Distractor Design**: Structurally similar but conceptually wrong
3. **Evidence Variety**: Mix of logs, emails, documents, reports
4. **Character Depth**: Realistic backgrounds tied to learning objectives

## Future Enhancements

Potential additions:
- [ ] Custom question templates
- [ ] Multi-language support
- [ ] Adaptive difficulty based on player performance
- [ ] Analytics dashboard for learning outcomes
- [ ] Question bank reusability
- [ ] Collaborative authoring mode

## Troubleshooting

### Common Issues

**Issue**: AI generates incomplete JSON
**Solution**: Retry generation, ensure API key is valid

**Issue**: Questions seem too easy/hard
**Solution**: Adjust difficulty level or provide more specific objectives

**Issue**: Suspects unlock out of order
**Solution**: Check unlockCondition values in generated data

**Issue**: Distractors too obvious
**Solution**: Provide more nuanced learning objectives

## Conclusion

The Advanced AI Mystery Wizard transforms mystery game creation into a sophisticated instructional design tool, enabling rapid development of evidence-based training scenarios with professional-grade assessment and feedback systems.
