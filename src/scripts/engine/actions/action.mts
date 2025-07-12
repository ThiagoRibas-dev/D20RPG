import { Entity } from "../entities/entity.mjs";

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

    constructor(actor: Entity) {
        this.actor = actor;
        this.provokesAoO = false;
    }

    public abstract execute(): void;
}
