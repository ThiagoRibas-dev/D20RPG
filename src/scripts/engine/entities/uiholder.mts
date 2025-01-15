export type UIHolder = {
    els: {
        [key: string]: HTMLElement;
    };
    inputs: {
        [key: string]: HTMLInputElement;
    };
    btns: {
        [key: string]: HTMLButtonElement;
    };
}