import { GameEvents } from "../engine/events.mjs";
import { MapTile } from "../engine/entities/mapTile.mjs";
import { globalServiceLocator } from "../engine/serviceLocator.mjs";
import { EntityID } from "../engine/ecs/world.mjs";
import { IdentityComponent } from "../engine/ecs/components/index.mjs";

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

    private async onAttackResolved(context: any): Promise<void> {
        const { attacker, target, attackRoll, outcome } = context;
        if (attacker === undefined || target === undefined || !outcome) {
            return;
        }

        const world = globalServiceLocator.world;
        const attackerName = world.getComponent(attacker, IdentityComponent)?.name || 'Someone';
        const targetName = world.getComponent(target, IdentityComponent)?.name || 'Someone';
        const targetAC = await globalServiceLocator.modifierManager.queryStat(target, 'ac');

        const outcomeText = outcome.replace('_', ' ').toUpperCase();
        const message = `${attackerName} attacks ${targetName}... Roll: ${attackRoll.final} vs AC ${targetAC} -> ${outcomeText}!`;
        this.addMessageToLog(message, 'cyan');
    }

    private onDamageResolved(context: any): void {
        const { attacker, target, damageRoll, damageType } = context;
        if (attacker === undefined || target === undefined || !damageRoll || !damageType) {
            return;
        }

        const world = globalServiceLocator.world;
        const attackerName = world.getComponent(attacker, IdentityComponent)?.name || 'Someone';
        const targetName = world.getComponent(target, IdentityComponent)?.name || 'Someone';

        const message = `${attackerName} deals ${damageRoll.total} ${damageType} damage to ${targetName}.`;
        this.addMessageToLog(message, 'orange');
    }

    private onCharacterDied(context: any): void {
        const { entity, killer } = context;
        if (entity === undefined || killer === undefined) {
            return;
        }

        const world = globalServiceLocator.world;
        const entityName = world.getComponent(entity, IdentityComponent)?.name || 'Someone';
        const killerName = world.getComponent(killer, IdentityComponent)?.name || 'Someone';

        const message = `${entityName} has been defeated by ${killerName}!`;
        this.addMessageToLog(message, 'red');
    }

    private onMoveBlocked(data: { actor: EntityID, reason: string, blocker: MapTile | EntityID | null }): void {
        if (data.actor !== globalServiceLocator.state.playerId) {
            return;
        }

        let message = "Your path is blocked.";
        if (data.reason === 'tile' && data.blocker) {
            const blockerTile = data.blocker as MapTile;
            message = `The ${blockerTile.name.toLowerCase()} blocks your path.`;
        } else if (data.reason === 'entity' && data.blocker) {
            const blockerId = data.blocker as EntityID;
            const world = globalServiceLocator.world;
            const blockerName = world.getComponent(blockerId, IdentityComponent)?.name || 'Someone';
            message = `${blockerName} is in your way.`;
        } else if (data.reason === 'boundary') {
            message = "You can't go that way.";
        }

        this.addMessageToLog(message, 'yellow');
    }

    public addMessageToLog(text: string, color: string = 'white'): void {
        const p = this.logElement.ownerDocument.createElement('p');
        p.textContent = text;
        p.style.color = color;

        this.logElement.prepend(p);
        if (this.logElement.children.length > 50) {
            this.logElement.removeChild(this.logElement.lastChild!);
        }
    }
}
