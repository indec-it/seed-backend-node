/* eslint-disable */
const {AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_ENDPOINT, GRANT_TYPE} = process.env;
const request = require('request');

let token = 'undefined';

const refreshToken = () => new Promise((resolve, reject) => request.post({
    url: `${AUTH_ENDPOINT}oauth/token`,
    body: {
        client_id: AUTH_CLIENT_ID,
        client_secret: AUTH_CLIENT_SECRET,
        grant_type: GRANT_TYPE
    },
    json: true
}, (err, response) => {
    if (err) {
        reject(err);
    }
    resolve(response.body.token);
}));

const send = options => new Promise((resolve, reject) => {
    options.json = true;
    options.headers = {Authorization: `Bearer ${token}`};
    request(options, (err, response) => {
        if (err) {
            return reject(err);
        }
        resolve(response);
    });
});

const sendAndRetry = options => send(options).then(
    response => {
        if (response.statusCode === 403) {
            return refreshToken().then(t => {
                token = t;
                return send(options);
            });
        }
        return response;
    }
);

module.exports.get = (url, qs) => sendAndRetry({
    url: `${AUTH_ENDPOINT}oauth/${url}`,
    method: 'GET',
    qs
});

module.exports.post = (url, body) => sendAndRetry({
    url: `${AUTH_ENDPOINT}oauth/${url}`,
    method: 'POST',
    body
});
