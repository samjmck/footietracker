import { Requester } from "../Requester";
import { RequestQueue } from "../amqpConstants";
import { Price, Top } from "./interfaces";
import { SpreadsheetsResponse, GetSpreadsheetDataRequest } from "./service";

export class PricingRequester extends Requester {
    protected initialiseListeners(): void {
        this.addConsumeListener(RequestQueue.GetSpreadsheetData);
    }

    async getSpreadsheetData({ currentPricePlayerIds, recentPriceChangesPlayerIds }: GetSpreadsheetDataRequest): Promise<SpreadsheetsResponse> {
        return this.makeRequest(RequestQueue.GetSpreadsheetData, { currentPricePlayerIds, recentPriceChangesPlayerIds });
    }
}
