"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ContentLoader, getIValue } from "./engine/contentLoader.mjs";
import { Game } from "./engine/game.mjs";
export var GAME_API = { init: false };
export var WIN_DOCUMENT;
export var GAME_STATE = {
    currentScreen: "startMenu",
    player: "",
    campaign: ""
};
var contentLoader = new ContentLoader();
function initializeGame(winObj) {
    return __awaiter(this, void 0, void 0, function () {
        var content, game, humanData, clericData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('INITIALIZING', winObj);
                    setGlobals(winObj);
                    return [4 /*yield*/, contentLoader.getContent()];
                case 1:
                    content = _a.sent();
                    game = new Game(content);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    console.log('Testing content', content);
                    return [4 /*yield*/, getIValue(content.races.human)];
                case 3:
                    humanData = _a.sent();
                    console.log('Loaded human data:', humanData === null || humanData === void 0 ? void 0 : humanData.name);
                    return [4 /*yield*/, getIValue(content.classes.cleric)];
                case 4:
                    clericData = _a.sent();
                    console.log('Loaded cleric data:', clericData === null || clericData === void 0 ? void 0 : clericData.name);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to load content:', error_1);
                    return [3 /*break*/, 6];
                case 6:
                    game.start(); //Load a default campaign data, if available
                    renderScreen(); // Render main screen, using those states to test everything (using data in that initial, generated game state)
                    return [2 /*return*/];
            }
        });
    });
}
// Using the global window, document variables so the code can interface dynamically with the html and create our dynamic interface (following previously implemented/designed methods):
function setGlobals(winObj) {
    GAME_API = {
        init: true,
        newGameClick: function () {
            GAME_STATE.currentScreen = "campaignSelection";
            renderScreen(); // Call to re-render our UI to display our Campaign Selection Screen
        },
        continueGameClick: function () {
            console.log("Continue clicked. Loading last save state, if present (placeholder).");
        },
        exitGameClick: function () {
            console.log("Exiting game.");
        },
        gameState: GAME_STATE, // Send data of the state
        renderScreen: renderScreen,
    };
    winObj.gameApi = GAME_API; // set it into our main window context, so it can be accessible using other files in that html.
    WIN_DOCUMENT = winObj.document;
}
function renderScreen() {
    return __awaiter(this, void 0, void 0, function () {
        var startMenuDiv, charCreationDiv, campaignSelectDiv, gameDiv, campaignListContainer_1, campaigns, campaignFolders;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!WIN_DOCUMENT) {
                        console.error('WIN_DOCUMENT not initialized');
                        return [2 /*return*/, false];
                    }
                    startMenuDiv = WIN_DOCUMENT.getElementById('startMenu');
                    charCreationDiv = WIN_DOCUMENT.getElementById('characterCreation');
                    campaignSelectDiv = WIN_DOCUMENT.getElementById('campaignSelection');
                    gameDiv = WIN_DOCUMENT.getElementById('gameContainer');
                    if (!(GAME_STATE.currentScreen === 'startMenu')) return [3 /*break*/, 1];
                    startMenuDiv.style.display = "";
                    charCreationDiv.style.display = "none";
                    campaignSelectDiv.style.display = "none";
                    gameDiv.style.display = "none";
                    return [3 /*break*/, 5];
                case 1:
                    if (!(GAME_STATE.currentScreen === "characterCreation")) return [3 /*break*/, 2];
                    startMenuDiv.style.display = "none";
                    charCreationDiv.style.display = "";
                    campaignSelectDiv.style.display = "none";
                    gameDiv.style.display = "none";
                    return [3 /*break*/, 5];
                case 2:
                    if (!(GAME_STATE.currentScreen === 'campaignSelection')) return [3 /*break*/, 4];
                    startMenuDiv.style.display = "none";
                    charCreationDiv.style.display = "none";
                    campaignSelectDiv.style.display = "";
                    gameDiv.style.display = "none";
                    campaignListContainer_1 = WIN_DOCUMENT.getElementById('campaigns-container');
                    campaignListContainer_1.innerHTML = '';
                    return [4 /*yield*/, contentLoader.getCampaigns()];
                case 3:
                    campaigns = _a.sent();
                    campaignFolders = Object.keys(campaigns);
                    console.log('availableCampaigns', campaignFolders);
                    if (campaignFolders) {
                        campaignFolders.forEach(function (campaign) {
                            var campaignItem = WIN_DOCUMENT.createElement('div');
                            campaignItem.classList.add('campaign-item');
                            campaignItem.textContent = campaign; // Adding this now
                            campaignItem.onclick = function () {
                                var _a;
                                GAME_STATE.campaign = campaign;
                                (_a = WIN_DOCUMENT.getElementById('campaignSelectBtn')) === null || _a === void 0 ? void 0 : _a.removeAttribute('style');
                            };
                            campaignListContainer_1.appendChild(campaignItem);
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    if (GAME_STATE.currentScreen === "game") {
                        startMenuDiv.style.display = "none";
                        charCreationDiv.style.display = "none";
                        campaignSelectDiv.style.display = "none";
                        gameDiv.style.display = "";
                    }
                    _a.label = 5;
                case 5:
                    console.log("Current Game State:", GAME_STATE.currentScreen); // A test output to see the flow
                    return [2 /*return*/, true]; // Use this for testing UI methods
            }
        });
    });
}
initializeGame(window); // Now passing window for making use of global object from our js.
//# sourceMappingURL=index.mjs.map