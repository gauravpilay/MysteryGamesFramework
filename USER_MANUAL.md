# Mystery Games Framework - Node Palette User Manual

Welcome to the Mystery Games Framework Editor! This manual provides a detailed explanation of each node type available in the Node Palette, along with a guide to the workspace controls, new case features, and user management system.

## Table of Contents

1. [Dashboard & Workspace Controls](#1-dashboard--workspace-controls)
2. [User Management & Access Control](#2-user-management--access-control)
3. [Story Node](#3-story-node)
4. [Suspect Node](#4-suspect-node)
5. [Evidence Node](#5-evidence-node)
6. [Logic Node](#6-logic-node)
7. [Terminal Node](#7-terminal-node)
8. [Message Node](#8-message-node)
9. [Background Audio](#9-background-audio)
10. [Media Asset](#10-media-asset)
11. [Action Button](#11-action-button)
12. [Identify Culprit](#12-identify-culprit)
13. [Notification](#13-notification)
14. [Question](#14-question)
15. [Lockpick Minigame](#15-lockpick-minigame)
16. [Decryption Minigame](#16-decryption-minigame)
17. [Keypad Lock](#17-keypad-lock)
18. [Tutorial: Building Your First Mystery](#18-tutorial-building-your-first-mystery)

---

### 1. Dashboard & Workspace Controls

The **Dashboard** is your command center for managing all mystery cases. Depending on your role (Admin or User), different controls will be available.

#### For Admins:
*   **Active vs. Draft Views:**
    *   **Active Investigations:** Cases that have been published and are live for users.
    *   **Draft Case Files:** Work-in-progress cases visible only to Admins.
*   **New Case:** Click the `+ New Case` button to create a blank slate for a new mystery.
*   **Seed Sample:** Use the `Rocket` icon (if enabled) in the header to instantly generate a fully playable demo case ("Operation Blackout") to see the framework in action.
*   **Case Controls (On each Card):**
    *   **Publish/Unpublish:** Toggle a case between "Draft" and "Live" status.
    *   **Duplicate:** Click the `Copy` icon to clone an entire case. Useful for creating templates or A/B testing variations.
    *   **Delete:** Click the `Trash` icon to permanently remove a case.
*   **Manage Users:** Access the User Management console via the `Manage Users` button.

#### For Users:
*   **View Assigned Cases:** You will only see cases that have been explicitly assigned to you by an Admin, or all public cases if your organization uses an "Open Access" policy.
*   **Play Mode:** Clicking a case opens it in "Play Mode" rather than "Edit Mode".

---

### 2. User Management & Access Control

The **User Management Console** allows Admins to control personnel and their clearance levels.

#### Role Management
*   **Promote/Demote:** You can toggle a user's role between `User` and `Admin`.
    *   **Admin:** Full access to create, edit, delete, and publish cases. Can manage other users.
    *   **User:** Can only play assigned cases. Cannot access the Editor or Admin controls.

#### Case Access Control
By default, users have access to **all** published cases ("Open Access"). However, for sensitive operations or tiered content, you can restrict access.

1.  Click the **"Access"** button (Folder with Lock icon) next to a user in the table.
2.  **Access Modes:**
    *   **All Cases (Default):** The user automatically gains access to every current and future published case.
    *   **Restricted Access:** Select this to manually pick which cases this user can see.
3.  **Selection:** In Restricted mode, simply check or uncheck individual cases from the list.
4.  **Save:** Click "Save Changes" to apply the new permissions immediately.

---

### 3. Story Node
**Icon:** FileText (Blue)

The **Story Node** is the primary narrative building block of your game. It is used to display text, dialogue, or descriptions to the player.

*   **When to use:** Use this whenever you need to advance the plot, describe a scene, or show conversation.
*   **Examples:**
    *   "Opening Scene description"
    *   "Conversation with a Witness"
    *   "Description of a spooky room"

#### Rich Text & Formatting
The Story Node supports basic Markdown-style formatting to help you emphasize keywords and guide the player's attention:
*   **Bold Text:** Wrap text in double asterisks like `**CRITICAL CLUE**` to make it bold and bright.
*   **Color Emphasis:** Use color tags to highlight specific words.
    *   `[red]Hostile[/red]`
    *   `[blue]Calm[/blue]`
    *   `[green]Success[/green]`
    *   `[yellow]Warning[/yellow]`
    *   `[indigo]Neural Link[/indigo]`
    *   `[orange]Danger[/orange]`

### 4. Suspect Node
**Icon:** User (Red)

The **Suspect Node** represents a character in the mystery.

*   **When to use:** Use this to define a person of interest. Players can interact with this node to view the suspect's dossier, check their alibi, and review their recent actions.
*   **Examples:**
    *   "Col. Mustard"
    *   "The suspicious butler"
    *   "Veronica (The Victim's Sister)"

### 5. Evidence Node
**Icon:** Search (Yellow)

The **Evidence Node** represents a collectible item found in the game world.

*   **When to use:** Use this when the player discovers a clue. When encountered, this evidence is added to the player's inventory and can be referenced later by Logic Nodes to check if the player has found specific items.
*   **Examples:**
    *   "Bloody Knife"
    *   "Encrypted USB Drive"
    *   "Crumpled Note found in the trash"

### 6. Logic Node
**Icon:** GitMerge (Emerald)

The **Logic Node** controls the flow of the game based on specific conditions.

*   **When to use:** Use this to create branching paths. You can check if a player has a specific item, has visited a certain node, or if a variable meets a condition. It supports 'If/Else' logic and 'While' loops (waiting for events).
*   **Examples:**
    *   "Check if the player has the 'Key Card' before opening the door."
    *   "Wait until the player has successfully hacked the terminal."
    *   "Branch the story: If the player accuses the Butler, go to Node A; otherwise, go to Node B."

### 7. Terminal Node
**Icon:** Terminal (Green)

The **Terminal Node** presents a hacking interface or a command-line challenge to the player.

*   **When to use:** Use this to simulate a computer system or a lock that requires a password or specific command to bypass.
*   **Examples:**
    *   "Password Lock on a laptop"
    *   "Database Query Interface"
    *   "Security Override Sequence"

### 8. Message Node
**Icon:** MessageSquare (Violet)

The **Message Node** simulates an incoming digital communication.

*   **When to use:** Use this to deliver hints, urgent plot updates, or messages from NPCs outside the immediate scene. It mimics an email, SMS, or radio transmission.
*   **Examples:**
    *   "Anonymous Tip via SMS"
    *   "Briefing from HQ"
    *   "Threatening Text Message"

### 9. Background Audio
**Icon:** Music (Pink)

The **Background Audio Node** sets the mood of the scene.

*   **When to use:** Use this to change the background music or ambient sound. The specified track will loop while this node is active.
*   **Examples:**
    *   "Suspense Theme for a crime scene"
    *   "High-energy Action Music for a chase"
    *   "Eerie Silence"

### 10. Media Asset
**Icon:** ImageIcon (Orange)

The **Media Asset Node** displays a visual element to the player.

*   **When to use:** Use this to show an image or video that provides visual context or clues.
*   **Examples:**
    *   "CCTV Footage (embedded YouTube/Video link)"
    *   "High-res photo of the Crime Scene"
    *   "Scanned image of a secret document"

### 11. Action Button
**Icon:** MousePointerClick (Indigo)

The **Action Button Node** creates an interactive choice for the player.

*   **When to use:** Use this to create branching options or points of interaction. It presents a button that the player must click to proceed.
*   **Examples:**
    *   "Open Door"
    *   "Talk to Witness"
    *   "Examine key under the mat"

### 12. Identify Culprit
**Icon:** Fingerprint (Red-600)

The **Identify Culprit Node** is a special challenge node, usually for the endgame.

*   **When to use:** Use this when the player is ready to solve the case. It prompts the player to select the guilty suspect from a list of all encountered suspects. Success typically triggers the end of the game.
*   **Examples:**
    *   "Final Accusation"
    *   "Who killed the victim?"

### 13. Notification
**Icon:** Bell (Sky)

The **Notification Node** shows a modal popup to alert the player.

*   **When to use:** Use this for meta-game information, tutorial tips, or critical alerts that pause the game flow until acknowledged.
*   **Examples:**
    *   "Achievement Unlocked: Master Detective"
    *   "System Alert: Security Breach"
    *   "Tutorial Tip: Click on items to examine them"

### 14. Question
**Icon:** HelpCircle (Fuchsia)

The **Question Node** presents a quiz or specific question to the player.

*   **When to use:** Use this to test the player's knowledge or deductions. You can define single or multiple correct answers.
*   **Examples:**
    *   "Riddle: What has keys but no locks?"
    *   "Knowledge Check: What was the time of death?"
    *   "Code Decryption challenge"

### 15. Lockpick Minigame
**Icon:** Unlock (Amber)

The **Lockpick Node** launches an interactive minigame requiring player reflexes.

*   **When to use:** Use this to simulate picking a physical lock on a door, chest, or safe. The player must click at the right moment to align tumblers.
*   **Features:**
    *   **Difficulty:** Choose between Easy, Medium, or Hard to adjust speed and complexity.
    *   **Success Variable:** Automatically sets a logic variable (e.g., `door_unlocked`) to 'True' when beaten.

### 16. Decryption Minigame
**Icon:** Binary (Lime)

The **Decryption Node** presents a "hacker style" puzzle interface.

*   **When to use:** Use this for computer hacking sequences. Characters rain down or scramble, and the player must lock in the correct code.
*   **Features:**
    *   **Target Phrase:** Set the secret word (e.g., "PASSWORD") that must be decoded.
    *   **Time Limit:** Set the urgency of the hack in seconds.

### 17. Keypad Lock
**Icon:** Grid3x3 (Slate)

The **Keypad Node** requires a specific numeric code to proceed.

*   **When to use:** Perfect for secure doors, safes, or phone unlocks where the player must have found a code elsewhere in the game.
*   **Features:**
    *   **Passcode:** Set the exact numeric code required (e.g., "0451").
    *   **Success Variable:** Completing the code triggers this variable for use in Logic Nodes.

### 18. Tutorial: Building Your First Mystery

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
