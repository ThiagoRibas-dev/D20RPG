import { GameEvents } from '../../engine/events.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { calculateModifier } from '../../engine/utils.mjs';
import { ClassComponent, FeatsComponent, IdentityComponent, AttributesComponent } from '../../engine/ecs/components/index.mjs';

export class CharacterSummaryView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['character-summary'];
    }

    public async render(): Promise<void> {
        this.container.innerHTML = ''; // Clear previous content
        const playerId = globalServiceLocator.state.playerId;
        if (playerId === null) {
            this.container.textContent = "Character data is incomplete. Please go back and make all selections.";
            return;
        }

        const world = globalServiceLocator.world;
        const identity = world.getComponent(playerId, IdentityComponent);
        const classes = world.getComponent(playerId, ClassComponent);
        const feats = world.getComponent(playerId, FeatsComponent);
        const attributes = world.getComponent(playerId, AttributesComponent);

        if (!identity || !classes || !feats || !attributes) {
            this.container.textContent = "Character data is incomplete. Please go back and make all selections.";
            return;
        }

        this.addSection("Race", identity.name); // TODO: Add race component
        this.addSection("Class", classes.classes.map(c => `${c.classId} ${c.level}`).join(', '));
        
        const abilities = [];
        for (const [key, value] of attributes.attributes.entries()) {
            const finalValue = await globalServiceLocator.modifierManager.queryStat(playerId, key);
            abilities.push(`${key.toUpperCase()}: ${finalValue} (Mod: ${calculateModifier(finalValue)})`);
        }
        this.addSection("Abilities", abilities);
        this.addSection("Feats", feats.feats.map(id => globalServiceLocator.contentLoader.getContentItemById('feats', id)?.name));

        const confirmButton = this.container.ownerDocument.createElement('button');
        confirmButton.textContent = "Confirm Character and Begin";
        confirmButton.onclick = () => {
            globalServiceLocator.eventBus.publish(GameEvents.UI_CREATION_CONFIRMED);
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
