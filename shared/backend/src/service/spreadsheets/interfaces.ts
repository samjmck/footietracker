export interface Portfolio {
    shares: Share[];
    expiringShares: ExpiringShare[];
    dividends: Dividend[];
}

export interface Share {
    name: string;
    playerId: string;
    quantity: number;
    totalPrice: number;
}

export interface Dividend {
    name: string;
    time: number;
    quantity: number;
    total: number;
    type: DividendType;
}

export enum DividendType {
    InPlayCleanSheet = 'In-play clean sheet',
    InPlayGoal = 'In-play goal',
    InPlayAssist = 'In-play assist',
    Media = 'Media',
    MatchDay = 'Match day',
}
export const dividendTypes = Object.values(DividendType);

export interface ExpiringShare {
    name: string;
    quantity: number;
    totalPrice: number;
    buyTime: number;
}
