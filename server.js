'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;
const TOKEN_KEY = process.env.TOKEN_KEY;

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const sa = require('superagent');
const jwt = require('jsonwebtoken');

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

const client = require('./db-client');

function validateUser(request, response, next) {
    const token = request.get('token') || request.query.token;
    if(!token) next({ status: 401, message: 'no token found' });

    let payload;
    try {
        payload = jwt.verify(token, TOKEN_KEY);
    } catch(err) {
        return next({ status: 403, message: 'permission denied' });
    }

    request.user = payload;
    next();
}

function makeToken(id) {
    return { token: jwt.sign({ id: id }, TOKEN_KEY) };
}

app.post('/api/v1/auth/signup', (request, response, next) => {
    const credentials = request.body;
    if(!credentials.username || !credentials.password) {
        return next({ status: 400, message: 'username and password required'});
    }

    client.query(`
        SELECT user_id
        FROM users
        WHERE username=$1
   `,
    [credentials.username]
    )
        .then(result => {
            if(result.rows.length !== 0) {
                return next({ status: 400, message: 'username taken' });
            }

            return client.query(`
                INSERT INTO users (username, password)
                VALUES ($1, $2)
                RETURNING user_id, username;
            `,
            [credentials.username, credentials.password]
            );
        })
        .then(result => {
            const token = makeToken(result.rows[0].id);
            response.send(token);
        })
        .catch(next);
});

app.post('/api/v1/auth/signin', (request, response, next) => {
    const credentials = request.body;
    if(!credentials.username || !credentials.password) {
        return next ({ status: 400, message: 'username and password required' });
    }

    client.query(`
        SELECT user_id, password
        FROM users
        WHERE username=$1
    `,
    [credentials.username]
    )
        .then(result => {
            if(result.rows.length === 0 || result.rows[0].password !== credentials.password) {
                return next({ status: 401, message: 'invalid username or password' });
            }
            const token = makeToken(result.rows[0].id);
            response.send(token);
        });
});

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
            spot_id,
            name,
            user_id, 
            location,
            note,
            date
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `,
    [spot.spot_id, spot.name, spot.user_id, spot.location, spot.note, spot.date]
    )
        .then(result => result.rows[0]);
}

app.post('/api/v1/spots/new', (request, response) => {
    const body = request.body;

    insertSpot(body)
        .then(result => response.send(result))
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
});

app.use((err, request, response, next) => { // eslint-disable-line
    console.error(err);

    if(err.status) {
        response.status(err.status).send({ error: err.message });
    }
    else {
        response.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});