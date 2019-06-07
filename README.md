# discord-giveaways
A complete framework to facilitate the creation of giveaways using discord.js
# Discord Giveaways

**Note**: If you are using Discord.js v12 or higher, type `npm install Androz2091/discord-giveaways#v12` instead of `npm install discord-giveaways`

Discord Giveaways is a powerful [Node.js](https://nodejs.org) module that allows you to easily create giveaways!

*   The duration of the Giveaway is customizable!
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
giveaways = require("discord-giveaways"),
client = new Discord.Client(),
settings = {
    prefix: "g!",
    token: "Your Discord Token"
};

client.on("ready", () => {
    console.log("I'm ready !");
    giveaways.launch(client, {
        updateCountdownEvery: 5000,
        botsCanWin: false,
        ignoreIfHasPermission: [
            "MANAGE_MESSAGES",
            "MANAGE_GUILD",
            "ADMINISTRATOR"
        ],
        embedColor: "#FF0000",
        reaction: "🎉"
    });
});
```

After that, giveaways that are not yet completed will start to be updated again and new giveaways can be launched.
You can pass a list of options to this method to customize the giveaway. Here is a list of them:

*   **client**: the discord client (your discord bot instance)
*   **options.updateCountdownEvery**: the number of seconds it will take to update the timers
*   **options.botsCanWin**: whether the bots can win a giveaway
*   **options.ignoreIfHasPermission**: an array of discord permissions. Members who have at least one of these permissions will not be able to win a giveaway even if they react to it.
*   **options.embedColor**: a hexadecimal color for the embeds of giveaways.
*   **options.reaction**: the reaction that users will have to react to in order to participate!

### Start a giveaway

```js
client.on("message", (message) => {

    const ms = require("ms"); // npm install ms
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "start-giveaway"){
        // g!start-giveaway 2d 1 Awesome prize !
        // will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize"

        giveaways.start(message.channel, {
            time: ms(args[0]),
            prize: args.slice(2).join(" "),
            winnersCount: parseInt(args[1]),
        });
        // And the giveaway is started!
    }
});
```

This allows you to launch a giveaway. Once the `start()` function is called, the giveaway starts and you only have to observe the result, the module does the rest!

<a href="http://zupimages.net/viewer.php?id=19/23/5h0s.png">
    <img src="https://zupimages.net/up/19/23/5h0s.png"/>
</a>

### 🇫🇷 Translation

You can also pass a `messages` parameter for `launch()` function, if you want to translate the bot text :

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

Here are the default values :

```js
giveaways.launch(client, {
    updateCountdownEvery: 5000,
    botsCanWin: false,
    ignoreIfHasPermission: [],
    embedColor: "#FF0000",
    reaction: "🎉",
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