import { Migration } from "./Migration";
import { Credentials } from "google-auth-library";
import { formatSpreadsheet } from "../spreadsheet/createAndFormat";
import { getSpreadsheetsObject, updateValues } from "../spreadsheet/wrapper";
import { SheetId, SheetName } from "../spreadsheet/constants/sheets";
import {
    dailySummaryColumns,
    defaultOverviewValues, defaultVariables, expiringColumns,
    overviewColumns,
    portfolioColumns, variablesColumns, watchlistColumns
} from "../spreadsheet/constants/columns";
import { sheets_v4 } from "googleapis";
import {
    getBoldHeaderRequests,
    getFormattingRequests, getFreezeRequests,
    getHiddenColumnRequests
} from "../spreadsheet/constants/formatting";
import { getChartRequests } from "../spreadsheet/constants/charts";

export class MidPriceMigration extends Migration {
    protected async migrateSpreadsheet(credentials: Credentials, spreadsheetId: string): Promise<void> {
        const spreadsheets = getSpreadsheetsObject(this.oauth, credentials);

        const range = 'A1';
        await updateValues(
            this.oauth,
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

        for(let i = 0; i < 15; i++) {
            try {
                await spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            deleteConditionalFormatRule: {
                                sheetId: SheetId.Portfolio,
                                index: i,
                            }
                        }]
                    },
                });
            } catch(error) {
                console.log(`conditional format rule index ${i} does not exist`);
            }
        }

        const requests: sheets_v4.Schema$Request[] = [
            ...getFormattingRequests(),
            ...getBoldHeaderRequests(),
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
}
