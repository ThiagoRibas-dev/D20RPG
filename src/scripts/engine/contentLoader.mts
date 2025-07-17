import { ContentItem } from "./entities/contentItem.mjs";
import { MapTile } from "./entities/mapTile.mjs";

export class ContentLoader {
    public contentData: ContentItem = new ContentItem("category");
    private campaignData: ContentItem = new ContentItem("category");
    public tileDefinitions: MapTile[] | null = null;
    public modifierTypes: any[] = [];
    public spells: ContentItem[] = [];

    private async loadDirectory(dirPath: string): Promise<ContentItem> {
        const directory: ContentItem = new ContentItem("category");
        try {
            const response = await fetch(dirPath);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const responseData: any[] = await response.json();
            for (const file of responseData) {
                const fullPath = `${dirPath}/${file.name}`;
                if (file.type === 'directory') {
                    directory[file.name] = await this.loadDirectory(fullPath); // Recursive call for subdirectories!
                } else {
                    if (file.name.endsWith('.json')) {
                        const itemName = file.name.slice(0, -5);
                        directory[itemName] = this.createContentItem(fullPath, itemName);
                    }
                }
            }

        } catch (error) {
            console.error(`Error reading directory: ${dirPath}`, error);
        }
        return directory;
    }

    private createContentItem(filePath: string, itemId: string): ContentItem {
        // Using a closure to encapsulate data and isLoaded, also changed it to 'let' instead of 'var'.
        const getLazyLoadFn = () => {
            let data: any = null;
            let isLoaded: boolean = false;

            return async () => {
                if (!isLoaded) {
                    try {
                        console.log(`Fetching ${filePath}`);
                        const response = await fetch(filePath)
                        if (!response.ok) {
                            throw new Error(`HTTP error: ${response.status}`);
                        }
                        data = await response.json();
                        data.id = itemId;
                        isLoaded = true;
                    }
                    catch (error) {
                        console.error(`Error loading or parsing file: ${filePath}`, error);
                        return null
                    }
                }
                return data
            }
        };
        return new ContentItem("item", getLazyLoadFn());
    }

    private async loadTileDefinitions(): Promise<MapTile[]> { // New loadTileDefinitions method <---
        try {
            console.log(`Fetching ./content/tileDefinitions.json`);
            const response = await fetch('./content/tileDefinitions.json');
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const data = await response.json();
            return data as MapTile[];
        } catch (error) {
            console.error("Error loading tile definitions:", error);
            throw error;
        }
    }

    public async getContent(force?: boolean): Promise<ContentItem> {
        if (!force && Object.keys(this.contentData).length > 2) {//has get and type by default
            return this.contentData;
        }
        try {
            this.contentData = await this.loadDirectory('./content');
            this.tileDefinitions = await this.loadTileDefinitions();
            this.modifierTypes = await this.loadModifierTypes();
            this.spells = await this.loadSpells();
            console.log("content loaded successfully from javascript calls:", this.contentData)
        }
        catch (e) {
            console.error("Could not fetch data: ", e);
        }
        return this.contentData;
    }

    public async getCampaigns(): Promise<ContentItem> {
        if (Object.keys(this.campaignData).length > 2) {//has get and type by default
            return this.campaignData;
        }
        try {
            this.campaignData = await this.loadDirectory('./campaigns')
            console.log("campaigns loaded successfully from javascript calls:", this.campaignData)
        }
        catch (e) {
            console.error("Could not fetch data: ", e);
        }
        return this.campaignData;
    }

    public async loadEffect(effectId: string): Promise<any> {
        const filePath = `./content/effects/${effectId}.json`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading effect: ${filePath}`, error);
            return null;
        }
    }

    public async loadSkill(skillId: string): Promise<any> {
        const filePath = `./content/skills/${skillId}.json`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading skill: ${filePath}`, error);
            return null;
        }
    }

    public async loadModifierTypes(): Promise<any[]> {
        const filePath = `./content/modifier_types.json`;
        try {
            console.log(`Fetching ${filePath}`);
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading modifier types: ${filePath}`, error);
            return [];
        }
    }

    public async loadSpells(): Promise<ContentItem[]> {
        const spellsDir = await this.loadDirectory('./content/spells');
        const spellItems: ContentItem[] = [];
        for (const key in spellsDir) {
            if (key !== 'get' && key !== 'type' && spellsDir[key] instanceof ContentItem) {
                spellItems.push(spellsDir[key]);
            }
        }
        return spellItems;
    }
}
