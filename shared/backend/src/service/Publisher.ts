import { Channel } from "amqplib";
import { Exchange, Queue } from "./amqpConstants";

export class Publisher {
    constructor(private channel: Channel) {}

    protected async publish(exchange: Exchange, queue: Queue, value: object): Promise<void> {
        await this.channel.publish(
            exchange,
            queue.slice(0, queue.length - 6),
            Buffer.from(JSON.stringify(value)),
        )
    }
}
