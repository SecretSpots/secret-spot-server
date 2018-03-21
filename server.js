'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;
const MAPS_API_KEY = process.env.MAPS_API_KEY;
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
    const token = request.get('token');
    if(!token) next({ status: 401, message: 'please sign in' });

    let decoded;
    try {
        decoded = jwt.verify(token, TOKEN_KEY);
    } catch(err) {
        return next({ status: 403, message: 'not permitted' });
    }

    request.user_id = decoded.id;
    next();
}

function makeToken(id) {
    return jwt.sign({ id: id }, TOKEN_KEY);
}

app.post('/api/v1/auth/signup', (request, response, next) => {
    const credentials = request.body;
    if(!credentials.username || !credentials.password) {
        return next({ status: 400, message: 'username and password required'});
    }

    client.query(`
        SELECT user_id
        FROM users
        WHERE username=$1;
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
            response.json({
                token: makeToken(result.rows[0].user_id),
                username: result.rows[0].username
            });
        })
        .catch(next);
});

app.post('/api/v1/auth/signin', (request, response, next) => {
    const credentials = request.body;
    if(!credentials.username || !credentials.password) {
        return next ({ status: 400, message: 'username and password required' });
    }

    client.query(`
        SELECT user_id, password, username
        FROM users
        WHERE username=$1;
    `,
    [credentials.username]
    )
        .then(result => {
            if(result.rows.length === 0 || result.rows[0].password !== credentials.password) {
                return next({ status: 401, message: 'invalid username or password' });
            }
            response.json({
                token: makeToken(result.rows[0].user_id),
                username: result.rows[0].username
            });
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

app.get('/api/v1/spots/:id', (request, response, next) => {
    const id = request.params.id;
    client.query(`
        SELECT spots.name, spots.address, spots.note, spots.date, spots.spot_id, users.username 
        FROM spots
        INNER JOIN users
        ON (spots.user_id = users.user_id)
        WHERE spot_id = $1;
    `,
    [id]
    )
        .then(result => {
            if(result.rows.length === 0) next({ status: 404, message: `Spot id ${id} does not exist`});
            else response.send(result.rows[0]);
        })
        .catch(next);
});

function insertSpot(spot) {
    return client.query(`
        INSERT INTO spots (
            name,
            user_id,
            address, 
            lat,
            lng,
            note,
            date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `,
    [spot.name, spot.user_id, spot.address, spot.lat, spot.lng, spot.note, spot.date]
    )
        .then(result => result.rows[0]);
}

app.post('/api/v1/spots/new', (request, response, next) => {
    const body = request.body;

    insertSpot(body)
        .then(result => response.send(result))
        .catch(next);
});

app.delete('/api/v1/spots/:id', validateUser, (request, response, next) => {
    const spot_id = request.params.id;

    client.query(`
        SELECT user_id FROM spots
        WHERE spot_id=$1;
    `,
    [spot_id]
    )
        .then(result1 => {
            if (result1.rows[0].user_id !== request.user_id) {
                return next({ status: 403, message: 'you may only delete spots you created' });
            }
            return client.query(`
                DELETE FROM spots
                WHERE spot_id=$1
                RETURNING name;
            `,
            [spot_id]
            )
                .then(result2 => response.send({ removed: result2.rows[0].name }))
                .catch(next);
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