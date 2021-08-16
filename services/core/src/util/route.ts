import { HttpStatusCode } from './HttpStatusCode';
import { RequestHandler, CookieOptions } from 'express';
import { verify } from 'jsonwebtoken';

export function getCheckAuthenticatedMiddleware(jwtSecret: string): RequestHandler {
    return async (request, response, next) => {
        if(request.cookies.jwt === undefined && request.headers['x-jwt'] === undefined) {
            return response.sendStatus(HttpStatusCode.Unauthorized);
        }

        const jwt: string = request.cookies.jwt ?? request.headers['x-jwt'];

        try {
            request.user = <{ id: number, customerId: string }> verify(jwt, jwtSecret);
            next();
        } catch(error) {
            return response.sendStatus(HttpStatusCode.Unauthorized);
        }
    };
}

export function getCookieOptions(): CookieOptions {
    const cookieOptions: CookieOptions = {
        maxAge: 60 * 60 * 24 * 365 * 1000,
        httpOnly: true,
    };
    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    return cookieOptions;
}