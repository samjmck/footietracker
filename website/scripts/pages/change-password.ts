import '../../styles/pages/change-password.scss';
import { apiDomain } from "../api-domain";

const passwordInputElement = <HTMLInputElement> document.getElementById('password');
const confirmPasswordInputElement = <HTMLInputElement> document.getElementById('confirm-password');
const responseElement = <HTMLParagraphElement> document.getElementById('response');

const urlParams = new URLSearchParams(window.location.search);
const hmac = urlParams.get('hmac');
const time = urlParams.get('time');
const id = urlParams.get('id');

document.getElementById('submit-button').addEventListener('click', async () => {
    if(passwordInputElement.value !== confirmPasswordInputElement.value) {
        responseElement.innerText = 'Passwords do not match.';
        return;
    }

    const response = await fetch(`${apiDomain}/users/change_password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            time,
            hmac,
            password: passwordInputElement.value,
        }),
    });

    const responseText = (await response.json()).message;
    responseElement.innerText = responseText;
});
