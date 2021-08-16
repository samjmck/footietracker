import Stripe from "stripe";
import * as crypto from "crypto";
import { Router } from "express";
import * as bodyParser from 'body-parser';
import { getCheckAuthenticatedMiddleware } from "../../util/route";
import { HttpStatusCode } from "../../util/HttpStatusCode";
import { Database } from "../../storage/Database";

export function getSubscriptionsRouter(
    usersDatabase: Database,
    stripe: Stripe,
    stripeWebhookSecret: string,
    domain: string,
    jwtSecret: string,
    hmacSecret: string,
): Router {
    const router = Router();

    const checkAuthenticated = getCheckAuthenticatedMiddleware(jwtSecret);

    router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async(request, response) => {
        if(request.headers['stripe-signature'] === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        try {
            const event = stripe.webhooks.constructEvent(request.body, request.headers['stripe-signature'], stripeWebhookSecret);

            switch (event.type) {
                case 'checkout.session.completed':
                    const checkoutSession = <any> event.data.object;

                    const subscriptionId = checkoutSession.subscription;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    await stripe.coupons.create({
                        percent_off: 15,
                        duration: 'forever',
                        max_redemptions: 1,
                        metadata: {
                            referralCustomerId: checkoutSession.customer,
                            referralSubscriptionId: subscriptionId,
                        },
                        id: crypto.createHmac('sha1', hmacSecret).update(`referral-${checkoutSession.customer}`).digest('hex'),
                    });
                    await stripe.coupons.create({
                        percent_off: 15 + 10,
                        duration: 'forever',
                        max_redemptions: 1,
                        id: crypto.createHmac('sha1', hmacSecret).update(`referral+referrer-${checkoutSession.customer}`).digest('hex'),
                    });
                    await stripe.coupons.create({
                        percent_off: 10,
                        duration: 'forever',
                        max_redemptions: 1,
                        id: crypto.createHmac('sha1', hmacSecret).update(`referrer-${checkoutSession.customer}`).digest('hex'),
                    });

                    // If this client is using a coupon code then we need to give the referrer
                    // a discount. The referrer's discount will be 10% or if they have also
                    // used a referral discount, it will be a total of 25%
                    if(subscription.discount !== null) {
                        const referralSubscriptionId = subscription.discount.coupon.metadata.referralSubscriptionId;
                        const referralCustomerId = subscription.discount.coupon.metadata.referralCustomerId;

                        if(referralSubscriptionId !== undefined) {
                            const referrerSubscription = await stripe.subscriptions.retrieve(referralSubscriptionId);

                            // Referrer is already using discount - apply combined discount
                            if(referrerSubscription.discount !== null) {
                                await stripe.subscriptions.update(referralSubscriptionId, {
                                    coupon: crypto.createHmac('sha1', hmacSecret).update(`referral+referrer-${referralCustomerId}`).digest('hex'),
                                });
                            // Referrer is not using any discount - just give them a referral discount
                            } else {
                                await stripe.subscriptions.update(referralSubscriptionId, {
                                    coupon: crypto.createHmac('sha1', hmacSecret).update(`referrer-${referralCustomerId}`).digest('hex'),
                                });
                            }
                        }
                    }
                    break;
                case 'invoice.paid':
                    const invoice = <any> event.data.object;
                    await usersDatabase.updateUserSubscriptionEnd(
                        invoice.customer,
                        invoice.lines.data[0].period.end * 1000 + 2 * 24 * 60 * 60 * 1000
                    );
                    break;
            }

            // Return a response to acknowledge receipt of the event
            response.json({ received: true });
        } catch (err) {
            response.status(400).send(`Webhook error: ${err.message}`);
        }
    });

    router.get('/redirect_billing_portal', checkAuthenticated, async(request, response) => {
        const data = await stripe.billingPortal.sessions.create({
            customer: request.user.customerId,
            return_url: `${domain}/account`,
        });
        return response.redirect(data.url);
    });

    router.get('/coupon/:coupon', async(request, response) => {
        const coupon = request.params.coupon;
        try {
            await stripe.coupons.retrieve(coupon);
            return response.sendStatus(HttpStatusCode.Ok);
        } catch(error) {
            return response.sendStatus(HttpStatusCode.NotFound);
        }
    });

    router.post('/create_checkout_session', checkAuthenticated, async(request, response) => {
        if(request.body.priceId === undefined) {
            return response.sendStatus(HttpStatusCode.UnprocessableEntity);
        }

        const subscriptionData: { coupon?: string } = {};
        if(request.body.coupon) {
            subscriptionData.coupon = request.body.coupon;
        } else {
            subscriptionData.coupon = "1FREE";
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: request.user.customerId,
            line_items: [
                {
                    price: request.body.priceId,
                    quantity: 1,
                },
            ],
            subscription_data: subscriptionData,
            // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
            success_url: `${domain}/register/connect-google-sheets${process.env.NODE_ENV === 'development' ? '.html' : ''}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/register/subscribe${process.env.NODE_ENV === 'development' ? '.html' : ''}${request.body.coupon === undefined ? '' : `?coupon=${request.body.coupon}`}`,
        });

        response.send({ sessionId: session.id });
    });

    return router;
}
