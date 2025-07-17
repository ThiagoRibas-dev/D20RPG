import { globalServiceLocator } from "../serviceLocator.mjs";
import { Entity } from "../entities/entity.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { calculateModifier, rollD20 } from "../utils.mjs";

export class EscapeGrappleAction extends OpposedCheckAction {
    public readonly id = 'escape_grapple';
    public readonly name = 'Escape Grapple';
    public readonly description = 'Attempt to break free from a grapple.';

    constructor(actor: Entity) {
        super(actor);
    }

    public canExecute(): boolean {
        return this.actor.hasTag('status:grappling') && super.canExecute();
    }

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        const actorGrappleBonus = actor.baseAttackBonus + calculateModifier(actor.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(actor);
        const targetGrappleBonus = target.baseAttackBonus + calculateModifier(target.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(target);

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} escapes the grapple!`, 'green');
        this.actor.tags.delete('status:grappling');
        this.actor.tags.delete('status:pinned');
        target.tags.delete('status:grappling');
        target.tags.delete('status:pinning');
    }

    protected onFailure(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} fails to escape the grapple.`, 'orange');
    }
}
