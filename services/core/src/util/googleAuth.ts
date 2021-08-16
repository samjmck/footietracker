import { Credentials, OAuth2Client } from "google-auth-library";

export function getAuthUrl(auth: OAuth2Client): string {
    return auth.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
        prompt: 'consent',
    });
}

export async function getCredentials(auth: OAuth2Client, code: string): Promise<Credentials | null> {
    return (await auth.getToken(code)).tokens;
}
