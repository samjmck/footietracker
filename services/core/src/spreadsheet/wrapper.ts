import { google, sheets_v4 } from 'googleapis';
import { Credentials, OAuth2Client } from 'google-auth-library';
import Resource$Spreadsheets = sheets_v4.Resource$Spreadsheets;
import { Column, getColumnLetter } from "./constants/columns";

export type Spreadsheets = Resource$Spreadsheets;

export function getSpreadsheetsObject(auth: OAuth2Client, credentials: Credentials): Spreadsheets {
    auth.setCredentials(credentials);
    return google.sheets({ version: 'v4', auth }).spreadsheets;
}

export interface Sheet {
    name: string;
    id: number;
}

export async function createSpreadsheet(
    oauth: OAuth2Client,
    credentials: Credentials,
    title: string,
    sheets: Sheet[],
): Promise<{ spreadsheetId: string; sheetIds: number[]; } | null> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    const { data } = await spreadsheets.create({
        auth: oauth,
        requestBody: {
            properties: {
                title,
            },
            sheets: sheets.map(sheet => ({
                properties: {
                    title: sheet.name,
                    sheetId: sheet.id,
                },
            })),
        },
    });
    if(data.spreadsheetId && data.sheets) {
        return {
            spreadsheetId: data.spreadsheetId,
            sheetIds: data.sheets.map(sheet => (sheet.properties && sheet.properties.sheetId) ? sheet.properties.sheetId : -1),
        };
    }
    return null;
}

export async function removeSheet(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    ...sheetIds: number[]
): Promise<void> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    await spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: sheetIds.map(sheetId => ({
                deleteSheet: {
                    sheetId,
                },
            }))
        },
    }, {});
}

export async function addSheet(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    ...titles: string[]
): Promise<number[]> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    const { data } = await spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: titles.map(title => ({
                addSheet: {
                    properties: {
                        title,
                    },
                },
            })),
        },
    }, {});
    if(data.replies === undefined) {
        throw new Error(`replies property of response for batchUpdate with addSheet request was undefined`);
    }
    const sheetIds: number[] = [];
    for(const reply of data.replies) {
        if(reply.addSheet && reply.addSheet.properties && reply.addSheet.properties.sheetId) {
            sheetIds.push(reply.addSheet.properties.sheetId);
        }
    }
    return sheetIds;
}

export enum MajorDimension {
    Rows = 'ROWS',
    Columns = 'COLUMNS',
}

export interface UpdateRequest {
    sheet: string;
    range: string;
    values: any[][];
}

export async function clearValues(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    sheet: string,
    range: string,
): Promise<void> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    await spreadsheets.values.clear({
        spreadsheetId,
        range: `'${sheet}'!${range}`,
    }, {});
}

export async function updateValues(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    updateRequests: UpdateRequest[],
    majorDimension = MajorDimension.Rows,
): Promise<void> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    await spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updateRequests.map(({ sheet, range, values }) => ({
                majorDimension,
                range: `'${sheet}'!${range}`,
                values,
            })),
        },
    }, {});
}

export async function appendValues(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    sheet: string,
    values: any[][],
    majorDimension = MajorDimension.Rows,
): Promise<void> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    const range = `'${sheet}'!A:A`;
    await spreadsheets.values.append({
        spreadsheetId,
        insertDataOption: 'INSERT_ROWS',
        valueInputOption: 'USER_ENTERED',
        range: `'${sheet}'!A:A`,
        requestBody: {
            majorDimension,
            range,
            values,
        },
    }, {});
}

export async function getValues(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
    ranges: string[],
    majorDimension = MajorDimension.Rows,
): Promise<any[][][] | null> {
    const spreadsheets = getSpreadsheetsObject(oauth, credentials);
    const { data } = await spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
        majorDimension,
        valueRenderOption: 'UNFORMATTED_VALUE',
    }, {});

    if(data.valueRanges) {
        const results: any[][][] = [];
        for(const valueRange of data.valueRanges) {
            if(valueRange.values) {
                results.push(valueRange.values);
            }
        }
        return results;
    }
    return null;
}

export function getUpdateRequests<TColumns extends Column>(
    sheet: string,
    columns: Column[],
    requests: {
        columnName: TColumns;
        values: any[];
    }[],
): UpdateRequest[] {
    const updateRequests: UpdateRequest[] = [];
    for(const {columnName, values} of requests) {
        const columnLetter = getColumnLetter(columns, columnName);
        updateRequests.push({
            sheet,
            range: `${columnLetter}2:${columnLetter}`,
            values: values.map(value => [value]),
        });
    }
    return updateRequests;
}
