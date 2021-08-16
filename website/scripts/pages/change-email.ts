import '../../styles/pages/change-email.scss';
import { apiDomain } from "../api-domain";

const emailInputElement = <HTMLInputElement> document.getElementById('email');
const responseElement = <HTMLParagraphElement> document.getElementById('response');

const urlParams = new URLSearchParams(window.location.search);
const hmac = urlParams.get('hmac');
const time = urlParams.get('time');
const id = urlParams.get('id');

document.getElementById('submit-button').addEventListener('click', async () => {
    const response = await fetch(`${apiDomain}/users/verify_email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            time,
            hmac,
            email: emailInputElement.value,
        }),
    });

    const responseText = (await response.json()).message;
    responseElement.innerText = responseText;
});
