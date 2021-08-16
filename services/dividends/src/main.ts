import * as dotenv from 'dotenv';
dotenv.config();
import { getCache } from "./footballindex/cache";
import { getDatabase } from "./footballindex/database";
import { getResponder } from "./service/responder";
import { getPublisher } from "./service/publisher";

(async () => {
    const cache = getCache();
    const database = await getDatabase();

    // creating responder alongside publisher at same time creates memory leak
    const publisher = getPublisher(cache, database);
    setTimeout(() => getResponder(cache, database), 1000);
})();
