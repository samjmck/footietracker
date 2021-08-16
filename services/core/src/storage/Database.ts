import { Client } from "pg";
import { Credentials } from 'google-auth-library';

export interface User {
    id: number;
    email: string;
    hash: string;
    spreadsheet_id: string;
    stripe_customer_id: string;
    subscription_end: number;
    google_credentials: Credentials;
}

export class Database {
    constructor(private client: Client) {}

    async createUser(email: string, stripeCustomerId: string, hash: string): Promise<User> {
        const result = await this.client.query<User>('INSERT INTO users (email, stripe_customer_id, hash) VALUES($1, $2, $3) RETURNING *', [email, stripeCustomerId, hash]);
        return result.rows[0];
    }

    async setCredentials(userId: number, credentials: Credentials): Promise<void> {
        await this.client.query('UPDATE users SET google_credentials = $1 WHERE id = $2', [credentials, userId]);
    }

    async getCredentials(userId: number): Promise<Credentials | null> {
        const result = await this.client.query<User> ('SELECT google_credentials FROM users WHERE id = $1', [userId]);
        if(result.rowCount > 0) {
            return result.rows[0].google_credentials;
        }
        return null;
    }

    async getAllCredentials(): Promise<Credentials[]> {
        const result = await this.client.query<User> ('SELECT google_credentials FROM user');
        return result.rows.map(({ google_credentials }) => google_credentials);
    }

    async getUser(identifier: { id?: number; email?: string }): Promise<User | null> {
        const columnName = identifier.id !== undefined ? 'id' : 'email';
        const query = `SELECT * FROM users WHERE ${columnName} = $1`;
        const result = await this.client.query<User> (query, [identifier.id ?? identifier.email]);
        return result.rows[0] ?? null;
    }

    async updateUserHash(id: number, hash: string): Promise<void> {
        await this.client.query('UPDATE users SET hash = $1 WHERE id = $2', [hash, id]);
    }

    async updateUserEmail(id: number, email: string): Promise<void> {
        await this.client.query('UPDATE users SET email = $1 WHERE id = $2', [email, id]);
    }

    async setUserIsEmailVerified(id: number): Promise<void> {
        await this.client.query('UPDATE users SET is_email_verified = true WHERE id = $1', [id]);
    }

    async updateUserSubscriptionEnd(customerId: string, endTime: number): Promise<void> {
        await this.client.query('UPDATE users SET subscription_end = $1 WHERE stripe_customer_id = $2', [endTime, customerId]);
    }

    async setSpreadsheetId(userId: number, spreadsheetId: string): Promise<void> {
        await this.client.query('UPDATE users SET spreadsheet_id = $1 WHERE id = $2', [spreadsheetId, userId]);
    }

    async getSpreadsheetId(userId: number): Promise<string | null> {
        const result = await this.client.query<User> ('SELECT spreadsheet_id FROM users WHERE id = $1', [userId]);
        if(result.rowCount > 0) {
            return result.rows[0].spreadsheet_id;
        }
        return null;
    }

    async getAllUserSpreadsheetIds(): Promise<Pick<User, "id" | "spreadsheet_id">[]> {
        const result = await this.client.query<User> ('SELECT id, spreadsheet_id FROM users');
        return result.rows.map(user => ({ id: user.id, spreadsheet_id: user.spreadsheet_id }));
    }

    async getAllValidUserSpreadsheetIds(): Promise<Pick<User, "id" | "spreadsheet_id">[]> {
        const result = await this.client.query<User> ('SELECT id, spreadsheet_id FROM users WHERE subscription_end > $1 AND subscription_end IS NOT NULL AND spreadsheet_id IS NOT NULL', [Date.now()]);
        return result.rows.map(user => ({ id: user.id, spreadsheet_id: user.spreadsheet_id }));
    }
}
