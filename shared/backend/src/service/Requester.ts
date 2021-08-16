import { Channel } from "amqplib";
import { getResponseQueue, RequestQueue } from "./amqpConstants";
import { v1 as uuidv1 } from "uuid";

export abstract class Requester {
    private promiseResolvesByUuid: { [uuid: string]: (value: any) => void } = {};

    constructor(protected channel: Channel) {
        this.initialiseListeners();
    }

    protected abstract initialiseListeners(): void;

    protected addConsumeListener(requestQueue: RequestQueue): void {
        this.channel.consume(getResponseQueue(requestQueue), message => {
            if(message !== null) {
                if(this.promiseResolvesByUuid[message.properties.correlationId] !== undefined) {
                    const data = JSON.parse(message.content.toString());
                    this.promiseResolvesByUuid[message.properties.correlationId](data);
                    this.channel.ack(message);
                }
            }
        });
    }

    protected async makeRequest(requestQueue: RequestQueue, data?: object): Promise<any> {
        if(data === undefined) {
            data = {};
        }

        let resolve: ((value: any) => void) | undefined = undefined;
        const responsePromise = new Promise<any>(_resolve => resolve = _resolve);

        if(resolve === undefined) {
            return;
        }

        const uuid = uuidv1();

        this.channel.sendToQueue(
            requestQueue,
            Buffer.from(JSON.stringify(data)),
            {
                correlationId: uuid,
                replyTo: getResponseQueue(requestQueue),
            },
        );

        this.promiseResolvesByUuid[uuid] = resolve;

        return responsePromise;
    }
}
