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
        if (!!cityData[cityName].error) {
            const earlier = cityData[cityName].data.filter(({date}) => parseCndDate(date) <= beforeDate);
            if (earlier.length > 0) {
                appointments.push({cityName, dates: earlier});
            }
        }
    }
    return appointments;
}

(async () => {
    const {success, data, ...error} = await fetchAppointments();
    // TODO: handle error detection better: network, timeout and return an error code from the process
    logger.info('Appointments:');
    logger.info(JSON.stringify(data));

    const appointments = findEarlierAppointments(data);
    if (appointments.length > 0) {
        const appAsStr = '\n' + appointments.map(app => `${app.cityName}: ${app.dates.join(',')}`).join('\n');
        notifier.notify({
            title: 'Snooper',
            message: `Found an earlier appointment! ${appAsStr}`
        });
    }

    if (!success) {
        notifier.notify({
            title: 'Snooper',
            message: 'There was an error downloading.'
        });
    }
})();


// TODO:
//  1. fix the fetch error
//  2. add some logic that detects if I have been rate limited for a period of time for making too many requests
//