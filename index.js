/* To know more information about this npm module, go here : https://npmjs.com/package/discord-giveaways */
const Discord = require("discord.js"),
fs = require("fs"),
path = require("path"),
ms = require("ms");

let parentDirectory = __dirname.split(path.sep);
parentDirectory.pop();
let jsonPath = parentDirectory.join(path.sep)+path.sep+"discord-giveaways/giveaways.json";

const fcheck = require("./functions/check"),
fstart = require("./functions/start");

const settings = {
    updateCountdownEvery: 5000,
    botsCanWin: false,
    ignoreIfHasPermission: [],
    embedColor: "#FF0000",
    reaction: "🎉",
    client: null,
    launched: false
}

module.exports = {

    /* Returns the package version */
    version: require("./package.json").version,

    /**
     * Start updating giveaways
     * @param {object} client The Discord Client
     * @param {object} options The options
     */
    launch(client, options){
        if(!client){
            throw new Error("No client found.");
        }
        if(!isNaN(options.updateCountdownEvery)){
            settings.updateCountdownEvery = options.updateCountdownEvery;
        }
        if(typeof options.botsCanWin === "boolean"){
            settings.botsCanWin = options.botsCanWin;
        }
        if(typeof options.ignoreIfHasPermission === "array"){
            let permissions = ["ADMINISTRATOR","CREATE_INSTANT_INVITE","KICK_MEMBERS","BAN_MEMBERS","MANAGE_CHANNELS","MANAGE_GUILD","ADD_REACTIONS","VIEW_AUDIT_LOG","PRIORITY_SPEAKER","STREAM","VIEW_CHANNEL","SEND_MESSAGES","SEND_TTS_MESSAGES","MANAGE_MESSAGES","EMBED_LINKS","ATTACH_FILES","READ_MESSAGE_HISTORY","MENTION_EVERYONE","USE_EXTERNAL_EMOJIS","CONNECT","SPEAK","MUTE_MEMBERS","DEAFEN_MEMBERS","MOVE_MEMBERS","USE_VAD","CHANGE_NICKNAME","MANAGE_NICKNAMES","MANAGE_ROLES","MANAGE_WEBHOOKS","MANAGE_EMOJIS"];
            let invalidPermissions = options.ignoreIfHasPermission.filter((perm) => !permissions.includes(perm));
            if(invalidPermissions[0]){
                throw new TypeError("Invalid permissions: "+invalidPermissions[0]);
            }
            settings.ignoreIfHasPermission = options.ignoreIfHasPermission;
        }
        if(typeof options.embedColor === "string"){
            let hex = (options.embedColor.startsWith("#") ? options.embedColor.substr(1, options.embedColor.length) : options.embedColor);
            let number = parseInt(hex, 16);
            if(isNaN(number)){
                throw new TypeError(options.embedColor+" is not a valid hexadecimal value.");
            }
            settings.embedColor = options.embedColor;
        }
        if(typeof options.reaction === "string"){
            settings.reaction = options.reaction;
        }
        settings.launched = true;
        settings.client = client;
        setInterval(fcheck, settings.updateCountdownEvery, client, settings);
    },

    /**
     * Start a giveaway
     * @param {object} guildChannel The channel for the giveaway
     * @param {object} options The options for the giveaway
     * @returns The giveaway data
     */
    async start(guildChannel, options){
        return new Promise(function(resolve, reject){
            if(!settings.launched){
                throw new Error("Please use the launch() function before starting to create giveaways!");
            }
            if(options.messages !== "object"){
                options.messages = {
                    giveaway: "@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉",
                    giveawayEnded: "@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉",
                    timeRemaining: "Time remaining: **{duration}**!",
                    inviteToParticipate: "React with 🎉 to participate!",
                    winMessage: "Congratulations, {winners}! You won **{prize}**!",
                    embedFooter: "Coucou",
                    noWinner: "Giveaway cancelled, no valid participations.",
                    winners: "winner(s)",
                    endedAt: "End at",
                    units: { seconds: "seconds", minutes: "minutes", hours: "hours", days: "days" }
                }
            }
            if(typeof guildChannel !== "object"){
                throw new Error(guildChannel+" is not a valid guildchannel.");
            }
            if(typeof options.time !== "number"){
                throw new Error(options.time+" is not a number.");
            }
            if(typeof options.prize !== "string"){
                throw new Error(options.prize+" is not a string.");
            }
            if(typeof options.winnersCount !== "number"){
                throw new Error(options.winnersCount+" is not a number.");
            }
            fstart(guildChannel, options, settings).then((data) => {
                resolve({
                    ID: data.id,
                    messageID: data.messageID,
                    channelID: data.channelID,
                    endAt: data.endAt
                });
            }).catch((err) => {
                reject(err);
            });
        });
    },

    /**
     * Returns the list of the giveaways
     * @returns An array with the giveaways
     */
    fetch(){
        let giveaways = require(jsonPath);
        return giveaways;
    },

    /**
     * Choose new winner(s) for the giveaway
     * @param {string} messageID The message ID of the giveaway to reroll
     */
    async reroll(messageID, options){
        if(!options){
            options = {
                congrat: ":tada: New winner(s) : {winners}! Congratulations!",
                error: "No valid participations, no winners can be chosen!"
            }
        }
        let giveaways = require(jsonPath);
        let giveaway = giveaways.find((g) => g.messageID === messageID);
        if(!giveaway){
            throw new Error("No giveaway found with message ID "+messageID);
        }
        if(!giveaway.ended){
            throw new Error("The giveaway with message ID "+messageID+" is not ended. Please wait and retry.");
        }
        let channel = settings.client.channels.get(giveaway.channelID);
        if(!channel){
            throw new Error("Cannot get channel "+giveaway.channelID);
        }
        let message = await channel.fetchMessage(giveaway.messageID).catch((err) => {
            throw new Error("Cannot fetch message "+giveaway.messageID+" in channel "+giveaway.channelID);
        });
        let guild = message.guild;
        let reaction = message.reactions.find((r) => r._emoji.name === settings.reaction);
        reaction.users = await reaction.fetchUsers();
        if(reaction){
            let users = (settings.botsCanWin ?
                reaction.users
                    .filter((u) => u.id !== message.client.id)
                    .filter((u) => guild.members.get(u.id)) : 
                reaction.users
                    .filter((u) => !u.bot)
                    .filter((u) => u.id !== message.client.id)
                    .filter((u) => guild.members.get(u.id))
            );
            users.forEach((user) => {
                let member = guild.members.get(user.id);
                settings.ignoreIfHasPermission.forEach((perm) => {
                    if(member.hasPermission(perm)){
                        users = users.filter((u) => u.id !== user.id);
                    }
                });
            });
            if(users.size < 1){
                return channel.send(options.error);
            } else {
                let uWinners = users.random(giveaway.winnersCount).filter((u) => u);
                let winners = uWinners.map((w) => "<@"+w.id+">").join(", ");
                channel.send(options.congrat
                    .replace("{winners}", winners)
                );
                return uWinners;
            }
        }
    },

    /**
     * Edit some options for a giveaway
     * @param {string} messageID The message ID of the giveaway to reroll
     * @param {object} options The new options
     * @returns The new giveaway
     */
    edit(messageID, options){
        let giveaways = require(jsonPath);
        let giveaway = giveaways.find((g) => g.messageID === messageID);
        if(!giveaway){
            throw new Error("No giveaway found with message ID "+messageID);
        }
        if(giveaway.ended){
            throw new Error("The giveaway with message ID "+messageID+" is ended.");
        }
        let nGiveaways = [];
        giveaways.forEach((g) => {
            if(g.messageID !== messageID){
                nGiveaways.push(g);
            }
        });
        for(let option in options){
            let value = options[option];
            giveaway[option] = value;
        }
        nGiveaways.push(giveaway);
        fs.writeFileSync(jsonPath, JSON.stringify(giveaways), "utf-8");
        return giveaway;
    }
}