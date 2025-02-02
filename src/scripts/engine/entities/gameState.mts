// src/scripts/engine/gameState.mts
import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    player: PlayerCharacter;
    campaign: string;
    creationStep: number;
    currentMapData: any;
};