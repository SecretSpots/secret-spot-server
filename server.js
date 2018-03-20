'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;
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

function insertSpot(spot) {
    return client.query(`
        INSERT INTO spots (
            name, 
            location,
            note,
            date,
        )
        VALUES ($2, $4, $5, $6)
        RETURNING *;
    `,
    [spot.name, spot.location, spot.note, spot.date]
    )
        .then(result => result.rows[0]);
}

app.post('/api/spots/new', (request, response) => {
    const body = request.body;

    insertSpot(body)
        .then(result => response.send(result))
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});