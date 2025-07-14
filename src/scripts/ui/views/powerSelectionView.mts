import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

export class PowerSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['powers-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const player = globalServiceLocator.state.player;

        if (!player || !player.powerSystem || !player.powerSystemRules) {
            this.container.innerText = "Error: No power system defined for the selected class.";
            return;
        }

        const powerSystem = player.powerSystem;
        const powerSystemRules = player.powerSystemRules;

        const powers = content[powerSystem];

        if (!powers) {
            this.container.innerText = `Error: Power content for "${powerSystem}" not found.`;
            return;
        }

        for (const powerKey in powers) {
            if (powerKey !== 'type' && powerKey !== 'get') {
                const powerData = await powers[powerKey].get();
                if (!powerData) continue;

                const powerButton = this.container.ownerDocument.createElement('button');
                powerButton.textContent = powerData.name;

                powerButton.onclick = () => {
                    // In a real implementation, this would be much more complex,
                    // handling known vs. prepared powers, spellbooks, etc.
                    // For now, we'll just log the selection.
                    console.log(`Selected power: ${powerData.name}`);
                    updateSelectionInfo(powerData);
                };

                this.container.appendChild(powerButton);
            }
        }
    }

    public show(): void {
        this.container.style.display = '';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}
