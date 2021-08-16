import { connect } from 'puppeteer';
import * as WebSocket from 'ws';

interface ChangeServerMessage {
    t: 'c';
    d: {
        t: string;
        d: {
            ts: number;
            v: string;
            h: string;
            s: string;
        };
    };
}

function isChangeServerMessage(message: any): message is ChangeServerMessage {
    return message.t === 'c';
}

export async function getWebSocketUrl(): Promise<string> {
    if(process.env.FOOTBALLINDEX_HOMEPAGE) {
        // Launch browser and create page
        const browser = await connect({
            browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();

        // Make the page ready to listen for the WebSocket
        // Create Chrome Devtools Protocol session
        const cdpSession = await page.target().createCDPSession();
        // Listen to network traffic via the CDP session
        await cdpSession.send('Network.enable');

        let resolve: (url: string) => void = () => null;
        const promise = new Promise<string> (_resolve => resolve = _resolve);

        cdpSession.on('Network.webSocketCreated', async({ requestId, url }: { requestId: number, url: string }) => {
            console.log(url);
            resolve(url);
        });

        // Go to page now that we are listening for the right events
        await page.goto(process.env.FOOTBALLINDEX_HOMEPAGE);

        await promise;

        browser.close();

        return promise;
    }

    throw new Error(`FOOTBALLINDEX_HOMEPAGE environment variable not set`);
}

export type Listener = (message: object) => void;

export interface UninterruptedWebSocketConnection {
    addListener: (listener: Listener) => void;
}

export async function createUninterruptedWebSocketConnection(): Promise<UninterruptedWebSocketConnection> {
    const listeners: Listener[] = [];

    async function createWebSocketConnection(url: string): Promise<void> {
        const origin = 'https://www.footballindex.co.uk';

        // These are the first messages that need to be sent to the WSS
        // If they are not sent, none of the following messages will be listened to
        const initialMessages = [
            '{"t":"d","d":{"r":1,"a":"s","b":{"c":{"sdk.js.3-6-6":1}}}}',
            '{"t":"d","d":{"r":2,"a":"q","b":{"p":"/prices","h":""}}}',
            '{"t":"d","d":{"r":3,"a":"q","b":{"p":"/activity/5","h":""}}}',
        ];

        // Get the value of the ns parameter in the URL query
        // We need this to construct new WSS URLs as the server seems to change
        // every now and then and the URLs for those servers contain the ns
        // parameter
        let ns = url.slice(url.indexOf('ns=' + 3));
        ns = ns.slice(0, ns.indexOf('&') === -1 ? ns.length : ns.indexOf('&'));

        const webSocket = new WebSocket(url, {
            origin,
        });

        webSocket.on('error', async (error: string) => {
            console.error(error);
        });

        // Replicating browser behaviour on footballindex.co.uk
        webSocket.on('ping', data => webSocket.send('0'));

        let creatingNewWebSocketConnection = false;
        webSocket.onclose = async () => {
            webSocket.terminate();

            // Create a new WebSocket connection if there isn't already
            // one being made
            // Normally, the server sends a message with a new WebSocket URL we
            // can connect to but in the case that that doesn't happen and the current connection closes
            // anyway, we will manually fetch the new URL with a browser and create a new connection
            if(!creatingNewWebSocketConnection) {
                createWebSocketConnection(await getWebSocketUrl());
            }
        };

        let i = 0;
        let firstSend: number;
        webSocket.on('message', async message => {
            if(i++ === 0) {
                for(const initialMessage of initialMessages) {
                    webSocket.send(initialMessage);
                }

                firstSend = Date.now();
            } else {
                // The messages that the server sends back in the first ~2.5s are normally the same as the last few messages
                // of the previous WebSocket connection, so we ignore those messages as we could end up with duplicate messages otherwise
                // It is important to note that the 2500ms figure is a rough estimation and might result in some messages
                // being missed
                if(Date.now() - firstSend < 2500) {
                    return;
                }

                const data = JSON.parse(message.toString());

                // If the message is telling us to change server, construct the new URL, connect to that server and
                // shutdown the current connection
                if(isChangeServerMessage(data)) {
                    console.log('Switching WebSocketServer');

                    const newUrl = `wss://${data.d.d.h}/.ws?v=${data.d.d.v}&ls=${data.d.d.s}&ns=${ns}`;
                    createWebSocketConnection(newUrl);
                    creatingNewWebSocketConnection = true;
                    webSocket.close();
                    return;
                }

                // Otherwise just call the listeners
                for(const listener of listeners) {
                    listener(data);
                }
            }
        });
    }

    // Start the first connection
    createWebSocketConnection(await getWebSocketUrl());

    // Return object with addListener method so we can add listeners after creating the connection
    return {
        addListener: listener => {
            listeners.push(listener);
        },
    };
}
