class WaitTimeoutError extends Error {}

const waitSeconds = function(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
};

async function wrapInTimeout(requestPromise, timeoutSec) {
    const {timeout, error, data} = await Promise.race([
        waitSeconds(timeoutSec).then(() => ({timeout: true, error: false, data: null})),
        requestPromise.then(result => ({timeout: false, error: false, data: result}))
            .catch(err => ({timeout: false, error: err, data: null}))
    ]);
    if (timeout) {
        throw new WaitTimeoutError();
    } else if (error) {
        throw error;
    } else {
        return data;
    }
}

const CITY_IDS = {
    CALGARY: 89,
    HALIFAX: 90,
    MONTREAL: 91,
    OTTAWA: 92,
    QUEBEC_CITY: 93,
    TORONTO: 94,
    VANCOUVER: 95
};

function parseCndDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

module.exports = {WaitTimeoutError, waitSeconds, wrapInTimeout, CITY_IDS, parseCndDate};