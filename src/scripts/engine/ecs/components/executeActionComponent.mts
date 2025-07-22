import { Component } from "../world.mjs";
import { ActionData } from "./possibleActionsComponent.mjs";

export class ExecuteActionComponent implements Component {
    constructor(public action: ActionData) {}
}
