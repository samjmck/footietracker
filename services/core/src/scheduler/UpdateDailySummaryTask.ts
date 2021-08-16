import { BaseTask } from "./BaseTask";
import { OAuth2Client } from 'google-auth-library';
import { getDailySummary } from "../spreadsheet/spreadsheet";
import { appendValues, updateValues } from "../spreadsheet/wrapper";
import { Database } from "../storage/Database";
import { SheetName } from "../spreadsheet/constants/sheets";
import { dailySummaryColumns, getColumnLetterFromIndex } from "../spreadsheet/constants/columns";
import { logger } from "../util/logger";

export class UpdateDailySummaryTask extends BaseTask {
    constructor(
        expression: string,
        private oauth: OAuth2Client,
        private database: Database,
    ) {
        super(expression);
    }

    protected async doTask(): Promise<void> {
        const userSpreadsheetIds = await this.database.getAllUserSpreadsheetIds();
        for(const { id: userId, spreadsheet_id: spreadsheetId } of userSpreadsheetIds) {
            try {
                logger.info({ message: 'Updating daily summary', userId });
                const credentials = await this.database.getCredentials(userId);
                if(credentials === null) {
                    logger.error({ message: 'Could not get credentials', userId });
                    continue;
                }

                const dailySummary = await getDailySummary(this.oauth, credentials, spreadsheetId);
                if(dailySummary === null) {
                    logger.error({ message: 'Could not get daily summary data', userId });
                    continue;
                }

                if(dailySummary.isFirstDailySummary) {
                    await updateValues(
                        this.oauth,
                        credentials,
                        spreadsheetId,
                        [{
                            sheet: SheetName.DailySummary,
                            range: `A2:A${getColumnLetterFromIndex(dailySummaryColumns.length - 1)}`,
                            values: [[
                                `=(${Date.now() - 24 * 60 * 60 * 1000} / 1000 / 86400) + DATE(1970, 1, 1)`,
                                dailySummary.totalValue,
                                dailySummary.change,
                                0,
                                dailySummary.percentageChange,
                                dailySummary.mediaDividends,
                                dailySummary.matchDayDividends,
                            ]]
                        }],
                    );
                } else {
                    await appendValues(
                        this.oauth,
                        credentials,
                        spreadsheetId,
                        SheetName.DailySummary,
                        [[
                            `=(${Date.now() - 24 * 60 * 60 * 1000} / 1000 / 86400) + DATE(1970, 1, 1)`,
                            dailySummary.totalValue,
                            dailySummary.change,
                            0,
                            dailySummary.percentageChange,
                            dailySummary.mediaDividends,
                            dailySummary.matchDayDividends,
                        ]],
                    );
                }
                logger.info({ message: 'Added daily summary', userId });
            } catch(error) {
                logger.info({ message: 'Could not add daily summary', error, userId });
            }
        }
    }
}
