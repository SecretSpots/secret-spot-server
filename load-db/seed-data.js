'use strict';

const client = require('../db-client');
const secretSpots = require('./secret-spots.json');
const users = require('./user-table.json');

Promise.all(users.map(user => {
    return client.query(`
        INSERT INTO users (username, password)
        VALUES ($1, $2);
        `,
    [
        user.username, user.password
    ]);
}))
    .then (() => console.log('user table seeded'))
    .then (() => {
        return Promise.all(secretSpots.map(spot =>
        {
            return client.query(`
                INSERT INTO spots (name, user_id, address, lat, lng, note, date)
                VALUES ($1, $2, $3, $4, $5, $6, $7);
                `,
            [
                spot.name, spot.user_id, spot.address, spot.lat, spot.lng, spot.note, spot.date
            ]);
        }));
    })
    .then (
        () => console.log('user table seeded'),
        err => console.error(err)
    )
    .then( () => client.end());
