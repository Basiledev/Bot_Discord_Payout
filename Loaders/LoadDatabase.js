const mysql = require('mysql');

const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bot_rtt',
};

const db = mysql.createConnection(config);
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database!');
});

module.exports = db;