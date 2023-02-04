export class WaitTimeoutError extends Error {}

export const waitSeconds = function(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
};

export async function wrapInTimeout(requestPromise, timeoutSec) {
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
