import { BuzzScoreboard, PerformanceBuzzScoreboard } from "./interfaces";
import { PlayerPosition } from "./enums";

type DividendPayoutRate = [number, number];
//                         ranking payout

// https://www.footballindex.academy/match-day-dividends/

enum MatchDayDividendType {
    Forward,
    Midfielder,
    Defender,
    Star,
    Media,
}

interface TotalDividendPayoutRate {
    [MatchDayDividendType.Forward]: DividendPayoutRate;
    [MatchDayDividendType.Midfielder]: DividendPayoutRate;
    [MatchDayDividendType.Defender]: DividendPayoutRate;
    [MatchDayDividendType.Star]: DividendPayoutRate;
    [MatchDayDividendType.Media]: DividendPayoutRate[];
}

export function getDividendPayoutRate(matchCount: number): TotalDividendPayoutRate {
    if(matchCount >= 15) {
        return {
            [MatchDayDividendType.Forward]: [0, 5],
            [MatchDayDividendType.Midfielder]: [0, 5],
            [MatchDayDividendType.Defender]: [0, 5],
            [MatchDayDividendType.Star]: [0, 2],
            [MatchDayDividendType.Media]: [[0, 2]],
        };
    }
    if(matchCount >= 5) {
        return {
            [MatchDayDividendType.Forward]: [0, 3],
            [MatchDayDividendType.Midfielder]: [0, 3],
            [MatchDayDividendType.Defender]: [0, 3],
            [MatchDayDividendType.Star]: [0, 2],
            [MatchDayDividendType.Media]: [[0, 2]],
        };
    }
    if(matchCount >= 1) {
        return {
            [MatchDayDividendType.Forward]: [0, 2],
            [MatchDayDividendType.Midfielder]: [0, 2],
            [MatchDayDividendType.Defender]: [0, 2],
            [MatchDayDividendType.Star]: [0, 1],
            [MatchDayDividendType.Media]: [[0, 2]],
        };
    }

    return {
        [MatchDayDividendType.Forward]: [0, 2],
        [MatchDayDividendType.Midfielder]: [0, 2],
        [MatchDayDividendType.Defender]: [0, 2],
        [MatchDayDividendType.Star]: [0, 1],
        [MatchDayDividendType.Media]: [
            [0, 3],
            [1, 2],
            [2, 1],
        ],
    };
}

enum InPlayDividendType {
    Goal,
    Assist,
    CleanSheet,
}

enum InPlayDividendPosition {
    Forward,
    Midfielder,
    Defender,
    Goalkeeper,
}

interface InPlayDividendPositionPayoutRate {
    [InPlayDividendPosition.Forward]: number;
    [InPlayDividendPosition.Midfielder]: number;
    [InPlayDividendPosition.Defender]: number;
    [InPlayDividendPosition.Goalkeeper]: number;
}

interface InPlayDividendPayoutRate {
    [InPlayDividendType.Goal]: InPlayDividendPositionPayoutRate;
    [InPlayDividendType.Assist]: InPlayDividendPositionPayoutRate;
    [InPlayDividendType.CleanSheet]: InPlayDividendPositionPayoutRate;
}

export function getInPlayDividendPayoutRate(): InPlayDividendPayoutRate {
    return {
        [InPlayDividendType.Goal]: {
            [InPlayDividendPosition.Forward]: 1,
            [InPlayDividendPosition.Midfielder]: 1,
            [InPlayDividendPosition.Defender]: 2,
            [InPlayDividendPosition.Goalkeeper]: 2,
        },
        [InPlayDividendType.Assist]: {
            [InPlayDividendPosition.Forward]: 1,
            [InPlayDividendPosition.Midfielder]: 1,
            [InPlayDividendPosition.Defender]: 1,
            [InPlayDividendPosition.Goalkeeper]: 1,
        },
        [InPlayDividendType.CleanSheet]: {
            [InPlayDividendPosition.Forward]: 0,
            [InPlayDividendPosition.Midfielder]: 0,
            [InPlayDividendPosition.Defender]: 0,
            [InPlayDividendPosition.Goalkeeper]: 1,
        },
    };
}

export interface DividendsPayout {
    [playerId: string]: number;
}

export function getMediaDividendsPayout(matchCount: number, scoreboard: BuzzScoreboard): DividendsPayout {
    const rates = getDividendPayoutRate(matchCount)[MatchDayDividendType.Media];
    const payout: DividendsPayout = {};
    let rank = 0;
    const playerIds = Object.keys(scoreboard);
    for(const [rank, rate] of rates) {
        if(playerIds[rank] !== undefined) {
            payout[playerIds[rank]] = rate;
        }
    }
    return payout;
}

export interface Performance {
    goals: number;
    assists: number;
    isCleanSheet: boolean;
}

export function getInPlayDividendsPayout(position: InPlayDividendPosition, performance: Performance): number {
    const rate = getInPlayDividendPayoutRate();

    return rate[InPlayDividendType.Goal][position] * performance.goals +
        rate[InPlayDividendType.Assist][position] * performance.assists +
        rate[InPlayDividendType.CleanSheet][position] * (performance.isCleanSheet ? 1 : 0);
}

export function getPerformanceDividendsPayout(matchCount: number, scoreboard: PerformanceBuzzScoreboard): DividendsPayout {
    const rates = getDividendPayoutRate(matchCount);
    let payout: DividendsPayout = {};

    const forwardPlayerIds = Object.keys(scoreboard[PlayerPosition.Forward]);
    const midfielderPlayerIds = Object.keys(scoreboard[PlayerPosition.Midfielder]);
    const defenderPlayerIds = Object.keys(scoreboard[PlayerPosition.Defender]);

    if(forwardPlayerIds.length > 0) {
        payout[forwardPlayerIds[0]] = rates[MatchDayDividendType.Forward][1];
    }
    if(midfielderPlayerIds.length > 0) {
        payout[midfielderPlayerIds[0]] = rates[MatchDayDividendType.Midfielder][1];
    }
    if(defenderPlayerIds.length > 0) {
        payout[defenderPlayerIds[0]] = rates[MatchDayDividendType.Defender][1];
    }

    return payout;
}
