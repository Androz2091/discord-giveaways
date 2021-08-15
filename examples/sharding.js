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

// Extends the GiveawaysManager class and update the refreshStorage method
const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithShardSupport = class extends GiveawaysManager {
    // The refreshStorage method is called when the database is updated on one of the shards
    async refreshStorage() {
        // This should make all shards refresh their cache with the updated database
        return client.shard.broadcastEval(() => this.giveawaysManager.getAllGiveaways());
    }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithShardSupport(client, {
    storage: './storage.json',
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
