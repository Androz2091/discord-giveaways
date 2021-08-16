# Discord Giveaways

[![discordBadge](https://img.shields.io/badge/Chat-Click%20here-7289d9?style=for-the-badge&logo=discord)](https://discord.gg/r5mb9r5WXv)
[![downloadsBadge](https://img.shields.io/npm/dt/discord-giveaways?style=for-the-badge)](https://npmjs.com/discord-giveaways)
[![versionBadge](https://img.shields.io/npm/v/discord-giveaways?style=for-the-badge)](https://npmjs.com/discord-giveaways)
[![documentationBadge](https://img.shields.io/badge/Documentation-Click%20here-blue?style=for-the-badge)](https://discord-giveaways.js.org)

Discord Giveaways is a powerful [Node.js](https://nodejs.org) module that allows you to easily create giveaways!

## Features

-   ⏱️ Easy to use!
-   🔄 Automatic restart after bot crash!
-   🇫🇷 Support for translations: adapt the strings for your own language!
-   📁 Support for all databases! (default is json)
-   ⚙️ Very customizable! (prize, duration, winners, ignored permissions, bonus entries, etc...)
-   🚀 Super powerful: start, edit, reroll, end, delete and pause giveaways!
-   💥 Events: giveawayEnded, giveawayRerolled, giveawayDeleted, giveawayReactionAdded, giveawayReactionRemoved, endedGiveawayReactionAdded
-   🕸️ Support for shards!
-   and much more!

## Installation

```js
npm install --save discord-giveaways
```

## Examples

You can read this example bot on GitHub: [giveaways-bot](https://github.com/Androz2091/giveaways-bot)

### Launch of the module

Required Discord Intents: `GUILDS`, `GUILD_MESSAGES`, `GUILD_MESSAGE_REACTIONS`.  
Optional Discord Privileged Intent for better performance: `GUILD_MEMBERS`.

```js
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
// Starts updating currents giveaways
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

client.login(settings.token);
```

After that, giveaways that are not yet completed will start to be updated again and new giveaways can be started.
You can pass an options object to customize the giveaways. Here is a list of them:

-   **client**: the discord client (your discord bot instance).
-   **options.storage**: the json file that will be used to store giveaways.
-   **options.updateCountdownEvery**: the number of milliseconds it will take to update the timers.
-   **options.endedGiveawaysLifetime**: duration for which the ended giveaways remain in the database after they are ended. ⚠ Giveaways deleted from the DB cannot get rerolled anymore!
-   **options.default.botsCanWin**: if bots can win giveaways.
-   **options.default.exemptPermissions**: an array of discord permissions. Members who have at least one of these permissions will not be able to win a giveaway even if they react to it.
-   **options.default.embedColor**: a hexadecimal color for the embeds of giveaways when they are running.
-   **options.default.embedColorEnd**: a hexadecimal color for the embeds of giveaways when they have ended.
-   **options.default.reaction**: the reaction that users will have to react to in order to participate.
-   **options.default.lastChance**: the last chance system parameters. [Usage example for the giveaway object](https://github.com/Androz2091/discord-giveaways#last-chance)

### Slash commands

Slash commands are used for the command examples of `discord-giveaways`.

The commands themselve are assumed to be in a "commands" folder.

```
discord-bot/
├── commands/
    ├── command1.js
    ├── command2.js
    ├── command3.js
├── node_modules
├── index.js
├── package-lock.json
└── package.json
```

The assumed registering and handling processes for the commands are shown below.

<ins>Registering</ins>

```js
const { REST } = require('@discordjs/rest'); // npm install @discordjs/rest
const { Routes } = require('discord-api-types/v9'); // npm install discord-api-types
const fs = require('fs');

const token = 'Your Discord Bot Token';

// Place your client and guild ids here
const clientId = '123456789012345678';
const guildId = '876543210987654321'; // Only needed for guild commands. For globabl commands this can be removed.

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (err) {
        console.error(err);
    }
})();
```

<ins>Handling</ins>

```js
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    try {
        const command = require(`./commands/${interaction.commandName}`);
        await command.run(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({
            content: `There was an error while executing this command! Please check and try again.\n\`${err.message || err}\``,
            ephemeral: true
        });
    }
}
```

### Start a giveaway

```js
module.exports = {
    data: {
        name: 'start',
        description: 'Start a new giveaway',
        options: [
            {
                name: 'duration',
                description: 'How long the giveaway should last for. Example values: 1m, 1h, 1d',
                type: 3, // STRING
                required: true
            },
            {
                name: 'winners',
                description: 'How many winners the giveaway should have',
                type: 4, // INTEGER
                required: true
            },
            {
                name: 'prize',
                description: 'What the prize of the giveaway should be',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const ms = require('ms'); // npm install ms

        // /start | duration: 2d | winners: 1 | prize: Awesome prize!
        // Will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"
        interaction.client.giveawaysManager.start(interaction.channel, {
            time: ms(interaction.options.getString('duration')),
            winnerCount: interaction.options.getInteger('winners'),
            prize: interaction.options.getString('prize')
        }).then((giveaway) => {
            console.log(giveaway); // {...} (messageId, end date and more)
        });
        // And the giveaway has started!
    }
};
```

-   **options.time**: the giveaway duration.
-   **options.prize**: the giveaway prize.
-   **options.winnerCount**: the number of giveaway winners.
-   **options.messages**: an object with the giveaway messages. [Usage example](https://github.com/Androz2091/discord-giveaways#-translation).
-   **options.thumbnail**: the giveaway thumbnail url.
-   **options.hostedBy**: the user who hosts the giveaway.
-   **options.botsCanWin**: if bots can win the giveaway.
-   **options.exemptPermissions**: an array of discord permissions. Server members who have at least one of these permissions will not be able to win a giveaway even if they react to it.
-   **options.exemptMembers**: function to filter members. If true is returned, the member won't be able to win the giveaway. [Usage example](https://github.com/Androz2091/discord-giveaways#exempt-members)
-   **options.bonusEntries**: an array of BonusEntry objects. [Usage example](https://github.com/Androz2091/discord-giveaways#bonus-entries)
-   **options.embedColor**: a hexadecimal color for the embed of the giveaway when it is running.
-   **options.embedColorEnd**: a hexadecimal color for the embed of the giveaway when is has ended.
-   **options.reaction**: the reaction that users will have to react to in order to participate.
-   **options.extraData**: Extra data which you want to save regarding this giveaway. You can access it from the giveaway object using `giveaway.extraData`.
-   **options.lastChance**: the last chance system parameters. [Usage example](https://github.com/Androz2091/discord-giveaways#last-chance)
-   **options.pauseOptions**: the pause system parameters. [Usage example](https://github.com/Androz2091/discord-giveaways#pause-options).

This allows you to start a new giveaway. Once the `start()` function is called, the giveaway starts, and you only have to observe the result, the package does the rest!

<a href="http://zupimages.net/viewer.php?id=19/23/5h0s.png">
    <img src="https://zupimages.net/up/19/23/5h0s.png"/>
</a>

#### ⚠ ATTENTION!
The command examples below (reroll, edit delete, end) can be executed on any server your bot is a member of if a person has the `prize` or the `messageId`of a giveaway. To prevent abuse we recommend to check if the `prize` or the `messageId` that was provided  by the command user is for a giveaway on the same server, if it is not, then cancel the command execution.

```js
let giveaway = 
// Search with giveaway prize
interaction.client.giveawaysManager.giveaways.find((g) => g.guildId === interaction.guildId && g.prize === interaction.options.getString('prize')) ||
// Search with messageId
interaction.client.giveawaysManager.giveaways.find((g) => g.guildId === interaction.guildId && g.messageId === interaction.options.getString('messageid'));

// If no giveaway was found
if (!giveaway) {
    return interaction.reply(
        'Unable to find a giveaway for `'+ (interaction.options.getString('prize') || interaction.options.getString('messageid')) +'`.'
    );
}
```

### Reroll a giveaway

```js
module.exports = {
    data: {
        name: 'reroll',
        description: 'Reroll a ended giveaway',
        options: [
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to reroll',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.reroll(messageId).then(() => {
            interaction.reply('Success! Giveaway rerolled!');
        });
    }
};
```

-   **options.winnerCount**: the number of winners to pick.
-   **options.messages**: an object with the "congrat" and the "error" message. [Usage example](https://github.com/Androz2091/discord-giveaways#-translation)

<a href="http://zupimages.net/viewer.php?id=19/24/mhuo.png">
    <img src="https://zupimages.net/up/19/24/mhuo.png"/>
</a>

### Edit a giveaway

```js
module.exports = {
    data: {
        name: 'edit',
        description: 'Edit a giveaway',
        options: [
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to edit',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.edit(messageId, {
            addTime: 5000,
            newWinnerCount: 3,
            newPrize: 'New Prize!'
        }).then(() => {
            interaction.reply('Success! Giveaway updated!')
        });
    }
};
```

-   **options.newWinnerCount**: the new number of winners.  
-   **options.newPrize**: the new prize.  
-   **options.addTime**: the number of milliseconds to add to the giveaway duration.
-   **options.setEndTimestamp**: the timestamp of the new end date (for example, for the giveaway to be ended in 1 hour, set it to `Date.now() + 60000`).
-   **options.newMessages**: the new giveaway messages. Will get merged with the existing object, if there.
-   **options.newExtraData**: the new extra data value for the giveaway
-   **options.newBonusEntries**: the new BonusEntry objects (for example, to change the amount of entries).
-   **options.newLastChance**: the new options for the last chance system. Will get merged with the existing object, if there.

**Note**: to reduce giveaway time, define `addTime` with a negative number! For example `addTime: -5000` will reduce giveaway time by 5 seconds!

### Delete a giveaway

```js
module.exports = {
    data: {
        name: 'delete',
        description: 'Delete a giveaway',
        options: [
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to delete',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.delete(messageId).then(() => {
            interaction.reply('Success! Giveaway deleted!');
        });
    }
};
```

-   **doNotDeleteMessage**: whether the giveaway message shouldn't be deleted.

⚠️ **Note**: when you use the delete function, the giveaway data and per default the message of the giveaway are deleted. You cannot restore a giveaway once you have deleted it!

### End a giveaway

```js
module.exports = {
    data: {
        name: 'end',
        description: 'End a giveaway',
        options: [
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to end',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.end(messageId).then(() => {
            interaction.reply('Success! Giveaway ended!');
        });
    }
};
```

### Pause a giveaway

```js
module.exports = {
    data: {
        name: 'pause',
        description: 'Pause a giveaway',
        options: [
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to pause',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.pause(messageId).then(() => {
            interaction.reply('Success! Giveaway paused!');
        })
    }
});
```

-   **options.content**: the text of the embed when the giveaway is paused.
-   **options.unPauseAfter**: the number of milliseconds after which the giveaway will automatically unpause.
-   **options.embedColor**: the color of the embed when the giveaway is paused.

⚠️ **Note**: the pause function overwrites/edits the [pauseOptions object property](https://github.com/Androz2091/discord-giveaways#pause-options) of a giveaway!

### Unpause a giveaway

```js
module.exports = {
    data: {
        name: 'unpause',
        description: 'Unpause a giveaway',
        options: [ 
            {
                name: 'messageid',
                description: 'The message ID of the giveaway to unpause',
                type: 3, // STRING
                required: true
            }
        ]
    },
    async run(interaction) {
        const messageId = interaction.options.getString('messageid');
        interaction.client.giveawaysManager.unpause(messageId).then(() => {
            interaction.reply('Success! Giveaway unpaused!');
        })
    }
});
```

### Fetch giveaways

```js
// A list of all the giveaways
const allGiveaways = client.giveawaysManager.giveaways; // [ {Giveaway}, {Giveaway} ]

// A list of all the giveaways on the server with Id "1909282092"
const onServer = client.giveawaysManager.giveaways.filter(g => g.guildId === '1909282092');

// A list of the current active giveaways (not ended)
const notEnded = client.giveawaysManager.giveaways.filter(g => !g.ended);
```

### Exempt Members

Function to filter members. If true is returned, the member will not be able to win the giveaway.

```js
interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Free Steam Key',
    // Only members who have the "Nitro Boost" role are able to win
    exemptMembers: (member) => !member.roles.cache.some((r) => r.name === 'Nitro Boost')
});
```

**Note**: if the function should be customizable:

```js
const roleName = 'Nitro Boost';

interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Free Steam Key',
    // Only members who have the the role which is assigned to "roleName" are able to win
    exemptMembers: new Function('member', `return !member.roles.cache.some((r) => r.name === \'${roleName}\')`),
});
```

**Note**: because of the special `new Function()` format, you can use `this` inside of the function string to access anything from the giveaway instance. For example: `this.extraData`, or `this.client`.

### Last Chance

```js
interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Discord Nitro!',
    lastChance: {
        enabled: true,
        content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
        threshold: 5000,
        embedColor: '#FF0000'
    }
});
```

-   **lastChance.enabled**: if the last chance system is enabled.
-   **lastChance.content**: the text of the embed when the last chance system is enabled.
-   **lastChance.threshold**: the number of milliseconds before the giveaway ends when the last chance system will be enabled.
-   **lastChance.embedColor**: the color of the embed when last chance is enabled.

<a href="https://zupimages.net/viewer.php?id=21/08/50mx.png">
    <img src="https://zupimages.net/up/21/08/50mx.png"/>
</a>

### Pause Options

```js
interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Discord Nitro!',
    pauseOptions: {
        isPaused: true,
        content: '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
        unPauseAfter: null,
        embedColor: '#FFFF00'
    }
});
```

-   **pauseOptions.isPaused**: if the giveaway is paused.
-   **pauseOptions.content**: the text of the embed when the giveaway is paused.
-   **pauseOptions.unPauseAfter**: the number of milliseconds after which the giveaway will automatically unpause.
-   **pauseOptions.embedColor**: the color of the embed when the giveaway is paused.

<a href="https://zupimages.net/viewer.php?id=21/24/dxhk.png">
    <img src="https://zupimages.net/up/21/24/dxhk.png"/>
</a>

### Bonus Entries

```js
interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Free Steam Key',
    bonusEntries: [  
        {
            // Members who have the "Nitro Boost" role get 2 bonus entries
            bonus: (member) => member.roles.cache.some((r) => r.name === 'Nitro Boost') ? 2 : null,
            cumulative: false
        }
    ]
});
```

-   **bonusEntries[].bonus**: the filter function that takes one parameter, a member and returns the amount of entries.
-   **bonusEntries[].cumulative**: if the amount of entries from the function can get summed with other amounts of entries.

**Note**: if the `bonus` function should be customizable:

```js
const roleName = 'Nitro Boost';
const roleBonusEntries = 2;

interaction.client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Free Steam Key',
    bonusEntries: [
        {   
            // Members who have the role which is assigned to "roleName" get the amount of bonus entries which is assigned to "roleBonusEntries"
            bonus: new Function('member', `return member.roles.cache.some((r) => r.name === \'${roleName}\') ? ${roleBonusEntries} : null`),
            cumulative: false 
        }
    ]
});
```

**Note**: because of the special `new Function()` format, you can use `this` inside of the function string to access anything from the giveaway instance. For example: `this.extraData`, or `this.client`.

## 🇫🇷 Translation

You can also pass a `messages` parameter for `start()` function, if you want to translate the bot text:

-   **options.messages.giveaway**: the message that will be displayed above the embeds.
-   **options.messages.giveawayEnded**: the message that will be displayed above the embeds when the giveaway is ended.
-   **options.messages.timeRemaining**: the message that displays the remaining time (the timer).
-   **options.messages.inviteToParticipate**: the message that invites users to participate.
-   **options.messages.winMessage**: the message that will be displayed to congratulate the winner(s) when the giveaway is ended.
-   **options.messages.embedFooter**: the message displayed at the bottom of the embeds. [Can be deactivated and iconURL can be set](https://discord-giveaways.js.org/global.html#EmbedFooterObject).
-   **options.messages.noWinner**: the message that is displayed if no winner can be drawn.
-   **options.messages.winners**: simply the word "winner" in your language.
-   **options.messages.endedAt**: simply the words "Ended at" in your language.
-   **options.messages.units.seconds**: simply the word "seconds" in your language.
-   **options.messages.units.minutes**: simply the word "minutes" in your language.
-   **options.messages.units.hours**: simply the word "hours" in your language.
-   **options.messages.units.days**: simply the word "days" in your language.

**Note**: units should be in the plural.

For example:

```js
interaction.client.giveawaysManager.start(interaction.channel, {
    time: ms(interaction.options.getString('duration')),
    winnerCount: interaction.options.getInteger('amount of winners'),
    prize: interaction.options.getString('prize')
    messages: {
        giveaway: '🎉🎉 **GIVEAWAY** 🎉🎉',
        giveawayEnded: '🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
        timeRemaining: 'Time remaining: **{duration}**',
        inviteToParticipate: 'React with 🎉 to participate!',
        winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
        embedFooter: 'Powered by the discord-giveaways package',
        noWinner: 'Giveaway cancelled, no valid participations.',
        hostedBy: 'Hosted by: {user}',
        winners: 'winner(s)',
        endedAt: 'Ended at',
        units: {
            seconds: 'seconds',
            minutes: 'minutes',
            hours: 'hours',
            days: 'days',
            pluralS: false // Not needed, because units end with a S so it will automatically removed if the unit value is lower than 2
        }
    }
});
```

And for the `reroll()` function:

```js
interaction.client.giveawaysManager.reroll(messageId, {
        messages: {
            congrat: ':tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}',
            error: 'No valid participations, no new winner(s) can be chosen!'
        }
    });
```

-   **options.messages.congrat**: the congratulatory message.  
-   **options.messages.error**: the error message if there is no valid participant.

## Custom Database

You can use your custom database to save giveaways, instead of the json files (the "database" by default for `discord-giveaways`). For this, you will need to extend the `GiveawaysManager` class, and replace some methods with your custom ones. There are 4 methods you will need to replace:

-   `getAllGiveaways`: this method returns an array of stored giveaways.
-   `saveGiveaway`: this method stores a new giveaway in the database.
-   `editGiveaway`: this method edits a giveaway already stored in the database.
-   `deleteGiveaway`: this method deletes a giveaway from the database (permanently).

**⚠️ All the methods should be asynchronous to return a promise!**

<ins>**SQL examples**</ins>
- [MySQL](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/mysql.js)
- SQLite
  - [Quick.db](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/quick.db.js)
  - [Enmap](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/enmap.js)

<ins>**NoSQL examples**</ins>
- MongoDB
  - [Mongoose](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/mongoose.js)
  - [QuickMongo](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/quickmongo.js) ⚠️ Not recommended for high giveaway usage, use the `mongoose` example instead
- Replit Database ⚠️ Only usable if your bot is hosted on [Replit](https://replit.com/)
  - [@replit/database](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/replit.js)
  - [Quick.Replit](https://github.com/Androz2091/discord-giveaways/blob/master/examples/custom-databases/quick.replit.js)

## Support shards

To make `discord-giveaways` working with shards, you will need to extend the `GiveawaysManager` class and update the `refreshStorage()` method. This method should call the `getAllGiveaways()` method for **every** shard, so all `GiveawaysManager` synchronize their cache with the updated database.

⚠️ **Note**: If you are using a [custom database](https://github.com/Androz2091/discord-giveaways#custom-database) then you must call (= add to code) `refreshStorage()` at the end of your extended `saveGiveaway`, `editGiveaway` and `deleteGiveaway` methods.

```js
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

// Extends the GiveawaysManager class and update the refreshStorage method
const { GiveawaysManager } = require('discord-giveaways');
const GiveawayManagerWithShardSupport = class extends GiveawaysManager {
    // Refresh storage method is called when the database is updated on one of the shards
    async refreshStorage() {
        // This should make all shard refreshing their cache with the updated database
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
```
