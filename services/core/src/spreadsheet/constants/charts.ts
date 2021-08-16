import { sheets_v4 } from "googleapis";
import { Column, getColumnIndex, PortfolioColumn, portfolioColumns, dailySummaryColumns, DailySummaryColumn } from "./columns";
import Schema$Request = sheets_v4.Schema$Request;
import Schema$AddChartRequest = sheets_v4.Schema$AddChartRequest;
import Schema$ChartSpec = sheets_v4.Schema$ChartSpec;
import { SheetId } from "./sheets";

export enum ChartId {
    CostByPlayer = 0,
    ValueByPlayer = 1,
    ProfitByPlayer = 2,
    PortfolioValueOverTime = 3,
    MediaDividendsByPlayer = 4,
    MatchDayDividendsByPlayer = 5,
    TotalDividendsByPlayer = 6,
}
export const chartIds: number[] = [
    ChartId.CostByPlayer,
    ChartId.ValueByPlayer,
    ChartId.ProfitByPlayer,
    ChartId.PortfolioValueOverTime,
    ChartId.MediaDividendsByPlayer,
    ChartId.MatchDayDividendsByPlayer,
];

export enum ChartTitle {
    CostByPlayer = 'Cost by player',
    ValueByPlayer = 'Value by player',
    ProfitByPlayer = 'Profit by player',
    PortfolioValueOverTime = 'Portfolio value over time',
    MediaDividendsByPlayer = 'Media dividends by player',
    MatchDayDividendsByPlayer = 'Match day dividends by player',
    TotalDividendsByPlayer = 'Total dividends by player'
}
export const chartTitles = Object.values(ChartTitle);

interface ChartRange {
    sheetId: SheetId;
    columns: Column[];
    selectedColumn: Column;
}

interface ChartPosition {
    sheetId: SheetId;
    rowIndex: number;
    columnIndex: number;
    offsetXPixels: number;
    offsetYPixels: number;
}

interface PieChart {
    chartId: ChartId;
    title: ChartTitle;
    label: ChartRange;
    value: ChartRange;
    position: ChartPosition;
}

enum BasicChartAxisPosition {
    Bottom = 'BOTTOM_AXIS',
    Left = 'LEFT_AXIS',
    Right = 'RIGHT_AXIS',
}

enum BasicChartType {
    Bar = 'BAR',
    Line = 'LINE',
    Area = 'AREA',
    Column = 'COLUMN',
    Scatter = 'SCATTER',
    Combo = 'COMBO',
    SteppedArea = 'STEPPED_AREA',
}

interface BasicChartAxis {
    position: BasicChartAxisPosition;
    title: string;
}

interface BasicChart {
    chartId: ChartId;
    chartType: BasicChartType;
    title: ChartTitle;
    axis: BasicChartAxis[];
    domains: ChartRange[];
    series: (ChartRange & { targetAxis: BasicChartAxisPosition })[];
    position: ChartPosition;
}

const pieCharts: PieChart[] = [
    {
        chartId: ChartId.CostByPlayer,
        title: ChartTitle.CostByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.TotalPrice,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 1,
            columnIndex: 0,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
    {
        chartId: ChartId.ValueByPlayer,
        title: ChartTitle.ValueByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.TotalValue,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 1,
            columnIndex: 7,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
    {
        chartId: ChartId.ProfitByPlayer,
        title: ChartTitle.ProfitByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.TotalProfit,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 1,
            columnIndex: 14,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
    {
        chartId: ChartId.MediaDividendsByPlayer,
        title: ChartTitle.MediaDividendsByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.MediaDividends,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 35,
            columnIndex: 0,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
    {
        chartId: ChartId.MatchDayDividendsByPlayer,
        title: ChartTitle.MatchDayDividendsByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.MatchDayDividends,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 35,
            columnIndex: 7,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
    {
        chartId: ChartId.TotalDividendsByPlayer,
        title: ChartTitle.TotalDividendsByPlayer,
        label: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.Name,
        },
        value: {
            sheetId: SheetId.Portfolio,
            columns: portfolioColumns,
            selectedColumn: PortfolioColumn.TotalDividends,
        },
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 35,
            columnIndex: 14,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    },
];

const basicCharts: BasicChart[] = [
    {
        chartId: ChartId.PortfolioValueOverTime,
        chartType: BasicChartType.Area,
        title: ChartTitle.PortfolioValueOverTime,
        axis: [
            {
                position: BasicChartAxisPosition.Bottom,
                title: 'Date',
            },
            {
                position: BasicChartAxisPosition.Left,
                title: 'Value',
            },
        ],
        domains: [
            {
                sheetId: SheetId.DailySummary,
                columns: dailySummaryColumns,
                selectedColumn: DailySummaryColumn.Date,
            },
        ],
        series: [
            {
                sheetId: SheetId.DailySummary,
                columns: dailySummaryColumns,
                selectedColumn: DailySummaryColumn.PortfolioValue,
                targetAxis: BasicChartAxisPosition.Left,
            },
        ],
        position: {
            sheetId: SheetId.Charts,
            rowIndex: 21,
            columnIndex: 0,
            offsetXPixels: 15,
            offsetYPixels: 15,
        },
    }
]

export function getChartRequests(): Schema$Request[] {
    function getAddChartRequest(
        chartId: ChartId,
        position: ChartPosition,
        spec: Schema$ChartSpec,
    ): Schema$AddChartRequest {
        return {
            chart: {
                chartId,
                spec,
                position: {
                    overlayPosition: {
                        anchorCell: {
                            sheetId: position.sheetId,
                            rowIndex: position.rowIndex,
                            columnIndex: position.columnIndex,
                        },
                        offsetXPixels: position.offsetXPixels,
                        offsetYPixels: position.offsetYPixels,
                    },
                },
            },
        };
    }

    function getBasicChartRequest(basicChart: BasicChart): Schema$AddChartRequest {
        return getAddChartRequest(
            basicChart.chartId,
            basicChart.position,
            {
                title: basicChart.title,
                basicChart: {
                    chartType: basicChart.chartType,
                    legendPosition: 'NO_LEGEND',
                    axis: basicChart.axis,
                    domains: basicChart.domains.map(domain => {
                        const columnIndex = getColumnIndex(domain.columns, domain.selectedColumn);
                        return {
                            domain: {
                                sourceRange: {
                                    sources: [
                                        {
                                            sheetId: domain.sheetId,
                                            startRowIndex: 1,
                                            endRowIndex: 999,
                                            startColumnIndex: columnIndex,
                                            endColumnIndex: columnIndex + 1,
                                        },
                                    ],
                                },
                            },
                        };
                    }),
                    series: basicChart.series.map(series => {
                        const columnIndex = getColumnIndex(series.columns, series.selectedColumn);
                        return {
                            series: {
                                sourceRange: {
                                    sources: [
                                        {
                                            sheetId: series.sheetId,
                                            startRowIndex: 1,
                                            endRowIndex: 999,
                                            startColumnIndex: columnIndex,
                                            endColumnIndex: columnIndex + 1,
                                        },
                                    ],
                                },
                            },
                            targetAxis: series.targetAxis,
                        };
                    }),
                },
            },
        );
    }

    function getPieChartRequest(pieChart: PieChart): Schema$AddChartRequest {
        const labelColumnIndex = getColumnIndex(pieChart.label.columns, pieChart.label.selectedColumn);
        const valueColumnIndex = getColumnIndex(pieChart.value.columns, pieChart.value.selectedColumn);
        return getAddChartRequest(
            pieChart.chartId,
            pieChart.position,
            {
                title: pieChart.title,
                pieChart: {
                    legendPosition: 'LABELED_LEGEND',
                    domain: {
                        sourceRange: {
                            sources: [
                                {
                                    sheetId: pieChart.label.sheetId,
                                    startRowIndex: 1,
                                    endRowIndex: 999,
                                    startColumnIndex: labelColumnIndex,
                                    endColumnIndex: labelColumnIndex + 1,
                                },
                            ],
                        },
                    },
                    series: {
                        sourceRange: {
                            sources: [
                                {
                                    sheetId: pieChart.value.sheetId,
                                    startRowIndex: 1,
                                    endRowIndex: 999,
                                    startColumnIndex: valueColumnIndex,
                                    endColumnIndex: valueColumnIndex + 1,
                                },
                            ],
                        },
                    },
                    pieHole: 0.5
                },
            },
        );
    }

    const requests: Schema$Request[] = [];

    for(const pieChart of pieCharts) {
        requests.push({
            addChart: getPieChartRequest(pieChart),
        });
    }
    for(const basicChart of basicCharts) {
        requests.push({
            addChart: getBasicChartRequest(basicChart),
        });
    }

    return requests;
}
