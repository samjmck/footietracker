import { Channel } from "amqplib";
import { RequestQueue } from "./amqpConstants";

export abstract class Responder {
    constructor(protected channel: Channel) {
        try {
            this.initialiseBindings()
        } catch(error) {
            throw error;
        }
    }

    protected abstract initialiseBindings(): void;

    protected bind(consumeQueue: RequestQueue, functionName: string): void {
        if(!(typeof this[functionName] === 'function')) {
            throw Error(`${functionName} does not exist in Responder`);
        }

        this.channel.consume(consumeQueue, async message => {
            if(message !== null) {
                const data = JSON.parse(message.content.toString());

                try {
                    let response = (<(...params: any[]) => any> this[functionName])(data);

                    if(isPromise(response)) {
                        response = await response;
                    }

                    // JSON.stringify(null) = 'null'
                    // JSON.parse(null) = 'null'
                    const buffer = response === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(response));

                    this.channel.sendToQueue(
                        message.properties.replyTo,
                        buffer,
                        { correlationId: message.properties.correlationId });
                } catch(error) {
                    console.log(`Error in ${functionName}`);
                    console.error(error);
                }
                this.channel.ack(message);
            }
        });
    }
}

function isValidFunctionName<T>(functionName: string): functionName is keyof typeof Responder.prototype {
    return functionName in Responder.prototype;
}

function isPromise(value: any): value is Promise<any> {
    return value.then !== undefined;
}
