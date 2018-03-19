'use strict';

const client = require('../db-client');
const secretSpots = require('./secret-spots.json');
const users = require('./user-table.json');

Promise.all(users.map(user => {
    return client.query(`
        INSERT INTO users (username, token, password)
        VALUES ($1, $2, $3);
        `,
    [
        user.username, user.token, user.password
    ]);
})
    .then (
        () => console.log('user table seeded'),
        err => console.error(err)
    )
    .then (
        () => {Promise.all(secretSpots.map(spot =>
        {
            return client.query(`
                INSERT INTO spots (name, username, location, note, date)
                SELECT $1, username, $3, $4, $5;
                FROM users
                WHERE users.username=$2,
                `,
            [
                spot.name, spot.username, spot.location, spot.note, spot.date
            ]);
        }))
            .then (
                () => console.log('user table seeded'),
                err => console.error(err)
            )
            .then( () => client.end());
        })
);
