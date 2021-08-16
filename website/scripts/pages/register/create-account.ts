import '../../layout/header.ts';
import '../../../styles/pages/register/create-account.scss';
import { apiDomain } from "../../api-domain";
import { redirectBasedOnLoginStatus } from "../../user";

declare var process: any;

redirectBasedOnLoginStatus(null, '/register/connect-google-sheets');

const stripeKey = process.env.STRIPE_PUBLIC_KEY;
const stripeSpreadsheetProductId = process.env.STRIPE_SPREADSHEET_PRODUCT_ID;
const stripeSpreadsheetPlanId = process.env.STRIPE_SPREADSHEET_PLAN_ID;

const stripe = Stripe(stripeKey);

const urlParams = new URLSearchParams(window.location.search);
const affiliateId = urlParams.get('aff');
const couponCode = urlParams.get('coupon');
if(couponCode !== null) {
    (<HTMLInputElement> document.getElementById('coupon')).value = couponCode;
}

function getValue(id: string): string {
    return (<HTMLInputElement> document.getElementById(id)).value;
}

const responseElement = document.getElementById('response');

let busy = false;

document.getElementById('sign-up').addEventListener('click', async event => {
    event.preventDefault();
    if(busy) {
        return;
    }

    const [
        email,
        password,
        coupon,
    ] = [
        getValue('email'),
        getValue('password'),
        getValue('coupon'),
    ];

    if(email === '' || password === '') {
        return;
    }

    busy = true;
    if(coupon !== '') {
        const response = await fetch(`${apiDomain}/subscriptions/coupon/${coupon}`);
        if(response.status !== 200) {
            responseElement.innerText = 'Coupon does not exist.';
            busy = false;
            return;
        }
    }

    const response = await fetch(`${apiDomain}/users/${email}`, {
        method: 'PUT',
        body: JSON.stringify({
            password,
            coupon,
            affiliateId,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if(response.status === 201) {
        responseElement.innerText = 'Successfully created account. Redirecting to checkout page...';
        window.localStorage.setItem('logged-in', 'true');

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

        return;
    }

    const json = await response.json();
    if(json.error) {
        responseElement.innerText = json.error;
    } else {
        responseElement.innerText = 'An unknown error has occurred.';
    }
    busy = false;
});
