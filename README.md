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
-   **[and many other optional parameters to customize the manager - read documentation](https://discord-giveaways.js.org/global.html#GiveawaysManagerOptions)**

### Start a giveaway

```js
client.on('interactionCreate', (interaction) => {

    const ms = require('ms');

    if (interaction.isCommand() && interaction.commandName === 'start-giveaway') {
        // /start-giveaway 2d 1 Awesome prize!
        // Will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"

        const time = interaction.options.getString('time');
        const winnerCount = interaction.options.getInteger('winner_count');
        const prize = interaction.options.getString('prize');

        client.giveawaysManager.start(interaction.channel, {
            time: ms(time),
            winnerCount,
            prize
        }).then((gData) => {
            console.log(gData); // {...} (messageId, end date and more)
        });
        // And the giveaway has started!
    }
});
```

-   **options.time**: the giveaway duration.
-   **options.prize**: the giveaway prize.
-   **options.winnerCount**: the number of giveaway winners.
-   **[and many other optional parameters to customize the giveaway - read documentation](https://discord-giveaways.js.org/global.html#GiveawayStartOptions)**

This allows you to start a new giveaway. Once the `start()` function is called, the giveaway starts, and you only have to observe the result, the package does the rest!

<a href="http://zupimages.net/viewer.php?id=19/23/5h0s.png">
    <img src="https://zupimages.net/up/19/23/5h0s.png"/>
</a>

#### ⚠ ATTENTION!
The command examples below (reroll, edit delete, end) can be executed on any server your bot is a member of if a person has the `prize` or the `messageId`of a giveaway. To prevent abuse we recommend to check if the `prize` or the `messageId` that was provided  by the command user is for a giveaway on the same server, if it is not, then cancel the command execution.

```js
let giveaway = 
// Search with giveaway prize
client.giveawaysManager.giveaways.find((g) => g.guildId === interaction.guild.id && g.prize === interaction.options.getString('query')) ||
// Search with messageId
client.giveawaysManager.giveaways.find((g) => g.guildId === interaction.guild.id && g.messageId === interaction.options.getString('query'));

// If no giveaway was found
if (!giveaway) return interaction.channel.send('Unable to find a giveaway for `'+ args.join(' ') +'`.');
```

### Reroll a giveaway

```js
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'reroll') {
        const messageId = interaction.options.getString('message_id');
        client.giveawaysManager.reroll(messageId).then(() => {
            interaction.channel.send('Success! Giveaway rerolled!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});
```

-   **options.winnerCount**: the number of winners to pick.
-   **options.messages**: an object with the "congrat" and the "error" message. [Usage example](https://github.com/Androz2091/discord-giveaways#-translation)

<a href="http://zupimages.net/viewer.php?id=19/24/mhuo.png">
    <img src="https://zupimages.net/up/19/24/mhuo.png"/>
</a>

### Edit a giveaway

```js
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'edit') {
        const messageId = interaction.options.getString('message_id');
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
});
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
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'delete') {
        const messageId = interaction.options.getString('message_id');
        client.giveawaysManager.delete(messageId).then(() => {
            interaction.channel.send('Success! Giveaway deleted!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});
```

-   **doNotDeleteMessage**: whether the giveaway message shouldn't be deleted.

⚠️ **Note**: when you use the delete function, the giveaway data and per default the message of the giveaway are deleted. You cannot restore a giveaway once you have deleted it!

### End a giveaway

```js
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'end') {
        const messageId = interaction.options.getString('message_id');
        client.giveawaysManager.end(messageId).then(() => {
            interaction.channel.send('Success! Giveaway ended!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});
```

### Pause a giveaway

```js
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'pause') {
        const messageId = interaction.options.getString('message_id');
        client.giveawaysManager.pause(messageId).then(() => {
            interaction.channel.send('Success! Giveaway paused!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});
```

-   **options.content**: the text of the embed when the giveaway is paused.
-   **options.unPauseAfter**: the number of milliseconds after which the giveaway will automatically unpause.
-   **options.embedColor**: the color of the embed when the giveaway is paused.

⚠️ **Note**: the pause function overwrites/edits the [pauseOptions object property](https://github.com/Androz2091/discord-giveaways#pause-options) of a giveaway!

### Unpause a giveaway

```js
client.on('interactionCreate', (interaction) => {

    if (interaction.isCommand() && interaction.commandName === 'unpause') {
        const messageId = interaction.options.getString('message_id');
        client.giveawaysManager.unpause(messageId).then(() => {
            interaction.channel.send('Success! Giveaway unpaused!');
        }).catch((err) => {
            interaction.channel.send(`An error has occurred, please check and try again.\n\`${err}\``);
        });
    }
});
```

- **noWinnerMessage**: Sent in the channel if there is no valid winner for the giveaway.

### Fetch giveaways

```js
// A list of all the giveaways
const allGiveaways = client.giveawaysManager.giveaways; // [ {Giveaway}, {Giveaway} ]

// A list of all the giveaways on the server with Id "1909282092"
const onServer = client.giveawaysManager.giveaways.filter((g) => g.guildId === '1909282092');

// A list of the current active giveaways (not ended)
const notEnded = client.giveawaysManager.giveaways.filter((g) => !g.ended);
```

### Exempt Members

Function to filter members. If true is returned, the member will not be able to win the giveaway.

```js
client.giveawaysManager.start(interaction.channel, {
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

client.giveawaysManager.start(interaction.channel, {
    time: 60000,
    winnerCount: 1,
    prize: 'Free Steam Key',
    // Only members who have the the role which is assigned to "roleName" are able to win
    exemptMembers: new Function('member', `return !member.roles.cache.some((r) => r.name === \'${roleName}\')`),
});
```

**Note**: because of the special `new Function()` format, you can use `this` inside of the function string to access anything from the giveaway instance. For example: `this.extraData`, or `this.client`.

⚠️ **Note**: because of the special `new Function()` format, external variables which contain [Discord Snowflakes](https://discord.com/developers/docs/reference#snowflakes) have to be stored in `giveaway.extraData` and have to be accessed with `this.extraData` inside of the function.  
The reason for this is that, in JavaScript, all numbers are [IEEE double precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) floating point numbers, which means that you only have about 16 digits of precision; the remainder of the 64 bits are reserved for the exponent.  
But snowflakes can have more than 16 digits, which means that if you would access them like in the example above, the last digits of the snowflake would get messed up.  
_The special format would "convert" the external string snowflake into a number, that is why we talk about digits here._


### Last Chance

```js
client.giveawaysManager.start(interaction.channel, {
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
client.giveawaysManager.start(interaction.channel, {
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
client.giveawaysManager.start(interaction.channel, {
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

client.giveawaysManager.start(interaction.channel, {
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

⚠️ **Note**: because of the special `new Function()` format, external variables which contain [Discord Snowflakes](https://discord.com/developers/docs/reference#snowflakes) have to be stored in `giveaway.extraData` and have to be accessed with `this.extraData` inside of the function.  
The reason for this is that, in JavaScript, all numbers are [IEEE double precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) floating point numbers, which means that you only have about 16 digits of precision; the remainder of the 64 bits are reserved for the exponent.  
But snowflakes can have more than 16 digits, which means that if you would access them like in the example above, the last digits of the snowflake would get messed up.  
_The special format would "convert" the external string snowflake into a number, that is why we talk about digits here._

## 🇫🇷 Translation

You can also pass a `messages` parameter for `start()` function, if you want to translate the bot text:

-   **options.messages.giveaway**: the message that will be displayed above the embeds.
-   **options.messages.giveawayEnded**: the message that will be displayed above the embeds when the giveaway is ended.
-   **options.messages.drawing**: the message that displays the drawing timestamp.
-   **options.messages.inviteToParticipate**: the message that invites users to participate.
-   **options.messages.winMessage**: the message that will be displayed to congratulate the winner(s) when the giveaway is ended.
-   **options.messages.embedFooter**: the message displayed at the bottom of the embeds. [Can be deactivated and iconURL can be set](https://discord-giveaways.js.org/global.html#EmbedFooterObject).
-   **options.messages.noWinner**: the message that is displayed if no winner can be drawn.
-   **options.messages.winners**: simply the word "winner" in your language.
-   **options.messages.endedAt**: simply the words "Ended at" in your language.

For example:

```js
client.giveawaysManager.start(interaction.channel, {
    time: ms(args[0]),
    winnerCount: parseInt(args[1]),
    prize: args.slice(2).join(' '),
    messages: {
        giveaway: '🎉🎉 **GIVEAWAY** 🎉🎉',
        giveawayEnded: '🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
        drawing: 'Drawing: {timestamp}',
        inviteToParticipate: 'React with 🎉 to participate!',
        winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
        embedFooter: 'Powered by the discord-giveaways package',
        noWinner: 'Giveaway cancelled, no valid participations.',
        hostedBy: 'Hosted by: {user}',
        winners: 'winner(s)',
        endedAt: 'Ended at',
    }
});
```

And for the `reroll()` function:

```js
client.giveawaysManager.reroll(messageId, {
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

⚠️ **Note**: If you are using a [custom database](https://github.com/Androz2091/discord-giveaways#custom-database) then you must call (= add to code) `this.refreshStorage()` at the end of your extended `saveGiveaway`, `editGiveaway` and `deleteGiveaway` methods.

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
