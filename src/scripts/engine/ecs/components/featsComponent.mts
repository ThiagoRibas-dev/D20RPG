import { FeatSlot } from "../../entities/featSlot.mjs";

export class FeatsComponent {
    public featSlots: FeatSlot[];
    public feats: string[];

    constructor(featSlots: FeatSlot[] = [], feats: string[] = []) {
        this.featSlots = featSlots;
        this.feats = feats;
    }
}
