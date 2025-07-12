import { Entity } from "../engine/entities/entity.mjs";
import { GameEvents } from "../engine/events.mjs";
import { MapTile } from "../engine/entities/mapTile.mjs";
import { globalServiceLocator } from "../engine/serviceLocator.mjs";

export class FeedbackManager {
    private logElement: HTMLElement;

    constructor() {
        this.logElement = globalServiceLocator.ui.els.combatLogText;
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_ATTACK_RESOLVED,
            (event) => this.onAttackResolved(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_DAMAGE_RESOLVED,
            (event) => this.onDamageResolved(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.CHARACTER_DIED,
            (event) => this.onCharacterDied(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_MOVE_BLOCKED,
            (event) => this.onMoveBlocked(event.data)
        );
    }

    private onAttackResolved(context: any): void {
        const { attacker, target, attackRoll, outcome } = context;
        if (!attacker) {
            return;
        }
        if (!target) {
            return;
        }
        if (!outcome) {
            return;
        }
        const outcomeText = outcome.replace('_', ' ').toUpperCase();
        const message = `${attacker.name} attacks ${target.name}... Roll: ${attackRoll.final} vs AC ${target.getArmorClass()} -> ${outcomeText}!`;
        this.addMessageToLog(message, 'cyan');
    }

    private onDamageResolved(context: any): void {
        const { attacker, target, damageRoll, damageType } = context;
        if (!attacker) {
            return;
        }
        if (!target) {
            return;
        }
        if (!damageRoll) {
            return;
        }
        if (!damageType) {
            return;
        }
        const message = `${attacker.name} deals ${damageRoll.total} ${damageType} damage to ${target.name}.`;
        this.addMessageToLog(message, 'orange');
    }

    private onCharacterDied(context: any): void {
        const { entity, killer } = context;
        if (!entity) {
            return;
        }
        if (!killer) {
            return;
        }
        const message = `${entity.name} has been defeated by ${killer.name}!`;
        this.addMessageToLog(message, 'red');
    }

    private onMoveBlocked(data: { actor: Entity, reason: string, blocker: MapTile | Entity | null }): void {
        // We only care about providing feedback for the player's actions
        if (data.actor !== globalServiceLocator.state.player) {
            return;
        }

        let message = "Your path is blocked.";
        if (data.reason === 'tile' && data.blocker) {
            message = `The ${data.blocker.name.toLowerCase()} blocks your path.`;
        } else if (data.reason === 'entity' && data.blocker) {
            message = `${data.blocker.name} is in your way.`;
        } else if (data.reason === 'boundary') {
            message = "You can't go that way.";
        }

        this.addMessageToLog(message, 'yellow');
    }

    // A generic helper to add messages to your log
    public addMessageToLog(text: string, color: string = 'white'): void {
        const p = this.logElement.ownerDocument.createElement('p');
        p.textContent = text;
        p.style.color = color;

        // Add to the top and manage scroll
        this.logElement.prepend(p);
        if (this.logElement.children.length > 50) { // Keep log from getting too long
            this.logElement.removeChild(this.logElement.lastChild!);
        }
    }
}
