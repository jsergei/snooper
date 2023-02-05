try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30 * 1000) });
    const result = await res.blob();
} catch (err) {
    if (err.name === "TimeoutError") {
        console.error("Timeout: It took more than 5 seconds to get the result!");
    } else if (err.name === "AbortError") {
        console.error(
            "Fetch aborted by user action (browser stop button, closing tab, etc."
        );
    } else if (err.name === "TypeError") {
        console.error("AbortSignal.timeout() method is not supported");
    } else {
        // A network error, or some other problem.
        console.error(`Error: type: ${err.name}, message: ${err.message}`);
    }
}

// Make a request and catch any errors
async function makeTimedRequest(url) {
    const TIMEOUT = 30 * 1000;
    let data = null, error = null;
    try {
        data = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
            .then((response) => response?.json ? response.json() : {});
    } catch (err) {
        if (err.name === "TimeoutError") {
            console.error("Timeout: It took more than 30 seconds to get the result!");
            error = {timeout: true};
        } else {
            // A network error, or some other problem.
            console.error(`Error: type: ${err.name}, message: ${err.message}`);
            error = {network: true, stack: err.stack};
        }
        data = null;
    }
    return {data, error};
}



// Make a request and catch any errors
let data = null, error = null;
try {
    data = await fetch(filledCityUrl)
        .then((response) => response?.json ? response.json() : {});
} catch (err) {
    data = null;
    error = err.stack;
}