import '../layout/header.ts';
import '../../styles/pages/index.scss';

const urlParams = new URLSearchParams(window.location.search);
const couponCode = urlParams.get('coupon');
if(couponCode !== null) {
    (<HTMLAnchorElement> document.getElementById('sign-up-subscribe')).href += `?coupon=${couponCode}`;
    (<HTMLAnchorElement> document.getElementById('subscribe-button')).href += `?coupon=${couponCode}`;
}

