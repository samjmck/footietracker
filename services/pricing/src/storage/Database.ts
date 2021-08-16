import { Client } from "pg";

// TODO: implement PriceStore
export class Database {
    constructor(private client: Client) {}

    private async insertPriceUpdate(tableName: string, playerId: string, time: number, buyPrice: number): Promise<void> {
        // TODO: combine into one query
        const playerIds = await this.client.query<{ id: number }> (
            // DO UPDATE because DO NOTHING stops the query from returning something
            'INSERT INTO player_ids (player_id) VALUES ($1) ON CONFLICT (player_id) DO UPDATE SET player_id = ($1) RETURNING id',
            [playerId]
        );
        const dbPlayerId = playerIds.rows[0].id;
        const result = await this.client.query(
            `
            INSERT INTO ${tableName} (player_id, time, price)
            VALUES ($1 , $2, $3)
            `,
            [dbPlayerId, time, buyPrice]
        );
    }

    async insertBuyUpdate(playerId: string, time: number, buyPrice: number): Promise<void> {
        await this.insertPriceUpdate('price_buy_updates', playerId, time, buyPrice);
    }

    async insertSellUpdate(playerId: string, time: number, sellPrice: number): Promise<void> {
        await this.insertPriceUpdate('price_sell_updates', playerId, time, sellPrice);
    }
}
