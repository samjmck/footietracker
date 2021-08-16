import { BuzzType } from "./enums";

export enum DividendsRequest {
    GetBuzz = 'GetBuzz',
    GetMediaDividendsPayout = 'GetMediaDividendsPayout',
    GetPerformanceDividendsPayout = 'GetPerformanceDividendsPayout',
    GetDividendsPayout = 'GetDividendsPayout',
}

export enum DividendsEvent {
    MediaBuzzUpdated = 'MediaBuzzUpdated',
    PerformanceBuzzUpdated = 'PerformanceBuzzUpdated',
}

export interface GetBuzzRequest {
    buzzType: BuzzType,
    playerId: string,
    time: number,
    endTime?: number,
}

export interface GetMediaDividendsPayoutRequest {
    params?: {
        time: number;
        matchCount: number;
    };
}
