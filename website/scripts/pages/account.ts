import '../layout/header.ts';
import '../../styles/pages/account.scss';
import { apiDomain } from "../api-domain";

const emailElement = <HTMLInputElement> document.getElementById('email');
const newEmailElement = <HTMLInputElement> document.getElementById('new-email');
const confirmPasswordElement = <HTMLInputElement> document.getElementById('confirm-password');
const referralCodeElement = <HTMLInputElement> document.getElementById('referral-code');
const openSheetsElement = <HTMLAnchorElement> document.getElementById('open-sheets');
const logoutElement = <HTMLButtonElement> document.getElementById('logout');
const viewBillingDetailsElement = <HTMLButtonElement> document.getElementById('view-billing-details');

const sendEmailVerificationResponse = document.getElementById('send-email-verification-response');
const changePasswordResponseElement = document.getElementById('request-password-change-response');

(async() => {
    const response = await fetch(`${apiDomain}/users`, {
        method: 'GET',
        credentials: 'include',
    });
    const data = await response.json();

    emailElement.value = data.email;
    referralCodeElement.value = data.referralCode;
    openSheetsElement.href += data.spreadsheetId;

    document.getElementById('request-password-change').addEventListener('click', async () => {
        const response = await fetch(`${apiDomain}/users/request_password_change`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                email: data.email,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        changePasswordResponseElement.innerText = (await response.json()).message;
    });

    document.getElementById('send-verification-email').addEventListener('click', async event => {
        const response = await fetch(`${apiDomain}/users/request_email_change`, {
            method: 'POST',
            body: JSON.stringify({
                email: newEmailElement.value,
                password: confirmPasswordElement.value,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        sendEmailVerificationResponse.innerText = (await response.json()).message;
    });

    viewBillingDetailsElement.addEventListener('click', () => {
        window.location.href = `${apiDomain}/subscriptions/redirect_billing_portal`;
    });

    logoutElement.addEventListener('click', async event => {
        window.localStorage.removeItem('logged-in');
        window.location.pathname = '/';
        await fetch(`${apiDomain}/users/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    });
})();
