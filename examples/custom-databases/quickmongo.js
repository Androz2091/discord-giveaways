const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessageReactions]
});

// Load quickmongo
const { Database } = require('quickmongo');
const giveawayDB = new Database('mongodb://localhost/database', { collectionName: 'giveaways' });
giveawayDB.connect();

// Start the manager only after the DB turned ready
giveawayDB.once('ready', () => {
    console.log('Connected to the database');
    client.giveawaysManager._init();
});

const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
    // This function is called when the manager needs to get all giveaways which are stored in the database.
    async getAllGiveaways() {
        // Get all giveaways from the database
        return (await giveawayDB.all()).map((element) => element.data);
    }

    // This function is called when a giveaway needs to be saved in the database.
    async saveGiveaway(messageId, giveawayData) {
        // Add the new giveaway data to the database
        await giveawayDB.set(messageId, giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageId, giveawayData) {
        // Replace the old giveaway data with the new giveaway data
        await giveawayDB.set(messageId, giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageId) {
        // Remove the giveaway data from the database
        await giveawayDB.delete(messageId);
        // Don't forget to return something!
        return true;
    }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithOwnDatabase(
    client,
    {
        default: {
            botsCanWin: false,
            embedColor: '#FF0000',
            embedColorEnd: '#000000',
            reaction: '🎉'
        }
    },
    false // ATTENTION: Add "false" in order to not start the manager until the DB got checked
);
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.login(process.env.DISCORD_BOT_TOKEN);
