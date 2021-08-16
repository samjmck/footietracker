import { Collection, Db, MongoClient } from 'mongodb';
import { BuzzStore } from './BuzzStore';
import {
    BuzzByDay,
    BuzzScoreboard,
    PerformanceBuzzScoreboard,
    TopBuzz
} from "../../../../shared/service/dividends/interfaces";
import * as moment from 'moment';
import { BuzzType } from "../../../../shared/service/dividends/enums";

function roundToMidnight(time: number): number {
    return moment(time).startOf('day').valueOf();
}

let database: Database;
export async function getDatabase(): Promise<Database> {
    if(database) {
        return database;
    }

    const { env } = process;

    if(env.MONGODB_HOST && env.MONGODB_PORT) {
        let mongoDatabase: Db;
        if(env.MONGODB_USER && env.MONGODB_PASSWORD && env.MONGODB_DATABASE) {
            const client = await MongoClient.connect(`mongodb://${env.MONGODB_USER}:${env.MONGODB_PASSWORD}@${env.MONGODB_HOST}:${env.MONGODB_PORT}`, { useNewUrlParser: true });
            mongoDatabase = client.db(env.MONGODB_DATABASE);
        } else {
            const client = await MongoClient.connect(`mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}`, { useNewUrlParser: true });
            mongoDatabase = client.db(env.MONGODB_DATABASE);
        }

        database = new Database(mongoDatabase);
    } else {
        throw new Error('Could not create MongoDB website: please define the following environment variables: MONGODB_HOST, MONGODB_PORT');
    }

    return database;
}

interface MediaBuzzScoreboardDocument {
    buzzType: BuzzType.Media;
    time: number;
    scoreboard: BuzzScoreboard;
}

interface PerformanceMediaBuzzScoreboardDocument {
    buzzType: BuzzType.Performance;
    time: number;
    scoreboard: PerformanceBuzzScoreboard;
}

export class Database extends BuzzStore {
    private buzzScoreboardCollection: Collection<MediaBuzzScoreboardDocument | PerformanceMediaBuzzScoreboardDocument>;

    constructor(mongoDatabase: Db) {
        super();
        this.buzzScoreboardCollection = mongoDatabase.collection('buzz-scoreboard');
    }

    private async addBuzzScoreboard(buzzType: BuzzType, time: number, scoreboard: BuzzScoreboard | PerformanceBuzzScoreboard): Promise<void> {
        await this.buzzScoreboardCollection.insertOne({
            buzzType,
            time,
            scoreboard,
        });
    }

    async addMediaBuzzScoreboard(time: number, scoreboard: BuzzScoreboard): Promise<void> {
        await this.addBuzzScoreboard(BuzzType.Media, time, scoreboard);
    }

    async addPerformanceBuzzScoreboard(time: number, scoreboard: PerformanceBuzzScoreboard): Promise<void> {
        await this.addBuzzScoreboard(BuzzType.Media, time, scoreboard);
    }

    private async getLatestDocument(buzzType: BuzzType): Promise<MediaBuzzScoreboardDocument | PerformanceMediaBuzzScoreboardDocument | null> {
        const scoreboardDocuments = await this.buzzScoreboardCollection
            .find({
                buzzType,
            })
            .sort({ time: -1 })
            .limit(1)
            .toArray();
        if(scoreboardDocuments.length > 0) {
            return scoreboardDocuments[0];
        }
        return null;
    }

    async getLatestMediaBuzzScoreboard(): Promise<BuzzScoreboard | null> {
        const latestDocument = <MediaBuzzScoreboardDocument | null> await this.getLatestDocument(BuzzType.Media);
        if(latestDocument === null) {
            return null;
        }
        return latestDocument.scoreboard;
    }

    async getLatestPerformanceBuzzScoreboard(): Promise<PerformanceBuzzScoreboard | null> {
        const latestDocument = <PerformanceMediaBuzzScoreboardDocument | null> await this.getLatestDocument(BuzzType.Media);
        if(latestDocument === null) {
            return null;
        }
        return latestDocument.scoreboard;
    }

    async getBuzz(buzzType: BuzzType, playerId: string, time: number, endTime?: number): Promise<BuzzByDay> {
        // if(endTime === undefined) {
        //     const midnight = roundToMidnight(time);
        //     const scoreboardDocuments = await this.buzzScoreboardCollection
        //         .find({
        //             buzzType,
        //             time: {
        //                 $gte: midnight,
        //                 $lte: midnight + 1000 * 60 * 60 * 24,
        //             },
        //         })
        //         .sort({ time: -1 })
        //         .limit(1)
        //         .toArray();
        //     if(scoreboardDocuments.length > 0 && scoreboardDocuments[0].scoreboard[playerId] !== undefined) {
        //         return {
        //             [scoreboardDocuments[0].time]: scoreboardDocuments[0].scoreboard[playerId],
        //         };
        //     }
        //     return {};
        // } else {
        //     const scoreboardDocuments = await this.buzzScoreboardCollection
        //         .find({
        //             buzzType,
        //             time: {
        //                 $gte: roundToMidnight(time),
        //                 $lte: roundToMidnight(endTime),
        //             },
        //         })
        //         .toArray();
        //     const buzz: BuzzByDay = {};
        //     for(const { time, scoreboard } of scoreboardDocuments) {
        //         if(scoreboard[playerId] !== undefined) {
        //             buzz[time] = scoreboard[playerId];
        //         }
        //     }
        //     return buzz;
        // }
        return {};
    }

    async getTopBuzz(buzzType: BuzzType, time: number, endTime?: number): Promise<TopBuzz> {
        // if(endTime === undefined) {
        //     const scoreboardDocument = await this.buzzScoreboardCollection
        //         .findOne({
        //             buzzType,
        //             time: roundToMidnight(time),
        //         });
        //     if(scoreboardDocument !== null) {
        //         return {
        //             [scoreboardDocument.time]: scoreboardDocument.scoreboard,
        //         };
        //     }
        //     return {};
        // } else {
        //     const scoreboardDocuments = await this.buzzScoreboardCollection
        //         .find({
        //             buzzType,
        //             time: {
        //                 $gte: roundToMidnight(time),
        //                 $lte: roundToMidnight(endTime),
        //             },
        //         })
        //         .toArray();
        //     const top: TopBuzz = {};
        //     for(const { time, scoreboard } of scoreboardDocuments) {
        //         top[time] = scoreboard;
        //     }
        //     return top;
        // }
        return {};
    }
}
