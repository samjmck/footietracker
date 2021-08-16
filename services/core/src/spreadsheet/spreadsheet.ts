import {
    DailySummaryColumn,
    dailySummaryColumns,
    DividendsColumn,
    dividendsColumns,
    ExpiringColumn,
    expiringColumns, getColumnIndex,
    getColumnLetter,
    OverviewColumn,
    overviewColumns,
    PortfolioColumn,
    portfolioColumns,
    VariablesColumn,
    variablesColumns,
    WatchlistColumn,
    watchlistColumns
} from "./constants/columns";
import { Credentials, OAuth2Client } from 'google-auth-library';
import { clearValues, getUpdateRequests, getValues, MajorDimension, updateValues } from "./wrapper";
import { DividendType, Portfolio } from "../../../../shared/backend/src/service/spreadsheets/interfaces";
import { SheetName } from "./constants/sheets";

export async function getPlayerIds(oauth: OAuth2Client, credentials: Credentials, spreadsheetId: string): Promise<{
    portfolioPlayerIds: string[];
    watchlistPlayerIds: string[];
} | null> {
    const portfolioPlayerIdsColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.PlayerId);
    const watchlistPlayerNamesColumnLetter = getColumnLetter(watchlistColumns, WatchlistColumn.Name);
    const values = await getValues(
        oauth,
        credentials,
        spreadsheetId,
        [
            `${SheetName.Portfolio}!${portfolioPlayerIdsColumnLetter}2:${portfolioPlayerIdsColumnLetter}`,
            `${SheetName.Watchlist}!${watchlistPlayerNamesColumnLetter}2:${watchlistPlayerNamesColumnLetter}`
        ],
        MajorDimension.Columns,
    );
    if(values !== null && values.length > 0) {
        return {
            portfolioPlayerIds: values[0][0],
            watchlistPlayerIds: values.length === 1 ? [] : values[1][0].map(playerName => playerName.replace(/ /g, '-').toLowerCase()),
        };
    }
    return null;
}

export async function getDailySummary(oauth: OAuth2Client, credentials: Credentials, spreadsheetId: string): Promise<{
    totalValue: number;
    mediaDividends: number;
    matchDayDividends: number;
    change: string;
    percentageChange: string;
    isFirstDailySummary: boolean; // fucking weird formatting error so we need to use values.update instead of appendValues for the first row
} | null> {
    const totalValueColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.TotalValue);
    const MediaDividendsColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.MediaDividends);
    const matchDayDividendsColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.MatchDayDividends);
    const portfolioValueColumnLetter = getColumnLetter(dailySummaryColumns, DailySummaryColumn.PortfolioValue);
    const changeColumnLetter = getColumnLetter(dailySummaryColumns, DailySummaryColumn.Change);

    const values = await getValues(
        oauth,
        credentials,
        spreadsheetId,
        [
            `'${SheetName.Portfolio}'!${totalValueColumnLetter}2:${totalValueColumnLetter}`,
            `'${SheetName.Portfolio}'!${MediaDividendsColumnLetter}2:${MediaDividendsColumnLetter}`,
            `'${SheetName.Portfolio}'!${matchDayDividendsColumnLetter}2:${matchDayDividendsColumnLetter}`,
            `'${SheetName.DailySummary}'!A:A`, // not being specific because we just need the column size
        ],
        MajorDimension.Columns,
    );

    if(values !== null && values.length > 0) {
        const sum = (array: number[]): number => array.reduce((previous, current) => previous + current, 0);

        const currentRow = values[3][0].length + 1;

        return {
            totalValue: sum(values[0][0]),
            mediaDividends: sum(values[2][0]),
            matchDayDividends: sum(values[2][0]),
            change: currentRow === 2 ? '0' : `=${portfolioValueColumnLetter}${currentRow} - ${portfolioValueColumnLetter}${currentRow - 1}`,
            percentageChange: currentRow === 2 ? '0' : `=${changeColumnLetter}${currentRow} / ${portfolioValueColumnLetter}${currentRow - 1}`,
            isFirstDailySummary: currentRow === 2,
        };
    }
    return null;
}

export async function addPortfolio(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    portfolio: Portfolio
): Promise<void> {
    await clearValues(
        oauth,
        credentials,
        spreadsheetId,
        SheetName.Portfolio,
        `A2:${getColumnLetter(portfolioColumns, portfolioColumns[portfolioColumns.length - 1])}`,
    );
    await clearValues(
        oauth,
        credentials,
        spreadsheetId,
        SheetName.Expiring,
        `A2:${getColumnLetter(expiringColumns, expiringColumns[expiringColumns.length - 1])}`,
    );
    await clearValues(
        oauth,
        credentials,
        spreadsheetId,
        SheetName.Dividends,
        `A2:${getColumnLetter(dividendsColumns, dividendsColumns[dividendsColumns.length - 1])}`,
    );

    function fill(getValue: (rowIndex: number) => any, length: number): any[] {
        const values: any[] = [];
        for (let i = 2; i < length + 2; i++) {
            values.push(getValue(i));
        }
        return values;
    }

    function fillPortfolio(getValue: (rowIndex: number) => any): any[] {
        return fill(getValue, portfolio.shares.length);
    }

    function fillExpiring(getValue: (rowIndex: number) => any): any[] {
        return fill(getValue, portfolio.expiringShares.length);
    }

    function getPortfolioCell(rowIndex: number, columnName: PortfolioColumn): string {
        return `${getColumnLetter(portfolioColumns, columnName)}${rowIndex}`;
    }

    function getDividendsCell(rowIndex: number, columnName: DividendsColumn): string {
        return `${getColumnLetter(portfolioColumns, columnName)}${rowIndex}`;
    }

    function getExpiringCell(rowIndex: number, columnName: ExpiringColumn): string {
        return `${getColumnLetter(expiringColumns, columnName)}${rowIndex}`;
    }

    const priceTypeCell = `'${SheetName.Variables}'!${getColumnLetter(variablesColumns, VariablesColumn.PriceType)}2`;
    const dividendsTotalCell = `'${SheetName.Dividends}'!${getColumnLetter(dividendsColumns, DividendsColumn.Total)}:${getColumnLetter(dividendsColumns, DividendsColumn.Total)}`;
    const dividendsNameCell = `'${SheetName.Dividends}'!${getColumnLetter(dividendsColumns, DividendsColumn.Name)}:${getColumnLetter(dividendsColumns, DividendsColumn.Name)}`;
    const dividendsTypeCell = `'${SheetName.Dividends}'!${getColumnLetter(dividendsColumns, DividendsColumn.Type)}:${getColumnLetter(dividendsColumns, DividendsColumn.Type)}`;

    const nameColumn: string[] = [];
    const playerIdColumn: string[] = [];
    const quantityColumn: number[] = [];
    const totalPriceColumn: number[] = [];
    for(const share of portfolio.shares) {
        nameColumn.push(share.name);
        playerIdColumn.push(share.playerId);
        quantityColumn.push(share.quantity);
        totalPriceColumn.push(share.totalPrice / 100);
    }
    const portfolioUpdateRequests = getUpdateRequests<PortfolioColumn> (SheetName.Portfolio, portfolioColumns, [
        {
            columnName: PortfolioColumn.Name,
            values: nameColumn,
        },
        {
            columnName: PortfolioColumn.PlayerId,
            values: playerIdColumn,
        },
        {
            columnName: PortfolioColumn.Quantity,
            values: quantityColumn,
        },
        {
            columnName: PortfolioColumn.TotalPrice,
            values: totalPriceColumn,
        },
        {
            columnName: PortfolioColumn.TotalValue,
            values: fillPortfolio(rI => `=IF(${priceTypeCell} = "SELL", ${getPortfolioCell(rI, PortfolioColumn.CurrentSellPrice)}, IF(${priceTypeCell} = "BUY", ${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)}, ${getPortfolioCell(rI, PortfolioColumn.CurrentMidPrice)})) * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.CurrentMidPrice,
            values: fillPortfolio(rI => `=(${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)} + ${getPortfolioCell(rI, PortfolioColumn.CurrentSellPrice)}) / 2`),
        },
        {
            columnName: PortfolioColumn.Weight,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.TotalValue)}/'${SheetName.Overview}'!${getColumnLetter(overviewColumns, OverviewColumn.Value)}2`),
        },
        {
            columnName: PortfolioColumn.TotalProfit,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.ProfitPerShare)} * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.Price,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.TotalPrice)} / ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.ProfitPerShare,
            values: fillPortfolio(rI => `=IF(${priceTypeCell} = "SELL", ${getPortfolioCell(rI, PortfolioColumn.CurrentSellPrice)}, IF(${priceTypeCell} = "BUY", ${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)}, ${getPortfolioCell(rI, PortfolioColumn.CurrentMidPrice)})) - ${getPortfolioCell(rI, PortfolioColumn.Price)}`),
        },
        {
            columnName: PortfolioColumn.TotalProfitAfterCommission,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.ProfitPerShareAfterCommission)} * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.ProfitPerShareAfterCommission,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.ProfitPerShare)} - ${SheetName.Variables}!${getColumnLetter(variablesColumns, VariablesColumn.Commission)}2 * ${getPortfolioCell(rI, PortfolioColumn.ProfitPerShare)}`),
        },
        {
            columnName: PortfolioColumn.PercentageReturnOnInvestment,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.ProfitPerShareAfterCommission)} / ${getPortfolioCell(rI, PortfolioColumn.Price)}`),
        },
        {
            columnName: PortfolioColumn.DayTotalChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.DayChange)} * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.PercentageDayChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.DayChange)} / (${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)} - ${getPortfolioCell(rI, PortfolioColumn.DayChange)})`),
        },
        {
            columnName: PortfolioColumn.WeekTotalChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.WeekChange)} * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.PercentageWeekChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.WeekChange)} / (${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)} - ${getPortfolioCell(rI, PortfolioColumn.WeekChange)})`),
        },
        {
            columnName: PortfolioColumn.MonthTotalChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.MonthChange)} * ${getPortfolioCell(rI, PortfolioColumn.Quantity)}`),
        },
        {
            columnName: PortfolioColumn.PercentageMonthChange,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.MonthChange)} / (${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)} - ${getPortfolioCell(rI, PortfolioColumn.MonthChange)})`),
        },
        {
            columnName: PortfolioColumn.Spread,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)} - ${getPortfolioCell(rI, PortfolioColumn.CurrentSellPrice)}`),
        },
        {
            columnName: PortfolioColumn.PercentageSpread,
            values: fillPortfolio(rI => `=${getPortfolioCell(rI, PortfolioColumn.Spread)}/${getPortfolioCell(rI, PortfolioColumn.CurrentPrice)}`),
        },
        {
            columnName: PortfolioColumn.MediaDividends,
            values: fillPortfolio(rI => `=SUMIFS(${dividendsTotalCell}, ${dividendsNameCell}, ${getPortfolioCell(rI, PortfolioColumn.Name)}, ${dividendsTypeCell}, "${DividendType.Media}")`),
        },
        {
            columnName: PortfolioColumn.MatchDayDividends,
            values: fillPortfolio(rI => `=SUMIFS(${dividendsTotalCell}, ${dividendsNameCell}, ${getPortfolioCell(rI, PortfolioColumn.Name)}, ${dividendsTypeCell}, "${DividendType.MatchDay}")`),
        },
        {
            columnName: PortfolioColumn.InPlayDividends,
            values: fillPortfolio(rI => `=SUMIFS(${dividendsTotalCell}, ${dividendsNameCell}, ${getPortfolioCell(rI, PortfolioColumn.Name)}, ${dividendsTypeCell}, "${DividendType.InPlayGoal}") + SUMIFS(${dividendsTotalCell}, ${dividendsNameCell}, ${getPortfolioCell(rI, PortfolioColumn.Name)}, ${dividendsTypeCell}, "${DividendType.InPlayCleanSheet}") + SUMIFS(${dividendsTotalCell}, ${dividendsNameCell}, ${getPortfolioCell(rI, PortfolioColumn.Name)}, ${dividendsTypeCell}, "${DividendType.InPlayAssist}")`),
        },
        {
            columnName: PortfolioColumn.TotalDividends,
            values: fillPortfolio(rI => `=SUM(${getPortfolioCell(rI, PortfolioColumn.MediaDividends)}, ${getPortfolioCell(rI, PortfolioColumn.MatchDayDividends)}, ${getPortfolioCell(rI, PortfolioColumn.InPlayDividends)})`),
        }
    ]);

    const expiringNameColumn: string[] = [];
    const expiringQuantityColumn: number[] = [];
    const purchaseDateColumn: string[] = [];
    const expiringTotalPriceColumn: number[] = [];
    for (const expiringShare of portfolio.expiringShares) {
        expiringNameColumn.push(expiringShare.name);
        expiringQuantityColumn.push(expiringShare.quantity);
        purchaseDateColumn.push(`=(${expiringShare.buyTime} / 1000 / 86400) + DATE(1970, 1, 1)`);
        expiringTotalPriceColumn.push(expiringShare.totalPrice / 100);
    }
    const expiringPriceType = `'${SheetName.Variables}'!${getColumnLetter(variablesColumns, VariablesColumn.ExpiringPriceType)}2`;
    const expiringUpdateRequests = getUpdateRequests<ExpiringColumn>(SheetName.Expiring, expiringColumns,
        [
            {
                columnName: ExpiringColumn.Name,
                values: expiringNameColumn,
            },
            {
                columnName: ExpiringColumn.Quantity,
                values: expiringQuantityColumn,
            },
            {
                columnName: ExpiringColumn.PurchaseDate,
                values: purchaseDateColumn,
            },
            {
                columnName: ExpiringColumn.TotalPrice,
                values: expiringTotalPriceColumn,
            },
            {
                columnName: ExpiringColumn.PricePerShare,
                values: fillExpiring(rI => `=${getExpiringCell(rI, ExpiringColumn.TotalPrice)} / ${getExpiringCell(rI, ExpiringColumn.Quantity)}`),
            },
            {
                columnName: ExpiringColumn.CurrentPrice,
                values: fillExpiring(rI => {
                    const nameCell = getExpiringCell(rI, ExpiringColumn.Name);
                    const portfolioNameColumn = getColumnLetter(portfolioColumns, PortfolioColumn.Name);
                    const portfolioMidPriceColumn = getColumnLetter(portfolioColumns, PortfolioColumn.CurrentMidPrice);
                    const sellPriceColumnNumber = getColumnIndex(portfolioColumns, PortfolioColumn.CurrentSellPrice) + 1;
                    const sellPrice = `VLOOKUP(${nameCell}, '${SheetName.Portfolio}'!${portfolioNameColumn}:${portfolioMidPriceColumn}, ${sellPriceColumnNumber}, FALSE)`;
                    const midPriceColumnNumber = getColumnIndex(portfolioColumns, PortfolioColumn.CurrentMidPrice) + 1;
                    const midPrice = `VLOOKUP(${nameCell}, '${SheetName.Portfolio}'!${portfolioNameColumn}:${portfolioMidPriceColumn}, ${midPriceColumnNumber}, FALSE)`;
                    const buyPriceColumnNumber = getColumnIndex(portfolioColumns, PortfolioColumn.CurrentPrice) + 1;
                    const buyPrice = `VLOOKUP(${nameCell}, '${SheetName.Portfolio}'!${portfolioNameColumn}:${portfolioMidPriceColumn}, ${buyPriceColumnNumber}, FALSE)`;
                    return `=IFS(${expiringPriceType} = "SELL", ${sellPrice}, ${expiringPriceType} = "MID", ${midPrice}, ${expiringPriceType} = "BUY", ${buyPrice})`;
                }),
            },
            {
                columnName: ExpiringColumn.TotalValue,
                values: fillExpiring(rI => `=${getExpiringCell(rI, ExpiringColumn.CurrentPrice)} * ${getExpiringCell(rI, ExpiringColumn.Quantity)}`),
            },
            {
                columnName: ExpiringColumn.ProfitPerShare,
                values: fillExpiring(rI => `=${getExpiringCell(rI, ExpiringColumn.CurrentPrice)} - ${getExpiringCell(rI, ExpiringColumn.PricePerShare)}`),
            },
            {
                columnName: ExpiringColumn.TotalProfit,
                values: fillExpiring(rI => `=${getExpiringCell(rI, ExpiringColumn.ProfitPerShare)} * ${getExpiringCell(rI, ExpiringColumn.Quantity)}`),
            },
            {
                columnName: ExpiringColumn.ExpiringDate,
                values: fillExpiring(rI => {
                    const cell = getExpiringCell(rI, ExpiringColumn.PurchaseDate);
                    return `=DATE(YEAR(${cell}) + 3, MONTH(${cell}), DAY(${cell}))`;
                }),
            },
            {
                columnName: ExpiringColumn.DaysTillExpiry,
                values: fillExpiring(rI => `=DATEDIF(TODAY(), ${getExpiringCell(rI, ExpiringColumn.ExpiringDate)}, "D")`),
            },
            {
                columnName: ExpiringColumn.InPlayExpiringDate,
                values: fillExpiring(rI => {
                    const cell = getExpiringCell(rI, ExpiringColumn.PurchaseDate);
                    return `=DATE(YEAR(${cell}), MONTH(${cell}), DAY(${cell}) + 30)`;
                }),
            },
            {
                columnName: ExpiringColumn.DaysTillInPlayExpiry,
                values: fillExpiring(rI => `=IFERROR(DATEDIF(TODAY(), ${getExpiringCell(rI, ExpiringColumn.InPlayExpiringDate)}, "D"), "Expired")`),
            },
        ],
    );

    const dividendsNames: string[] = [];
    const dividendsTime: string[] = [];
    const dividendsType: string[] = [];
    const dividendsQuantity: number[] = [];
    const dividendsTotal: number[] = [];
    for(const dividend of portfolio.dividends) {
        dividendsNames.push(dividend.name);
        dividendsTime.push(`=(${dividend.time} / 1000 / 86400) + DATE(1970, 1, 1)`)
        dividendsType.push(dividend.type);
        dividendsQuantity.push(dividend.quantity);
        dividendsTotal.push(dividend.total)
    }
    const dividendsUpdateRequests = getUpdateRequests<DividendsColumn>(SheetName.Dividends, dividendsColumns,
        [
            {
                columnName: DividendsColumn.Name,
                values: dividendsNames,
            },
            {
                columnName: DividendsColumn.Time,
                values: dividendsTime,
            },
            {
                columnName: DividendsColumn.Type,
                values: dividendsType,
            },
            {
                columnName: DividendsColumn.Quantity,
                values: dividendsQuantity,
            },
            {
                columnName: DividendsColumn.Total,
                values: dividendsTotal,
            },
        ],
    );

    await updateValues(
        oauth,
        credentials,
        spreadsheetId,
        [
            ...portfolioUpdateRequests,
            ...expiringUpdateRequests,
            ...dividendsUpdateRequests
        ]
    );
}

export async function updateSpreadsheet(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    portfolio: {
        sellPrices: number[],
        buyPrices: number[],
        dayChanges: number[],
        weekChanges: number[],
        monthChanges: number[],
        mediaDividends: number[],
        matchDayDividends: number[],
    },
    watchlist: {
        buyPrices: number[],
    },
): Promise<void> {
    function correctCurrencies(currencies: number[]): number[] {
        const correctedCurrencies: number[] = [];
        for(const currency of currencies) {
            correctedCurrencies.push(currency / 100);
        }
        return correctedCurrencies;
    }

    const sellPricesColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.CurrentSellPrice);
    const buyPricesColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.CurrentPrice);
    const mediaDividendsColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.MediaDividends);
    const matchDayDividendsColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.MatchDayDividends);
    const dayChangesColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.DayChange);
    const weekChangesColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.WeekChange);
    const monthChangesColumnLetter = getColumnLetter(portfolioColumns, PortfolioColumn.MonthChange);
    const watchlistCurrentPriceColumnLetter = getColumnLetter(watchlistColumns, WatchlistColumn.CurrentPrice);
    await updateValues(
        oauth,
        credentials,
        spreadsheetId,
        [
            {
                sheet: SheetName.Portfolio,
                range: `${sellPricesColumnLetter}2:${sellPricesColumnLetter}`,
                values: [correctCurrencies(portfolio.sellPrices)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${buyPricesColumnLetter}2:${buyPricesColumnLetter}`,
                values: [correctCurrencies(portfolio.buyPrices)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${mediaDividendsColumnLetter}2:${mediaDividendsColumnLetter}`,
                values: [correctCurrencies(portfolio.mediaDividends)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${matchDayDividendsColumnLetter}2:${matchDayDividendsColumnLetter}`,
                values: [correctCurrencies(portfolio.matchDayDividends)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${dayChangesColumnLetter}2:${dayChangesColumnLetter}`,
                values: [correctCurrencies(portfolio.dayChanges)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${weekChangesColumnLetter}2:${weekChangesColumnLetter}`,
                values: [correctCurrencies(portfolio.weekChanges)],
            },
            {
                sheet: SheetName.Portfolio,
                range: `${monthChangesColumnLetter}2:${monthChangesColumnLetter}`,
                values: [correctCurrencies(portfolio.monthChanges)],
            },
            {
                sheet: SheetName.Watchlist,
                range: `${watchlistCurrentPriceColumnLetter}2:${watchlistCurrentPriceColumnLetter}`,
                values: [correctCurrencies(watchlist.buyPrices)],
            },
        ],
        MajorDimension.Columns,
    );
}
