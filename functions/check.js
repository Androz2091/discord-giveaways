// Gets the giveaways file
const giveaways = require("../giveaways.json"),
utils = require("./utils.js"),
Discord = require("discord.js");

let deletedGiveaways = [];

module.exports = async function check(client, settings){

    giveaways.filter((g) => !deletedGiveaways.includes(g.giveawayID)).forEach(giveaway => {
        let channel = client.channels.get(giveaway.channelID);
        if(channel){
            channel.messages.fetch(giveaway.messageID).then((message) => {
                let remaining = giveaway.endAt - Date.now();
                let sentence = utils.parseTime(remaining, settings);
                let embed = new Discord.MessageEmbed()
                    .setAuthor(giveaway.prize)
                    .setColor(settings.embedColor)
                    .setFooter(String(giveaway.winnersCount) + " " + settings.messages.winners)
                    .setDescription(settings.messages.inviteToParticipate+"\n"+sentence)
                    .setTimestamp(giveaway.endAt);
                message.edit(settings.messages.giveaway, { embed: embed});
                if(remaining < settings.updateCountdownEvery){
                    setTimeout(function(){
                        endGiveaway(giveaway, channel, message, settings);
                    }, remaining);
                }
            }).catch((err) => {
                console.log(err);
                utils.deleteGiveaway(giveaway.giveawayID);
                deletedGiveaways.push(giveaway.giveawayID);
            });
        } else {
            utils.deleteGiveaway(giveaway.giveawayID);
            deletedGiveaways.push(giveaway.giveawayID);
        }
    });
    
}

async function endGiveaway(giveawayData, channel, message, settings){

    let guild = channel.guild;
    let reaction = message.reactions.find((r) => r._emoji.name === settings.reaction);
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
        if(users.size > 0){
            let uWinners = users.random(giveawayData.winnersCount).filter((u) => u);
            let winners = uWinners.map((w) => "<@"+w.id+">").join(", ");
            let str = settings.messages.winners.substr(0, 1).toUpperCase()+
            settings.messages.winners.substr(1, settings.messages.winners.length)+": "+winners;
            let embed = new Discord.MessageEmbed()
                .setAuthor(giveawayData.prize)
                .setColor("#000000")
                .setFooter(settings.messages.endedAt)
                .setDescription(str)
                .setTimestamp(giveawayData.endAt);
            message.edit(settings.messages.giveawayEnded, { embed: embed });
            message.channel.send(
                settings.messages.winMessage
                    .replace("{winners}", winners)
                    .replace("{prize}", giveawayData.prize)
            )
            utils.deleteGiveaway(giveawayData.giveawayID);
            deletedGiveaways.push(giveawayData.giveawayID);
        } else {
            let embed = new Discord.MessageEmbed()
                .setAuthor(giveawayData.prize)
                .setColor("#000000")
                .setFooter(settings.messages.endedAt)
                .setDescription(settings.messages.noWinner)
                .setTimestamp(giveawayData.endAt);
            message.edit(settings.messages.giveawayEnded, { embed: embed });
            utils.deleteGiveaway(giveawayData.giveawayID);
            deletedGiveaways.push(giveawayData.giveawayID);
        }
    } else {
        let embed = new Discord.MessageEmbed()
            .setAuthor(giveawayData.prize)
            .setColor("#000000")
            .setFooter(settings.messages.endedAt)
            .setDescription(settings.messages.noWinner)
            .setTimestamp(giveawayData.endAt);
        message.edit(settings.messages.giveawayEnded, { embed: embed });
        utils.deleteGiveaway(giveawayData.giveawayID);
        deletedGiveaways.push(giveawayData.giveawayID);
    }
}