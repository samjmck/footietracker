import { UninterruptedWebSocketConnection } from "./webSocketConnection";
import { BuyData, PriceType, SellData } from "../../../../shared/backend/src/service/pricing/interfaces";
import { Database } from "../storage/Database";
import { Cache } from "../storage/Cache";

// {"t":"d","d":{"b":{"p":"prices/dean-henderson","d":{"sell":0.99,"dt":1590172545431}},"a":"m"}}
// {"t":"d","d":{"b":{"p":"prices/ryota-oshima","d":{"buy":0.11,"dt":1590172614230}},"a":"m"}}
interface PriceUpdateMessage<TPrice> {
    t: 'd';
    d: {
        b: {
            p: string;
            d: TPrice & { dt: number; };
        };
        a: 'm';
    };
}

function isPriceUpdateMessage<T>(message: any): message is PriceUpdateMessage<T> {
    return message?.d?.a === 'm' && message?.d?.b?.d?.dt !== undefined;
}
function isBuyPriceUpdateMessage(message: any): message is PriceUpdateMessage<BuyData> {
    return message?.d?.b?.d?.buy !== undefined;
}
function isSellPriceUpdateMessage(message: any): message is PriceUpdateMessage<SellData> {
    return message?.d?.b?.d?.sell !== undefined;
}

// {"t":"d","d":{"b":{"p":"activity/5/-M7xfI6wvMyUnzUFRpux","d":{"celeb":"Paulinho","code":"paulo-henrique-filho","name":"Andrew B","price":22.9,"qty":10,"thumbnailImage":"paulo-henrique-filho-g-t2.jpg","title":"Mr"}},"a":"d"}}
interface ActivityMessage {
    t: 'd';
    d: {
        b: {
            p: string;
            d: {
                celeb: string;
                code: string;
                name: string;
                price: number;
                qty: number;
                thumbnailImage: string;
                title: string;
            };
        };
        a: 'd';
    };
}

export class WebSocketMessageHandler {
    constructor(
        connection: UninterruptedWebSocketConnection,
        private cache: Cache,
        private database: Database,
    ) {
        connection.addListener(message => this.handleMessage(message));
    }

    private async handleMessage(message: object): Promise<void> {
        if(isPriceUpdateMessage(message)) {
            let price: number;
            let priceType: PriceType;
            const time = message.d.b.d.dt;
            if(isBuyPriceUpdateMessage(message)) {
                price = message.d.b.d.buy;
                priceType = PriceType.Buy;
            } else if(isSellPriceUpdateMessage(message)) {
                price = message.d.b.d.sell;
                priceType = PriceType.Sell;
            } else {
                return;
            }

            // message.d.b.p example: "/steven-bergwijn"
            // Split it into ["/", "steven-bergwijn"] and use the second item for the actual player ID
            const playerId = message.d.b.p.split('/')[1];

            console.log(`Handling price message for playerId ${playerId}`);

            // These args are the same types and order as the PriceStore updatePrice function
            // The price in the message have two decimal points
            // We multiply by 100 to make them integers so we don't suffer from floating point errors
            // Remember: we have to do this ANY TIME we pull price data from the Football Index server
            const wholePrice = Math.round(price * 100);

            if(priceType === PriceType.Buy) {
                this.cache.updateBuyPrice(playerId, time, wholePrice);
                this.database.insertBuyUpdate(playerId, time, wholePrice);
            } else {
                this.cache.updateSellPrice(playerId, time, wholePrice);
                this.database.insertSellUpdate(playerId, time, wholePrice);
            }
        }
    }
}
