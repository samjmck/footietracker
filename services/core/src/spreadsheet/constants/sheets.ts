import { Sheet } from "../wrapper";

export enum SheetId {
    Overview = 0,
    Portfolio = 1,
    DailySummary = 2,
    Expiring = 3,
    Charts = 4,
    Watchlist = 5,
    Variables = 6,
    Dividends = 7,
}
export const sheetIds: number[] = [
    SheetId.Overview,
    SheetId.Dividends,
    SheetId.Portfolio,
    SheetId.DailySummary,
    SheetId.Expiring,
    SheetId.Charts,
    SheetId.Watchlist,
    SheetId.Variables,
];

export const fixedHeaderSheetIds: number[] = [
    SheetId.Overview,
    SheetId.Dividends,
    SheetId.Portfolio,
    SheetId.DailySummary,
    SheetId.Expiring,
    SheetId.Watchlist,
    SheetId.Variables,
]

export enum SheetName {
    Overview = 'Overview',
    Portfolio = 'Portfolio',
    DailySummary = 'Daily summary',
    Expiring = 'Expiring',
    Charts = 'Charts',
    Watchlist = 'Watchlist',
    Variables = 'Variables',
    Dividends = 'Dividends',
}
export const sheetNames = Object.values(SheetName);

export function getSheetNameIndex(sheetName: SheetName): number {
    return sheetNames.indexOf(sheetName);
}

export const sheets: Sheet[] = [
    {
        name: SheetName.Overview,
        id: SheetId.Overview
    },
    {
        name: SheetName.Dividends,
        id: SheetId.Dividends,
    },
    {
        name: SheetName.Portfolio,
        id: SheetId.Portfolio,
    },
    {
        name: SheetName.DailySummary,
        id: SheetId.DailySummary,
    },
    {
        name: SheetName.Expiring,
        id: SheetId.Expiring,
    },
    {
        name: SheetName.Charts,
        id: SheetId.Charts,
    },
    {
        name: SheetName.Watchlist,
        id: SheetId.Watchlist,
    },
    {
        name: SheetName.Variables,
        id: SheetId.Variables,
    },
];
