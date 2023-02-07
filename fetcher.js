const puppeteer = require('puppeteer');
const {waitSeconds, CITY_IDS} = require('./utils');
const logger = require('./logger');
const config = require('./config');

const STANDARD_WAIT = 30 * 1000; // Seconds

async function fetchAppointments() {
    logger.info('Launch the browser');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});
    page.setDefaultTimeout(STANDARD_WAIT);

    try {
        logger.info('Go to the sign-in page, type into the login form and submit');
        await page.goto(config.signInUrl);
        await page.waitForSelector('#user_email');
        await page.type('#user_email', config.email);
        await page.type('#user_password', config.password);
        await page.click('label[for="policy_confirmed"]');
        await Promise.all([
            page.waitForNavigation(),
            page.click('input[type="submit"]')
        ]);
        await page.waitForSelector('span[title="Applicant Actions"]');
        await waitSeconds(1);

        logger.info('Make the appointment requests');
        const cityData = await page.evaluate(async (cityUrl, CITY_IDS) => {
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

            const cityData = {};
            for (const cityName of Object.keys(CITY_IDS)) {
                const filledCityUrl = cityUrl.replace('$city$', CITY_IDS[cityName]);
                const response = await makeTimedRequest(filledCityUrl);
                cityData[cityName] = response;
                if (response.error) {
                    break;
                }
                // For safety so that the server doesn't think it's a bot
                await new Promise(resolve => setTimeout(resolve, 3 * 1000));
            }
            return cityData;
        }, config.getCityUrl, CITY_IDS);

        const error = Object.values(cityData).find(({error}) => !!error);
        if (error) {
            logger.error('There was an error making appointment requests.');
            const errorText = (error.timeout ? 'Timeout' : 'Network') + ', ' + error.info;
            logger.error(errorText);
            return {success: false, ...error, data: cityData};
        } else {
            return {success: true, data: cityData};
        }
    } catch (err) {
        if (err instanceof puppeteer.TimeoutError) {
            logger.error('Puppeteer request timeout out');
            return {success: false, timeout: true};
        }
        logger.error(err);
        logger.error('No data was retrieved');
        return {success: false, network: true};
    } finally {
        logger.info('Log out and close the browser');
        await page.goto(config.signOutUrl);
        await browser.close();
    }
}

module.exports = fetchAppointments;
