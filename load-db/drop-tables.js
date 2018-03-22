'use strict';

const client = require('../db-client');

client.query(`
    DROP TABLE IF EXISTS been;
    DROP TABLE IF EXISTS good;
    DROP TABLE IF EXISTS spots;
    DROP TABLE IF EXISTS users;
`)
    .then(
        () => console.log('user table dropped'),
        err => console.error(err)
    )
    .then( () => client.end());