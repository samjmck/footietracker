import { createHandyClient, IHandyRedis } from 'handy-redis';
import { Price, Top } from "../../../../shared/backend/src/service/pricing/interfaces";

export class Cache {
    private redisClient: IHandyRedis;

    constructor(host: string, port: number, password: string | undefined) {
        this.redisClient = createHandyClient({
            host,
            port,
            password,
        });
    }

    private async getRawPriceData(key: string): Promise<(string | null)[]> {
        return this.redisClient.hmget(
            key,
            'price',
            'time',
        );
    }

    private async getPriceByKey(key: string): Promise<Price | null> {
        const [priceString, timeString] = await this.getRawPriceData(key);

        if(priceString === null || timeString === null) {
            return null;
        }

        return {
            price: Number(priceString),
            time: Number(timeString),
        };
    }

    async getCurrentBuyPrice(playerId: string): Promise<Price | null> {
        return this.getPriceByKey(`current-buy-price:player-id#${playerId}`);
    }

    async getCurrentSellPrice(playerId: string): Promise<Price | null> {
        return this.getPriceByKey(`current-sell-price:player-id#${playerId}`);
    }

    async getMultipleCurrentBuyPrices(playerIds: string[]): Promise<(Price | null)[]> {
        const promises: Promise<(Price | null)>[] = [];
        for(const playerId of playerIds) {
            promises.push(this.getCurrentBuyPrice(playerId));
        }
        return Promise.all(promises);
    }

    async getMultipleCurrentSellPrices(playerIds: string[]): Promise<(Price | null)[]> {
        const promises: Promise<(Price | null)>[] = [];
        for(const playerId of playerIds) {
            promises.push(this.getCurrentSellPrice(playerId));
        }
        return Promise.all(promises);
    }

    async getSellPrices(playerId: string, startTime: number, endTime: number): Promise<Price[]> {
        const priceIndexStrings: string[] = await this.redisClient.zrangebyscore(`sell-prices:player-id#${playerId}`, startTime, endTime);

        if(priceIndexStrings.length === 0) {
            return [];
        }

        const promises: Promise<(Price | null)>[] = [];
        for(const priceIndexString of priceIndexStrings) {
            promises.push(this.getPriceByKey(`sell-price:player-id#${playerId}:price-index#${priceIndexString}`));
        }
        const prices = <Price[]> (await Promise.all(promises)).filter(price => price !== null);

        return prices;
    }

    async getBuyPrices(playerId: string, startTime: number, endTime: number): Promise<Price[]> {
        const priceIndexStrings: string[] = await this.redisClient.zrangebyscore(`buy-prices:player-id#${playerId}`, startTime, endTime);

        if(priceIndexStrings.length === 0) {
            return [];
        }

        const promises: Promise<(Price | null)>[] = [];
        for(const priceIndexString of priceIndexStrings) {
            promises.push(this.getPriceByKey(`buy-price:player-id#${playerId}:price-index#${priceIndexString}`));
        }
        const prices = <Price[]> (await Promise.all(promises)).filter(price => price !== null);

        return prices;
    }

    async getSellPriceAtTime(playerId: string, time: number): Promise<Price | null> {
        // All price indexes between the given time and now
        const priceIndexStrings: string[] = await this.redisClient.zrangebyscore(`sell-prices:player-id#${playerId}`, time, Date.now(), ['LIMIT', 0, 1]);
        if(priceIndexStrings.length !== 0) {
            return this.getPriceByKey(`sell-price:player-id#${playerId}:price-index#${priceIndexStrings[0]}`);
        }

        // All prices between when we first started tracking the player and the given time
        const reversePriceIndexStrings: string[] = await this.redisClient.zrangebyscore(`sell-prices:player-id#${playerId}`, 0, time, ['LIMIT', 0, 1]);
        if(reversePriceIndexStrings.length !== 0) {
            return this.getPriceByKey(`sell-price:player-id#${playerId}:price-index#${priceIndexStrings[0]}`);
        }

        return null;
    }

    async getBuyPriceAtTime(playerId: string, time: number): Promise<Price | null> {
        // All price indexes between the given time and now
        const priceIndexStrings: string[] = await this.redisClient.zrangebyscore(`buy-prices:player-id#${playerId}`, time, Date.now(), ['LIMIT', 0, 1]);
        if(priceIndexStrings.length !== 0) {
            return this.getPriceByKey(`buy-price:player-id#${playerId}:price-index#${priceIndexStrings[0]}`);
        }

        // All prices between when we first started tracking the player and the given time
        const reversePriceIndexStrings: string[] = await this.redisClient.zrangebyscore(`buy-prices:player-id#${playerId}`, 0, time, ['LIMIT', 0, 1]);
        if(reversePriceIndexStrings.length !== 0) {
            return this.getPriceByKey(`buy-price:player-id#${playerId}:price-index#${priceIndexStrings[0]}`);
        }

        return null;
    }

    async updateBuyPrice(
        playerId: string,
        time: number,
        price: number,
    ): Promise<void> {
        const timeString = time.toString();

        const priceIndex = await this.redisClient.incr(`buy-price-index:player-id#${playerId}`);

        const fields: [string, string][] = [
            ['price', price.toString()],
            ['time', timeString],
        ];

        await this.redisClient.zadd('current-buy-prices', [price, playerId]);
        await this.redisClient.zadd(`buy-prices:player-id#${playerId}`, [time, priceIndex.toString()]);
        await this.redisClient.hmset(`buy-price:player-id#${playerId}:price-index#${priceIndex}`, ...fields);
        await this.redisClient.hmset(`current-buy-price:player-id#${playerId}`, ...fields);
    }

    async updateSellPrice(
        playerId: string,
        time: number,
        price: number,
    ): Promise<void> {
        const timeString = time.toString();

        const priceIndex = await this.redisClient.incr(`sell-price-index:player-id#${playerId}`);

        const fields: [string, string][] = [
            ['price', price.toString()],
            ['time', timeString],
        ];

        await this.redisClient.zadd('current-sell-prices', [price, playerId]);
        await this.redisClient.zadd(`sell-prices:player-id#${playerId}`, [time, priceIndex.toString()]);
        await this.redisClient.hmset(`sell-price:player-id#${playerId}:price-index#${priceIndex}`, ...fields);
        await this.redisClient.hmset(`current-sell-price:player-id#${playerId}`, ...fields);
    }

    async getTopSellPlayers(min = 0, max = 24): Promise<Top> {
        const playerIds = await this.redisClient.zrevrange('current-sell-prices', min, max);

        const promises: Promise<Price | null>[] = [];
        for(const playerId of playerIds) {
            promises.push(this.getPriceByKey(`current-price:player-id#${playerId}`));
        }
        const prices = <Price[]> (await Promise.all(promises)).filter(price => price !== null);

        const result: Top = [];
        let i = 0;
        for(const playerId of playerIds) {
            result.push({
                playerId,
                price: prices[i++],
            });
        }

        return result;
    }

    async getTopBuyPlayers(min = 0, max = 24): Promise<Top> {
        const playerIds = await this.redisClient.zrevrange('current-buy-prices', min, max);

        const promises: Promise<Price | null>[] = [];
        for(const playerId of playerIds) {
            promises.push(this.getPriceByKey(`current-price:player-id#${playerId}`));
        }
        const prices = <Price[]> (await Promise.all(promises)).filter(price => price !== null);

        const result: Top = [];
        let i = 0;
        for(const playerId of playerIds) {
            result.push({
                playerId,
                price: prices[i++],
            });
        }

        return result;
    }
}
