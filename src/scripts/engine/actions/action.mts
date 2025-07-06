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

    constructor(actor: Entity) {
        this.actor = actor;
    }

    public abstract execute(): void;
}