import { Portfolio } from "./interfaces";

export interface SendCodeRequest {
    userId: number;
    code: string;
}

export interface SendCodeResponse {
    spreadsheetId: string | null;
}

export interface SendPortfolioRequest {
    userId: number;
    portfolio: Portfolio;
}

export interface SendPortfolioResponse {
    error: string | null;
}
