'use strict';

const client = require('../db-client');

client.query(`
    DROP TABLE IF EXISTS users;
`)
    .then(
        () => console.log('user table dropped'),
        err => console.error(err)
    );

client.query(`
    DROP TABLE IF EXISTS spots;
`)
    .then(
        () => console.log('spot table dropped'),
        err => console.error(err)
    )
    .then( () => client.end());