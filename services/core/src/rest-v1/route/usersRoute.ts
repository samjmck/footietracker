import { Router } from "express";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import Stripe from 'stripe';
import * as crypto from "crypto";
import { MailService } from "@sendgrid/mail/src/mail";
import { getCheckAuthenticatedMiddleware, getCookieOptions } from "../../util/route";
import { Database } from "../../storage/Database";
import { HttpStatusCode } from "../../util/HttpStatusCode";
import { OAuth2Client } from "google-auth-library";
import { getAuthUrl, getCredentials } from "../../util/googleAuth";
import { createAndFormatFootietrackerSpreadsheet } from "../../spreadsheet/createAndFormat";
import { addPortfolio } from "../../spreadsheet/spreadsheet";
import { logger } from "../../util/logger";

export function getUsersRouter(
    database: Database,
    oauth: OAuth2Client,
    stripe: Stripe,
    recaptchaSecret: string,
    jwtSecret: string,
    hmacSecret: string,
    domain: string,
    sendGrid: MailService,
): Router {
    const checkAuthenticated = getCheckAuthenticatedMiddleware(jwtSecret);

    const router = Router();

    router.get('/', checkAuthenticated, async(request, response) => {
        const user = await database.getUser({ id: request.user.id });
        if(user === null) {
            return response.sendStatus(HttpStatusCode.NotFound);
        }
        response.json({
            id: user.id,
            customerId: user.stripe_customer_id,
            email: user.email,
            spreadsheetId: user.spreadsheet_id,
            referralCode: crypto.createHmac('sha1', hmacSecret).update(`referral-${user.stripe_customer_id}`).digest('hex'),
        });
    });

    router.post('/request_password_change', async(request, response) => {
        if(request.body.email === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        const user = await database.getUser({ email: request.body.email });
        if(user === null) {
            return response.sendStatus(HttpStatusCode.NotFound);
        }

        if(process.env.NODE_ENV !== 'development') {
            const time = Date.now();
            const changeLink = `${domain}/change-password?hmac=${crypto.createHmac('sha1', hmacSecret).update(`change-password-${time}-${user.id}-${user.hash}`).digest('hex')}&id=${user.id}&time=${time}`;
            sendGrid.send({
                to: user.email,
                from: 'no-reply@footietracker.com',
                subject: 'Change password',
                text: `A request has been made to change your Footietracker password. Open this link to change your password: ${changeLink}. If you didn't make this request, please ignore this email.`,
                html: `A request has been made to change your Footietracker password. <a href="${changeLink}">Open this link to change your password</a>. If you didn't make this request, please ignore this email.`,
            });
        }
        return response.status(HttpStatusCode.Accepted).send({ message: `Password change email sent to ${user.email}` });
    });

    router.post('/change_password', async(request, response) => {
        if(request.body.id === undefined || request.body.time === undefined || request.body.hmac === undefined || request.body.password === undefined) {
            return response.status(HttpStatusCode.UnprocessableEntity).send({ message: 'Link is incomplete' });
        }

        if(Date.now() > request.body.time + 24 * 60 * 60 * 1000) {
            return response.status(HttpStatusCode.Gone).send({ message: 'Request has expired' });
        }

        const user = await database.getUser({ id: request.body.id });
        if(user === null) {
            return response.status(HttpStatusCode.NotFound).send({ message: 'User does not exist' });
        }

        if(crypto.createHmac('sha1', hmacSecret).update(`change-password-${request.body.time}-${request.body.id}-${user.hash}`).digest('hex') !== request.body.hmac) {
            return response.status(HttpStatusCode.Unauthorized).send({ message: 'Request is unauthorized' });
        }

        try {
            await database.updateUserHash(user.id, await hash(request.body.password, 12));
            return response.status(HttpStatusCode.Ok).send({ message: 'Password changed' });
        } catch(error) {
            return response.status(HttpStatusCode.InternalServerError).send({ message: 'Server error, please contact support@footietracker.com' });
        }
    });

    router.post('/request_email_change', checkAuthenticated, async(request, response) => {
        if(request.body.email === undefined || request.body.password === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        const user = await database.getUser({ id: request.user.id });
        if(user === null) {
            return response.sendStatus(HttpStatusCode.NotFound);
        }

        if(await compare(request.body.password, user.hash)) {
            if(process.env.NODE_ENV !== 'development') {
                const time = Date.now();
                const verifyLink = `${domain}/change-email?hmac=${crypto.createHmac('sha1', hmacSecret).update(`change-email-${request.body.email}-${user.id}-${time}`).digest('hex')}&id=${user.id}&time=${time}`;
                sendGrid.send({
                    to: request.body.email,
                    from: 'no-reply@footietracker.com',
                    subject: 'Verify your email',
                    text: `A request has been made to change your email address for your Footietracker account. Please verify your email with this link: ${verifyLink}. If you didn't make this request, please ignore this email.`,
                    html: `A request has been made to change your email address for your Footietracker account. <a href="${verifyLink}">Please verify your email with this link.</a> If you didn't make this request, please ignore this email.`,
                });
            }
            return response.status(HttpStatusCode.Accepted).send({ message: `Verification email sent to ${request.body.email}` });
        }

        response.status(HttpStatusCode.Unauthorized).send({ message: 'Wrong password' });
    });

    router.post('/verify_email', async(request, response) => {
        if(request.body.email === undefined || request.body.time === undefined || request.body.hmac === undefined || request.body.id === undefined) {
            return response.status(HttpStatusCode.UnprocessableEntity).send({ message: 'Link is incomplete' });
        }

        const user = await database.getUser({ id: request.body.id });
        if(user === null) {
            return response.status(HttpStatusCode.NotFound).send({ message: 'User does not exist' });
        }

        if(crypto.createHmac('sha1', hmacSecret).update(`change-email-${request.body.email}-${request.body.id}-${request.body.time}`).digest('hex') !== request.body.hmac) {
            return response.status(HttpStatusCode.Unauthorized).send({ message: 'Request is unauthorized' });
        }

        try {
            await database.updateUserEmail(user.id, request.body.email);
            return response.status(HttpStatusCode.Ok).send({ message: 'Email verified and changed' });
        } catch(error) {
            return response.status(HttpStatusCode.InternalServerError).send({ message: 'Server error, please contact support@footietracker.com' });
        }
    });

    router.put('/:email', async (request, response) => {
        const { email } = request.params;

        if(request.body.password === undefined) {
            logger.error({ req_path: request.path, email, message: 'Undefined body property "password"' });
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        const { password } = request.body;

        const customer = await stripe.customers.create({
            email,
        });
        logger.info({ req_path: request.path, message: 'Stripe customer created', email, customerId: customer.id });

        try {
            const { id } = await database.createUser(email, customer.id, await hash(password, 12));
            logger.info({ req_path: request.path, message: 'User created', email, customerId: customer.id });

            await stripe.customers.update(customer.id, {
                metadata: {
                    userId: id,
                    affiliateId: request.body.affiliateId,
                },
            });
            logger.info({ req_path: request.path, message: 'Stripe metadata updated', email, customerId: customer.id });

            const verifyLink = `${domain}/verify?hmac=${crypto.createHmac('sha1', hmacSecret).update(`verify-account-${id}`).digest('hex')}&id=${id}`;

            if(process.env.NODE_ENV !== 'development') {
                sendGrid.send({
                    to: email,
                    from: 'no-reply@footietracker.com',
                    subject: 'Verify your Footietracker account',
                    text: `Thank you for creating a Footietracker account. Please verify your account with this link: ${verifyLink}`,
                    html: `Thank you for creating a Footietracker account. Please verify your account with <a href="${verifyLink}">this link</a>.`,
                });
            }

            return response
                .status(HttpStatusCode.Created)
                .cookie(
                    'jwt',
                    sign({ id: id, customerId: customer.id }, jwtSecret),
                    getCookieOptions(),
                )
                .send();
        } catch(error) {
            logger.error({ message: 'Could not create user', email, error });
            await stripe.customers.del(customer.id);
            return response
                .status(HttpStatusCode.UnprocessableEntity)
                .send({ message: 'Username or email already exists.' });
        }
    });

    router.post('/verify_account', async(request, response) => {
        if(request.body.id === undefined || request.body.hmac === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        if(crypto.createHmac('sha1', hmacSecret).update(`verify-account-${request.body.id}`).digest('hex') !== request.body.hmac) {
            return response.sendStatus(HttpStatusCode.Unauthorized);
        }

        try {
            await database.setUserIsEmailVerified(Number(request.body.id));
            return response.sendStatus(HttpStatusCode.Ok);
        } catch(error) {
            return response.sendStatus(HttpStatusCode.InternalServerError);
        }
    });

    router.post('/create_session', async(request, response) => {
        if(request.body.email === undefined || request.body.password === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        try {
            const user = await database.getUser({ email: request.body.email });
            if(user === null) {
                return response
                    .status(HttpStatusCode.NotFound)
                    .send({ message: 'User not found' });
            }
            if(await compare(request.body.password, user.hash)) {
                return response
                    .status(HttpStatusCode.Accepted)
                    .cookie(
                        'jwt',
                        sign(
                            {
                                id: user.id,
                                customerId: user.stripe_customer_id,
                            },
                            jwtSecret
                        ),
                        getCookieOptions()
                    ).send();
            }
            response
                .status(HttpStatusCode.Unauthorized)
                .send({ message: 'Wrong password' });
        } catch(error) {
            return response
                .status(HttpStatusCode.InternalServerError)
                .send({ message: 'Postgres returned error' });
        }
    });

    router.post('/logout', checkAuthenticated, async(request, response) => {
        response.clearCookie('jwt').sendStatus(HttpStatusCode.Ok);
    })

    router.get('/redirect_google_auth', checkAuthenticated, async (request, response) => {
        if(request.cookies.jwt === undefined) {
            return response.sendStatus(HttpStatusCode.Unauthorized);
        }

        return response.redirect(await getAuthUrl(oauth));
    });

    router.post('/send_auth_code', checkAuthenticated, async (request, response) => {
        const userId = request.user.id;
        if(request.body.code === undefined) {
            logger.error({ req_path: request.path, userId, message: 'Body does not contain code' });
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }
        const user = await database.getUser({ id: request.user.id });
        if(user === null) {
            logger.error({ req_path: request.path, userId, message: 'User not found' });
            return response.sendStatus(HttpStatusCode.NotFound);
        }

        const { id, subscription_end: subscriptionEnd } = user;
        const { code } = request.body;

        const credentials = await getCredentials(oauth, code);
        if(credentials === null) {
            logger.error({ req_path: request.path, userId, message: 'Could not get credentials' });
            return response.sendStatus(HttpStatusCode.NotFound);
        }

        if(subscriptionEnd === null) {
            logger.error({ req_path: request.path, userId, message: 'No subscription end. Does user have an active subscription?' });
            return response.sendStatus(HttpStatusCode.NotFound);
        }
        if(subscriptionEnd < Date.now()) {
            logger.error({ req_path: request.path, userId, message: 'Subscription has ended' });
            return response.sendStatus(HttpStatusCode.Forbidden);
        }
        database.setCredentials(id, credentials);

        logger.info({ req_path: request.path, userId, message: 'Creating and formatting spreadsheet' });
        const spreadsheetId = await createAndFormatFootietrackerSpreadsheet(oauth, credentials);
        if(spreadsheetId === null) {
            logger.error({ req_path: request.path, userId, message: 'Was not able to create and format spreadsheet' });
            return response.sendStatus(HttpStatusCode.InternalServerError);
        }
        logger.info({ req_path: request.path, userId, message: 'Created and formatted spreadsheet', spreadsheetId });
        database.setSpreadsheetId(id, spreadsheetId);

        return response.status(HttpStatusCode.Created).send({ spreadsheetId });
    });

    router.post('/send_portfolio', checkAuthenticated, async (request, response) => {
        const userId = request.user.id;

        logger.info({ req_path: request.path, userId });
        if(request.body.portfolio === undefined) {
            logger.error({ req_path: request.path, message: 'Body does not contain portfolio', userId });
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        logger.info({ req_path: request.path, message: 'Updating portfolio', userId });
        const user = await database.getUser({ id: userId });
        if(user === null) {
            logger.error({ req_path: request.path, message: 'User does not exist', userId });
            return response.sendStatus(HttpStatusCode.NotFound);
        }
        const { spreadsheet_id: spreadsheetId, google_credentials: credentials, subscription_end: subscriptionEnd } = user;
        if(subscriptionEnd < Date.now()) {
            logger.error({ req_path: request.path, message: 'Subscription has ended', userId });
            return response.sendStatus(HttpStatusCode.Forbidden);
        }

        await addPortfolio(oauth, credentials, spreadsheetId, request.body.portfolio);

        logger.info({ req_path: request.path, message: 'Successfully added portfolio', spreadsheetId, userId });

        response
            .sendStatus(HttpStatusCode.Accepted);
    });

    router.post('/debug_portfolio', checkAuthenticated, async (request, response) => {
        const userId = request.user.id;

        if(request.body === undefined) {
            logger.error({ req_path: request.path, userId, message: 'Body does not contain any data' });
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        logger.info({ req_path: request.path, message: 'Received portfolio debug data', userId, debugData: request.body });

        response
            .sendStatus(HttpStatusCode.Accepted);
    });

    return router;
}
