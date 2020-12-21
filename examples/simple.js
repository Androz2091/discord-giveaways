const Discord = require('discord.js'),
    client = new Discord.Client(),
    settings = {
        prefix: 'g!',
        token: 'Your Discord Token'
    };

// Requires Manager from discord-giveaways
const { GiveawaysManager } = require('discord-giveaways');
// Starts updating currents giveaways
const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    updateCountdownEvery: 10000,
    default: {
        botsCanWin: false,
        exemptPermissions: ['MANAGE_MESSAGES', 'ADMINISTRATOR'],
        embedColor: '#FF0000',
        reaction: '🎉'
    }
});
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('I\'m ready !');
});

client.on('message', (message) => {

    const ms = require('ms'); // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'start-giveaway') {
        // g!start-giveaway 2d 1 Awesome prize!
        // will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"

        client.giveawaysManager.start(message.channel, {
            time: ms(args[0]),
            prize: args.slice(2).join(' '),
            winnerCount: parseInt(args[1])
        }).then(() => {
            message.channel.send('Giveaway started in the current channel!');
        });
        // And the giveaway has started!
    }

    if (command === 'reroll') {
        const messageID = args[0];
        client.giveawaysManager.reroll(messageID).then(() => {
            message.channel.send('Success! Giveaway rerolled!');
        }).catch(() => {
            message.channel.send('No giveaway found for ' + messageID + ', please check and try again');
        });
    }

    if (command === 'edit') {
        const messageID = args[0];
        client.giveawaysManager.edit(messageID, {
            newWinnerCount: 3,
            newPrize: 'New Prize!',
            addTime: 5000
        }).then(() => {
            // here, we can calculate the time after which we are sure that the lib will update the giveaway
            const numberOfSecondsMax = client.giveawaysManager.options.updateCountdownEvery / 1000;
            message.channel.send('Success! Giveaway will updated in less than ' + numberOfSecondsMax + ' seconds.');
        }).catch(() => {
            message.channel.send('No giveaway found for ' + messageID + ', please check and try again');
        });
    }

    if (command === 'delete') {
        const messageID = args[0];
        client.giveawaysManager.delete(messageID).then(() => {
            message.channel.send('Success! Giveaway deleted!');
        }).catch(() => {
            message.channel.send('No giveaway found for ' + messageID + ', please check and try again');
        });
    }

});

client.login(settings.token);
