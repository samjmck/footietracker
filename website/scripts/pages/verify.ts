import '../../styles/pages/verify.scss';
import { apiDomain } from "../api-domain";

const urlParams = new URLSearchParams(window.location.search);
const hmac = urlParams.get('hmac');
const id = urlParams.get('id');

(async () => {
    await fetch(`${apiDomain}/users/verify_account`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            hmac,
        }),
    });
})();
