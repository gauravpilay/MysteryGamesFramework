# Mystery Game Framework - Implementation Plan

## 1. Project Setup
- **Stack**: Vite + React + Tailwind CSS
- **Dependencies**: 
  - `reactflow`: Visual node editor
  - `lucide-react`: Icons
  - `jszip`: Export generation
  - `clsx` / `tailwind-merge`: Class management
  - `react-router-dom`: Routing
  - `firebase`: Authentication
  - `framer-motion`: Animations (for premium feel)
  - `zustand`: State management (easier than Redux for this scope)

## 2. Architecture & Data Structure
### JSON Schema (The "Save File")
```json
{
  "id": "project-id",
  "metadata": {
    "title": "Mystery of the Missing Code",
    "description": "A thriller...",
    "author": "User"
  },
  "nodes": [
    { "id": "1", "type": "story", "data": { "text": "..." }, "position": { "x": 0, "y": 0 } },
    { "id": "2", "type": "suspect", "data": { "name": "...", "alibi": "..." }, "position": { "x": 100, "y": 100 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}
```

## 3. Core Modules
### A. Authentication
- Firebase Config setup.
- Login Page with Google Button.
- Protected Route wrapper.

### B. Dashboard
- **Layout**: Grid of "Case Files" (Projects).
- **Actions**: Create New, Delete, Open.
- **Visuals**: Dark mode, glassmorphism cards.

### C. Visual Mission Architect (The Editor)
- **Canvas**: Full screen React Flow instance.
- **Toolbar**: Draggable node types (Story, Suspect, Evidence, Logic).
- **Properties Panel**: Edit the `data` of the selected node.
- **Top Bar**: Save, Load JSON, Generate Build.

### D. Export Engine ("The Generator")
- A utility function `generateGame(projectData)`.
- **Mechanism**:
  1. Fetch/Read a "Player Template" (a minimal pre-built React app skeleton).
  2. Inject `projectData` into a `game-data.json` or `config.js` file within that skeleton.
  3. Zip the entire structure using `jszip`.
  4. Trigger download.
- *Note*: To keep it "no-code" for the agent to build, we might embed the player template source codes as string constants or have a sub-folder that gets read. For simplicity in this single environment, we will embed the critical "Player" logic as a string template that gets written to `App.jsx` in the downloaded zip.
- [x] **Sample Story & Tutorial**
  - [x] Create "Tutorial: The Missing Architect" sample project injection logic
  - [x] Create "Case: The Digital Insider" Cyber Attack sample project
  - [x] Implement "How To" guided tour in Editor
  - [x] Add highlighting/spotlight feature for tutorial steps
## 4. Work Breakdown
1. **Initialize Project**: Scaffold Vite app, install libs.
2. **Setup Tailwind**: Config for dark mode and colors.
3. **Auth**: Basic Firebase dummy/real setup (User asked for Firebase/GCP, we will set up the code structure, user might need to provide keys). *Self-correction: I will use a mock auth for the immediate demo if keys aren't provided, but code will be ready for keys.*
4. **Dashboard UI**: Build the card layout.
5. **Editor UI**: Integrate React Flow.
6. **Custom Nodes**: Implement Story, Suspect, Evidence styling.
7. **Export Logic**: Write the JSZip generation code.
8. **Test**: Verify flow.

## 5. Aesthetics
- **Theme**: "Cyber Detective" / "Noir SaaS".
- **Colors**: Slate/Zinc backgrounds, Indigo/Violet accents, Emerald for success logic.
- **Typography**: Inter or similar system font.
