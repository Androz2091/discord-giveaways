const Discord = require('discord.js'),
    client = new Discord.Client(),
    settings = {
        prefix: 'g!',
        token: 'Your Discord Token'
    };

// Load mysql
const MySQL = require('mysql');
const sql = MySQL.createConnection({
    host     : 'localhost',
    user     : 'Your MySQL user',
    password : 'Your MySQL password',
    database : 'Your MySQL database name'
});
sql.connect( (err) => {
    if (err){
        console.error('Impossible to connect to MySQL server. Code: ' + err.code);
        process.exit(99); // stop the process if we can't connect to MySQL server
    } else {
        console.log('[SQL] Connected to the MySQL server! Connexion ID: ' + sql.threadId);
    }
});

// Create giveaways table
sql.query(`
	CREATE TABLE IF NOT EXISTS \`giveaways\`
	(
		\`id\` INT(1) NOT NULL AUTO_INCREMENT,
		\`message_id\` VARCHAR(64) NOT NULL,
		\`data\` JSON NOT NULL,
		PRIMARY KEY (\`id\`)
	);
`, (err) => {
    if (err) console.error(err);
    console.log('[SQL] Created table `giveaways`');
});

const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {

    // This function is called when the manager needs to get all the giveaway stored in the database.
    async getAllGiveaways(){
        return new Promise(function (resolve, reject) {
            sql.query('SELECT `data` FROM `giveaways`', (err, res) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                const giveaways = res.map((row) => JSON.parse(row.data));
                resolve(giveaways);
            });
        });
    }

    // This function is called when a giveaway needs to be saved in the database (when a giveaway is created or when a giveaway is edited).
    async saveGiveaway(messageID, giveawayData){
        return new Promise(function (resolve, reject) {
            sql.query('INSERT INTO `giveaways` (`message_id`, `data`) VALUES (?,?)', [messageID, JSON.stringify(giveawayData)], (err, res) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                resolve(true);
            });
        });
    }

    async editGiveaway(messageID, giveawayData){
        return new Promise(function (resolve, reject) {
            sql.query('UPDATE `giveaways` SET `data` = ? WHERE `message_id` = ?', [JSON.stringify(giveawayData), messageID], (err, res) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                resolve(true);
            });
        });
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageID){
        return new Promise(function (resolve, reject) {
            sql.query('DELETE FROM `giveaways` WHERE `message_id` = ?', messageID, (err, res) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                resolve(true);
            });
        });
    }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithOwnDatabase(client, {
    storage: false, // Important - use false instead of a storage path
    updateCountdownEvery: 10000,
    default: {
        botsCanWin: false,
        exemptPermissions: [ 'MANAGE_MESSAGES', 'ADMINISTRATOR' ],
        embedColor: '#FF0000',
        reaction: '🎉'
    }
});
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('I\'m ready !');
});

client.login(settings.token);
