import { BaseTask } from "./BaseTask";
import { OAuth2Client } from 'google-auth-library';
import { getPlayerIds, updateSpreadsheet } from "../spreadsheet/spreadsheet";
import { Database } from "../storage/Database";
import { PricingCache } from "../storage/PricingCache";
import { BuyAndSellPrice } from "../../../../shared/backend/src/service/pricing/interfaces";
import { getCurrentPriceFromSite } from "../util/footballindex";
import { logger } from "../util/logger";

interface SpreadsheetsResponse {
    currentPrices: { [playerId: string]: BuyAndSellPrice | null };
    dayChanges: { [playerId: string]: number };
    weekChanges: { [playerId: string]: number };
    monthChanges: { [playerId: string]: number };
}

const forceOneTimeUpdatePlayerIds: string[] = [];

export class UpdatePricesTask extends BaseTask {
    constructor(
        expression: string,
        private oauth: OAuth2Client,
        private pricingCache: PricingCache,
        private database: Database,
    ) {
        super(expression);
    }

    protected async doTask(): Promise<void> {
        const userSpreadsheetIds = await this.database.getAllValidUserSpreadsheetIds();
        for(const { id: userId, spreadsheet_id: spreadsheetId } of userSpreadsheetIds) {
            try {
                logger.info({ message: 'Updating prices', userId });
                const credentials = await this.database.getCredentials(userId);
                if(credentials === null) {
                    logger.error({ message: 'Could not get credentials', userId });
                    continue;
                }

                const playerIdsResult = await getPlayerIds(this.oauth, credentials, spreadsheetId);
                if(playerIdsResult === null) {
                    logger.error({ message: 'Could not get player IDs', userId });
                    continue;
                }
                const { portfolioPlayerIds, watchlistPlayerIds } = playerIdsResult;

                const spreadsheetData = await this.getSpreadsheetData(
                    [...new Set([...portfolioPlayerIds, ...watchlistPlayerIds])],
                    portfolioPlayerIds,
                );

                const sellPrices: number[] = [];
                const buyPrices: number[] = [];
                const watchlistBuyPrices: number[] = [];
                for(const playerId of portfolioPlayerIds) {
                    const price = spreadsheetData.currentPrices[playerId];
                    if(price === null) {
                        sellPrices.push(0);
                        buyPrices.push(0);
                    } else {
                        sellPrices.push(price.sell.price);
                        buyPrices.push(price.buy.price);
                    }
                }
                for(const playerId of watchlistPlayerIds) {
                    const price = spreadsheetData.currentPrices[playerId];
                    if(price === null) {
                        watchlistBuyPrices.push(0);
                    } else {
                        watchlistBuyPrices.push(price.buy.price);
                    }
                }
                const dayChanges: number[] = [];
                const weekChanges: number[] = [];
                const monthChanges: number[] = [];
                for(const playerId in spreadsheetData.dayChanges) {
                    dayChanges.push(spreadsheetData.dayChanges[playerId]);
                    weekChanges.push(spreadsheetData.weekChanges[playerId]);
                    monthChanges.push(spreadsheetData.monthChanges[playerId]);
                }

                // const [mediaDividendsPayout, performanceDividendsPayout]: [DividendsPayout, DividendsPayout] = await this.dividendsRequester.send({
                //     type: DividendsRequest.GetDividendsPayout,
                // });
                //
                // const mediaDividendsPayout: DividendsPayout = {};
                // const performanceDividendsPayout: DividendsPayout = {};

                const sortedMediaDividendsPayout: number[] = [];
                const sortedPerformanceDividendsPayout: number[] = [];
                // for(const playerId of playerIds) {
                //     if(mediaDividendsPayout[playerId] === undefined) {
                //         sortedMediaDividendsPayout.push(0);
                //     } else {
                //         sortedMediaDividendsPayout.push(mediaDividendsPayout[playerId]);
                //     }
                //     if(performanceDividendsPayout[playerId] === undefined) {
                //         sortedPerformanceDividendsPayout.push(0);
                //     } else {
                //         sortedPerformanceDividendsPayout.push(performanceDividendsPayout[playerId]);
                //     }
                // }

                await updateSpreadsheet(
                    this.oauth,
                    credentials,
                    spreadsheetId,
                    {
                        sellPrices,
                        buyPrices,
                        dayChanges,
                        weekChanges,
                        monthChanges,
                        mediaDividends: sortedMediaDividendsPayout,
                        matchDayDividends: sortedPerformanceDividendsPayout,
                    },
                    {
                        buyPrices: watchlistBuyPrices,
                    },
                );
                logger.info({ message: 'Updated prices', userId });
            } catch(error) {
                logger.error({ message: 'Could not update prices', error, userId });
            }
        }
    }

    private async getCurrentPrice(playerId: string): Promise<BuyAndSellPrice | null> {
        if(process.env.FORCE_ONE_TIME_UPDATE == 'true') {
            if(!forceOneTimeUpdatePlayerIds.includes(playerId)) {
                forceOneTimeUpdatePlayerIds.push(playerId);
                const price = await getCurrentPriceFromSite(playerId);
                if(price !== null) {
                    this.pricingCache.updateBuyPrice(playerId, price.buy.time, price.buy.price);
                    this.pricingCache.updateSellPrice(playerId, price.sell.time, price.sell.price);
                    return {
                        sell: price.sell,
                        buy: price.buy,
                    };
                }
                return null;
            }
        }
        const promises = [this.pricingCache.getCurrentSellPrice(playerId), this.pricingCache.getCurrentBuyPrice(playerId)];
        const [sell, buy] = await Promise.all(promises);
        if(sell === null || buy === null) {
            return null;
        }
        return {
            sell,
            buy,
        };
    }

    private async getSpreadsheetData(currentPricePlayerIds: string[], recentPriceChangesPlayerIds: string[]): Promise<SpreadsheetsResponse> {
        const fixIncompletePrices = async(prices: (BuyAndSellPrice | null)[]): Promise<(BuyAndSellPrice | null)[]> => {
            const newPricePromises: Promise<BuyAndSellPrice | null>[] = [];
            for(let i = 0; i < prices.length; i++) {
                if(prices[i] === null) {
                    const playerId = currentPricePlayerIds[i];
                    const promise = getCurrentPriceFromSite(playerId);
                    promise.then(buyAndSellPrice => {
                        if(buyAndSellPrice !== null) {
                            this.pricingCache.updateBuyPrice(playerId, buyAndSellPrice.buy.time, buyAndSellPrice.buy.price);
                            this.pricingCache.updateSellPrice(playerId, buyAndSellPrice.sell.time, buyAndSellPrice.sell.price);
                        }
                    });
                    newPricePromises[i] = promise;
                }
            }
            const newPrices = await Promise.all(newPricePromises);
            for(let i = 0; i < newPrices.length; i++) {
                const newPrice = newPrices[i];
                if(newPrice !== undefined) {
                    prices[i] = newPrice;
                }
            }
            return prices;
        };

        const getDifferencePromises = (playerId: string, currentBuyPrice: number): [Promise<number>, Promise<number>, Promise<number>] => {
            const getDifferencePromise = (timeDifference: number): Promise<number> => {
                return this.pricingCache.getBuyPriceAtTime(playerId, timeDifference).then(price => {
                    if(price === null) {
                        return 0;
                    }
                    return currentBuyPrice - price.price;
                });
            };

            const day = 60 * 60 * 24 * 1000;
            const dayTimeDifference = Date.now() - day;
            const weekTimeDifference = Date.now() - day * 7;
            const monthTimeDifference = Date.now() - day * 28;
            return [
                getDifferencePromise(dayTimeDifference),
                getDifferencePromise(weekTimeDifference),
                getDifferencePromise(monthTimeDifference),
            ];
        };

        const allPlayerIds = [...new Set([...currentPricePlayerIds, ...recentPriceChangesPlayerIds])]; // Set removes duplicates
        // We need the current prices of the recentPriceChangesPlayerIds as well because we can't calculate the change without the current price
        const allCachedPrices = await Promise.all(allPlayerIds.map(playerId => this.getCurrentPrice(playerId)));
        const allCachedPricesByPlayerId: { [playerId: string]: BuyAndSellPrice | null } = {};
        const currentCachedPrices: (BuyAndSellPrice | null)[] = [];
        let i = 0;
        for(const playerId of allPlayerIds) {
            allCachedPricesByPlayerId[playerId] = allCachedPrices[i++];
        }
        for(const playerId of currentPricePlayerIds) {
            currentCachedPrices.push(allCachedPricesByPlayerId[playerId]);
        }

        const dayChangePromises: Promise<number>[] = [];
        const weekChangePromises: Promise<number>[] = [];
        const monthChangePromises: Promise<number>[] = [];

        for(const playerId of recentPriceChangesPlayerIds) {
            const cachedPrice = allCachedPricesByPlayerId[playerId];
            if(cachedPrice === null) {
                const nullPromise = Promise.resolve<number> (0);
                dayChangePromises.push(nullPromise);
                weekChangePromises.push(nullPromise);
                monthChangePromises.push(nullPromise);
            } else {
                const [dayChangePromise, weekChangePromise, monthChangePromise] = getDifferencePromises(playerId, cachedPrice.buy.price);
                dayChangePromises.push(dayChangePromise);
                weekChangePromises.push(weekChangePromise);
                monthChangePromises.push(monthChangePromise);
            }
        }

        const response: SpreadsheetsResponse = {
            currentPrices: {},
            dayChanges: {},
            weekChanges: {},
            monthChanges: {},
        };

        const [dayChanges, weekChanges, monthChanges, currentPrices] = await Promise.all([
            Promise.all(dayChangePromises),
            Promise.all(weekChangePromises),
            Promise.all(monthChangePromises),
            fixIncompletePrices(currentCachedPrices),
        ]);

        for(let i = 0; i < dayChanges.length; i++) {
            response.dayChanges[recentPriceChangesPlayerIds[i]] = dayChanges[i];
            response.weekChanges[recentPriceChangesPlayerIds[i]] = weekChanges[i];
            response.monthChanges[recentPriceChangesPlayerIds[i]] = monthChanges[i];
        }
        for(let i = 0; i < currentPrices.length; i++) {
            response.currentPrices[currentPricePlayerIds[i]] = currentPrices[i];
        }

        return response;
    }
}
