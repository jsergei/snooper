const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});

    await page.goto('https://somewebsite.com');
    await page.waitForSelector('[data-cy="tp_about-about"]');

    const result = await page.evaluate(async () => {
        async function makeTimedRequest(url) {
            const TIMEOUT = 30 * 1000;
            let data = null, error = null;
            try {
                data = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
                    .then((response) => response?.json ? response.json() : []);
            } catch (err) {
                if (err.name === 'TimeoutError') {
                    error = {timeout: true};
                } else {
                    // A network error, or some other problem.
                    error = {network: true, info: JSON.stringify(err, Object.getOwnPropertyNames(err))};
                }
                data = null;
            }
            return {data, error};
        }

        urlT = 'some url';
        const response = await makeTimedRequest(urlT);
        return response;
    });

    console.log('Response:');
    console.log(JSON.stringify(result));

    await browser.close();
})()

