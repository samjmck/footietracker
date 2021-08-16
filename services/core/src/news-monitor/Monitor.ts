import { Browser } from "puppeteer";

export interface Article {
    id: string;
    title: string;
    time: number;
    body?: Promise<string>;
    metadata: object;
}

export abstract class Monitor {
    private checkedArticlesById: string[] = [];

    constructor(protected browser: Browser) {}

    protected abstract async getLatestArticles(): Promise<Article[]>;

    async getNewArticles(): Promise<Article[]> {
        const latestArticles = await this.getLatestArticles();
        const newArticles: Article[] = [];
        for(const article of latestArticles) {
            if(this.checkedArticlesById.indexOf(article.id) === 0) {
                newArticles.push(article);
                this.checkedArticlesById.push(article.id);
            }
        }
        return newArticles;
    }
}
