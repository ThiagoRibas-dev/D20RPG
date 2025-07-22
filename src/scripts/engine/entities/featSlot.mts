export class FeatSlot {
    constructor(
        public tags: string[],
        public source: string,
        public feat: string | null = null
    ) { }
}
