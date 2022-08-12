// Tested with quick.db version: 9.0.6

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessageReactions]
});

// Load quick.db
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Check the DB
(async () => {
    if (!Array.isArray(await db.get('giveaways'))) await db.set('giveaways', []);
    // Start the manager only after the DB got checked
    client.giveawaysManager._init();
})();

const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
    // This function is called when the manager needs to get all giveaways which are stored in the database.
    async getAllGiveaways() {
        // Get all giveaways from the database
        return await db.get('giveaways');
    }

    // This function is called when a giveaway needs to be saved in the database.
    async saveGiveaway(messageId, giveawayData) {
        // Add the new giveaway data to the database
        await db.push('giveaways', giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageId, giveawayData) {
        // Remove the old giveaway data from the database
        await db.pull('giveaways', (giveaway) => giveaway.messageId === messageId);
        // Add the new giveaway data to the database
        await db.push('giveaways', giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageId) {
        // Remove the giveaway data from the database
        await db.pull('giveaways', (giveaway) => giveaway.messageId === messageId);
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
