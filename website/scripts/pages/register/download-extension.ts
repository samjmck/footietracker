import '../../layout/header.ts';
import '../../../styles/pages/register/download-extension.scss';
import { apiDomain } from "../../api-domain";
import { redirectBasedOnLoginStatus } from "../../user";

redirectBasedOnLoginStatus('/', null);

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

(async () => {
    if(code === null) {
        return;
    }

    const response = await fetch(`${apiDomain}/users/send_auth_code`, {
        method: 'POST',
        body: JSON.stringify({
            code,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if(response.status === 201) {
        const json = await response.json();
        (<HTMLAnchorElement> document.getElementById('sheets-link')).href += json.spreadsheetId;
    }
})();
