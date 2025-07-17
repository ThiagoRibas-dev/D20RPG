import { globalServiceLocator } from "../serviceLocator.mjs";
import { Entity } from "../entities/entity.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { calculateModifier, rollD20 } from "../utils.mjs";

export class PinAction extends OpposedCheckAction {
    public readonly id = 'pin_opponent';
    public readonly name = 'Pin Opponent';
    public readonly description = 'Hold an opponent immobile for 1 round.';

    constructor(actor: Entity) {
        super(actor);
    }

    public canExecute(): boolean {
        return this.actor.hasTag('status:grappling') && !this.actor.hasTag('status:pinning') && super.canExecute();
    }

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        const actorGrappleBonus = actor.baseAttackBonus + calculateModifier(actor.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(actor);
        const targetGrappleBonus = target.baseAttackBonus + calculateModifier(target.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(target);

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} pins ${target.name}!`, 'green');
        this.actor.tags.add('status:pinning');
        target.tags.add('status:pinned');
    }

    protected onFailure(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} fails to pin ${target.name}.`, 'orange');
    }
}
