export class GameState {
    public currentScreen: string;
    public player: string;
    public campaign: string;

    constructor(currentScreen: string,
        player: string,
        campaign: string) {
        this.currentScreen = currentScreen;
        this.player = player;
        this.campaign = campaign;
    };
};