import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';
import { TemplateComponent } from '../../engine/ecs/components/index.mjs';
import { EntityID } from '../../engine/ecs/world.mjs';

export class TemplateSelectionView {
    private container: HTMLElement | null;

    constructor() {
        this.container = globalServiceLocator.ui.els['templates-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        if (!this.container) {
            return;
        }
        this.container.innerHTML = ""; // Clear previous content
        const templates = content.templates;

        if (!templates) {
            this.container.innerText = "Error: Template content not found.";
            return;
        }

        const player = globalServiceLocator.state.playerId;
        if (!player) {
            console.error("Player not initialized during template rendering.");
            return;
        }

        const world = globalServiceLocator.world;
        const templateComponent = world.getComponent(player, TemplateComponent);
        if (!templateComponent) {
            console.error("Player entity does not have a TemplateComponent.");
            return;
        }

        for (const templateKey in templates) {
            if (templateKey !== 'type' && templateKey !== 'get') {
                const templateData = await templates[templateKey].get();
                if (!templateData) continue;

                const templateButton = this.container.ownerDocument.createElement('button');
                templateButton.textContent = templateData.name;
                templateButton.dataset.templateId = templateKey;

                if (templateComponent.templateId === templateKey) {
                    templateButton.classList.add('selected');
                }

                templateButton.onclick = async () => {
                    const isSelected = templateButton.classList.contains('selected');
                    const currentTemplateId = templateButton.dataset.templateId;

                    // Deselect all buttons
                    this.container?.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('selected');
                    });

                    const effectManager = globalServiceLocator.effectManager;

                    // Un-apply the old template if one was selected
                    if (templateComponent.templateId) {
                        await effectManager.removeTemplateEffects(player, templateComponent.templateId);
                    }

                    if (isSelected) {
                        // If it was already selected, unselect it
                        templateComponent.templateId = null;
                        updateSelectionInfo(null);
                    } else {
                        // Otherwise, select the new one
                        templateButton.classList.add('selected');
                        templateComponent.templateId = currentTemplateId || null;
                        
                        // TODO: Handle template choices properly
                        const choices = {}; // Placeholder
                        await effectManager.applyTemplateEffects(player, templateComponent.templateId, choices);
                        
                        updateSelectionInfo(templateData);
                    }
                };

                this.container.appendChild(templateButton);
            }
        }
    }

    public show(): void {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    public hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}
