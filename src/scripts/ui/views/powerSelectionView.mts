import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';
import { ClassComponent } from '../../engine/ecs/components/index.mjs';

export class PowerSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['powers-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        const world = globalServiceLocator.world;
        const classComponent = world.getComponent(playerId, ClassComponent);
        if (!classComponent || classComponent.classes.length === 0) {
            this.container.innerText = "Error: No class selected.";
            return;
        }

        // For simplicity, we'll use the power system of the first class.
        const mainClassId = classComponent.classes[0].classId;
        const classDataItem = globalServiceLocator.contentLoader.getContentItemById('classes', mainClassId);
        if (!classDataItem || !classDataItem.get) {
            this.container.innerText = "Error: Class data not found.";
            return;
        }
        const classData = await classDataItem.get();

        if (!classData || !classData.powerSystem) {
            this.container.innerText = "Error: No power system defined for the selected class.";
            return;
        }

        const powerSystem = classData.powerSystem;
        const powers = content[powerSystem];

        if (!powers) {
            this.container.innerText = `Error: Power content for "${powerSystem}" not found.`;
            return;
        }

        for (const powerKey in powers) {
            if (powerKey !== 'type' && powerKey !== 'get') {
                const powerItem = powers[powerKey] as ContentItem;
                if (powerItem && powerItem.get) {
                    const powerData = await powerItem.get();
                    if (!powerData) continue;

                    const powerButton = this.container.ownerDocument.createElement('button');
                powerButton.textContent = powerData.name;

                powerButton.onclick = () => {
                    console.log(`Selected power: ${powerData.name}`);
                    updateSelectionInfo(powerData);
                };

                    this.container.appendChild(powerButton);
                }
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
