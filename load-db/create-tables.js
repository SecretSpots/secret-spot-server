'use strict';

const client = require('../db-client');

// Put these in one query, (which is easier than a Promise.all)
// Reason being that there is no control here of when script is actually "done"

client.query(`
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(16) NOT NULL UNIQUE,
        password VARCHAR(16) NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS been (
        user_id INT references users(user_id),
        spot_id INT references spots(spot_id)
    );

    CREATE TABLE IF NOT EXISTS good (
        user_id INT references users(user_id),
        spot_id INT references spots(spot_id)
    );
`)
    .then(
        () => console.log('been table created'),
        err => console.error(err)
    )
    .then( () => client.end());