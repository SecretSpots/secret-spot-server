'use strict';

const client = require('../db-client');

client.query(`
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(16) NOT NULL UNIQUE,
        password VARCHAR(16) NOT NULL
    );
`)
    .then(
        () => console.log('user table created'),
        err => console.error(err)
    );

client.query(`
    CREATE TABLE IF NOT EXISTS spots (
        spot_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT references users(user_id),
        address VARCHAR(255) NOT NULL,
        lat FLOAT8 NOT NULL,
        lng FLOAT8 NOT NULL,
        note TEXT,
        date  TIMESTAMP NOT NULL
    );
`)
    .then(
        () => console.log('spot table created'),
        err => console.error(err)
    )
    .then( () => client.end());