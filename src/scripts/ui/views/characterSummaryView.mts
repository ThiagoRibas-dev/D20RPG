import { ServiceLocator } from '../../engine/serviceLocator.mjs';
import { calculateModifier } from '../../engine/utils.mjs';

export class CharacterSummaryView {
    private container: HTMLElement;

    constructor() {
        this.container = ServiceLocator.UI.els['character-summary'];
    }

    public render(): void {
        this.container.innerHTML = ''; // Clear previous content
        const player = ServiceLocator.State.player;

        if (!player || !player.selectedRace || player.classes.length === 0) {
            this.container.textContent = "Character data is incomplete. Please go back and make all selections.";
            return;
        }

        this.addSection("Race", player.selectedRace.name);
        this.addSection("Class", player.classes.map(c => `${c.class.name} ${c.level}`).join(', '));
        this.addSection("Abilities", Object.entries(player.stats).map(([key, value]) =>
            `${key.toUpperCase()}: ${value} (Mod: ${calculateModifier(value)})`
        ));
        this.addSection("Feats", player.feats.map(f => f.name));
        // Add more sections for Skills, HP, etc. as needed

        const confirmButton = this.container.ownerDocument.createElement('button');
        confirmButton.textContent = "Confirm Character and Begin";
        confirmButton.onclick = () => {
            // Finalize stats one last time
            ServiceLocator.RulesEngine.calculateStats(player);
            // Announce completion
            ServiceLocator.EventBus.publish('ui:creation:confirmed');
        };
        this.container.appendChild(confirmButton);
    }

    private addSection(title: string, content: string | string[]): void {
        const header = this.container.ownerDocument.createElement('h3');
        header.textContent = title;
        this.container.appendChild(header);

        if (Array.isArray(content)) {
            const list = this.container.ownerDocument.createElement('ul');
            content.forEach(item => {
                const li = this.container.ownerDocument.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
            this.container.appendChild(list);
        } else {
            const p = this.container.ownerDocument.createElement('p');
            p.textContent = content;
            this.container.appendChild(p);
        }
    }

    public show(): void { this.container.style.display = ''; }
    public hide(): void { this.container.style.display = 'none'; }
}