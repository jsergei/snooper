const puppeteer = require('puppeteer');
const config = require('./config');
const logger = require('./logger');

const waitSeconds = function(seconds) {
    return new Promise(resolve => {
       setTimeout(resolve, seconds * 1000);
    });
};

async function fetchNewAppointmentData() {
    logger.info('Launch the browser');
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});

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

        await waitSeconds(5000);

        logger.info('Make the appoinment requests');
        const cityData = await page.evaluate((cityUrl) => {
            const CITY_IDS = {
                CALGARY: 89,
                HALIFAX: 90,
                MONTREAL: 91,
                OTTAWA: 92,
                QUEBEC_CITY: 93,
                TORONTO: 94,
                VANCOUVER: 95
            };

            const requests = Object.keys(CITY_IDS).map(cityName => {
                const filledCityUrl = cityUrl.replace('$city$', CITY_IDS[cityName]);
                return fetch(filledCityUrl)
                    .then((response) => response?.json ? response.json() : {})
                    .then((data) => ({[cityName]: data}));
            });
            return Promise.all(requests);
        }, config.getCityUrl);

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

(async () => {
    const {success, data} = fetchNewAppointmentData();
    if (success) {
        logger.info('Appointments:');
        logger.info(JSON.stringify(data));
    }
})()
