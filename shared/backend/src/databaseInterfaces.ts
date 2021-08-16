export interface User {
    id: number;
    email: string;
    hash: string;
    spreadsheet_id: string;
    stripe_customer_id: string;
    subscription_end: number;
    google_credentials: GoogleSpreadsheetCredentials;
}

export interface GoogleSpreadsheetCredentials {
    refresh_token?: string | null;
    expiry_date?: number | null;
    access_token?: string | null;
    token_type?: string | null;
    id_token?: string | null;
    scope?: string | null;
}
