import { Requester } from "../Requester";
import { RequestQueue } from "../amqpConstants";
import { GetSubscriptionEndResponse } from "./service";

export class UsersRequester extends Requester {
    protected initialiseListeners(): void {
        this.addConsumeListener(RequestQueue.GetSubscriptionEnd);
    }

    async getSubscriptionEnd(userId: number): Promise<GetSubscriptionEndResponse | null> {
        return this.makeRequest(RequestQueue.GetSubscriptionEnd, { userId });
    }
}
