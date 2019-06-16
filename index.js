/* To know more information about this npm module, go here : https://npmjs.com/package/discord-giveaways */
const Discord = require("discord.js"),
fs = require("fs"),
ms = require("ms");

let parentDirectory = __dirname.split(path.sep);
parentDirectory.pop();
let jsonPath = parentDirectory.join(path.sep)+path.sep+"giveaways.json";

const fcheck = require("./functions/check"),
fstart = require("./functions/start");

const settings = {
    updateCountdownEvery: 5000,
    botsCanWin: false,
    ignoreIfHasPermission: [],
    embedColor: "#FF0000",
    reaction: "🎉",
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
        setInterval(fcheck, settings.updateCountdownEvery, client, settings);
    },

    /**
     * Start a giveaway
     * @param {object} guildChannel The channel for the giveaway
     * @param {object} options The options for the giveaway
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
                throw new Element(options.winnersCount+" is not a number.");
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
    }
}