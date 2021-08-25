const Discord = require('discord.js'),
    client = new Discord.Client({
        intents: [
            Discord.Intents.FLAGS.GUILDS,
            Discord.Intents.FLAGS.GUILD_MESSAGES,
            Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
        ]
    }),
    settings = {
        prefix: 'g!',
        token: 'Your Discord Bot Token'
    };

// Load Replit Database
const Database = require('@replit/database');
const db = new Database();
(async () => {
    if (!Array.isArray(await db.get('giveaways'))) await db.set('giveaways', []);
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
        // Get all giveaways from the database
        const giveawaysArray = await db.get('giveaways');
        // Push the new giveaway into the array
        giveawaysArray.push(giveawayData);
        // Save the updated array
        await db.set('giveaways', giveawaysArray);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageId, giveawayData) {
        // Get all giveaways from the database
        const giveaways = await db.get('giveaways');
        // Remove the unedited giveaway from the array
        const newGiveawaysArray = giveaways.filter((giveaway) => giveaway.messageId !== messageId);
        // Push the edited giveaway into the array
        newGiveawaysArray.push(giveawayData);
        // Save the updated array
        await db.set('giveaways', newGiveawaysArray);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageId) {
        // Get all giveaways from the database
        const giveaways = await db.get('giveaways');
        // Remove the giveaway from the array
        const newGiveawaysArray = giveaways.filter((giveaway) => giveaway.messageId !== messageId);
        // Save the updated array
        await db.set('giveaways', newGiveawaysArray);
        // Don't forget to return something!
        return true;
    }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithOwnDatabase(client, {
    updateCountdownEvery: 10000,
    default: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉'
    }
});
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('I\'m ready!');
});

client.login(settings.token);
