import { globalServiceLocator } from "../serviceLocator.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { rollD20 } from "../utils.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { IdentityComponent, TagsComponent } from "../ecs/components/index.mjs";

export class PinAction extends OpposedCheckAction {
    public readonly id = 'pin_opponent';
    public readonly name = 'Pin Opponent';
    public readonly description = 'Hold an opponent immobile for 1 round.';

    constructor(actor: EntityID) {
        super(actor);
    }

    public canExecute(world: World): boolean {
        const tags = world.getComponent(this.actor, TagsComponent);
        return tags ? tags.tags.has('status:grappling') && !tags.tags.has('status:pinning') && super.canExecute(world) : false;
    }

    protected async resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorGrappleBonus = await globalServiceLocator.modifierManager.queryStat(actor, 'grapple');
        const targetGrappleBonus = await globalServiceLocator.modifierManager.queryStat(target, 'grapple');

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} pins ${targetIdentity?.name}!`, 'green');
        
        const actorTags = world.getComponent(this.actor, TagsComponent);
        if (actorTags) {
            actorTags.tags.add('status:pinning');
        }

        const targetTags = world.getComponent(target, TagsComponent);
        if (targetTags) {
            targetTags.tags.add('status:pinned');
        }
    }

    protected onFailure(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} fails to pin ${targetIdentity?.name}.`, 'orange');
    }
}
