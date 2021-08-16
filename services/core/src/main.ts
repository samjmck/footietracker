import * as dotenv from 'dotenv';
dotenv.config();
import { google } from "googleapis";
import * as express from 'express';
import { addV1Routes } from "./rest-v1/server";
import { PricingCache } from "./storage/PricingCache";
import { Client } from "pg";
import { Database } from "./storage/Database";
import { UpdateDailySummaryTask } from "./scheduler/UpdateDailySummaryTask";
import { UpdatePricesTask } from "./scheduler/UpdateCurrentPricesTask";
import { logger } from "./util/logger";

(async () => {
    const { env } = process;

    if(
        env.GOOGLE_OAUTH2_CLIENT_ID === undefined ||
        env.GOOGLE_OAUTH2_CLIENT_SECRET === undefined ||
        env.GOOGLE_OAUTH2_REDIRECT_URI === undefined
    ) {
        logger.error('Undefined environment variables GOOGLE_OAUTH2_CLIENT_ID or GOOGLE_OAUTH2_CLIENT_SECRET or GOOGLE_OAUTH2_REDIRECT_URI');
        return;
    }

    if(env.REDIS_HOST === undefined || env.REDIS_PORT === undefined) {
        logger.error('Undefined environment variables REDIS_HOST or REDIS_PORT');
        return;
    }

    const pricingCache = new PricingCache(
        env.REDIS_HOST,
        Number(env.REDIS_PORT),
        env.REDIS_PASSWORD || undefined,
    );

    const postgresClient = new Client();
    await postgresClient.connect();
    const database = new Database(postgresClient);

    const oauth = new google.auth.OAuth2(
        env.GOOGLE_OAUTH2_CLIENT_ID,
        env.GOOGLE_OAUTH2_CLIENT_SECRET,
        env.GOOGLE_OAUTH2_REDIRECT_URI
    );

    new UpdateDailySummaryTask('0 0 0 * * *', oauth, database);
    new UpdatePricesTask('*/30 * * * * *', oauth, pricingCache, database);

    const app = express();
    addV1Routes(app, oauth, database);
    app.listen(8080);
    logger.info('Listening on :8080');
})();
