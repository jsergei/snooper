import {WaitTimeoutError, waitSeconds} from "./utils";

const puppeteer = require("puppeteer");
const logger = require("./logger");
const config = require("./config");

const STANDARD_WAIT = 60 * 1000; // Seconds

export const CITY_IDS = {
    CALGARY: 89,
    HALIFAX: 90,
    MONTREAL: 91,
    OTTAWA: 92,
    QUEBEC_CITY: 93,
    TORONTO: 94,
    VANCOUVER: 95
};

export async function fetchAppointments() {
    logger.info('Launch the browser');
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});
    page.setDefaultTimeout(STANDARD_WAIT);

    try {
        logger.info('Go to the sign-in page, type into the login form and submit');
        await page.goto(config.signInUrl),
        await page.waitForSelector('#user_email');
        await page.type('#user_email', config.email);
        await page.type('#user_password', config.password);
        await page.click('label[for="policy_confirmed"]');
        await Promise.all([
            page.waitForNavigation(),
            page.click('input[type="submit"]')
        ]);
        await page.waitForSelector('span[title="Applicant Actions"]');

        await waitSeconds(5000);

        logger.info('Make the appointment requests');
        const cityData = await page.evaluate(async (cityUrl, CITY_IDS) => {
            const cityData = {};
            for (const cityName of Object.keys(CITY_IDS)) {
                const filledCityUrl = cityUrl.replace('$city$', CITY_IDS[cityName]);

                // Make a request and catch any errors
                let data = null, error = null;
                try {
                    data = await fetch(filledCityUrl)
                        .then((response) => response?.json ? response.json() : {});
                } catch (err) {
                    data = null;
                    error = err.stack;
                }

                await waitSeconds(5); // For safety so that the server doesn't think it's a bot
                cityData[cityName] = {data, error};
            }
            return cityData;
        }, config.getCityUrl, CITY_IDS);

        return {success: true, data: cityData};
    } catch (err) {
        logger.error(err);
        logger.error('No data was retrieved');
        return {success: false};
    } finally {
        logger.info('Log out and close the browser');
        await page.goto(config.signOutUrl);
        await browser.close();
    }
}
