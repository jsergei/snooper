const axios = require('axios');

// Want to use async/await? Add the `async` keyword to your outer function/method.
async function getUser() {
    try {
        const response = await axios.get('https://api.italki.com/api/v2/teacher/5764208/schedule?start_time=2023-01-31T05%3A00%3A00Z&end_time=2023-02-08T04%3A59%3A59Z');
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.error(error);
    }
}


getUser()
