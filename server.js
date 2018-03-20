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

function makeToken(id) {
    return { token: jwt.sign({ id: id }), TOKEN_KEY };
}

app.post('/api/auth/signup', (request, response, next) => {
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
                RETURNING id, username;
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