import '../../styles/pages/forgot-password.scss';
import { apiDomain } from "../api-domain";

const responseElement = document.getElementById('response');
const emailElement = <HTMLInputElement> document.getElementById('email');

document.getElementById('submit-button').addEventListener('click', async () => {
    if(emailElement.value === '') {
        return;
    }

    const response = await fetch(`${apiDomain}/users/request_password_change`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: emailElement.value,
        }),
    });

    const responseText = (await response.json()).message;
    responseElement.innerText = responseText;
});
