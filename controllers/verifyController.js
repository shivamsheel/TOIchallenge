
const ACCOUNT_SID1= process.env.ACCOUNT_SID1;
const AUTH_TOKEN1= process.env.AUTH_TOKEN1; // changed
const VERIFY_SERVICE_SID1= process.env.VERIFY_SERVICE_SID1;

const client = require('twilio')(ACCOUNT_SID1, AUTH_TOKEN1);

exports.getCode = async (phone, channel) => {
    return client
        .verify
        .services(VERIFY_SERVICE_SID1)
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
        .services(VERIFY_SERVICE_SID1)
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
