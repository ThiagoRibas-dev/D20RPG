import { globalServiceLocator } from "../serviceLocator.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { rollD20 } from "../utils.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { IdentityComponent, TagsComponent } from "../ecs/components/index.mjs";

export class EscapeGrappleAction extends OpposedCheckAction {
    public readonly id = 'escape_grapple';
    public readonly name = 'Escape Grapple';
    public readonly description = 'Attempt to break free from a grapple.';

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

    protected onSuccess(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} escapes the grapple!`, 'green');
        
        const actorTags = world.getComponent(this.actor, TagsComponent);
        if (actorTags) {
            actorTags.tags.delete('status:grappling');
            actorTags.tags.delete('status:pinned');
        }

        const targetTags = world.getComponent(target, TagsComponent);
        if (targetTags) {
            targetTags.tags.delete('status:grappling');
            targetTags.tags.delete('status:pinning');
        }
    }

    protected onFailure(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} fails to escape the grapple.`, 'orange');
    }
}
