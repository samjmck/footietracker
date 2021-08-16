import * as dotenv from 'dotenv';
dotenv.config();
import { Cache } from "./storage/Cache";
import { WebSocketMessageHandler } from "./websocket/WebSocketMessageHandler";
import { assertExchangesAndQueues } from "../../../shared/backend/src/service/amqpConnection";
import { Client } from "pg";
import { Database } from "./storage/Database";
import { createUninterruptedWebSocketConnection } from "./websocket/webSocketConnection";

(async() => {
    const { env } = process;

    if(env.REDIS_HOST === undefined || env.REDIS_PORT === undefined) {
        console.log('Undefined environment variables REDIS_HOST or REDIS_PORT');
        return;
    }

    const cache = new Cache(
        env.REDIS_HOST,
        Number(env.REDIS_PORT),
        env.REDIS_PASSWORD || undefined,
    );

    // Create the WebSocket connection and its message handle
    const webSocketConnection = await createUninterruptedWebSocketConnection();
    console.log('Created WebSocketConnection');

    try {
        const client = new Client();
        await client.connect();
        const database = new Database(client);
        console.log('Connected to Postgres')

        // The message handler is what connects the WebSocket to the stores and the publisher
        // See pricing_flowchart.xml
        new WebSocketMessageHandler(webSocketConnection, cache, database);
        console.log('Created WebSocketMessageHandler');
    } catch(error) {
        console.log('Could not connect to Postgres, check if environment variables are set');
        console.log('Cannot start web server without database connection');
        console.error(error);
    }
})();
