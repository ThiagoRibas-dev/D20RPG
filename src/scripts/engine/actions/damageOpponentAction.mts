import { globalServiceLocator } from "../serviceLocator.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { calculateModifier, rollD20 } from "../utils.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { IdentityComponent, TagsComponent, AttributesComponent } from "../ecs/components/index.mjs";

export class DamageOpponentAction extends OpposedCheckAction {
    public readonly id = 'damage_opponent';
    public readonly name = 'Damage Opponent';
    public readonly description = 'Deal damage to an opponent you are grappling.';

    constructor(actor: EntityID) {
        super(actor);
    }

    public canExecute(world: World): boolean {
        const tags = world.getComponent(this.actor, TagsComponent);
        return tags ? tags.tags.has('status:grappling') && super.canExecute(world) : false;
    }

    protected async resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorGrappleBonus = await globalServiceLocator.modifierManager.queryStat(actor, 'grapple');
        const targetGrappleBonus = await globalServiceLocator.modifierManager.queryStat(target, 'grapple');

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected async onSuccess(world: World, target: EntityID): Promise<void> {
        const strMod = await globalServiceLocator.modifierManager.queryStat(this.actor, 'str_mod');
        const damage = Math.max(1, 1 + strMod);
        
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} damages ${targetIdentity?.name} for ${damage} points!`, 'green');
        
        const targetAttributes = world.getComponent(target, AttributesComponent);
        if (targetAttributes) {
            const currentHp = targetAttributes.attributes.get('hp_current') || 0;
            targetAttributes.attributes.set('hp_current', currentHp - damage);
        }
    }

    protected onFailure(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} fails to damage ${targetIdentity?.name}.`, 'orange');
    }
}
