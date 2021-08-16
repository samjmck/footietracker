import { Responder } from "cote";
import { Cache } from "../footballindex/cache";
import { Database } from "../footballindex/database";
import {
    DividendsRequest,
    GetBuzzRequest,
    GetMediaDividendsPayoutRequest
} from "../../../../shared/service/dividends/service";
import { ServiceType } from "../../../../shared/service/ServiceType";
import {
    getMediaDividendsPayout,
    getPerformanceDividendsPayout
} from "../../../../shared/service/dividends/dividendCalculator";
import { discoveryOptions } from "../../../../shared/backend/src/service/discoveryOptions";
import { getMatchCount, getMediaBuzzScoreboard, getPerformanceBuzzScoreboard } from "../footballindex/scraper";
import { ServiceKey } from "../../../../shared/service/ServiceKey";

let responder: Responder;
export function getResponder(cache: Cache, database: Database): Responder {
    if(responder) {
        return responder;
    }

    responder = new Responder({
        name: ServiceType.DividendsResponder,
        key: ServiceKey.DividendsRequester,
        respondsTo: [
            DividendsRequest.GetBuzz,
            DividendsRequest.GetMediaDividendsPayout,
            DividendsRequest.GetPerformanceDividendsPayout,
            DividendsRequest.GetDividendsPayout,
        ]
    }, discoveryOptions);

    responder.on(DividendsRequest.GetBuzz, async ({ buzzType, playerId, time, endTime }: GetBuzzRequest) => {
        const cachedBuzz = await cache.getBuzz(buzzType, playerId, time, endTime);
        if(Object.keys(cachedBuzz).length > 0) {
            return cachedBuzz;
        }
        return database.getBuzz(buzzType, playerId, time, endTime)
    });

    responder.on(DividendsRequest.GetMediaDividendsPayout, async ({ params }: GetMediaDividendsPayoutRequest) => {
        let realMatchCount: number;
        if(params !== undefined && params.matchCount !== undefined) {
            realMatchCount = params.matchCount;
        } else {
            realMatchCount = await getMatchCount();
        }
        return getMediaDividendsPayout(realMatchCount, await getMediaBuzzScoreboard(params !== undefined ? params.time : undefined));
    });

    responder.on(DividendsRequest.GetPerformanceDividendsPayout, async () => {
        return getPerformanceDividendsPayout(await getMatchCount(), await getPerformanceBuzzScoreboard());
    });

    responder.on(DividendsRequest.GetDividendsPayout, async () => {
        const matchCount = await getMatchCount();
        const [mediaBuzzScoreboard, performanceBuzzScoreboard] = await Promise.all([await cache.getLatestMediaBuzzScoreboard(), await cache.getLatestPerformanceBuzzScoreboard()]);

        return [
            mediaBuzzScoreboard !== null ? getMediaDividendsPayout(matchCount, mediaBuzzScoreboard) : {},
            performanceBuzzScoreboard !== null ? getPerformanceDividendsPayout(matchCount, performanceBuzzScoreboard) : {},
        ];
    });

    return responder;
}
