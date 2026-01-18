# Mystery Games Framework - Node Palette User Manual

Welcome to the Mystery Games Framework Editor! This manual provides a detailed explanation of each node type available in the Node Palette. Use these nodes to construct your interactive mystery narratives.

## Table of Contents

1. [Story Node](#1-story-node)
2. [Suspect Node](#2-suspect-node)
3. [Evidence Node](#3-evidence-node)
4. [Logic Node](#4-logic-node)
5. [Terminal Node](#5-terminal-node)
6. [Message Node](#6-message-node)
7. [Background Audio](#7-background-audio)
8. [Media Asset](#8-media-asset)
9. [Action Button](#9-action-button)
10. [Identify Culprit](#10-identify-culprit)
11. [Notification](#11-notification)
12. [Question](#12-question)
13. [Tutorial: Building Your First Mystery](#13-tutorial-building-your-first-mystery)

---

### 1. Story Node
**Icon:** FileText (Blue)

The **Story Node** is the primary narrative building block of your game. It is used to display text, dialogue, or descriptions to the player.

*   **When to use:** Use this whenever you need to advance the plot, describe a scene, or show conversation.
*   **Examples:**
    *   "Opening Scene description"
    *   "Conversation with a Witness"
    *   "Description of a spooky room"

### 2. Suspect Node
**Icon:** User (Red)

The **Suspect Node** represents a character in the mystery.

*   **When to use:** Use this to define a person of interest. Players can interact with this node to view the suspect's dossier, check their alibi, and review their recent actions.
*   **Examples:**
    *   "Col. Mustard"
    *   "The suspicious butler"
    *   "Veronica (The Victim's Sister)"

### 3. Evidence Node
**Icon:** Search (Yellow)

The **Evidence Node** represents a collectible item found in the game world.

*   **When to use:** Use this when the player discovers a clue. When encountered, this evidence is added to the player's inventory and can be referenced later by Logic Nodes to check if the player has found specific items.
*   **Examples:**
    *   "Bloody Knife"
    *   "Encrypted USB Drive"
    *   "Crumpled Note found in the trash"

### 4. Logic Node
**Icon:** GitMerge (Emerald)

The **Logic Node** controls the flow of the game based on specific conditions.

*   **When to use:** Use this to create branching paths. You can check if a player has a specific item, has visited a certain node, or if a variable meets a condition. It supports 'If/Else' logic and 'While' loops (waiting for events).
*   **Examples:**
    *   "Check if the player has the 'Key Card' before opening the door."
    *   "Wait until the player has successfully hacked the terminal."
    *   "Branch the story: If the player accuses the Butler, go to Node A; otherwise, go to Node B."

### 5. Terminal Node
**Icon:** Terminal (Green)

The **Terminal Node** presents a hacking interface or a command-line challenge to the player.

*   **When to use:** Use this to simulate a computer system or a lock that requires a password or specific command to bypass.
*   **Examples:**
    *   "Password Lock on a laptop"
    *   "Database Query Interface"
    *   "Security Override Sequence"

### 6. Message Node
**Icon:** MessageSquare (Violet)

The **Message Node** simulates an incoming digital communication.

*   **When to use:** Use this to deliver hints, urgent plot updates, or messages from NPCs outside the immediate scene. It mimics an email, SMS, or radio transmission.
*   **Examples:**
    *   "Anonymous Tip via SMS"
    *   "Briefing from HQ"
    *   "Threatening Text Message"

### 7. Background Audio
**Icon:** Music (Pink)

The **Background Audio Node** sets the mood of the scene.

*   **When to use:** Use this to change the background music or ambient sound. The specified track will loop while this node is active.
*   **Examples:**
    *   "Suspense Theme for a crime scene"
    *   "High-energy Action Music for a chase"
    *   "Eerie Silence"

### 8. Media Asset
**Icon:** ImageIcon (Orange)

The **Media Asset Node** displays a visual element to the player.

*   **When to use:** Use this to show an image or video that provides visual context or clues.
*   **Examples:**
    *   "CCTV Footage (embedded YouTube/Video link)"
    *   "High-res photo of the Crime Scene"
    *   "Scanned image of a secret document"

### 9. Action Button
**Icon:** MousePointerClick (Indigo)

The **Action Button Node** creates an interactive choice for the player.

*   **When to use:** Use this to create branching options or points of interaction. It presents a button that the player must click to proceed.
*   **Examples:**
    *   "Open Door"
    *   "Talk to Witness"
    *   "Examine key under the mat"

### 10. Identify Culprit
**Icon:** Fingerprint (Red-600)

The **Identify Culprit Node** is a special challenge node, usually for the endgame.

*   **When to use:** Use this when the player is ready to solve the case. It prompts the player to select the guilty suspect from a list of all encountered suspects. Success typically triggers the end of the game.
*   **Examples:**
    *   "Final Accusation"
    *   "Who killed the victim?"

### 11. Notification
**Icon:** Bell (Sky)

The **Notification Node** shows a modal popup to alert the player.

*   **When to use:** Use this for meta-game information, tutorial tips, or critical alerts that pause the game flow until acknowledged.
*   **Examples:**
    *   "Achievement Unlocked: Master Detective"
    *   "System Alert: Security Breach"
    *   "Tutorial Tip: Click on items to examine them"

### 12. Question
**Icon:** HelpCircle (Fuchsia)

The **Question Node** presents a quiz or specific question to the player.

*   **When to use:** Use this to test the player's knowledge or deductions. You can define single or multiple correct answers.
*   **Examples:**
    *   "Riddle: What has keys but no locks?"
    *   "Knowledge Check: What was the time of death?"
    *   "Code Decryption challenge"

---

### 13. Tutorial: Building Your First Mystery

In this example, we will build a short mystery game: **"The Cyber Heist"**.

**Premise:** A corporate server has been hacked from the inside. The player must identify the mole before the data is leaked.

#### Step 1: Setting the Scene (Story Node)
1.  Drag a **Story Node** to the canvas.
    *   **Label:** "Mission Briefing"
    *   **Content:** "HQ here. We have a breach at CorpTech. Someone inside bypassed the firewall at 03:00 AM. You have 15 minutes to find the culprit."
2.  Drag a **Background Audio Node** and connect it to the Story Node.
    *   **Track:** Select "Suspense Theme" to set the mood immediately.

#### Step 2: The Hub & Suspects
1.  Create a new **Story Node** called "Main Lobby". Connect the Briefing node to this one. This will serve as your central hub.
2.  Drag three **Suspect Nodes** onto the canvas:
    *   **Suspect A:** "SysAdmin Dave" (Alibi: Sleeping at home)
    *   **Suspect B:** "Manager Alice" (Alibi: Working late in office)
    *   **Suspect C:** "Intern Bob" (Alibi: At a party)
3.  Connect the "Main Lobby" node to each Suspect Node.
    *   **Edge Labels:** Click on the connecting lines and label them "Interrogate Dave", "Question Alice", etc.

#### Step 3: Leaving Clues (Evidence & Logic)
We want the player to find a log file that contradicts Alice's alibi.
1.  Create a **Terminal Node** called "Server Room PC".
    *   **Challenge:** "Enter password" (Set answer to 'admin123').
2.  Connect "Main Lobby" to this Terminal Node with label "Inspect Server Room".
3.  Create an **Evidence Node** called "Access Logs".
    *   **Description:** "The logs show a login from Alice's terminal at 03:05 AM."
4.  Connect the Terminal Node to this Evidence Node. This means the player must hack the PC to get the evidence.

#### Step 4: Connecting the Dots (Logic Node)
Now, let's make Alice reveal more info *only if* the player has the evidence.
1.  Drag a **Logic Node** near Alice.
    *   **Condition:** Check if player has "Access Logs" (Evidence).
2.  Create a connection from "Suspect Alice" to this Logic Node.
    *   **Label:** "Press for details"
3.  **True Path:** Connect the Logic Node (Handle: True) to a new **Story Node** called "Alice Confesses".
    *   **Content:** "Fine! I was here, but I didn't steal the data! I saw Bob sneaking into the server room!"
4.  **False Path:** Connect the Logic Node (Handle: False) to a new **Story Node** called "Alice Denies".
    *   **Content:** "I told you, I was working. I don't know anything else."

#### Step 5: The Climax (Identify Culprit)
1.  Create a **Story Node** called "Final Deduction".
    *   **Content:** "You have gathered enough clues. Who is the mole?"
2.  Connect your various paths back to this node (or make it accessible from the Hub).
3.  Drag an **Identify Culprit Node** and connect it to the Final Deduction node.
    *   **Configuration:** Mark "Intern Bob" as the correct answer (based on Alice's witness account).

**Congratulations!** You have built a dynamic mystery game with branching dialogue, inventory-based logic, and a challenging conclusion.

---

*This manual was generated for the Mystery Games Framework.*
