export class ActionBudgetComponent {
    constructor(
        public standardActions: number = 1,
        public moveActions: number = 1,
        public swiftActions: number = 1,
        public freeActions: number = Infinity,
        public attacksOfOpportunity: number = 1
    ) {}
}
