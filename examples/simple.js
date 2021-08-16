require('./registerSlash.js');

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

    if (interaction.commandName === 'start') {
        const ms = require('ms'); // npm install ms

        // /start duration: 2d winners: 1 prize: Awesome prize!
        // This will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"
        client.giveawaysManager.start(interaction.channel, {
            time: ms(interaction.options.getString('duration')),
            winnerCount: interaction.options.getInteger('winners'),
            prize: interaction.options.getString('prize')
        }).then(() => {
            interaction.reply('Giveaway started in the current channel!');
        });
        // And the giveaway has started!
    }

    if (interaction.commandName === 'reroll') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.reroll(messageId).then(() => {
            interaction.reply('Success! Giveaway rerolled!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }

    if (interaction.commandName === 'edit') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.edit(messageId, {
            addTime: 5000,
            newWinnerCount: 3,
            newPrize: 'New Prize!'
        }).then(() => {
            interaction.reply('Success! Giveaway updated!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }

    if (interaction.commandName === 'delete') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.delete(messageId).then(() => {
            interaction.reply('Success! Giveaway deleted!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }
    
    if (interaction.commandName === 'end') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.end(messageId).then(() => {
            interaction.reply('Success! Giveaway ended!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }

    if (interaction.commandName === 'pause') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.pause(messageId).then(() => {
            interaction.reply('Success! Giveaway paused!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }

    if (interaction.commandName === 'unpause') {
        const messageId = interaction.options.getString('messageid');
        client.giveawaysManager.unpause(messageId).then(() => {
            interaction.reply('Success! Giveaway unpaused!');
        }).catch((err) => {
            interaction.reply(`There was an error while executing this command! Please check and try again.\n\`${err.message}\``);
        });
    }
});

client.login(settings.token);
