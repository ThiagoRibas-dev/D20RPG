import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

export class TemplateSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['templates-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const templates = content.templates;

        if (!templates) {
            this.container.innerText = "Error: Template content not found.";
            return;
        }

        for (const templateKey in templates) {
            if (templateKey !== 'type' && templateKey !== 'get') {
                const templateData = await templates[templateKey].get();
                if (!templateData) continue;

                const templateButton = this.container.ownerDocument.createElement('button');
                templateButton.textContent = templateData.name;

                templateButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during template selection.");
                        return;
                    }

                    // For now, we only allow one template.
                    // A more complex system could allow multiple templates.
                    player.template = templateData;

                    // If the template has choices, we need to present them to the user.
                    // This is a placeholder for a more complex UI.
                    if (templateData.choices) {
                        const choices: { [key: string]: string } = {};
                        templateData.choices.forEach((choice: any) => {
                            // For now, just pick the first option automatically.
                            choices[choice.id] = choice.options[0].id;
                        });

                        // In a real implementation, you would show a UI to the user
                        // and get their selections.
                        this.applyTemplate(player, templateData, choices);
                    } else {
                        this.applyTemplate(player, templateData, {});
                    }

                    updateSelectionInfo(templateData);
                };

                this.container.appendChild(templateButton);
            }
        }
    }

    private async applyTemplate(player: any, templateData: ContentItem, choices: { [key: string]: string }) {
        if (templateData.script) {
            const scriptModule = await import(`../../../content/templates/${templateData.script}`);
            if (scriptModule.onApply) {
                scriptModule.onApply(player, choices);
            }
        }

        // Recalculate stats after applying the template
        globalServiceLocator.rulesEngine.calculateStats(player);
    }

    public show(): void {
        this.container.style.display = '';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}
