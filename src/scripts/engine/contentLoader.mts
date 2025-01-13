import { ContentItem } from "./entities/contentItem.mjs";

export class ContentLoader {
    private contentData: ContentItem = new ContentItem("category");
    private campaignData: ContentItem = new ContentItem("category");

    public async getContent(force?:boolean): Promise<ContentItem> {
        if (!force && Object.keys(this.contentData).length > 2) {//has get and type by default
            return this.contentData;
        }
        try {
            this.contentData = await this.loadDirectory('./content')
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

    private async loadDirectory(dirPath: string): Promise<ContentItem> {
        const directory: ContentItem = new ContentItem("category");
        try {
            const response = await fetch(dirPath)
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const responseData: any[] = await response.json()
            for (const file of responseData) {
                const fullPath = `${dirPath}/${file.name}`
                if (file.type === 'directory') {
                    directory[file.name] = await this.loadDirectory(fullPath)
                } else {
                    if (file.name.endsWith('.json')) {
                        const itemName = file.name.slice(0, -5)
                        directory[itemName] = this.createContentItem(fullPath);
                    }
                }
            }

        } catch (error) {
            console.error(`Error reading directory: ${dirPath}`, error);
        }
        return directory
    }

    private createContentItem(filePath: string): ContentItem {
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
                        data = await response.json()
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
}