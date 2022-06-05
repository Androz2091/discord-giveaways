const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

// Load nano
const nano = require('nano')('http://admin:mypassword@localhost:5984');
let giveawayDB;

// Check the DB
(async () => {
    if (!(await nano.db.list()).includes('giveaways')) await nano.db.create('giveaways');
    giveawayDB = nano.use('giveaways');
    // Start the manager only after the DB got checked to prevent an error
    client.giveawaysManager._init();
})();

const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
    // This function is called when the manager needs to get all giveaways which are stored in the database.
    async getAllGiveaways() {
        // Get all giveaways from the database
        return (await giveawayDB.list({ include_docs: true })).rows.map((r) => r.doc);
    }

    // This function is called when a giveaway needs to be saved in the database.
    async saveGiveaway(messageId, giveawayData) {
        // Add the new giveaway to the database
        await giveawayDB.insert(giveawayData, messageId);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageId, giveawayData) {
        // Get the unedited giveaway from the database
        const giveaway = await giveawayDB.get(messageId);
        // Edit the giveaway
        await giveawayDB.insert({ ...giveaway, ...giveawayData });
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageId) {
        // Get the giveaway from the database
        const giveaway = await giveawayDB.get(messageId);
        // Remove the giveaway from the database
        await giveawayDB.destroy(messageId, giveaway._rev);
        // Don't forget to return something!
        return true;
    }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithOwnDatabase(client, {
    default: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉'
    }
}, false); // ATTENTION: Add "false" in order to not start the manager until the DB got checked, see below
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.login(process.env.DISCORD_BOT_TOKEN);
