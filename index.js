/* To know more information about this npm module, go here : https://npmjs.com/package/discord-giveaways */
const Discord = require("discord.js"),
fs = require("fs"),
ms = require("ms");

const fcheck = require("./functions/check"),
fstart = require("./functions/start");

const settings = {
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
    },
    launched: false
}

module.exports = {

    /* Returns the package version */
    version: require("./package.json").version,

    launch(client, options){
        if(!client){
            throw new Error("Invalid parameters");
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
        if(typeof options.messages === "object"){
            settings.messages = options.messages;
        }
        settings.launched = true;
        setInterval(fcheck, settings.updateCountdownEvery, client, settings);
    },

    async start(guildChannel, options){
        if(!settings.launched){
            throw new Error("Please launch the module before starting to create giveaways!");
        }
        fstart(guildChannel, options, settings).then((giveaway) => {
            return giveaway;
        });
    }

}