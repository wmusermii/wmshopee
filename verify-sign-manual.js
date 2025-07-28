const crypto = require('crypto');

const baseString = '2011942/api/v2/auth/access_token/get1753636515119070787';
const clientSecret = 'shpk6e44424a53644f786f636a62434741496d6e4944454d566e526e5a654a63'; // ganti dengan clientSecret asli kamu

const sign = crypto.createHmac('sha256', clientSecret).update(baseString).digest('hex');
console.log('SIGN:', sign);
