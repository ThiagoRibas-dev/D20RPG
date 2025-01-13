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
import { getIValue } from './contentLoader.mjs'; // Now importing the function that loads/fetches content as implemented, with specific categories as exemplified
var Game = /** @class */ (function () {
    function Game(content) {
        this.content = content;
        this.gameData = {};
        this.gameLoopInterval = setInterval(function () { console.log('pooling'); }, 1000);
    }
    Game.prototype.createCharacter = function () {
        return __awaiter(this, void 0, void 0, function () {
            var character;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {
                            name: 'Test Character'
                        };
                        return [4 /*yield*/, getIValue(this.content.races.human)];
                    case 1:
                        _a.race = _b.sent();
                        return [4 /*yield*/, getIValue(this.content.classes.cleric)];
                    case 2:
                        character = (_a.class = _b.sent(),
                            _a.inventory = [],
                            _a.level = 1,
                            _a.position = { x: 1, y: 1 },
                            _a);
                        this.gameData.player = character;
                        if (!this.gameData.level1) {
                            this.gameData.level1 = {
                                map: "myTestMap",
                                player: {
                                    position: { x: 1, y: 1 }
                                }
                            };
                        }
                        console.log("Created Character: ".concat(character.name, " , level ").concat(character.level, "."));
                        return [2 /*return*/];
                }
            });
        });
    };
    Game.prototype.start = function () {
        console.log("Game started: Initializing Level/Map and game engine behaviors..."); // Placeholder, but make use of dynamic or user created Ids and their behavior, with our intended json format and functionality to do more than just that: Test those.
    };
    Game.prototype.stop = function () {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            console.log("Game stopped");
        }
    };
    Game.prototype.gameLoop = function () {
        // Place for adding placeholder game functionality that test our content implementation in previous code examples and with those hardcoded behaviors and through a specific HTML page
    };
    return Game;
}());
export { Game };
//# sourceMappingURL=game.mjs.map