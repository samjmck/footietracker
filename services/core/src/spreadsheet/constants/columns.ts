import { SheetName } from "./sheets";

export enum PortfolioColumn {
    Name = 'Name',
    PlayerId = 'Player ID',
    Quantity = 'Quantity',
    Weight = 'Weight',
    TotalPrice = 'Total price',
    TotalValue = 'Total value',
    TotalProfit = 'Total P/L',
    Price = 'Price',
    CurrentSellPrice = 'Current sell price',
    CurrentPrice = 'Current price',
    CurrentMidPrice = 'Current mid price',
    ProfitPerShare = 'P/L',
    TotalProfitAfterCommission = 'Total P/L after commission',
    ProfitPerShareAfterCommission = 'P/L after commission',
    PercentageReturnOnInvestment = '% ROI',
    Spread = 'Spread',
    PercentageSpread = '% Spread',
    MediaDividends = 'Media dividends',
    MatchDayDividends = 'Match day dividends',
    InPlayDividends = 'In-play dividends',
    TotalDividends = 'Total dividends',
    DayChange = 'Day change',
    DayTotalChange = 'Day total change',
    PercentageDayChange = '% Day change',
    WeekChange = 'Week change',
    WeekTotalChange = 'Week total change',
    PercentageWeekChange = '% Week change',
    MonthChange = 'Month change',
    MonthTotalChange = 'Month total change',
    PercentageMonthChange = '% Month change',
}
export const portfolioColumns = Object.values(PortfolioColumn);

export enum DailySummaryColumn {
    Date = 'Date',
    PortfolioValue = 'Portfolio value',
    Change = 'Change',
    Footie100 = 'FOOTIE 100',
    PercentageChange = '% Change',
    MediaDividends = 'Media dividends',
    MatchDayDividends = 'Match day dividends',
    InPlayDividends = 'In-play dividends',
}
export const dailySummaryColumns = Object.values(DailySummaryColumn);

export enum ExpiringColumn {
    Name = 'Name',
    Quantity = 'Quantity',
    PurchaseDate = 'Purchase date',
    ExpiringDate = 'Expiring date',
    DaysTillExpiry = 'Days till expiry',
    InPlayExpiringDate = 'In-play expiring date',
    DaysTillInPlayExpiry = 'Days till in-play expiring date',
    PricePerShare = 'Price per share',
    TotalPrice = 'Total price',
    CurrentPrice = 'Current price',
    TotalValue = 'Total value',
    ProfitPerShare = 'Profit per share',
    TotalProfit = 'Total profit',
}
export const expiringColumns = Object.values(ExpiringColumn);

export enum OverviewColumn {
    NumberOfShares = 'Number of shares',
    NumberOfUniquePlayers = 'Number of unique players',
    Cost = 'Cost',
    Value = 'Value',
    Profit = 'P/L',
    DayChange = 'Day change',
    PercentageDayChange = '% Day change',
    WeekChange = 'Week change',
    PercentageWeekChange = '% Week change',
    MonthChange = 'Month change',
    PercentageMonthChange = '% Month change',
}
export const overviewColumns = Object.values(OverviewColumn);

export enum WatchlistColumn {
    Name = 'Name',
    AddedDate = 'Added date',
    AddedPrice = 'Added price',
    CurrentPrice = 'Current price',
    Change = 'Change',
    PercentageChange = '% Change',
}
export const watchlistColumns = Object.values(WatchlistColumn);

export enum DividendsColumn {
    Name = 'Name',
    Time = 'Time',
    Type = 'Type',
    Quantity = 'Quantity',
    Total = 'Total',
}
export const dividendsColumns = Object.values(DividendsColumn);

const quantityColumn = getColumnLetter(portfolioColumns, PortfolioColumn.Quantity);
const totalPriceColumn = getColumnLetter(portfolioColumns, PortfolioColumn.TotalPrice);
const totalValueColumn = getColumnLetter(portfolioColumns, PortfolioColumn.TotalValue);
const totalProfitColumn = getColumnLetter(portfolioColumns, PortfolioColumn.TotalProfit);
const dayChangeColumn = getColumnLetter(portfolioColumns, PortfolioColumn.DayTotalChange);
const weekChangeColumn = getColumnLetter(portfolioColumns, PortfolioColumn.WeekTotalChange);
const monthChangeColumn = getColumnLetter(portfolioColumns, PortfolioColumn.MonthTotalChange);
const overviewDayChangeColumn = getColumnLetter(overviewColumns, OverviewColumn.DayChange);
const overviewWeekChangeColumn = getColumnLetter(overviewColumns, OverviewColumn.WeekChange);
const overviewMonthChangeColumn = getColumnLetter(overviewColumns, OverviewColumn.MonthChange);
const overviewValueColumn = getColumnLetter(overviewColumns, OverviewColumn.Value);
export const defaultOverviewValues = [
    `=SUM('${SheetName.Portfolio}'!${quantityColumn}:${quantityColumn})`,
    `=COUNTIF('${SheetName.Portfolio}'!A2:A, "<>")`,
    `=SUM('${SheetName.Portfolio}'!${totalPriceColumn}:${totalPriceColumn})`,
    `=SUM('${SheetName.Portfolio}'!${totalValueColumn}:${totalValueColumn})`,
    `=SUM('${SheetName.Portfolio}'!${totalProfitColumn}:${totalProfitColumn})`,
    `=SUM('${SheetName.Portfolio}'!${dayChangeColumn}:${dayChangeColumn})`,
    `=${overviewDayChangeColumn}2 / ${overviewValueColumn}2`,
    `=SUM('${SheetName.Portfolio}'!${weekChangeColumn}:${weekChangeColumn})`,
    `=${overviewWeekChangeColumn}2 / ${overviewValueColumn}2`,
    `=SUM('${SheetName.Portfolio}'!${monthChangeColumn}:${monthChangeColumn})`,
    `=${overviewMonthChangeColumn}2 / ${overviewValueColumn}2`,
];

export enum VariablesColumn {
    Commission = 'Commission',
    PriceType = 'Price type (SELL, MID, BUY)',
    ExpiringPriceType = 'Expiring price type (SELL, MID, BUY)',
}
export const variablesColumns = Object.values(VariablesColumn);
export const defaultVariables = [0.02, 'MID', 'MID'];

export type Column =
    OverviewColumn |
    PortfolioColumn |
    ExpiringColumn |
    DailySummaryColumn |
    WatchlistColumn |
    VariablesColumn |
    DividendsColumn;

export function getColumnLetterFromIndex(index: number): string {
    let number = index + 1;
    for(var ret = '', a = 1, b = 26; (number -= a) >= 0; a = b, b *= 26) {
        ret = String.fromCharCode(parseInt(String((number % b) / a)) + 65) + ret;
    }
    return ret;
}

export function getColumnLetter(columns: Column[], column: Column): string {
    const columnNameIndex = columns.indexOf(column);
    if (columnNameIndex === -1) {
        throw new Error(`Column name '${column}' does not exist`);
    }

    return getColumnLetterFromIndex(columnNameIndex);
}

export function getColumnIndex(columns: string[], column: string): number {
    return columns.indexOf(column);
}
