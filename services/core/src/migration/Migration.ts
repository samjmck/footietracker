import { Database } from "../storage/Database";
import { OAuth2Client, Credentials } from 'google-auth-library';

export abstract class Migration {
    constructor(protected database: Database, protected oauth: OAuth2Client) {}

    async migrate(): Promise<void> {
        const validUserSpreadsheetIds = await this.database.getAllValidUserSpreadsheetIds();
        for(const { id: userId, spreadsheet_id: spreadsheetId } of validUserSpreadsheetIds) {
            try {
                console.log(`Starting migration for user with ID ${userId}`);
                const credentials = await this.database.getCredentials(userId);
                if(credentials === null) {
                    console.log(`Could not get credentials`);
                    continue;
                }
                await this.migrateSpreadsheet(credentials, spreadsheetId);
                console.log('Finished migration\n\n');
            } catch(err) {
                console.log('Could not migrate')
                console.log(err);
            }
        }
    }

    protected abstract async migrateSpreadsheet(credentials: Credentials, spreadsheetId: string): Promise<void>;
}
