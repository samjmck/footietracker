import { Requester } from "../Requester";
import { RequestQueue } from "../amqpConstants";
import { Portfolio } from "./interfaces";
import { SendCodeRequest, SendCodeResponse, SendPortfolioRequest, SendPortfolioResponse } from "./service";

export class SpreadsheetsRequester extends Requester {
    protected initialiseListeners(): void {
        this.addConsumeListener(RequestQueue.SendPortfolio);
        this.addConsumeListener(RequestQueue.GetAuthUrl);
        this.addConsumeListener(RequestQueue.SendCode);
    }

    async sendPortfolio(userId: number, portfolio: Portfolio): Promise<SendPortfolioResponse> {
        return this.makeRequest(RequestQueue.SendPortfolio, <SendPortfolioRequest> { userId, portfolio });
    }

    async sendCode(userId: number, code: string): Promise<SendCodeResponse> {
        return this.makeRequest(RequestQueue.SendCode, <SendCodeRequest> { userId, code });
    }

    async getAuthUrl(): Promise<string> {
        return this.makeRequest(RequestQueue.GetAuthUrl);
    }
}
