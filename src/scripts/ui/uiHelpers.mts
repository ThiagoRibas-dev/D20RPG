import { ServiceLocator } from "../engine/serviceLocator.mjs";

/**
 * Updates the shared information panel with details of a selected item.
 * @param itemData - The data object (e.g., from a race or class JSON).
 */
export function updateSelectionInfo(itemData: any) {
    const uiScreens = ServiceLocator.UI;
    const infoContainer = uiScreens.els['selector-info'];
    const elName = uiScreens.els['selected-name'];
    const elDesc = uiScreens.els['selected-desc'];

    elName.innerText = itemData.name;
    elDesc.innerText = itemData.description;

    elName.style.display = "";
    elDesc.style.display = "";
    infoContainer.style.display = "";
}

/**
 * Toggles the main screen containers (startMenu, gameContainer, etc.)
 * @param screenId - The ID of the screen to show.
 */
export function setActiveScreen(screenId: string) {
    const uiScreens = ServiceLocator.UI.els;
    for (const key in uiScreens) {
        if (Object.prototype.hasOwnProperty.call(uiScreens, key)) {
            const el = uiScreens[key];
            if (el instanceof HTMLElement && el.id && el.parentElement?.id !== 'character-selector' && el.parentElement?.id !== 'uiPanels') {
                el.style.display = (el.id === screenId) ? '' : 'none';
            }
        }
    }
}
