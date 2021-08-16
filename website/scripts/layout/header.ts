import { isLoggedIn } from "../user";

if(isLoggedIn()) {
    const loggedInElement = document.getElementsByClassName('logged-in');
    if(loggedInElement.length > 0) {
        (<HTMLElement> loggedInElement[0]).style.display = 'flex';
    }

    const userLinksElement = document.getElementById('user-links');
    if(userLinksElement !== null) {
        userLinksElement.style.display = 'none';
    }
}
