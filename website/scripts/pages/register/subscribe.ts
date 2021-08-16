import '../../layout/header.ts';
import '../../../styles/pages/register/subscribe.scss';
import { apiDomain } from "../../api-domain";
import { redirectBasedOnLoginStatus } from "../../user";

// redirectBasedOnLoginStatus('/register/create-account', null);

const urlParams = new URLSearchParams(window.location.search);
const couponCode = urlParams.get('coupon');

const stripeKey = process.env.STRIPE_PUBLIC_KEY;
const stripeSpreadsheetProductId = process.env.STRIPE_SPREADSHEET_PRODUCT_ID;
const stripeSpreadsheetPlanId = process.env.STRIPE_SPREADSHEET_PLAN_ID;

const stripe = Stripe(stripeKey);

const couponElement = <HTMLInputElement> document.getElementById('coupon-code');
const responseElement = document.getElementById('response');

document.getElementById('subscribe-button').addEventListener('click', async event => {
    const coupon = couponElement.value;
    if(coupon !== '') {
        const response = await fetch(`${apiDomain}/subscriptions/coupon/${coupon}`);
        if(response.status !== 200) {
            responseElement.innerText = 'Coupon does not exist.';
            return;
        }
    }

    const response = await fetch(`${apiDomain}/subscriptions/create_checkout_session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            priceId: stripeSpreadsheetPlanId,
            coupon,
        }),
        credentials: 'include',
    });
    const result = await response.json();

    await stripe.redirectToCheckout({ sessionId: result.sessionId });
});

if(/Mobi/.test(navigator.userAgent)) {
    document.getElementById('using-mobile-device').style.display = 'block';
}


