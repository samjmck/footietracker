import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';

let baseUrl = '';
export function setBaseUrl(url: string): void {
    baseUrl = url;
}

let defaultHeaders: http.OutgoingHttpHeaders = {};
export function setDefaultHeaders(headers: http.OutgoingHttpHeaders): void {
    defaultHeaders = headers;
}

export enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export enum ContentType {
    Text,
    JSON,
    FormURLEncoded,
}

export interface Response<TResult = object> {
    statusCode: number;
    data: string;
    result?: TResult;
}

export interface Rejection {
    statusCode?: number;
    message: string;
}

export interface BaseRequestOptions {
    headers?: http.OutgoingHttpHeaders;
    parseJSONResponse?: boolean;
    query?: querystring.ParsedUrlQueryInput;
    timeout?: number;
}

export interface BaseDataRequestOptions extends BaseRequestOptions {
    body: string | object;
    contentType: ContentType;
}

export interface GETRequestOptions extends BaseRequestOptions {
    method: RequestMethod.GET;
}

export interface POSTRequestOptions extends BaseDataRequestOptions {
    method: RequestMethod.POST;
}

export interface PUTRequestOptions extends BaseDataRequestOptions {
    method: RequestMethod.PUT;
}

export interface DELETERequestOptions extends BaseDataRequestOptions {
    method: RequestMethod.DELETE;
}

export type RequestOptions =
    GETRequestOptions |
    POSTRequestOptions |
    PUTRequestOptions |
    DELETERequestOptions;

// not sure if I'm using generics correctly here?
export function makeRequest<TResult extends object>(
    url: string,
    options: RequestOptions,
): Promise<Response<TResult>> {
    let resolve: (response: Response<TResult>) => void;
    let reject: (rejection: Rejection) => void;
    const promise = new Promise<Response<TResult>>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    let headers = defaultHeaders;
    if(options.headers) {
        headers = Object.assign(defaultHeaders, options.headers);
    }

    const responseCallback = (response: http.IncomingMessage) => {
        if(response.statusCode) {
            console.log(`status code ${response.statusCode}`);
            response.setEncoding('utf8');

            let data = '';

            response.addListener('data', chunk => data += chunk);
            response.addListener('end', () => {
                if(response.statusCode && response.statusMessage) {
                    if(!options.parseJSONResponse) {
                        return resolve({
                            statusCode: response.statusCode,
                            data,
                        });
                    }

                    try {
                        return resolve({
                            statusCode: response.statusCode,
                            data,
                            result: <TResult> JSON.parse(data),
                        });
                    } catch(error) {
                        return reject({
                            message: `Could not parse JSON response: ${error.message}`,
                        });
                    }
                }
            });
        }
    };

    const actualUrl = baseUrl + url + (options.query ? `?${querystring.stringify(options.query)}` : '');
    const urlObject = new URL(actualUrl);

    console.log(`${options.method} ${actualUrl}`);
    const request = https.request(
        // baseUrl + id + (options.query ? `?${querystring.stringify(options.query)}` : ''), // fucking puppeteer breaks this shit, spent 2 hours trying to figure out what the fuck was going on.
        // i think it was puppeteer. might have been ws
        // anyway it's fixed for now. now i have shitty code though
        {
            host: urlObject.host,
            protocol: urlObject.protocol,
            path: urlObject.pathname + urlObject.search,
            headers,
            method: options.method,
        },
        responseCallback,
    );
    request.setTimeout(options.timeout ? options.timeout : 4000, () => {
        reject({ message: `Request timed out after ${options.timeout ? options.timeout : 4000}` });
        request.destroy();
    });

    function setBody(contentType: string, body: string): void {
        request.setHeader('Content-Type', contentType);
        request.setHeader('Content-Length', Buffer.byteLength(body));
        request.write(body);
    }

    function isObject(value: any): value is object {
        return typeof value === 'object';
    }

    switch(options.method) {
        case RequestMethod.POST:
        case RequestMethod.PUT:
        case RequestMethod.DELETE:
            switch(options.contentType) {
                case ContentType.Text:
                    setBody('text/plain; charset=utf-8', isObject(options.body) ? JSON.stringify(options.body) : options.body);
                    break;
                case ContentType.JSON:
                    setBody('application/json; charset=utf-8', isObject(options.body) ? JSON.stringify(options.body) : options.body);
                    break;
                case ContentType.FormURLEncoded:
                    setBody('application/x-www-form-urlencoded; charset=utf-8', querystring.stringify(isObject(options.body) ? options.body : JSON.parse(options.body)));
                    break;

            }
            break;
    }
    request.end();

    return promise;
}
