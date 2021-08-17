// Register slash commands
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
    await interaction.deferReply();

    if (interaction.commandName === 'start') {
        const ms = require('ms'); // npm install ms

        try {
            // /start duration: 2d winners: 1 prize: Awesome prize!
            // This will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"
            await client.giveawaysManager.start(interaction.channel, {
                time: ms(interaction.options.getString('duration')),
                winnerCount: interaction.options.getInteger('winners'),
                prize: interaction.options.getString('prize')
            });
        } catch (err) {
            return await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }

        // And the giveaway has started!
        await interaction.editReply('Giveaway started in the current channel!');
    }

    if (interaction.commandName === 'reroll') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.reroll(messageId);
        } catch (err) {
            return await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway rerolled!');
    }

    if (interaction.commandName === 'edit') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.edit(messageId, {
                addTime: 5000,
                newWinnerCount: 3,
                newPrize: 'New Prize!'
            });  
        } catch (err) {
            return await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway updated!');
    }

    if (interaction.commandName === 'delete') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.delete(messageId);
        } catch (err) {
            await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway deleted!');
    }
    
    if (interaction.commandName === 'end') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.end(messageId);
        } catch (err) {
            return await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway ended!');
    }

    if (interaction.commandName === 'pause') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.pause(messageId);
        } catch (err) {
            return await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway paused!');
    }

    if (interaction.commandName === 'unpause') {
        const messageId = interaction.options.getString('messageid');
        try {
            await client.giveawaysManager.unpause(messageId);
        } catch (err) {
            await interaction.editReply(`An error has occurred, please check and try again.\n\`${err}\``);
        }
        await interaction.editReply('Success! Giveaway unpaused!');
    }
});

client.login(settings.token);
