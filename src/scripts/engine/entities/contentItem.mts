export class ContentItem {
    [key: string]: any; //any number of keys associated to any type of value

    public get: (() => Promise<ContentItem>) | null;
    public type: string;

    constructor(t: string, fn?: () => Promise<ContentItem>) {
        this.type = t;
        this.get = !!fn ? fn : null;
    };
}