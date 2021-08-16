import '../layout/header.ts';
import '../../styles/pages/login.scss';
import { apiDomain } from "../api-domain";
import { redirectBasedOnLoginStatus } from "../user";

redirectBasedOnLoginStatus(null, '/account');

const responseElement = document.getElementById('response');

document.getElementById('login-button').addEventListener('click', async event => {
    event.preventDefault();

    const email = (<HTMLInputElement> document.getElementById('email')).value;
    const password = (<HTMLInputElement> document.getElementById('password')).value;

    const response = await fetch(`${apiDomain}/users/create_session`, {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if(response.status === 202) {
        window.localStorage.setItem('logged-in', 'true');
        window.location.pathname = '/account';
    } else {
        responseElement.innerText = (await response.json()).message;
    }
});
