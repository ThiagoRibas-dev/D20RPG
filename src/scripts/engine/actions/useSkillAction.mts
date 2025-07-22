import { Action, ActionType } from "./action.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { IdentityComponent, SkillsComponent } from "../ecs/components/index.mjs";
import { ModifierManager } from "../modifierManager.mjs";
import { rollD20 } from "../utils.mjs";

export class UseSkillAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;

    public readonly skillId: string;
    public readonly useId: string;
    public readonly target: EntityID;

    constructor(actor: EntityID, skillId: string, useId: string, target: EntityID) {
        super(actor);
        this.skillId = skillId;
        this.useId = useId;
        this.target = target;
        this.id = `use-skill-${skillId}-${useId}`;
        this.name = `Use ${skillId}`;
        this.description = `Use the ${skillId} skill.`;
    }

    canExecute(world: World): boolean {
        const skills = world.getComponent(this.actor, SkillsComponent) as SkillsComponent;
        return skills ? (skills.skills.get(this.skillId) || 0) > 0 : false;
    }

    public async execute(world: World): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(this.target, IdentityComponent);
        console.log(`${actorIdentity?.name} uses skill ${this.skillId} (${this.useId}) on ${targetIdentity?.name}`);
        
        // TODO: Implement skill resolution
        // await globalServiceLocator.rulesEngine.resolveSkillUse(this.actor, this.skillId, this.useId, this.target);
        
        globalServiceLocator.eventBus.publish("action:use-skill", { action: this });
        return Promise.resolve();
    }
}
