// src/scripts/engine/entities/uiHolder.mts
export type UIHolder = {
    els: {
        [key: string]: HTMLElement;
        'startMenu': HTMLElement;
        'characterCreation': HTMLElement;
        'campaignSelection': HTMLElement;
        'gameContainer': HTMLElement;
        'races-selector': HTMLElement;
        'classes-selector': HTMLElement;
        'skills-selector': HTMLElement;
        'feats-selector': HTMLElement;
        'character-summary': HTMLElement;
        'ability-score-selection': HTMLElement;
        'step-description': HTMLElement;
        'selector-info': HTMLElement;
        'remainingPointsDisplay': HTMLElement;
        'campaign-list-ul': HTMLUListElement;
        'campaign-info': HTMLElement;
        'campaign-name': HTMLParagraphElement;
        'campaign-desc': HTMLParagraphElement;
        'selected-name': HTMLElement;
        'selected-desc': HTMLElement;
        'skill-container': HTMLUListElement;
        'skill-points-remaining': HTMLLabelElement;
        'str-cost': HTMLSpanElement;
        'dex-cost': HTMLSpanElement;
        'con-cost': HTMLSpanElement;
        'int-cost': HTMLSpanElement;
        'wis-cost': HTMLSpanElement;
        'cha-cost': HTMLSpanElement;
        'str-total': HTMLSpanElement;
        'dex-total': HTMLSpanElement;
        'con-total': HTMLSpanElement;
        'int-total': HTMLSpanElement;
        'wis-total': HTMLSpanElement;
        'cha-total': HTMLSpanElement;
        'str-mod': HTMLSpanElement;
        'dex-mod': HTMLSpanElement;
        'con-mod': HTMLSpanElement;
        'int-mod': HTMLSpanElement;
        'wis-mod': HTMLSpanElement;
        'cha-mod': HTMLSpanElement;
        'combatLogPanel': HTMLElement;
        'characterStatusPanel': HTMLElement;
        'actionButtonsPanel': HTMLElement;
        'combatLogText': HTMLElement;
        'characterStatusDetails': HTMLElement;
    };
    inputs: {
        [key: string]: HTMLInputElement;
    };
    btns: {
        [key: string]: HTMLButtonElement;
        'back-btn': HTMLButtonElement;
        'next-btn': HTMLButtonElement;
        'campaignSelectBtn': HTMLButtonElement;
    };
}