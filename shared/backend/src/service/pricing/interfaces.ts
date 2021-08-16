export interface Price {
    price: number;
    time: number;
}

export interface BuyAndSellPrice {
    buy: Price;
    sell: Price;
}

// Open High Low Close
export interface OHLCItem {
    highBuyPrice: number;
    lowBuyPrice: number;

    highSellPrice: number;
    lowSellPrice: number;

    openBuyPrice: number;
    closeBuyPrice: number;

    openSellPrice: number;
    closeSellPrice: number;

    openTime: number;
    closeTime: number;
}

export interface TopItem {
    playerId: string;
    price: Price;
}

export type Top = TopItem[];

export enum PriceType {
    Buy = 'buy',
    Sell = 'sell',
}

export interface BuyData {
    buy: number;
}

export interface SellData {
    sell: number;
}
