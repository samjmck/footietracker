export enum Exchange {
    Pricing = 'pricing_exchange',
    Dividends = 'dividends_exchange',
    Spreadsheets = 'spreadsheets_exchange',
    Users = 'users_exchange',
}

export const exchangeTypes: { [exchange: string]: string } = {
    [Exchange.Pricing]: 'direct',
    [Exchange.Dividends]: 'direct',
    [Exchange.Spreadsheets]: 'direct',
    [Exchange.Users]: 'direct',
};

export enum Queue {
    PriceUpdates = 'price_updates_queue',
}

export enum RequestQueue {
    GetCurrentPrice = 'get_current_price_requests_queue',
    GetMultipleCurrentPrice = 'get_multiple_current_price_requests_queue',
    GetPrices = 'get_prices_requests_queue',
    GetTopPlayers = 'get_top_player_requests_queue',
    GetSpreadsheetData = 'get_spreadsheet_data_requests_queue',
    SendPortfolio = 'send_portfolio_queue',
    GetAuthUrl = 'get_auth_url_queue',
    SendCode = 'send_code_queue',
    GetSubscriptionEnd = 'get_subscription_end_queue',
}

export const queueExchanges: { [exchange: string]: string } = {
    [Queue.PriceUpdates]: Exchange.Pricing,
    [RequestQueue.GetCurrentPrice]: Exchange.Pricing,
    [RequestQueue.GetMultipleCurrentPrice]: Exchange.Pricing,
    [RequestQueue.GetPrices]: Exchange.Pricing,
    [RequestQueue.GetTopPlayers]: Exchange.Pricing,

    [RequestQueue.GetSpreadsheetData]: Exchange.Spreadsheets,
    [RequestQueue.SendPortfolio]: Exchange.Spreadsheets,
    [RequestQueue.GetAuthUrl]: Exchange.Spreadsheets,
    [RequestQueue.SendCode]: Exchange.Spreadsheets,

    [RequestQueue.GetSubscriptionEnd]: Exchange.Users,
};

export function getResponseQueue(requestQueue: RequestQueue): string {
    return `response_${requestQueue}`;
}
