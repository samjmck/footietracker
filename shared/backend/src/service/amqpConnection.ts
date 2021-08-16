import { Channel } from "amqplib";
import { Exchange, exchangeTypes, getResponseQueue, Queue, queueExchanges, RequestQueue } from "./amqpConstants";

export async function assertExchangesAndQueues(channel: Channel): Promise<void> {
    const exchanges = Object.values(Exchange);
    for(const exchange of exchanges) {
        await channel.assertExchange(exchange, exchangeTypes[exchange]);
    }

    const queues = Object.values(Queue);
    for(const queue of queues) {
        await channel.assertQueue(queue);
        await channel.bindQueue(queue, queueExchanges[queue], queue.slice(0, queue.length - 6));
    }

    const requestQueues = Object.values(RequestQueue);
    for(const requestQueue of requestQueues) {
        await channel.assertQueue(requestQueue);
        const responseQueue = getResponseQueue(requestQueue);
        await channel.assertQueue(responseQueue);
        await channel.bindQueue(requestQueue, queueExchanges[requestQueue], requestQueue.slice(0, requestQueue.length - 6));
        await channel.bindQueue(responseQueue, queueExchanges[requestQueue], responseQueue.slice(0, responseQueue.length - 6));
    }
}
