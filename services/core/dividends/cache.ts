import { createHandyClient, IHandyRedis } from 'handy-redis';
import { BuzzStore } from './BuzzStore';
import {
    BuzzByDay,
    BuzzScoreboard,
    PerformanceBuzzScoreboard,
    TopBuzz
} from "../../../../shared/service/dividends/interfaces";
import * as moment from 'moment';
import { BuzzType, PlayerPosition } from "../../../../shared/service/dividends/enums";

function roundToMidnight(time: number): number {
    return moment(time).startOf('day').valueOf();
}

function getAllRoundedTimesBetween(start: number, end: number): number[] {
    const day = 86400000;
    const roundedStart = roundToMidnight(start);
    const between: number[] = [];
    for(let i = roundedStart; i <= end; i += day) {
        between.push(i);
    }
    return between;
}

let cache: Cache;
export function getCache(): Cache {
    if(cache) {
        return cache;
    }

    const { env } = process;

    if(env.REDIS_HOST && env.REDIS_PORT) {
        const redis = createHandyClient({
            host: env.REDIS_HOST,
            port: Number(env.REDIS_PORT),
            password: env.REDIS_PASSWORD ? env.REDIS_PASSWORD : undefined,
        });

        cache = new Cache(redis);
    } else {
        throw new Error('Could not create Redis website: please define REDIS_HOST and REDIS_PORT in environment variables');
    }

    return cache;
}

const playerPositions: PlayerPosition[] = Object.values(PlayerPosition);

export class Cache extends BuzzStore {
    constructor(private redis: IHandyRedis) {
        super()
    }

    private async getPlayerBuzz(buzzType: BuzzType, time: number, playerId: string): Promise<number | null> {
        return this.redis.zrank(`buzz-scoreboard:buzz-type#${buzzType}:time#${time}`, playerId);
    }

    private async getBuzzScoreboard(key: string): Promise<BuzzScoreboard | null> {
        const playerIdsAndScores = await this.redis.zrevrange(key, 0, await this.redis.zcard(key), 'WITHSCORES');
        const scoreboard: BuzzScoreboard = {};
        for(let i = 0; i < playerIdsAndScores.length; i++) {
            scoreboard[playerIdsAndScores[i]] = Number(playerIdsAndScores[++i]);
        }
        return scoreboard;
    }

    async addMediaBuzzScoreboard(time: number, scoreboard: BuzzScoreboard): Promise<void> {
        const members: [number, string][] = [];
        for(const playerId in scoreboard) {
            members.push([scoreboard[playerId], playerId]);
        }
        if(members.length === 0) {
            return;
        }
        await this.redis.set('current-media-buzz-scoreboard-time', time.toString());
        await this.redis.zadd(`media-buzz-scoreboard:time#${time}`,  ...members);
        await this.redis.sadd(`media-buzz-scoreboard-times`, time.toString());
    }

    async addPerformanceBuzzScoreboard(time: number, scoreboard: PerformanceBuzzScoreboard): Promise<void> {
        const members: [number, string][] = [];
        const playerIds = Object.keys(scoreboard);
        const playerPositions = <string[]> Object.values(PlayerPosition);
        let skipped = 0;
        for(const playerPosition of playerPositions) {
            const members: [number, string][] = [];
            for(const playerId in scoreboard[<PlayerPosition> playerPosition]) {
                members.push([scoreboard[<PlayerPosition> playerPosition][playerId], playerId]);
            }
            if(members.length === 0) {
                skipped++;
                continue;
            }
            await this.redis.zadd(`performance-buzz-scoreboard:time#${time}:position#${playerPosition}`,  ...members);
        }
        if(skipped === playerPositions.length) {
            return;
        }
        await this.redis.set('current-performance-buzz-scoreboard-time', time.toString());
        await this.redis.sadd(`performance-buzz-scoreboard-times`, time.toString());
    }

    async getLatestMediaBuzzScoreboard(): Promise<BuzzScoreboard | null> {
        const time = await this.redis.get('current-media-buzz-scoreboard-time');
        if(time === null) {
            return null;
        }
        return this.getBuzzScoreboard(`media-buzz-scoreboard:time#${time}`);
    }

    async getLatestPerformanceBuzzScoreboard(): Promise<PerformanceBuzzScoreboard | null> {
        const time = await this.redis.get('current-performance-buzz-scoreboard-time');
        if(time === null) {
            return null;
        }
        const performanceBuzzScoreboard: PerformanceBuzzScoreboard = {
            [PlayerPosition.Forward]: {},
            [PlayerPosition.Midfielder]: {},
            [PlayerPosition.Defender]: {},
            [PlayerPosition.Goalkeeper]: {},
            all: {},
        };
        for(const playerPosition of playerPositions) {
            const scoreboard = await this.getBuzzScoreboard(`performance-buzz-scoreboard:time${time}:position#${playerPosition}`);
            if(scoreboard === null) {
                performanceBuzzScoreboard[playerPosition] = {};
            } else {
                performanceBuzzScoreboard[playerPosition] = scoreboard;
                for(const playerId in scoreboard) {
                    performanceBuzzScoreboard.all[playerId] = scoreboard[playerId];
                }
            }
        }
        return performanceBuzzScoreboard;
    }

    async getBuzz(buzzType: BuzzType, playerId: string, time: number, endTime?: number): Promise<BuzzByDay> {
        if(endTime === undefined) {
            const buzz = await this.getPlayerBuzz(buzzType, time, playerId);
            if(buzz !== null) {
                const roundedTime = roundToMidnight(time);
                return {
                    [roundedTime]: buzz,
                };
            }
            return {};
        }

        const times = getAllRoundedTimesBetween(time, endTime);

        const promises: Promise<number | null>[] = [];
        for(const roundedTime of times) {
            promises.push(this.getPlayerBuzz(buzzType, roundedTime, playerId));
        }
        const buzzes = await Promise.all(promises);

        const buzzByDay: BuzzByDay = {};
        let i = 0;
        for(const buzz of buzzes) {
            const time = times[i++];
            if(buzz !== null) {
                buzzByDay[time] = buzz;
            }
        }
        return buzzByDay;
    }

    async getTopBuzz(buzzType: BuzzType, time: number, endTime?: number): Promise<TopBuzz> {
        return {};
    }
}
