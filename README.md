# Discord Giveaways

[![downloadsBadge](https://img.shields.io/npm/dt/discord-giveaways?style=for-the-badge)](https://npmjs.com/discord-backup)
[![versionBadge](https://img.shields.io/npm/v/discord-giveaways?style=for-the-badge)](https://npmjs.com/discord-backup)
[![doc](https://img.shields.io/badge/Documentation-Click%20here-blue?style=for-the-badge)](https://discord-giveaways.js.org)
[![patreonBadge](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2FAndroz2091%2Fpledges&style=for-the-badge)](https://patreon.com/Androz2091)


Discord Giveaways is a powerful [Node.js](https://nodejs.org) module that allows you to easily create giveaways!

*   The duration of the Giveaway is customizable!
*   Automatic restart after bot crash
*   Update of the timer every X seconds!
*   The strings are fully customizable so you can adapt them to your language!
*   And customizable prize, customizable number of winners, customizable ignored members, and more!

## Installation

```js
npm install --save discord-giveaways
```

## Examples

### Launch of the module

```js
const Discord = require("discord.js"),
client = new Discord.Client(),
settings = {
    prefix: "g!",
    token: "Your Discord Token"
};

// Requires Manager from discord-giveaways
const { GiveawaysManager } = require("discord-giveaways");
// Starts updating currents giveaways
const manager = new GiveawaysManager(client, {
    storage: "./giveaways.json",
    updateCountdownEvery: 5000,
    default: {
        botsCanWin: false,
        exemptPermissions: [ "MANAGE_MESSAGES", "ADMINISTRATOR" ],
        embedColor: "#FF0000",
        reaction: "🎉"
    }
});

client.on("ready", () => {
    console.log("I'm ready !");
});

client.login(settings.token);
```

After that, giveaways that are not yet completed will start to be updated again and new giveaways can be launched.
You can pass a list of options to this method to customize the giveaway. Here is a list of them:

*   **client**: the discord client (your discord bot instance)
*   **options.storage**: the json file that will be used to store giveaways
*   **options.updateCountdownEvery**: the number of seconds it will take to update the timers
*   **options.default.botsCanWin**: whether the bots can win a giveaway
*   **options.default.exemptPermissions**: an array of discord permissions. Members who have at least one of these permissions will not be able to win a giveaway even if they react to it.
*   **options.default.embedColor**: a hexadecimal color for the embeds of giveaways.
*   **options.default.embedColorEnd**: a hexadecimal color the embeds of giveaways when they are ended.  
*   **options.default.reaction**: the reaction that users will have to react to in order to participate!

### Start a giveaway

```js
client.on("message", (message) => {

    const ms = require("ms"); // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "start-giveaway"){
        // g!start-giveaway 2d 1 Awesome prize!
        // will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"

        manager.start(message.channel, {
            time: ms(args[0]),
            prize: args.slice(2).join(" "),
            winnerCount: parseInt(args[1])
        }).then((gData) => {
            console.log(gData); // {...} (messageid, end date and more)
        });
        // And the giveaway has started!
    }
});
```

*   **options.time**: the giveaway duration  
*   **options.prize**: the giveaway prize  
*   **options.winnerCount**: the number of giveaway winners
*   **options.botsCanWin**: whether the bots can win a giveaway
*   **options.exemptPermissions**: an array of discord permissions. Members who have at least one of these permissions will not be able to win a giveaway even if they react to it.
*   **options.embedColor**: a hexadecimal color for the embeds of giveaways.
*   **options.embedColorEnd**: a hexadecimal color the embeds of giveaways when they are ended.  
*   **options.reaction**: the reaction that users will have to react to in order to participate!

This allows you to launch a giveaway. Once the `start()` function is called, the giveaway starts and you only have to observe the result, the module does the rest!

<a href="http://zupimages.net/viewer.php?id=19/23/5h0s.png">
    <img src="https://zupimages.net/up/19/23/5h0s.png"/>
</a>

### Fetch the giveaways

```js
    // The list of all the giveaways
    let allGiveaways = manager.giveaways; // [ {Giveaway}, {Giveaway} ]

    // The list of all the giveaways on the server with ID "1909282092"
    let onServer = manager.giveaways.filter((g) => g.guildID === "1909282092");

    // The list of the current giveaways (not ended)
    let notEnded = manager.giveaways.filter((g) => !g.ended);
```
### Reroll a giveaway

```js
client.on("message", (message) => {

    const ms = require("ms"); // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "reroll"){
        let messageID = args[0];
        manager.reroll(messageID).then(() => {
            message.channel.send("Success! Giveaway rerolled!");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
    }

});
```

**options.winnerCount**: the number of winners to pick

<a href="http://zupimages.net/viewer.php?id=19/24/mhuo.png">
    <img src="https://zupimages.net/up/19/24/mhuo.png"/>
</a>

### Edit a giveaway

```js
client.on("message", (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "edit"){
        let messageID = args[0];
        manager.edit(messageID, {
            newWinnerCount: 3,
            newPrize: "New Prize!",
            addTime: 5000
        }).then(() => {
            message.channel.send("Success! Giveaway will updated in less than "+(manager.updateCountdownEvery/1000)+" seconds.");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
    }

});
```

**options.newWinnerCount**: the new number of winners  
**options.newPrize**: the new prize  
**options.addTime**: the number of milliseconds to add to the giveaway duration
**options.setEndTimestamp**: the timestamp of the new end date. `Date.now()+1000`

⚠️ Tips: to reduce giveaway time, define `addTime` with a negative number! For example `addTime: -5000` will reduce giveaway time by 5 seconds!

### Delete a giveaway

```js
client.on("message", (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "delete"){
        let messageID = args[0];
        manager.delete(messageID).then(() => {
            message.channel.send("Success! Giveaway deleted!");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
    }

});
```

When you use the delete function, the giveaway data and the message of the giveaway are deleted. You cannot restore a giveaway once you have deleted it.

## 🇫🇷 Translation

You can also pass a `messages` parameter for `start()` function, if you want to translate the bot text :

* **options.messages.giveaway**: the message that will be displayed above the embeds
* **options.messages.giveawayEnded**: the message that will be displayed above the embeds when the giveaway is terminated
* **options.messages.timeRemaining**: the message that displays the remaining time (the timer)
* **options.messages.inviteToParticipate**: the message that invites users to participate
* **options.messages.winMessage**: the message that will be displayed to congratulate the winner(s) when the giveaway is terminated
* **options.messages.embedFooter**: the message displayed at the bottom of the embeds
* **options.messages.noWinner**: the message that is displayed if no winner can be drawn
* **options.messages.winners**: simply the word "winner" in your language
* **options.messages.endedAt**: simply the words "Ended at" in your language
* **options.messages.units.seconds**: simply the word "seconds" in your language
* **options.messages.units.minutes**: simply the word "minutes" in your language
* **options.messages.units.hours**: simply the word "hours" in your language
* **options.messages.units.days**: simply the word "days" in your language

For example :

```js
manager.start(message.channel, {
    time: ms(args[0]),
    prize: args.slice(2).join(" "),
    winnerCount: parseInt(args[1]),
    messages: {
        giveaway: "@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉",
        giveawayEnded: "@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉",
        timeRemaining: "Time remaining: **{duration}**!",
        inviteToParticipate: "React with 🎉 to participate!",
        winMessage: "Congratulations, {winners}! You won **{prize}**!",
        embedFooter: "Giveaways",
        noWinner: "Giveaway cancelled, no valid participations.",
        winners: "winner(s)",
        endedAt: "Ended at",
        units: {
            seconds: "seconds",
            minutes: "minutes",
            hours: "hours",
            days: "days"
        }
    }
});
```

And for the `reroll()` function:

```js
manager.reroll(messageID, {
    messages: {
        congrat: ":tada: New winner(s) : {winners}! Congratulations!",
        error: "No valid participations, no winners can be chosen!"
    }
}).catch((err) => {
    message.channel.send("No giveaway found for "+messageID+", please check and try again");
});
```

**options.messages.congrat**: the message of congratulations  
**options.messages.error**: the error message if there is no valid participations.
