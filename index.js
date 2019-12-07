/* To know more information about this npm module, go here : https://npmjs.com/package/discord-giveaways */
const Discord = require("discord.js");

const fs = require("fs"), // To write giveaways.json file
path = require("path");   // To get the giveaways.json file location

// Utils functions
const utils = require("./utils");

/* DEFAULT SETTINGS */
const settings = {
    updateCountdownEvery: 5000,
    botsCanWin: false,
    ignoreIfHasPermission: [],
    embedColor: "#FF0000",
    embedColorEnd: "#000000",
    reaction: "🎉",
    client: null,
    storage: __dirname+"/giveaways.json",
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
        if(options.botsCanWin){
            settings.botsCanWin = options.botsCanWin;
        }
        if(options.ignoreIfHasPermission){
            let permissions = ["ADMINISTRATOR","CREATE_INSTANT_INVITE","KICK_MEMBERS","BAN_MEMBERS","MANAGE_CHANNELS","MANAGE_GUILD","ADD_REACTIONS","VIEW_AUDIT_LOG","PRIORITY_SPEAKER","STREAM","VIEW_CHANNEL","SEND_MESSAGES","SEND_TTS_MESSAGES","MANAGE_MESSAGES","EMBED_LINKS","ATTACH_FILES","READ_MESSAGE_HISTORY","MENTION_EVERYONE","USE_EXTERNAL_EMOJIS","CONNECT","SPEAK","MUTE_MEMBERS","DEAFEN_MEMBERS","MOVE_MEMBERS","USE_VAD","CHANGE_NICKNAME","MANAGE_NICKNAMES","MANAGE_ROLES","MANAGE_WEBHOOKS","MANAGE_EMOJIS"];
            let invalidPermissions = options.ignoreIfHasPermission.filter((perm) => !permissions.includes(perm));
            if(invalidPermissions[0]){
                throw new TypeError("Invalid permissions: "+invalidPermissions[0]);
            }
            settings.ignoreIfHasPermission = options.ignoreIfHasPermission;
        }
        if(options.embedColor){
            let hex = (options.embedColor.startsWith("#") ? options.embedColor.substr(1, options.embedColor.length) : options.embedColor);
            let number = parseInt(hex, 16);
            if(isNaN(number)){
                throw new TypeError(options.embedColor+" is not a valid hexadecimal value.");
            }
            settings.embedColor = options.embedColor;
        }
        if(options.reaction){
            settings.reaction = options.reaction;
        }
        if(options.storage){
            settings.storage = options.storage;
        }
        settings.launched = true;
        settings.client = client;
        if(!fs.existsSync(settings.storage)){
            fs.writeFileSync(settings.storage, "[]", "utf-8");
        } else if(!Array.isArray(require(settings.storage))){
            fs.writeFileSync(settings.storage, "[]", "utf-8");
        }
        setInterval(utils.check, settings.updateCountdownEvery, client, settings);
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
                return reject("Please use the launch() function before starting to create giveaways!");
            }
            if(!options.messages){
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
            if(!guildChannel || !(guildChannel instanceof Discord.Channel)){
                return reject(guildChannel+" is not a valid guildchannel.");
            }
            if(!options.time || isNaN(options.time)){
                return reject(options.time+" is not a number.");
            }
            if(!options.prize){
                return reject(options.prize+" is not a string.");
            }
            if(!options.winnersCount || isNaN(options.winnersCount)){
                return reject(options.winnersCount+" is not a number.");
            }
            utils.start(guildChannel, options, settings).then((data) => {
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
        let giveaways = require(settings.storage);
        return giveaways;
    },

    /**
     * Choose new winner(s) for the giveaway
     * @param {string} messageID The message ID of the giveaway to reroll
     */
    async reroll(messageID, options){
        return new Promise(async function(resolve, reject){
            let version = utils.getVersion(settings.client);
            if(!options){
                options = {
                    congrat: ":tada: New winner(s) : {winners}! Congratulations!",
                    error: "No valid participations, no winners can be chosen!"
                }
            }
            let giveaways = require(settings.storage);
            let giveaway = giveaways.find((g) => g.messageID === messageID);
            if(!giveaway){
                return reject("No giveaway found with message ID "+messageID);
            }
            if(!giveaway.ended){
                return reject("The giveaway with message ID "+messageID+" is not ended. Please wait and retry.");
            }
            let channel = settings.client.channels.get(giveaway.channelID);
            if(!channel){
                return reject("Cannot get channel "+giveaway.channelID);
            }
            let message = null;
            if(version === "v12"){
                message = await channel.messages.fetch(giveaway.messageID).catch((err) => {});
            } else {
                message = await channel.fetchMessage(giveaway.messageID).catch((err) => {});
            }
            if(message){
                let guild = message.guild;
                let reaction = message.reactions.find((r) => r.emoji.name === settings.reaction);
                if(version === "v12"){
                    reaction.users = await reaction.users.fetch();
                } else {
                    reaction.users = await reaction.fetchUsers();
                }
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
                        channel.send(options.error);
                        resolve("Return error message");
                    } else {
                        let uWinners = users.random(giveaway.winnersCount).filter((u) => u);
                        let winners = uWinners.map((w) => "<@"+w.id+">").join(", ");
                        channel.send(options.congrat
                            .replace("{winners}", winners)
                        );
                        resolve(uWinners);
                    }
                }
            } else {
                reject("Cannot fetch message "+giveaway.messageID+" in channel "+giveaway.channelID);
            }
        });
    },

    /**
     * Edit some options for a giveaway
     * @param {string} messageID The message ID of the giveaway to reroll
     * @param {object} options The new options
     * @returns The new giveaway
     */
    async edit(messageID, options){
        return new Promise(async function(resolve, reject){
            let version = utils.getVersion(settings.client);
            let giveaways = require(settings.storage);
            let giveaway = giveaways.find((g) => g.messageID === messageID);
            if(!giveaway){
                return reject("No giveaway found with message ID "+messageID);
            }
            if(giveaway.ended){
                return reject("The giveaway with message ID "+messageID+" is ended.");
            }
            let nGiveaways = [];
            giveaways.forEach((g) => {
                if(g.messageID !== messageID){
                    nGiveaways.push(g);
                }
            });
            if(options.newPrize){
                giveaway.prize = options.newPrize;
            }
            if(options.newWinnersCount){
                giveaway.winnersCount = options.newWinnersCount;
            }
            if(options.addTime){
                giveaway.time = options.addTime + giveaway.time;
            }
            if(options.setEndTimestamp){
                giveaway.time = options.setEndTimestamp - giveaway.createdAt;
            }
            nGiveaways.push(giveaway);
            fs.writeFileSync(settings.storage, JSON.stringify(giveaways), "utf-8");
            resolve(giveaway);
        });
    },

    /**
     * Delete a giveaway and delete the message
     * @param {string} messageID The message ID of the giveaway to delete
     */
    async delete(messageID){
        return new Promise(async function(resolve, reject){
            let version = utils.getVersion(settings.client);
            let giveaways = require(settings.storage);
            let giveaway = giveaways.find((g) => g.messageID === messageID);
            if(!giveaway){
                return reject("No giveaway found with message ID "+messageID);
            }
            if(giveaway.ended){
                return reject("The giveaway with message ID "+messageID+" is ended.");
            }
            let channel = settings.client.channels.get(giveaway.channelID);
            if(!channel){
                return reject("Cannot get channel "+giveaway.channelID);
            }
            let message = null;
            if(version === "v12"){
                message = await channel.messages.fetch(giveaway.messageID).catch((err) => {});
            } else {
                message = await channel.fetchMessage(giveaway.messageID).catch((err) => {});
            }
            if(message){
                message.delete();
                utils.markAsEnded(giveaway.giveawayID, settings);
                resolve(giveaway);
            } else {
                return reject("Cannot fetch message "+giveaway.messageID+" in channel "+giveaway.channelID);
            }
        });
    }
}