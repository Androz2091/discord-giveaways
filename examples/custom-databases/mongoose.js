const Discord = require('discord.js'),
    client = new Discord.Client(),
    settings = {
        prefix: 'g!',
        token: 'Your Discord Bot Token',
    };

const mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://localhost/giveaways', { useFindAndModify: false });
const db = mongoose.connection;

// Check the connection
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB.');
});

// Create the schema for giveaways
const giveawaySchema = new mongoose.Schema({
    messageID: String,
    channelID: String,
    guildID: String,
    startAt: Number,
    endAt: Number,
    ended: Boolean,
    winnerCount: Number,
    winners: [],
    prize: String,
    messages: {
        giveaway: String,
        giveawayEnded: String,
        inviteToParticipate: String,
        timeRemaining: String,
        winMessage: String,
        embedFooter: String,
        noWinner: String,
        winners: String,
        endedAt: String,
        hostedBy: String,
        units: {
            seconds: String,
            minutes: String,
            hours: String,
            days: String,
            pluralS: Boolean,
        },
    },
    hostedBy: String,
    winnerIDs: [],
});

// Create the model
const giveawayModel = mongoose.model('giveaways', giveawaySchema);

const { GiveawaysManager } = require('discord-giveaways');
class GiveawayManagerWithMongoose extends GiveawaysManager {
    // This function is called when the manager needs to get all the giveaways stored in the database.
    async getAllGiveaways() {
        // Get all the giveaway in the database. We can use messageID field to fetch all documents by passing empty condition.
        return await giveawayModel.find({}, 'messageID');
    }

    // This function is called when a giveaway needs to be saved in the database (when a giveaway is created or when a giveaway is edited).
    async saveGiveaway(messageID, giveawayData) {
        // Add the new one
        await giveawayModel.create(giveawayData);
        // Don't forget to return something!
        return true;
    }

    // This function is called when a giveaway needs to be edited in the database.
    async editGiveaway(messageID, giveawayData) {
        // Find by messageID and update it
        await giveawayModel
            .findOneAndUpdate({ messageID: messageID }, giveawayData)
            .exec();

        return true;
    }

    // This function is called when a giveaway needs to be deleted from the database.
    async deleteGiveaway(messageID) {
        // Find by messageID and delete it
        await giveawayModel
            .findOneAndDelete({ messageID: messageID }, messageID)
            .exec();

        return true;
    }
}

// Create a new instance of your new class
const manager = new GiveawayManagerWithMongoose(client, {
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
