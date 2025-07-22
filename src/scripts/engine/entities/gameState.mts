import { EntityID } from "../ecs/world.mjs";
import { ContentItem } from "./contentItem.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    playerId: EntityID | null;
    creationStep: number;
    currentMapData: any;
    npcs: EntityID[];
    currentCampaignData: ContentItem | null;
    currentTurn: string;
};
