require('registerSlash.js');

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

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const args = interaction.content.slice(settings.prefix.length).trim().split(/ +/g);

    if (interaction.commandName === 'start') {
        const ms = require('ms'); // npm install ms

        // /start duration: 2d winners: 1 prize: Awesome prize!
        // This will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"
        client.giveawaysManager.start(interaction.channel, {
            time: ms(args[0]),
            winnerCount: parseInt(args[1]),
            prize: args.slice(2).join(' ')
        }).then(() => {
            interaction.channel.send('Giveaway started in the current channel!');
        });
        // And the giveaway has started!
    }

    if (interaction.commandName === 'reroll') {
        const messageId = args[0];
        client.giveawaysManager.reroll(messageId).then(() => {
            interaction.channel.send('Success! Giveaway rerolled!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (interaction.commandName === 'edit') {
        const messageId = args[0];
        client.giveawaysManager.edit(messageId, {
            addTime: 5000,
            newWinnerCount: 3,
            newPrize: 'New Prize!'
        }).then(() => {
            interaction.channel.send('Success! Giveaway updated!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (interaction.commandName === 'delete') {
        const messageId = args[0];
        client.giveawaysManager.delete(messageId).then(() => {
            interaction.channel.send('Success! Giveaway deleted!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
    
    if (interaction.commandName === 'end') {
        const messageId = args[0];
        client.giveawaysManager.end(messageId).then(() => {
            interaction.channel.send('Success! Giveaway ended!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (interaction.commandName === 'pause') {
        const messageId = args[0];
        client.giveawaysManager.pause(messageId).then(() => {
            interaction.channel.send('Success! Giveaway paused!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }

    if (interaction.commandName === 'unpause') {
        const messageId = args[0];
        client.giveawaysManager.unpause(messageId).then(() => {
            interaction.channel.send('Success! Giveaway unpaused!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});

client.login(settings.token);
