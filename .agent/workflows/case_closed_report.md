# Implementation Plan: Generative Case Closed News Report

This plan outlines the implementation of a cinematic, AI-powered "Case Closed" news report feature.

## Features
1.  **AI-Generated Narratives**: Uses the Gemini/OpenAI API to generate a personalized news script summarizing the player's performance, key evidence found, and the final verdict.
2.  **Cinematic Aesthetics**: A "Breaking News" theme with a pulsing red light, futuristic scanlines, and a scrolling news ticker.
3.  **Responsive Design**: A 2-column layout (Article + Stats) that collapses into a single column on mobile devices.
4.  **End-Game Integration**: Accessible via a new "View Live News Report" button on the Success, Failure, and Timeout screens in `GamePreview`.
5.  **Dynamic Content**: The tone and imagery respond to the game outcome (e.g., "Triumphant" vs. "Somber").

## Components
-   `CaseClosedNewsReport.jsx`: The core component responsible for calling the AI and rendering the news layout.
-   `GamePreview.jsx`: Integrated to track the accused suspect's name and provide the entry point for the report.

## Technical Details
-   **AI Prompting**: The system prompt instructs the AI to return a JSON object containing a headline, lead, details, verdict, and ticker items.
-   **State Management**: Tracks the accused name to ensure the news report correctly identifies who was apprehended (or who escaped).
-   **Libraries**: Uses `framer-motion` for smooth, cinematic transitions and `lucide-react` for high-tech iconography.
