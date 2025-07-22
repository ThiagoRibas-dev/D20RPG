import { Component } from "../world.mjs";

export class TemplateComponent implements Component {
    constructor(public templateId: string | null = null) {}
}
