# Quick Start Guide: Advanced AI Mystery Wizard

## 🚀 Getting Started

The Advanced AI Mystery Wizard is accessible from the Editor toolbar via the **"AI Build"** button.

---

## 📋 Step-by-Step Workflow

### **Step 1: Industry Context** (Required)

#### Industry Selection
Choose from 8 industries:
- 💰 Finance & Banking
- 🏥 Healthcare
- 💻 Technology & IT
- 🏭 Manufacturing
- 🛍️ Retail & E-commerce
- 🎓 Education
- 🏛️ Government & Public Sector
- ⚡ Energy & Utilities

#### Topic Summary (4 lines max, 400 characters)
Provide a concise scenario description:

**Example:**
```
A data breach at GlobalBank exposed 2 million customer records.
Investigation reveals insider involvement with external hackers.
Players must identify the culprit and understand security protocols.
The incident occurred during a planned system upgrade window.
```

**Tips:**
- Line 1: What happened
- Line 2: Key context
- Line 3: Player objective
- Line 4: Additional detail

#### Location
Specify City/Country for realistic context:
- New York, USA
- London, UK
- Tokyo, Japan
- Mumbai, India

#### Date
Select the incident date using the date picker.

---

### **Step 2: Game Mechanics** (Required)

#### Difficulty Level
Choose one of three levels:

| Level | Suspects | Questions per Document | Best For |
|-------|----------|----------------------|----------|
| **Beginner** | 2-3 | 2 | New learners, basic concepts |
| **Medium** | 4-5 | 3 | Intermediate training |
| **Advanced** | 6-8 | 4 | Expert-level, complex scenarios |

#### Number of Suspects
Use the slider to select 2-10 suspects.

**Recommendations:**
- 2-3: Quick training (15-20 min)
- 4-5: Standard session (30-45 min)
- 6-8: Deep dive (60+ min)

#### Diverse Identities Toggle
✅ **Enabled** (Recommended):
- Varied ages (20s-60s)
- Different genders
- Multiple ethnicities
- Prevents cognitive bias
- More realistic scenarios

❌ **Disabled**:
- AI has more freedom
- May default to stereotypes

---

### **Step 3: Learning Objectives** (Required)

#### Adding Objectives
Click **"+ Add Learning Objective"** to add more objectives.

#### Writing Effective Objectives

**✅ Good Examples:**

```
Objective 1:
Identify common phishing email indicators including:
- Suspicious sender domains
- Urgent language tactics
- Unexpected attachments
- Mismatched URLs in links
```

```
Objective 2:
Understand multi-factor authentication bypass techniques:
- Token interception methods
- Session hijacking vulnerabilities
- Weak validation exploits
```

```
Objective 3:
Recognize insider threat indicators in access logs:
- Unusual access times
- Privilege escalation patterns
- Data exfiltration signatures
```

**❌ Poor Examples:**

```
Learn about security
```
*Too vague - AI can't create specific questions*

```
Cybersecurity
```
*Not an objective - just a topic*

```
Know stuff about hacking
```
*Unprofessional and unclear*

#### Tips for Great Objectives
1. **Be Specific**: Include concrete examples
2. **Use Action Verbs**: Identify, Understand, Recognize, Apply
3. **List Sub-Points**: Break down complex concepts
4. **Industry Terms**: Use professional terminology
5. **Measurable**: Can you test if someone learned this?

#### Removing Objectives
Click the **X** button next to any objective (minimum 1 required).

---

### **Step 4: Review & Generate** (Final)

#### Review Your Configuration

Check all settings before generating:

**Industry Context:**
- Industry, Topic, Location, Date

**Game Mechanics:**
- Difficulty level
- Number of suspects
- Diversity setting

**Learning Objectives:**
- Count of objectives defined
- Quick scan of content

#### Generate Button

Click **"Generate Mystery"** to start AI generation.

**What Happens:**
1. Progress bar appears (15-45 seconds)
2. AI builds complete mystery structure
3. Suspects created with sequential unlock
4. Evidence documents generated (3 per suspect)
5. Questions created with feedback
6. Nodes and edges constructed
7. Mystery loaded into editor

---

## 🎯 What You Get

### Generated Content

#### Case Metadata
- **Title**: Auto-generated from context
- **Description**: Professional summary
- **Mastermind Index**: Random culprit position

#### Suspects (Based on count selected)
Each suspect includes:
- Full name
- Professional role
- Identity details (if diversity enabled)
- Alibi statement
- Potential motive
- Personality traits
- Unlock condition (null for first, evidence-based for others)

#### Evidence Documents (3 per suspect)
Each document includes:
- Unique ID
- Descriptive label
- Detailed description
- AI image generation prompt
- Questions array

#### Questions (2-4 per document, based on difficulty)
Each question includes:
- Fill-in-the-blank format
- Correct answer
- 3 distractors (structurally similar)
- Hint (max 2 lines)
- Correct explanation (max 2 lines)
- 3 distractor explanations (max 2 lines each)
- Learning objective mapping

#### Game Nodes
- Story introduction node
- Suspect nodes (sequential unlock)
- Evidence nodes (3 per suspect)
- Question nodes (per evidence)
- Logic nodes (unlock gates)
- Identify culprit node (finale)

---

## 🎮 Player Experience

### Sequential Progression

```
1. Story Introduction
   ↓
2. Suspect 1 (Available immediately)
   ↓
3. Evidence 1-1 → Questions
   ↓
4. Evidence 1-2 → Questions
   ↓
5. Evidence 1-3 → Questions
   ↓
6. [Logic Check: All evidence collected?]
   ↓
7. Suspect 2 (Unlocked!)
   ↓
8. Evidence 2-1 → Questions
   ↓
   [Continue for all suspects]
   ↓
9. Identify Culprit (Final accusation)
```

### Question Format Example

**Screen Display:**
```
Evidence: Email Communication Log

Question 1 of 3:

Fill in the blank: The unauthorized access occurred at ___________.

Options:
○ A) 03:47 AM GMT
○ B) 03:47 PM GMT
○ C) 15:47 GMT
○ D) 03:47 AM EST

[Submit Answer]
```

**If Wrong:**
```
❌ Incorrect

Hint: Check the timestamp format in the log header

Why this is wrong: PM would be 15:47 in 24-hour format, not 03:47
```

**If Correct:**
```
✅ Correct!

Explanation: The log clearly shows 03:47 in 24-hour format with GMT timezone

Learning Objective: Identify authentication vulnerabilities in enterprise systems
```

---

## 💡 Best Practices

### For Training Designers

1. **Start Simple**: Use Beginner difficulty for first attempt
2. **Test Objectives**: Can you answer questions about them?
3. **Industry Alignment**: Match industry to your organization
4. **Realistic Dates**: Use recent dates for relevance
5. **Review Generated Content**: Always preview before deployment

### For Learners

1. **Read Carefully**: Evidence contains all answers
2. **Take Notes**: Track clues across documents
3. **Use Hints**: They guide without spoiling
4. **Learn from Mistakes**: Wrong answer explanations teach
5. **Map to Objectives**: Connect questions to learning goals

---

## 🔧 Troubleshooting

### Generation Failed

**Possible Causes:**
- Invalid API key
- Network timeout
- AI service unavailable

**Solutions:**
1. Check Settings → AI API Key
2. Retry generation
3. Simplify objectives (reduce complexity)
4. Reduce suspect count

### Questions Too Easy/Hard

**Solution:**
- Adjust difficulty level
- Refine learning objectives (more/less specific)
- Change suspect count

### Suspects Not Unlocking

**Check:**
- Evidence completion status
- Logic node connections
- Unlock conditions in suspect data

### Distractors Too Obvious

**Solution:**
- Use more technical/specific objectives
- Increase difficulty level
- Provide industry-specific terminology

---

## 📊 Example Scenarios

### Scenario 1: Cybersecurity Training

```
Industry: Technology & IT
Topic: Ransomware attack on healthcare provider's patient database.
       IT team must trace the attack vector and identify the entry point.
       Players learn about network security and incident response.
       Attack exploited a zero-day vulnerability in legacy systems.
Location: Seattle, USA
Date: 2024-02-10
Difficulty: Medium
Suspects: 4
Objectives:
  1. Identify ransomware attack vectors and entry points
  2. Understand network segmentation failures
  3. Apply incident response procedures
```

### Scenario 2: Compliance Training

```
Industry: Finance & Banking
Topic: Insider trading investigation at investment firm.
       Suspicious trades before major acquisition announcement.
       Players identify the leak source and understand compliance rules.
       Case involves analysis of trading patterns and communications.
Location: Hong Kong
Date: 2024-01-15
Difficulty: Advanced
Suspects: 6
Objectives:
  1. Recognize insider trading red flags in trading patterns
  2. Understand information barrier requirements
  3. Apply regulatory compliance procedures
```

### Scenario 3: Safety Training

```
Industry: Manufacturing
Topic: Industrial accident investigation at chemical plant.
       Equipment failure led to minor chemical spill.
       Players identify safety protocol violations.
       Investigation reveals maintenance and training gaps.
Location: Frankfurt, Germany
Date: 2024-03-01
Difficulty: Beginner
Suspects: 3
Objectives:
  1. Identify common safety protocol violations
  2. Understand equipment maintenance requirements
  3. Recognize training deficiency indicators
```

---

## 🎓 Learning Outcomes

After completing a generated mystery, learners will:

✅ **Understand** industry-specific concepts through narrative
✅ **Apply** knowledge to solve evidence-based challenges
✅ **Analyze** complex scenarios with multiple perspectives
✅ **Evaluate** information to identify the culprit
✅ **Remember** concepts through engaging storytelling

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review `ADVANCED_WIZARD_DOCS.md` for technical details
3. See `AI_WIZARD_COMPARISON.md` for feature explanations
4. Contact your system administrator

---

**Happy Mystery Building! 🕵️‍♀️🎮**
