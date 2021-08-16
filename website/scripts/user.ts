export function isLoggedIn(): boolean {
    return window.localStorage.getItem('logged-in') !== null;
}

export function redirectBasedOnLoginStatus(notLoggedInPath = '/login', loggedInPath = '/account'): void {
    if(isLoggedIn()) {
        if(loggedInPath) {
            window.location.pathname = loggedInPath;
        }
        return;
    }

    if(notLoggedInPath) {
        window.location.pathname = notLoggedInPath;
    }
}
