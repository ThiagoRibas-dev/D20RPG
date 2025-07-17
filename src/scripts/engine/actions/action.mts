import { Entity } from "../entities/entity.mjs";
import { Point } from "../../utils/point.mjs";

export enum ActionType {
    Standard,
    Move,
    FullRound,
    Swift,
    Free
}

export abstract class Action {
    public readonly actor: Entity;
    public abstract readonly cost: ActionType;
    public provokesAoO: boolean;

    public abstract readonly id: string;
    public abstract readonly name: string;
    public abstract readonly description: string;

    constructor(actor: Entity) {
        this.actor = actor;
        this.provokesAoO = false;
    }

    public abstract canExecute(): boolean;

    public abstract execute(target?: Entity | Point): Promise<void>;
}
