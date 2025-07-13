
# Eversummer Days

This project is a 2D, tile-based, **Hybrid Turn-Based Tactical RPG** inspired by the mechanics of the D20 system (D&D 3.5e) and classic RPGs like Pool of Radiance and Knights of the Chalice. It draws significant inspiration from the strategic, systems-driven combat of **Incursion: Halls of the Goblin King** and the profound emergent interactions and player freedom of **NetHack**. The game seamlessly transitions between a real-time "Exploration Mode" and a strict, initiative-based "Combat Mode."

## Table of Contents
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Game](#running-the-game)
- [User-Generated Content](#user-generated-content)
  - [Content Structure](#content-structure)
  - [Creating New Content](#creating-new-content)
- [Development & Contribution](#development--contribution)
  - [Project Brief & Roadmap](#project-brief--roadmap)
  - [Contributing](#contributing)
- [License & Disclaimer](#license--disclaimer)
- [Contact & Support](#contact--support)
- [Resources](#resources)

## Key Features

*   **D20 Game Mechanics:** The game uses a simplified version of the D&D 3.5e ruleset, under the Open Game License (OGL) 1.0a.
*   **Hybrid Turn System:** The game features a dynamic turn system that transitions between a real-time "Exploration Mode" for general movement and interaction, and a strict, initiative-based "Combat Mode" for tactical encounters. In Combat Mode, actions are resolved in initiative order, allowing for strategic decision-making, similar to Incursion.
*   **Emergent Gameplay & Systemic Interactivity:** Inspired by NetHack, the engine prioritizes systemic interactivity and emergent gameplay. The game provides a toolbox of universal actions and a rich set of object properties, with gameplay emerging from the interactions between these systems.
*   **User-Generated Content :** The primary design goal of the project is allowing users to create and modify game content easily. Users can add their own races, classes, items, spells, maps, quests, and campaigns using simple JSON files. This extensibility allows for endless customization and new adventures.
*   **Campaign-Based Structure:** The game supports multiple campaigns, each with its own self-contained set of maps, characters, organizations, and quests, providing a modular approach to storytelling and world-building.
*   **Standalone Executable:** The game is built using TypeScript and packaged into a standalone executable using `pkg`, allowing users to run it with a simple double-click without needing Node.js or other dependencies.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm (Performant Node.js Package Manager)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ThiagoRibas-dev/D20RPG.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd D20RPG
    ```
3.  Install dependencies using pnpm:
    ```bash
    pnpm install
    ```

### Running the Game

*   **Development Mode:** To run the game in a development server with live reloading:
    ```bash
    pnpm run dev
    ```
    The server will start, and you can open your browser to `http://localhost:3000` (or the port indicated in your terminal).

*   **Building the Executable:** To create a standalone executable:
    ```bash
    pnpm run build
    ```
    The executable will be generated in the `output/` directory.

## User-Generated Content

One of the core philosophies of this project is to empower users to create and share their own content. All game data, from character races and classes to items, spells, and entire campaigns, is defined in simple, human-readable JSON files.

### Content Structure

Game content is organized within the `src/content/` and `src/campaigns/` directories.
*   `src/content/`: Contains global game elements like races, classes, items, spells, feats, skills, AI behaviors, and modifier types.
*   `src/campaigns/`: Each sub-directory here represents a distinct campaign, containing its own maps, NPCs, organizations, and quests.

### Creating New Content

To create new content, you can use the existing JSON files as templates. For example:
*   To add a new race, create a new `.json` file in `src/content/races/` following the structure of `src/content/races/human.json`.
*   To create a new map for your campaign, add a `.json` file to `src/campaigns/MyCampaign/maps/` based on `src/campaigns/MyCampaign/maps/map.json.template`.

## Development & Contribution

### Project Brief & Roadmap

For an overview of the project's vision, current status, and future development plans, please refer to the `PROJECT_BRIEF.md` file in the root directory. This document also contains a checklist/roadmap that tracks completed tasks and upcoming features.

## License & Disclaimer

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/). A copy of this license, along with a reference to the Open Game License, can be found in the `LICENSE.md` file in the root of this repository.

This project utilizes mechanics and content based on the Dungeons & Dragons 3.5 Edition rules, which are licensed under the [Open Game License Version 1.0a (OGL 1.0a)](https://media.wizards.com/2016/dnd/downloads/OGL_V1.0a.pdf) by Wizards of the Coast. The full text of this license is included within the main `LICENSE.md` file.

**Disclaimer:**
This project is not affiliated with or endorsed by Wizards of the Coast. It is a fan-made project created for and entertainment purposes. All content derived from D&D 3.5e rules is used under the Open Game License 1.0a.

## Resources

*   **Online SRD:** For a comprehensive and searchable version of the D&D 3.5e System Reference Document, please visit the [Hypertext d20 SRD](https://www.d20srd.org/index.htm).
*   **Local SRD Files:** For offline reference, the original SRD 3.5 RTF files are included in the `docs/srd35` directory of this repository.

---
*This README is a living document and will be updated as the project evolves.*
