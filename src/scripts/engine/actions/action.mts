import { EntityID, World } from "../ecs/world.mjs";
import { Point } from "../../utils/point.mjs";

export enum ActionType {
    Standard,
    Move,
    FullRound,
    Swift,
    Free
}

export abstract class Action {
    public readonly actor: EntityID;
    public target?: EntityID | EntityID[] | Point;
    public abstract readonly cost: ActionType;
    public provokesAoO: boolean;

    public abstract readonly id: string;
    public abstract readonly name: string;
    public abstract readonly description: string;

    constructor(actor: EntityID) {
        this.actor = actor;
        this.provokesAoO = false;
    }

    public abstract canExecute(world: World): boolean;

    public abstract execute(world: World, target?: EntityID | Point): Promise<void>;
}
