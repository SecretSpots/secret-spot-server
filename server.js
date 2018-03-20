'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;
const MAPS_API_KEY = process.env.MAPS_API_KEY;
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const sa = require('superagent');

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

const client = require('./db-client');

app.get('/api/v1/spots', (request, response) => {
    client.query(`
        SELECT * FROM spots;
    
    `)
        .then(results => response.send(results.rows))
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });

});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});