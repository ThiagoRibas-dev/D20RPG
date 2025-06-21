import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator, ServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

/**
 * Manages the UI and logic for the race selection step of character creation.
 */
export class RaceSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = ServiceLocator.UI.els['races-selector'];
    }

    /**
     * Renders the list of available races for the player to choose from.
     * @param content - The main content data object containing all game races.
     */
    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const races = content.races;

        if (!races) {
            this.container.innerText = "Error: Race content not found.";
            return;
        }

        for (const raceKey in races) {
            // Standard check to ignore prototype properties and internal keys
            if (raceKey !== 'type' && raceKey !== 'get') {
                const raceData = await races[raceKey].get();
                if (!raceData) continue;

                const raceButton = this.container.ownerDocument.createElement('button');
                raceButton.textContent = raceData.name;

                // Set the onclick handler for this race button
                raceButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during race selection.");
                        return;
                    }

                    // Update the central info panel
                    updateSelectionInfo(raceData);

                    // Set the selected race on the player object in globalServiceLocator.state
                    player.selectedRace = raceData;
                };

                // Add an icon if it exists
                if (raceData.icon) {
                    const imgElement = this.container.ownerDocument.createElement("img");
                    imgElement.src = raceData.icon;
                    raceButton.appendChild(imgElement);
                }

                this.container.appendChild(raceButton);
            }
        }
    }

    /**
     * Makes the race selection view visible.
     */
    public show(): void {
        this.container.style.display = '';
    }

    /**
     * Hides the race selection view.
     */
    public hide(): void {
        this.container.style.display = 'none';
    }
}