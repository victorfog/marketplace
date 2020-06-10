const typeExt = require('./typeExt');

function assertBigNumberEqual(actual, expected, message=undefined) {
    assert(actual.eq(expected), "{2}expected {0}, but got: {1}".format(expected, actual,
        message ? message + ': ' : ''));
}

module.exports.assertBigNumberEqual=assertBigNumberEqual;