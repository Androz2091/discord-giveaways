const Discord = require('discord.js'),
    client = new Discord.Client(),
    settings = {
        prefix: 'g!',
        token: 'Your Discord Bot Token'
    };

// Load quickmongo
const { Database } = require('quickmongo');
const db = new Database('mongodb://localhost/giveaways');

const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
    // This function is called when the manager needs to get all giveaways which are stored in the database.
    async getAllGiveaways() {
        // Get all giveaways from the database
        return await db.get('giveaways');
    }

    // This function is called when a giveaway needs to be saved in the database.
    async saveGiveaway(messageID, giveawayData) {
        // Add the new giveaway to the database
        await db.push('giveaways', giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageID, giveawayData) {
        // Get all giveaways from the database
        const giveaways = await db.get('giveaways');
        // Remove the unedited giveaway from the array
        const newGiveawaysArray = giveaways.filter((giveaway) => giveaway.messageID !== messageID);
        // Push the edited giveaway into the array
        newGiveawaysArray.push(giveawayData);
        // Save the updated array
        await db.set('giveaways', newGiveawaysArray);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageID) {
        // Get all giveaways from the database
        const giveaways = await db.get('giveaways');
        // Remove the giveaway from the array
        const newGiveawaysArray = giveaways.filter((giveaway) => giveaway.messageID !== messageID);
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
        exemptPermissions: ['MANAGE_MESSAGES', 'ADMINISTRATOR'],
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉'
    }
}, false); // ATTENTION: Add "false" in order to not start the manager until the DB got checked, see below
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

// Check the DB when it is ready
db.on('ready', async () => {
    if (!Array.isArray(await db.get('giveaways'))) await db.set('giveaways', []);
    // Start the manager only after the DB got checked to prevent an error
    client.giveawaysManager._init();
});

client.on('ready', () => {
    console.log('I\'m ready!');
});

client.login(settings.token);
