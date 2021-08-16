// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/other#ConditionType
import { sheets_v4 } from "googleapis";
import {
    Column,
    DailySummaryColumn,
    dailySummaryColumns,
    DividendsColumn,
    dividendsColumns,
    ExpiringColumn,
    expiringColumns,
    getColumnIndex,
    OverviewColumn,
    overviewColumns,
    PortfolioColumn,
    portfolioColumns,
    VariablesColumn,
    variablesColumns,
    WatchlistColumn,
    watchlistColumns
} from "./columns";
import { fixedHeaderSheetIds, SheetId, sheetIds } from "./sheets";
import Schema$Color = sheets_v4.Schema$Color;
import Schema$Request = sheets_v4.Schema$Request;
import Schema$GridRange = sheets_v4.Schema$GridRange;

enum ConditionalRuleType {
    NumberGreater = 'NUMBER_GREATER',
    NumberGreaterThanEQ = 'NUMBER_GREATER_THAN_EQ',
    NumberLess = 'NUMBER_LESS',
    NumberLessThanEQ = 'NUMBER_LESS_THAN_EQ',
    NumberEQ = 'NUMBER_EQ'
}

interface ConditionalRule {
    conditionType: ConditionalRuleType;
    value: number;
    backgroundColor: Schema$Color;
    textColor: Schema$Color;
}

interface SheetFormattingDetails {
    sheetId: SheetId;
    columns: Column[];
    selectedColumns: Column[];
}

interface Formatting {
    format: string;
    conditionalRules: ConditionalRule[];
    sheets: SheetFormattingDetails[];
}

export const differenceConditionalRules: ConditionalRule[] = [
    {
        conditionType: ConditionalRuleType.NumberLess,
        value: 0,
        backgroundColor: {
            red: 247 / 255,
            green: 202 / 255,
            blue: 207 / 255,
            alpha: 1,
        },
        textColor: {
            red: 144 / 255,
            green: 27 / 255,
            blue: 21 / 255,
            alpha: 1,
        },
    },
    {
        conditionType: ConditionalRuleType.NumberGreaterThanEQ,
        value: 0,
        backgroundColor: {
            red: 206 / 255,
            green: 237 / 255,
            blue: 209 / 255,
            alpha: 1,
        },
        textColor: {
            red: 39 / 255,
            green: 94 / 255,
            blue: 23 / 255,
            alpha: 1,
        },
    },
];

export const currencyFormatting: Formatting = {
    format: '_(£* #,##0.00_); _(£* -#,##0.00_)',
    conditionalRules: [],
    sheets: [
        {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumns: [
                PortfolioColumn.TotalPrice,
                PortfolioColumn.TotalValue,
                PortfolioColumn.Price,
                PortfolioColumn.CurrentSellPrice,
                PortfolioColumn.CurrentPrice,
                PortfolioColumn.CurrentMidPrice,
                PortfolioColumn.Spread,
                PortfolioColumn.MediaDividends,
                PortfolioColumn.MatchDayDividends,
                PortfolioColumn.InPlayDividends,
                PortfolioColumn.TotalDividends,
            ],
        },
        {
            sheetId: SheetId.DailySummary,
            columns: dailySummaryColumns,
            selectedColumns: [
                DailySummaryColumn.PortfolioValue,
                DailySummaryColumn.MediaDividends,
                DailySummaryColumn.MatchDayDividends,
                DailySummaryColumn.InPlayDividends,
            ],
        },
        {
            sheetId: SheetId.Watchlist,
            columns: watchlistColumns,
            selectedColumns: [
                WatchlistColumn.AddedPrice,
                WatchlistColumn.CurrentPrice,
            ],
        },
        {
            sheetId: SheetId.Overview,
            columns: overviewColumns,
            selectedColumns: [
                OverviewColumn.Cost,
                OverviewColumn.Value,
            ],
        },
        {
            sheetId: SheetId.Dividends,
            columns: dividendsColumns,
            selectedColumns: [
                DividendsColumn.Total,
            ],
        },
        {
            sheetId: SheetId.Expiring,
            columns: expiringColumns,
            selectedColumns: [
                ExpiringColumn.PricePerShare,
                ExpiringColumn.TotalPrice,
                ExpiringColumn.CurrentPrice,
                ExpiringColumn.TotalValue,
                ExpiringColumn.PricePerShare,
            ],
        },
    ],
};
export const differenceFormatting: Formatting = {
    format: '_(£* +#,##0.00_); _(£* -#,##0.00_)',
    conditionalRules: differenceConditionalRules,
    sheets: [
        {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumns: [
                PortfolioColumn.TotalProfit,
                PortfolioColumn.ProfitPerShare,
                PortfolioColumn.TotalProfitAfterCommission,
                PortfolioColumn.ProfitPerShareAfterCommission,
                PortfolioColumn.DayChange,
                PortfolioColumn.DayTotalChange,
                PortfolioColumn.WeekChange,
                PortfolioColumn.WeekTotalChange,
            ],
        },
        {
            sheetId: SheetId.Overview,
            columns: overviewColumns,
            selectedColumns: [
                OverviewColumn.Profit,
                OverviewColumn.DayChange,
                OverviewColumn.WeekChange,
                OverviewColumn.MonthChange,
            ],
        },
        {
            sheetId: SheetId.DailySummary,
            columns: dailySummaryColumns,
            selectedColumns: [
                DailySummaryColumn.Change,
            ],
        },
        {
            sheetId: SheetId.Watchlist,
            columns: watchlistColumns,
            selectedColumns: [
                WatchlistColumn.Change,
            ],
        },
        {
            sheetId: SheetId.Expiring,
            columns: expiringColumns,
            selectedColumns: [
                ExpiringColumn.ProfitPerShare,
                ExpiringColumn.TotalProfit,
            ],
        },
    ],
};
export const differencePercentageFormatting: Formatting = {
    format: '+##,#0.00%;-##,#0.00%',
    conditionalRules: differenceConditionalRules,
    sheets: [
        {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumns: [
                PortfolioColumn.PercentageReturnOnInvestment,
                PortfolioColumn.PercentageDayChange,
                PortfolioColumn.PercentageWeekChange,
            ],
        },
        {
            sheetId: SheetId.Overview,
            columns: overviewColumns,
            selectedColumns: [
                OverviewColumn.PercentageDayChange,
                OverviewColumn.PercentageWeekChange,
                OverviewColumn.PercentageMonthChange,
            ],
        },
        {
            sheetId: SheetId.DailySummary,
            columns: dailySummaryColumns,
            selectedColumns: [
                DailySummaryColumn.PercentageChange,
            ],
        },
        {
            sheetId: SheetId.Watchlist,
            columns: watchlistColumns,
            selectedColumns: [
                WatchlistColumn.PercentageChange,
            ],
        }
    ],
};
export const percentageFormatting: Formatting = {
    format: '##,#0.00%',
    conditionalRules: [],
    sheets: [
        {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumns: [
                PortfolioColumn.PercentageSpread,
                PortfolioColumn.Weight,
            ],
        },
        {
            sheetId: SheetId.Variables,
            columns: variablesColumns,
            selectedColumns: [
                VariablesColumn.Commission,
            ],
        },
        {
            sheetId: SheetId.DailySummary,
            columns: dailySummaryColumns,
            selectedColumns: [
                DailySummaryColumn.PercentageChange,
            ],
        },
    ],
};
export const dateFormatting: Formatting = {
    format: 'dd/MM/yyyy HH:mm:ss',
    conditionalRules: [],
    sheets: [
        {
            sheetId: SheetId.DailySummary,
            columns: dailySummaryColumns,
            selectedColumns: [
                DailySummaryColumn.Date,
            ],
        },
        {
            sheetId: SheetId.Expiring,
            columns: expiringColumns,
            selectedColumns: [
                ExpiringColumn.PurchaseDate,
                ExpiringColumn.ExpiringDate,
                ExpiringColumn.InPlayExpiringDate,
            ],
        },
        {
            sheetId: SheetId.Watchlist,
            columns: watchlistColumns,
            selectedColumns: [
                WatchlistColumn.AddedDate,
            ],
        },
        {
            sheetId: SheetId.Dividends,
            columns: dividendsColumns,
            selectedColumns: [
                DividendsColumn.Time,
            ],
        },
    ],
};

const hiddenColumns: SheetFormattingDetails[] = [
    {
        sheetId: SheetId.Portfolio,
        columns: portfolioColumns,
        selectedColumns: [
            PortfolioColumn.PlayerId,
            PortfolioColumn.Spread,
            PortfolioColumn.TotalDividends,
        ],
    },
];

const formattings: Formatting[] = [
    currencyFormatting,
    differenceFormatting,
    differencePercentageFormatting,
    percentageFormatting,
    dateFormatting,
];

export function getHiddenColumnRequests(): Schema$Request[] {
    const requests: Schema$Request[] = [];
    for(const { sheetId, columns, selectedColumns } of hiddenColumns) {
        for(const column of selectedColumns) {
            requests.push({
                updateDimensionProperties: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'COLUMNS',
                        startIndex: getColumnIndex(columns, column),
                        endIndex: getColumnIndex(columns, column) + 1,
                    },
                    properties: {
                        hiddenByUser: true,
                    },
                    fields: 'hiddenByUser'
                },
            });
        }
    }
    return requests;
}

export function getFormattingRequests(): Schema$Request[] {
    const requests: Schema$Request[] = [];
    for(const { format, conditionalRules, sheets } of formattings) {
        for(const { sheetId, columns, selectedColumns } of sheets) {
            const ranges: Schema$GridRange[] = [];
            for(const column of selectedColumns) {
                const columnIndex = getColumnIndex(columns, column);
                const range: Schema$GridRange = {
                    sheetId,
                    startRowIndex: 1,
                    startColumnIndex: columnIndex,
                    endColumnIndex: columnIndex + 1,
                };
                ranges.push(range);
                requests.push({
                    repeatCell: {
                        range,
                        cell: {
                            userEnteredFormat: {
                                numberFormat: {
                                    type: 'NUMBER',
                                    pattern: format,
                                },
                            },
                        },
                        fields: 'userEnteredFormat.numberFormat',
                    },
                });
            }
            for(const { conditionType, value, backgroundColor, textColor } of conditionalRules) {
                requests.push({
                    addConditionalFormatRule: {
                        // index: 0,
                        rule: {
                            ranges,
                            booleanRule: {
                                condition: {
                                    type: conditionType,
                                    values: [{
                                        userEnteredValue: value.toString(),
                                    }],
                                },
                                format: {
                                    backgroundColor,
                                    textFormat: {
                                        foregroundColor: textColor,
                                    },
                                },
                            },
                        },
                    },
                });
            }
        }
    }
    return requests;
}

export function getBoldHeaderRequests(): Schema$Request[] {
    const requests: Schema$Request[] = [];
    for(const sheetId of sheetIds) {
        requests.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1
                },
                cell: {
                    userEnteredFormat: {
                        textFormat: {
                            bold: true,
                        },
                    },
                },
                fields: 'userEnteredFormat.textFormat',
            },
        });
    }
    return requests;
}

export function getFreezeRequests(): Schema$Request[] {
    return [
        {
            updateSheetProperties: {
                properties: {
                    sheetId: SheetId.Portfolio,
                    gridProperties: {
                        frozenRowCount: 1,
                        frozenColumnCount: 3,
                    },
                },
                fields: 'gridProperties(frozenRowCount,frozenColumnCount)',
            },
        },
        ...fixedHeaderSheetIds.map(sheetId => ({
            updateSheetProperties: {
                properties: {
                    sheetId,
                    gridProperties: {
                        frozenRowCount: 1,
                    },
                },
                fields: 'gridProperties.frozenRowCount',
            },
        })),
    ];
}
