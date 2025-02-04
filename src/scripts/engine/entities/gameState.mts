// src/scripts/engine/entities/gameState.mts
import { ContentItem } from "./contentItem.mjs";
import { Entity } from "./entity.mjs";
import { Monster } from "./monster.mjs";
import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    player: PlayerCharacter | null;
    creationStep: number;
    currentMapData: any;
    monsters: Monster[];
    npcs: Entity[];
    currentCampaignData: ContentItem | null;
    currentTurn: string;
};