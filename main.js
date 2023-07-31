const discord = require("discord.js") 
const mysql = require('mysql');
const intents = new discord.IntentsBitField(3276799)
const bot = new discord.Client({intents})
const LoadCommands = require("./Loaders/loadcommands")
const LoadEvents = require("./Loaders/loadevents")
const config = require("./config")
const db_config = {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
};

bot.commands = new discord.Collection()

bot.login(config.token)

const db = mysql.createConnection(db_config);
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database!');
    bot.db=db
});

LoadCommands(bot)
LoadEvents(bot)


