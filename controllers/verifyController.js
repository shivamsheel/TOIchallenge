let ACCOUNT_SID="AC592debfec8694fdca9503b300e6bb471"
let AUTH_TOKEN="c3fc84cb96824f156a7f8db785dcc652" // changed
let VERIFY_SERVICE_SID="VAe093d0523158de302a59d66a6a45ee8f"

const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

exports.getCode = async (phone, channel) => {
    return client
        .verify
        .services(VERIFY_SERVICE_SID)
        .verifications
        .create({
            to: `+${phone}`,
            channel
        })
        .then(data => {
           return data;
        })
};

exports.verifyCode = async (phonenumber, code) => {
   console.log(phonenumber, code);
   return client
        .verify
        .services(VERIFY_SERVICE_SID)
        .verificationChecks
        .create({
            to: phonenumber,
            code
        })
        .then(data => {
            return data;
        })
        .catch(err => console.log("error happened " + err));
};
