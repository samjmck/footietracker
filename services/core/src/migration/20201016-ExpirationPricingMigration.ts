import { Migration } from "./Migration";
import { Credentials } from "google-auth-library";
import { addSheet, getSpreadsheetsObject, updateValues } from "../spreadsheet/wrapper";
import { SheetId, SheetName } from "../spreadsheet/constants/sheets";
import {
    dailySummaryColumns,
    defaultOverviewValues, defaultVariables, dividendsColumns, expiringColumns,
    overviewColumns,
    portfolioColumns, variablesColumns, watchlistColumns
} from "../spreadsheet/constants/columns";
import { sheets_v4 } from "googleapis";
import {
    getBoldHeaderRequests,
    getFormattingRequests, getFreezeRequests,
    getHiddenColumnRequests
} from "../spreadsheet/constants/formatting";
import { ChartId, getChartRequests } from "../spreadsheet/constants/charts";

export class ExpirationPricingMigration extends Migration {
    protected async migrateSpreadsheet(credentials: Credentials, spreadsheetId: string): Promise<void> {
        const spreadsheets = getSpreadsheetsObject(this.oauth, credentials);

        const range = 'A1';
        await updateValues(
            this.oauth,
            credentials,
            spreadsheetId,
            [
                {
                    sheet: SheetName.Expiring,
                    range,
                    values: [expiringColumns],
                },
                {
                    sheet: SheetName.Variables,
                    range,
                    values: [variablesColumns, defaultVariables],
                },
            ],
        );

        // for(let i = 0; i < 15; i++) {
        //     try {
        //         await spreadsheets.batchUpdate({
        //             spreadsheetId,
        //             requestBody: {
        //                 requests: [{
        //                     deleteConditionalFormatRule: {
        //                         sheetId: SheetId.Portfolio,
        //                         index: i,
        //                     }
        //                 }]
        //             },
        //         });
        //     } catch(error) {
        //         console.log(`conditional format rule index ${i} does not exist`);
        //     }
        // }

        const requests: sheets_v4.Schema$Request[] = [
            ...getFormattingRequests(),
            ...getBoldHeaderRequests(),
        ];
        await spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests,
            },
        });
    }
}
