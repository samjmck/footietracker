import '../../layout/header.ts';
import '../../../styles/pages/register/connect-google-sheets.scss';
import { apiDomain } from "../../api-domain";
import { redirectBasedOnLoginStatus } from "../../user";

redirectBasedOnLoginStatus('/register/create-account', null);

document.getElementById('google-continue').addEventListener('click', () => {
    window.location.href = `${apiDomain}/users/redirect_google_auth`;
});
