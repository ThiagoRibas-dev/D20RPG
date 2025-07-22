export class SkillsComponent {
    public allocations: Map<string, number> = new Map();
    public remaining: number = 0;
    public total: number = 0;
    constructor(public skills: Map<string, number> = new Map()) {}
}
