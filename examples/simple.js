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

// Requires Manager from discord-giveaways
const { GiveawaysManager } = require('discord-giveaways');
// Create a new instance of the manager class
const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
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

client.on('messageCreate', (message) => {
    const ms = require('ms'); // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'start-giveaway') {
        // g!start-giveaway 2d 1 Awesome prize!
        // This will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"

        client.giveawaysManager.start(message.channel, {
            time: ms(args[0]),
            winnerCount: parseInt(args[1]),
            prize: args.slice(2).join(' ')
        }).then(() => {
            message.channel.send('Giveaway started in the current channel!');
        });
        // And the giveaway has started!
    }

    if (command === 'reroll') {
        const messageId = args[0];
        client.giveawaysManager.reroll(messageId).then(() => {
            message.channel.send('Success! Giveaway rerolled!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (command === 'edit') {
        const messageId = args[0];
        client.giveawaysManager.edit(messageId, {
            addTime: 5000,
            newWinnerCount: 3,
            newPrize: 'New Prize!'
        }).then(() => {
            message.channel.send('Success! Giveaway updated!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (command === 'delete') {
        const messageId = args[0];
        client.giveawaysManager.delete(messageId).then(() => {
            message.channel.send('Success! Giveaway deleted!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (command === 'end') {
        const messageId = args[0];
        client.giveawaysManager.end(messageId).then(() => {
            message.channel.send('Success! Giveaway ended!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (command === 'pause') {
        const messageId = args[0];
        client.giveawaysManager.pause(messageId).then(() => {
            message.channel.send('Success! Giveaway paused!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (command === 'unpause') {
        const messageId = args[0];
        client.giveawaysManager.unpause(messageId).then(() => {
            message.channel.send('Success! Giveaway un paused!');
        }).catch((err) => {
            message.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});

client.login(settings.token);
