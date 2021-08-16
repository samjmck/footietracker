import * as dotenv from 'dotenv';
dotenv.config();
import { Portfolio } from '../../../../shared/backend/src/service/spreadsheets/interfaces';
import { Client } from 'pg';
import { google } from "googleapis";
import { Credentials, OAuth2Client } from 'google-auth-library';
import { updateSpreadsheet, getDailySummary, addPortfolio } from '../spreadsheet/spreadsheet';
import { appendValues, updateValues } from '../spreadsheet/wrapper';
import { readFileSync } from 'fs';
import { dailySummaryColumns, getColumnLetterFromIndex } from "../spreadsheet/constants/columns";
import { SheetName } from "../spreadsheet/constants/sheets";
import { Database } from "../storage/Database";

const portfolio = <Portfolio> (JSON.parse(readFileSync(__dirname + '/demo_portfolio.json').toString()).portfolio);

const playerIds: string[] = [];
const priceIncreaseProbabilities: { [playerId: string]: number } = {};
const buyPrices: { [playerId: string]: number } = {};
const sellPrices: { [playerId: string]: number } = {};
const matchDividends: { [playerId: string]: number } = {};
const mediaDividends: { [playerId: string]: number } = {};
function setNewPriceProbabilities(): void {
    for(const { playerId, totalPrice, quantity } of portfolio.shares) {
        priceIncreaseProbabilities[playerId] = 0.38 + Math.random() / 2;
    }
}
for(const { playerId, totalPrice, quantity } of portfolio.shares) {
    const price = Math.round(totalPrice / quantity);
    priceIncreaseProbabilities[playerId] = 0.38 + Math.random() / 2;
    matchDividends[playerId] = 0;
    mediaDividends[playerId] = 0;
    playerIds.push(playerId);
    buyPrices[playerId] = price;
    sellPrices[playerId] = Math.round(price - price * ((2 + Math.random() * 5)/100))
}

const activePlayerIds: string[] = [];

let nextPlayerIdIndex = 0;
function addActivePlayerId(): void {
    if(playerIds[nextPlayerIdIndex] === undefined) {
        return;
    }
    activePlayerIds.push(playerIds[nextPlayerIdIndex++]);
}
async function addNewPlayersPortfolio(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
): Promise<void> {
    const newPortfolio = JSON.parse(JSON.stringify(portfolio));
    newPortfolio.shares = newPortfolio.shares.filter(({ playerId }) => activePlayerIds.indexOf(playerId) > -1);
    // console.log(activePlayerIds);
    // console.log(JSON.stringify(newPortfolio.shares, null, 4));
    await addPortfolio(oauth, credentials, spreadsheetId, newPortfolio);
}
function getSellPrices(): number[] {
    const activeSellPrices: number[] = [];
    for(const playerId of activePlayerIds) {
        activeSellPrices.push(sellPrices[playerId]);
    }
    return activeSellPrices;
}
function getBuyPrices(): number[] {
    const activeBuyPrices: number[] = [];
    for(const playerId of activePlayerIds) {
        activeBuyPrices.push(buyPrices[playerId]);
    }
    return activeBuyPrices;
}
function setNewPrices(): void {
    for(const { playerId } of portfolio.shares) {
        const buyPrice = buyPrices[playerId] + (Math.random() <= priceIncreaseProbabilities[playerId] ? 1 : -1);
        const sellPrice = Math.round(buyPrice - buyPrice * ((2 + Math.random() * 5)/100));
        buyPrices[playerId] = buyPrice;
        sellPrices[playerId] = sellPrice;
    }
}
function setNewDividends(): void {
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    function shuffle(a): string[] {
        a = JSON.parse(JSON.stringify(a));
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
    const shuffledPlayerIds = shuffle(playerIds);
    // reset all dividends
    for(const playerId of playerIds) {
        matchDividends[playerId] = 0;
        mediaDividends[playerId] = 0;
    }
    for(let i = 0; i < 4; i++) {
        matchDividends[shuffledPlayerIds[i]] = 8;
    }
    mediaDividends[shuffledPlayerIds[4]] = 3;
}
let day = 0;
let totalValue = 23053;
let updates = 0;
async function update(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
): Promise<void> {
    await updateSpreadsheet(
        oauth,
        credentials,
        spreadsheetId,
        {
            sellPrices: getSellPrices(),
            buyPrices: getBuyPrices(),
            dayChanges: [],
            weekChanges: [],
            monthChanges: [],
            mediaDividends: Object.values(mediaDividends),
            matchDayDividends: Object.values(matchDividends),
        },
        {
            buyPrices: [],
        },
    );
}
async function addDailySummary(
    oauth: OAuth2Client,
    credentials: Credentials,
    spreadsheetId: string,
): Promise<void> {
    const dailySummary = await getDailySummary(oauth, credentials, spreadsheetId);
    if(dailySummary === null) {
        return;
    }

    if(dailySummary.isFirstDailySummary) {
        await updateValues(
            oauth,
            credentials,
            spreadsheetId,
            [{
                sheet: SheetName.DailySummary,
                range: `A2:A${getColumnLetterFromIndex(dailySummaryColumns.length - 1)}`,
                values: [[
                    `=(${Date.now() - 24 * 60 * 60 * 1000} / 1000 / 86400) + DATE(1970, 1, 1)`,
                    dailySummary.totalValue,
                    dailySummary.change,
                    dailySummary.percentageChange,
                    dailySummary.mediaDividends,
                    dailySummary.matchDayDividends,
                ]]
            }],
        );
    } else {
        await appendValues(
            oauth,
            credentials,
            spreadsheetId,
            SheetName.DailySummary,
            [[
                `=(${Date.now() - 24 * 60 * 60 * 1000} / 1000 / 86400) + DATE(1970, 1, 1)`,
                dailySummary.totalValue,
                dailySummary.change,
                dailySummary.percentageChange,
                dailySummary.mediaDividends,
                dailySummary.matchDayDividends,
            ]],
        );
    }
}

const userId = 6;
const spreadsheetId = '1w70t3jF6hFXCPPcGdpHEXCnexFlS-hZincDRTj_69hE';

(async () => {
    const client = new Client();
    await client.connect();
    const database = new Database(client);

    let oauthClientId: string;
    let oauthClientSecret: string;
    let oauthRedirectUri: string;

    const { env } = process;
    if(env.NODE_ENV === 'production') {
        if(env.GOOGLE_PROD_OAUTH2_CLIENT_ID === undefined) {
            console.error('Undefined environment variable GOOGLE_PROD_OAUTH2_CLIENT_ID');
            return;
        }
        if(env.GOOGLE_PROD_OAUTH2_CLIENT_SECRET === undefined) {
            console.error('Undefined environment variable GOOGLE_PROD_OAUTH2_CLIENT_SECRET');
            return;
        }
        if(env.GOOGLE_PROD_OAUTH2_REDIRECT_URI === undefined) {
            console.error('Undefined environment variable GOOGLE_PROD_OAUTH2_REDIRECT_URI');
            return;
        }
        oauthClientId = env.GOOGLE_PROD_OAUTH2_CLIENT_ID;
        oauthClientSecret = env.GOOGLE_PROD_OAUTH2_CLIENT_SECRET;
        oauthRedirectUri = env.GOOGLE_PROD_OAUTH2_REDIRECT_URI;
    } else {
        if(env.GOOGLE_TEST_OAUTH2_CLIENT_ID === undefined) {
            console.error('Undefined environment variable GOOGLE_TEST_OAUTH2_CLIENT_ID');
            return;
        }
        if(env.GOOGLE_TEST_OAUTH2_CLIENT_SECRET === undefined) {
            console.error('Undefined environment variable GOOGLE_TEST_OAUTH2_CLIENT_SECRET');
            return;
        }
        if(env.GOOGLE_TEST_OAUTH2_REDIRECT_URI === undefined) {
            console.error('Undefined environment variable GOOGLE_TEST_OAUTH2_REDIRECT_URI');
            return;
        }
        oauthClientId = env.GOOGLE_TEST_OAUTH2_CLIENT_ID;
        oauthClientSecret = env.GOOGLE_TEST_OAUTH2_CLIENT_SECRET;
        oauthRedirectUri = env.GOOGLE_TEST_OAUTH2_REDIRECT_URI;
    }

    const auth = new google.auth.OAuth2(oauthClientId, oauthClientSecret, oauthRedirectUri);

    const credentials = await database.getCredentials(userId);

    if(credentials !== null) {
        for(let i = 0; i < 30; i++) {
            addActivePlayerId();
        }
        addNewPlayersPortfolio(auth, credentials, spreadsheetId);

        setInterval(() => {
            setNewPriceProbabilities();
        }, 70000);

        // setInterval(() => {
        //     addDailySummary(auth, credentials, spreadsheetId);
        // }, 3000);

        setInterval(() => {
            setNewPrices();
            setNewDividends();
            update(auth, credentials, spreadsheetId);
        }, 2000);
        // setInterval(() => {
        //     // addActivePlayerId();
        //     addNewPlayersPortfolio(auth, credentials, spreadsheetId);
        // }, 15000);
    }
})();
