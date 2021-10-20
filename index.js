const express = require('express');
const app = express();
app.get('/', (request, response) => response.send('Oh hi!'));
app.listen(3000, () => console.log('App Listening to port 3000'));