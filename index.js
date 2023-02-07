const fetchAppointments = require('./fetcher');
const {parseCndDate} = require('./utils');
const config = require('./config');
const logger = require('./logger');
const notifier = require('node-notifier');

// Data format: {success, data}, data = {TORONTO: {data, error}, VANCOUVER: {data, error}}
// City data: data = [{date: '2024-05-29', business_day: true}]

function findEarlierAppointments(cityData) {
    // data = {TORONTO: {data, error}, VANCOUVER: {data, error}}
    const appointments = [];
    const beforeDate = parseCndDate(config.beforeDate);
    for (const cityName of Object.keys(cityData)) {
        if (!cityData[cityName].error && Array.isArray(cityData[cityName].data)) {
            const earlier = cityData[cityName].data
                .map(({date}) => parseCndDate(date))
                .filter(date => date <= beforeDate);
            if (earlier.length > 0) {
                appointments.push({cityName, dates: earlier});
            }
        }
    }
    return appointments;
}

function formatFoundAppointments(appointments) {
    return '\n' + appointments.map(app => {
        const earliest = app.dates.sort((a, b) => a - b)[0];
        return `${app.cityName}: ${earliest.toDateString()}`;
    }).join('\n');
}

// TODO: when the code is run, make sure it returns 0 as an exit code

(async () => {
    const {success, data, timeout, network, info} = await fetchAppointments();
    logger.info('Appointments:');
    logger.info(JSON.stringify(data));

    const appointments = findEarlierAppointments(data);
    if (appointments.length > 0) {
        logger.info('Found an earlier appointment! ${formatFoundAppointments(appointments)}');
        notifier.notify({
            title: 'Snooper',
            message: `Found an earlier appointment! ${formatFoundAppointments(appointments)}`
        });
    }

    if (!success) {
        logger.error(`There was an error downloading. ${timeout ? 'A request timed out.' : 'A network error.'}`);
        notifier.notify({
            title: 'Snooper',
            message: `There was an error downloading. ${timeout ? 'A request timed out.' : 'A network error.'}`
        });
        process.exitCode = 1;
    }
})();
