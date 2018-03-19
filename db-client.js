const DATABASE_URL = process.env.DATABASE_URL;
const dotenv = require('dotenv');
dotenv.config();
const pg = require('pg');

const Client = pg.Client;

const client = new Client(DATABASE_URL);
client.connect()
    .then( () => console.log('connected to database'))
    .catch( err=> console.error('connection error', err));

client.on('error', err => console.error(err));

module.exports = client;