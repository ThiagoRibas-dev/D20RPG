import { Component } from "../world.mjs";

export type ActionData = {
    id: string;
    [key: string]: any;
};

export class PossibleActionsComponent implements Component {
    constructor(public actions: ActionData[] = []) {}
}
