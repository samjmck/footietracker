import {
    BuzzByDay,
    BuzzScoreboard,
    PerformanceBuzzScoreboard,
    TopBuzz
} from "../../../../shared/service/dividends/interfaces";
import { BuzzType } from "../../../../shared/service/dividends/enums";

export abstract class BuzzStore {
    abstract async addMediaBuzzScoreboard(time: number, scoreboard: BuzzScoreboard): Promise<void>;
    abstract async addPerformanceBuzzScoreboard(time: number, scoreboard: PerformanceBuzzScoreboard): Promise<void>;

    abstract async getBuzz(buzzType: BuzzType, playerId: string, time: number, endTime?: number): Promise<BuzzByDay>;

    abstract async getTopBuzz(buzzType: BuzzType, time: number, endTime?: number): Promise<TopBuzz>;

    abstract async getLatestMediaBuzzScoreboard(): Promise<BuzzScoreboard | null>;
    abstract async getLatestPerformanceBuzzScoreboard(): Promise<PerformanceBuzzScoreboard | null>;
}
