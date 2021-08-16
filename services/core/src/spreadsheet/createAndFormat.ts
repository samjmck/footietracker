import { Credentials, OAuth2Client } from 'google-auth-library';
import { createSpreadsheet, getSpreadsheetsObject, updateValues } from "./wrapper";
import { fixedHeaderSheetIds, SheetId, SheetName, sheets } from "./constants/sheets";
import {
    getBoldHeaderRequests,
    getFormattingRequests,
    getFreezeRequests,
    getHiddenColumnRequests
} from "./constants/formatting";
import { getChartRequests } from "./constants/charts";
import {
    dailySummaryColumns,
    defaultOverviewValues, defaultVariables, dividendsColumns, expiringColumns,
    overviewColumns,
    portfolioColumns, variablesColumns, watchlistColumns
} from "./constants/columns";
import { sheets_v4 } from "googleapis";

export async function createFootietrackerSpreadsheet(oauth: OAuth2Client, credentials: Credentials): Promise<string | null> {
    const data = await createSpreadsheet(oauth, credentials, 'Footietracker', sheets);

    if(data === null) {
        return null;
    }

    const { spreadsheetId } = data;

    return spreadsheetId;
}

export async function formatSpreadsheet(oauth: OAuth2Client, credentials: Credentials, spreadsheetId: string) {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);

    const range = 'A1';
    await updateValues(
        oauth,
        credentials,
        spreadsheetId,
        [
            {
                sheet: SheetName.Overview,
                range,
                values: [overviewColumns, defaultOverviewValues],
            },
            {
                sheet: SheetName.Portfolio,
                range,
                values: [portfolioColumns],
            },
            {
                sheet: SheetName.DailySummary,
                range,
                values: [dailySummaryColumns],
            },
            {
                sheet: SheetName.Expiring,
                range,
                values: [expiringColumns],
            },
            {
                sheet: SheetName.Dividends,
                range,
                values: [dividendsColumns],
            },
            {
                sheet: SheetName.Watchlist,
                range,
                values: [watchlistColumns],
            },
            {
                sheet: SheetName.Variables,
                range,
                values: [variablesColumns, defaultVariables],
            },
        ],
    );

    const requests: sheets_v4.Schema$Request[] = [
        ...getFormattingRequests(),
        ...getBoldHeaderRequests(),
        ...getChartRequests(),
        ...getHiddenColumnRequests(),
        ...getFreezeRequests(),
    ];
    await spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests,
        },
    });
}

export async function createAndFormatFootietrackerSpreadsheet(oauth: OAuth2Client, credentials: Credentials): Promise<string | null> {
    const spreadsheetId = await createFootietrackerSpreadsheet(oauth, credentials);
    if(spreadsheetId === null) {
        return null;
    }
    await formatSpreadsheet(oauth, credentials, spreadsheetId);
    return spreadsheetId;
}
