import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

/**
 * Manages the UI and logic for the feat selection step of character creation.
 */
export class FeatSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['feats-selector'];
    }

    /**
     * Renders the list of available feats for the player to choose from.
     * @param content - The main content data object containing all game feats.
     */
    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const feats = content.feats;

        if (!feats) {
            this.container.innerText = "Error: Feat content not found.";
            return;
        }

        for (const featKey in feats) {
            if (featKey !== 'type' && featKey !== 'get') {
                const featData = await feats[featKey].get();
                if (!featData) continue;

                const featButton = this.container.ownerDocument.createElement('button');
                featButton.textContent = featData.name;

                // Set the onclick handler for this feat button
                featButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during feat selection.");
                        return;
                    }

                    // Determine the maximum number of feats allowed.
                    // Base is 1, plus any bonuses (like from being Human).
                    const maxFeats = 1 + (player.modifiers.get('feats.max')?.getTotal() || 0);

                    // Check if the player can select another feat.
                    if (player.feats.length >= maxFeats) {
                        console.log("Cannot select more feats. Maximum reached.");
                        // Optional: Provide UI feedback to the user.
                        updateSelectionInfo({ name: "Maximum Feats Reached", description: `You can only select ${maxFeats} feat(s).` });
                        return;
                    }

                    // Check for prerequisites and if the feat is already selected.
                    if (!player.feats.find(f => f.name === featData.name)) {
                        // TODO: Add prerequisite checking logic here.
                        player.feats.push(featData);
                        console.log(`Feat selected: ${featData.name}`);
                    } else {
                        console.log(`Feat already selected: ${featData.name}`);
                    }

                    updateSelectionInfo(featData);
                };

                this.container.appendChild(featButton);
            }
        }
    }

    public show(): void { this.container.style.display = ''; }
    public hide(): void { this.container.style.display = 'none'; }
}
