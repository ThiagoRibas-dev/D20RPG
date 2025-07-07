import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { EntityClass } from '../../engine/entities/entity.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

/**
 * Manages the UI and logic for the class selection step of character creation.
 */
export class ClassSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['classes-selector'];
    }

    /**
     * Renders the list of available classes for the player to choose from.
     * @param content - The main content data object containing all game classes.
     */
    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const classes = content.classes;

        if (!classes) {
            this.container.innerText = "Error: Class content not found.";
            return;
        }

        for (const classKey in classes) {
            if (classKey !== 'type' && classKey !== 'get') {
                const classData = await classes[classKey].get();
                if (!classData) continue;

                const classButton = this.container.ownerDocument.createElement('button');
                classButton.textContent = classData.name;

                // Set the onclick handler for this class button
                classButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during class selection.");
                        return;
                    }

                    // For now, we only allow one class at level 1. A multiclassing
                    // system would require more complex logic here.
                    if (player.classes.length > 0) {
                        player.classes = []; // Reset if they change their mind
                    }

                    const hitDieValue: number = parseInt(classData.hit_die.replace('d', ''), 10);

                    const newClass: EntityClass = {
                        class: classData,
                        level: 1,
                        classSkills: classData.class_skills || [],
                        hitDice: hitDieValue || 8 // Default to d8 if missing
                    };

                    player.classes.push(newClass);
                    player.totalLevel = player.classes.reduce((sum, cls) => sum + cls.level, 0);

                    updateSelectionInfo(classData);
                };

                // Add an icon if it exists
                if (classData.icon) {
                    const imgElement = this.container.ownerDocument.createElement("img");
                    imgElement.src = classData.icon;
                    classButton.appendChild(imgElement);
                }

                this.container.appendChild(classButton);
            }
        }
    }

    /**
     * Makes the class selection view visible.
     */
    public show(): void {
        this.container.style.display = '';
    }

    /**
     * Hides the class selection view.
     */
    public hide(): void {
        this.container.style.display = 'none';
    }
}