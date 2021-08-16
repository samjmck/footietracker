import { BuyAndSellPrice } from "../../../../shared/backend/src/service/pricing/interfaces";
import { makeRequest, RequestMethod } from "../../../../shared/backend/src/util/request";
import { logger } from "./logger";

const lastUpdateTimes: {[playerId: string]: number} = {};

export async function getCurrentPriceFromSite(playerId: string): Promise<BuyAndSellPrice | null> {
    const lastUpdateTime = lastUpdateTimes[playerId.toLowerCase()];

    // Check if the last update was less than an hour ago
    // If it is, do not make the request and just return null
    // This is to prevent unnecessary requests to Football Index servers
    if(lastUpdateTime !== undefined && Date.now() - lastUpdateTime < 3600000) {
        return null;
    }

    logger.info({ message: 'Getting price data from site', playerId });

    lastUpdateTimes[playerId] = Date.now();

    try {
        const { statusCode, result } = await makeRequest<{ score: number, scoreSell: number }> (`https://api-prod.footballindex.co.uk/football.all/${playerId}`, { method: RequestMethod.GET, parseJSONResponse: true });
        if(result !== undefined && statusCode !== 404) {
            const time = Date.now();
            const { score, scoreSell } = result;
            const buyPrice = Math.round(score * 100);
            const sellPrice = Math.round(scoreSell * 100);

            return {
                buy: {
                    price: buyPrice,
                    time,
                },
                sell: {
                    price: sellPrice,
                    time,
                },
            };
        }
    } catch(error) {
        return null;
    }
    return null;
}
