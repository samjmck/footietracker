import { Database } from "../storage/Database";
import { NextFunction, Request, RequestHandler, Response } from "express";
import * as express from "express";
import * as helmet from "helmet";
import * as cookieParser from "cookie-parser";
import Stripe from "stripe";
import * as sendGrid from '@sendgrid/mail';
import { getUsersRouter } from "./route/usersRoute";
import { getSubscriptionsRouter } from "./route/subscriptionsRoute";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../util/logger";

export async function addV1Routes(
    app: express.Express,
    oauth: OAuth2Client,
    database: Database,
): Promise<void> {
    const { env } = process;

    if(env.STRIPE_SECRET_KEY === undefined || env.STRIPE_WEBHOOK_SECRET === undefined) {
        logger.error('Undefined environment variables STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
        return;
    }

    if(env.RECAPTCHA_SECRET === undefined || env.JWT_SECRET === undefined) {
        logger.error('Undefined environment variables RECAPTCHA_SECRET or JWT_SECRET');
        return;
    }

    if(env.HMAC_SECRET === undefined) {
        logger.error('Undefined environment variable HMAC_SECRET');
        return;
    }

    if(env.SENDGRID_API_KEY === undefined) {
        logger.error('Undefined environment variable SENDGRID_API_KEY');
        return;
    }

    if(env.DOMAIN === undefined) {
        logger.error('Undefined environment variable DOMAIN');
        return;
    }

    const filter = (middleware: RequestHandler) => {
        return (request: Request, response: Response, next: NextFunction) => {
            if(request.originalUrl === '/v1/subscriptions/webhook') {
                return next();
            }
            return middleware(request, response, next);
        };
    };

    sendGrid.setApiKey(env.SENDGRID_API_KEY);
    const stripe = new Stripe(
        env.STRIPE_SECRET_KEY,
        {
            apiVersion: '2020-08-27',
        },
    );

    app.use(
        helmet(),
        filter(express.json({ limit: '5mb' })),
        filter(express.urlencoded({ extended: true })),
        filter(cookieParser()),
        (request, response, next) => {
            response.header('Access-Control-Allow-Origin', env.DOMAIN);
            response.header('Access-Control-Allow-Credentials', 'true');
            response.header('Access-Control-Allow-Headers', 'Set-Cookie, Content-Type, Cookie');
            response.header('Access-Control-Allow-Methods', 'POST, DELETE, GET, OPTIONS, PUT');
            next();
        },
    );
    const v1 = express.Router();
    v1.use('/users', getUsersRouter(
        database,
        oauth,
        stripe,
        env.RECAPTCHA_SECRET,
        env.JWT_SECRET,
        env.HMAC_SECRET,
        env.DOMAIN,
        sendGrid,
    ));
    v1.use('/subscriptions', getSubscriptionsRouter(
        database,
        stripe,
        env.STRIPE_WEBHOOK_SECRET,
        env.DOMAIN,
        env.JWT_SECRET,
        env.HMAC_SECRET
    ));
    app.use('/v1', v1);
}
