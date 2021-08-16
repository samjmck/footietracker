import * as moment from "moment";
import { Moment } from "moment";
import { makeRequest, RequestMethod } from "../../../../shared/backend/src/util/request";
import { BuzzScoreboard, PerformanceBuzzScoreboard } from "../../../../shared/service/dividends/interfaces";
import { PlayerPosition } from "../../../../shared/service/dividends/enums";

interface MediaBuzzResponse {
    count: number;
    items: {
        id: string;
        score: number;
    }[];
    page: number;
    per_page: number;
    total: number;
}

export async function getMediaBuzzScoreboard(buzzDayTime?: number): Promise<BuzzScoreboard> {
    const usingMoment: Moment = moment(buzzDayTime) ? moment(buzzDayTime) : moment();
    const formattedTime = usingMoment.format('YYYYMMDD');

    const headers = {
        'Access-Control-Request-Headers': 'x-access-token,x-website-type',
        'Access-Control-Request-Method': 'GET',
        'Origin': 'https://www.footballindex.co.uk',
        'Referer': 'https://www.footballindex.co.uk/stockmarket/buzz',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    };

    const { result } = await makeRequest<MediaBuzzResponse> (`https://api-prod.footballindex.co.uk/buzzmedia/rankedpage/footballuk.all:${formattedTime}`, {
        method: RequestMethod.GET,
        parseJSONResponse: true,
        headers,
        query: {
            page: 1,
            per_page: 1,
        },
    });

    if(result !== undefined) {
        const { result: nextResult } = await makeRequest<MediaBuzzResponse> (`https://api-prod.footballindex.co.uk/buzzmedia/rankedpage/footballuk.all:${formattedTime}`, {
            method: RequestMethod.GET,
            parseJSONResponse: true,
            headers,
            query: {
                page: 1,
                per_page: result.total,
            },
        });

        if(nextResult) {
            const { items } = nextResult;

            const scoreboard: BuzzScoreboard = {};

            for(const { id, score } of items) {
                scoreboard[id] = score;
            }

            return scoreboard;
        }

        throw new Error('nextResult is undefined');
    }

    throw new Error('result is undefined');
}

interface PerformanceBuzzResponse {
    count: number;
    items: {
        id: string;
        rank: number;
        score: number;
        sectorRank: number;
        sector: PlayerPosition;
    }[];
    page: number;
    per_page: number;
    total: number;
}

export async function getPerformanceBuzzScoreboard(): Promise<PerformanceBuzzScoreboard> {
    const headers = {
        'Access-Control-Request-Headers': 'x-access-token,x-website-type',
        'Access-Control-Request-Method': 'GET',
        'Origin': 'https://www.footballindex.co.uk',
        'Referer': 'https://www.footballindex.co.uk/stockmarket/buzz',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    };

    const { result } = await makeRequest<PerformanceBuzzResponse> ('https://api-prod.footballindex.co.uk/football.perfomancebuzz.all', {
        method: RequestMethod.GET,
        parseJSONResponse: true,
        headers,
        query: {
            page: 1,
            per_page: 1,
            sort: 'asc',
        },
    });

    if(result !== undefined) {
        const { result: nextResult } = await makeRequest<PerformanceBuzzResponse> (`https://api-prod.footballindex.co.uk/football.perfomancebuzz.all`, {
            method: RequestMethod.GET,
            parseJSONResponse: true,
            headers,
            query: {
                page: 1,
                per_page: result.total,
                sort: 'asc',
            },
        });

        if(nextResult) {
            const { items } = nextResult;

            const result: PerformanceBuzzScoreboard = {
                [PlayerPosition.Forward]: {},
                [PlayerPosition.Midfielder]: {},
                [PlayerPosition.Defender]: {},
                [PlayerPosition.Goalkeeper]: {},
                all: {},
            };

            for(const { score, sector, id } of items) {
                result[sector][id] = score;
                result.all[id] = score;
            }

            return result;
        }

        throw new Error('nextResult is undefined');
    }

    throw new Error('result is undefined');
}

const tournamentNames = [
    'Premier League',
    'LaLiga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
];

interface SofaScoreFootballResponse {
    sportItem: {
        tournaments: {
            tournament: {
                name: string;
                slug: string;
            };
            events: {
                formatedStartDate: string;
            }[];
        }[];
    };
}

export async function getMatchCount(time?: number): Promise<number> {
    const momentTime = time === undefined ? moment() : moment(time);
    const { result } = await makeRequest<SofaScoreFootballResponse> (`https://www.sofascore.com/football//${momentTime.format('YYYY-MM-DD')}/json?_=157220228`, {
        method: RequestMethod.GET,
        parseJSONResponse: true,
    });

    let matchCount = 0;

    if(result === undefined) {
        return matchCount;
    }

    const formattedStartDate = momentTime.format('DD.MM.YYYY.');

    for(const tournament of result.sportItem.tournaments) {
        if(tournamentNames.indexOf(tournament.tournament.name) > -1) {
            for(const event of tournament.events) {
                if(event.formatedStartDate === formattedStartDate) {
                    matchCount++;
                }
            }
        }
    }

    return matchCount;
}
