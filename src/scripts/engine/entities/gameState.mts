import { PlayerCharacter } from "./playerCharacter.mjs";

export class GameState {
    public currentScreen: string;
    public player: PlayerCharacter;
    public campaign: string;
    public creationStep: number;

    constructor(currentScreen: string,
        player: PlayerCharacter,
        campaign: string,
        creationStep: number) {
        this.currentScreen = currentScreen;
        this.player = player;
        this.campaign = campaign;
        this.creationStep = creationStep;
    };
};