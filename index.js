const {fetchAppointments, CITY_IDS} = require('./fetcher');
const config = require('./config');
const logger = require('./logger');
const notifier = require('node-notifier');

// Data format: {success, data}, data = {TORONTO: {data, error}, VANCOUVER: {data, error}}
// City data: data = [{date: '2024-05-29', business_day: true}]


function findEarlierAppointment(data) {
    // data = {TORONTO: {data, error}, VANCOUVER: {data, error}}
}

(async () => {
    const {success, data} = fetchAppointments();
    if (success) {
        logger.info('Appointments:');
        logger.info(JSON.stringify(data));

        const appointment = findEarlierAppointment(data);
        if (appointment) {
            notifier.notify({
                title: 'Snooper',
                message: `Found an earlier appointment! City: ${appointment.city}, date: ${appointment.date}`
            });
        }
    } else {
        // // String
        // notifier.notify('Message');
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