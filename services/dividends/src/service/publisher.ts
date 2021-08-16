import { Publisher } from "cote";
import { Cache } from "../footballindex/cache";
import { Database } from "../footballindex/database";
import { getMediaBuzzScoreboard, getPerformanceBuzzScoreboard } from "../footballindex/scraper";
import { ServiceType } from "../../../../shared/service/ServiceType";
import { DividendsEvent } from "../../../../shared/service/dividends/service";
import { discoveryOptions } from "../../../../shared/backend/src/service/discoveryOptions";
import { schedule } from "node-cron";
import { ServiceKey } from "../../../../shared/service/ServiceKey";

let publisher: Publisher;
export function getPublisher(cache: Cache, database: Database): Publisher {
    if(publisher) {
        return publisher;
    }

    publisher = new Publisher({
        name: ServiceType.DividendsPublisher,
        key: ServiceKey.DividendsSubscriber,
    }, discoveryOptions);

    schedule('* * * * *', async () => {
        const time = Date.now();
        const mediaBuzzScoreboard = await getMediaBuzzScoreboard();
        cache.addMediaBuzzScoreboard(time, mediaBuzzScoreboard);
        database.addMediaBuzzScoreboard(time, mediaBuzzScoreboard);

        const performanceBuzzScoreboard = await getPerformanceBuzzScoreboard();
        cache.addPerformanceBuzzScoreboard(time, performanceBuzzScoreboard);
        database.addPerformanceBuzzScoreboard(time, performanceBuzzScoreboard);

        publisher.publish(DividendsEvent.MediaBuzzUpdated, {
            scoreboard: mediaBuzzScoreboard,
            time,
        });
    });

    return publisher;
}
