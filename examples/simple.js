const Discord = require('discord.js'),
    client = new Discord.Client(),
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
        exemptPermissions: ['MANAGE_MESSAGES', 'ADMINISTRATOR'],
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

client.on('message', (message) => {
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
            addTime: 5000,
            newWinnerCount: 3,
            newPrize: 'New Prize!'
        }).then(() => {
            // Here, we can calculate the time after which we are sure that the lib will update the giveaway
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
    
    if (command === 'end') {
        const messageID = args[0];
        client.giveawaysManager.end(messageID).then(() => {
            message.channel.send('Success! Giveaway ended!');
        }).catch(() => {
            message.channel.send('No giveaway found for ' + messageID + ', please check and try again');
        });
    }
});

client.login(settings.token);
