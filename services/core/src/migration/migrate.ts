import * as dotenv from 'dotenv';
dotenv.config();
import { PricingCache } from "../storage/PricingCache";
import { Client } from "pg";
import { Database } from "../storage/Database";
import { google } from "googleapis";
import { MidPriceMigration } from "./20200911-MidPriceMigration";
import { DividendsMigration } from "./20201005-DividendsMigration";
import { ExpirationPricingMigration } from "./20201016-ExpirationPricingMigration";

(async () => {
    const { env } = process;

    if(
        env.GOOGLE_OAUTH2_CLIENT_ID === undefined ||
        env.GOOGLE_OAUTH2_CLIENT_SECRET === undefined ||
        env.GOOGLE_OAUTH2_REDIRECT_URI === undefined
    ) {
        console.log('Undefined environment variables GOOGLE_OAUTH2_CLIENT_ID or GOOGLE_OAUTH2_CLIENT_SECRET or GOOGLE_OAUTH2_REDIRECT_URI');
        return;
    }

    if(env.REDIS_HOST === undefined || env.REDIS_PORT === undefined) {
        console.log('Undefined environment variables REDIS_HOST or REDIS_PORT');
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

    const migration = new ExpirationPricingMigration(database, oauth);
    await migration.migrate();
})();
