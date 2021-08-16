import { BuyAndSellPrice, Price } from "./interfaces";

export interface GetCurrentPriceRequest {
    playerId: string;
}

export interface GetSpreadsheetDataRequest {
    currentPricePlayerIds: string[];
    recentPriceChangesPlayerIds: string[];
}

export interface GetPricesRequest {
    playerId: string;
    startTime: number;
    endTime: number;
}

export interface GetTopPlayersRequest {
    min: number;
    max: number;
}

export interface SpreadsheetsResponse {
    currentPrices: { [playerId: string]: BuyAndSellPrice | null };
    dayChanges: { [playerId: string]: number };
    weekChanges: { [playerId: string]: number };
    monthChanges: { [playerId: string]: number };
}

