const JWT = require('jsonwebtoken');

const secret = "$$flyingjatt123";

function createTokenForUser(user) {
    const payload = {
        firstName: user.firstName,
        _id: user._id,
        email: user.email,
        messages: user.messages || [] // Add messages array, defaulting to an empty array if undefined
    };
    const token = JWT.sign(payload, secret);
    return token;
}

function validateToken(token) {
    const payload = JWT.verify(token, secret);
    return payload;
}

module.exports = {
    createTokenForUser,
    validateToken,
};
