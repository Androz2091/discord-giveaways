// Gets the giveaways file
const giveaways = require("../giveaways.json"),
utils = require("./utils.js"),
Discord = require("discord.js");

module.exports = async function check(client, settings){

    giveaways.filter((g) => !g.ended).forEach((giveaway) => {
        giveaway.endAt = parseInt(giveaway.createdAt+giveaway.time);
        let channel = client.channels.get(giveaway.channelID);
        if(channel){
            channel.messages.fetch(giveaway.messageID).then((message) => {
                let remaining = giveaway.endAt - Date.now();
                let sentence = utils.parseTime(remaining, giveaway);
                let embed = new Discord.MessageEmbed()
                    .setAuthor(giveaway.prize)
                    .setColor(settings.embedColor)
                    .setFooter(String(giveaway.winnersCount) + " " + giveaway.messages.winners)
                    .setDescription(giveaway.messages.inviteToParticipate+"\n"+sentence)
                    .setTimestamp(new Date(giveaway.endAt).toISOString());
                message.edit(giveaway.messages.giveaway, { embed: embed});
                if(remaining < settings.updateCountdownEvery){
                    setTimeout(function(){
                        endGiveaway(giveaway, channel, message, settings);
                    }, remaining);
                }
            }).catch((err) => {
                console.log(err);
                utils.deleteGiveaway(giveaway.giveawayID);
            });
        } else {
            utils.deleteGiveaway(giveaway.giveawayID);
        }
    });
    
}

async function endGiveaway(giveawayData, channel, message, settings){

    let guild = channel.guild;
    let reaction = message.reactions.find((r) => r._emoji.name === settings.reaction);
    reaction.users = await reaction.users.fetch();
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
            let str = giveawayData.messages.winners.substr(0, 1).toUpperCase()+
            giveawayData.messages.winners.substr(1, giveawayData.messages.winners.length)+": "+winners;
            let embed = new Discord.MessageEmbed()
                .setAuthor(giveawayData.prize)
                .setColor("#000000")
                .setFooter(giveawayData.messages.endedAt)
                .setDescription(str)
                .setTimestamp(new Date(giveawayData.endAt).toISOString());
            message.edit(giveawayData.messages.giveawayEnded, { embed: embed });
            message.channel.send(
                giveawayData.messages.winMessage
                    .replace("{winners}", winners)
                    .replace("{prize}", giveawayData.prize)
            )
            utils.deleteGiveaway(giveawayData.giveawayID);
        } else {
            let embed = new Discord.MessageEmbed()
                .setAuthor(giveawayData.prize)
                .setColor("#000000")
                .setFooter(giveawayData.messages.endedAt)
                .setDescription(giveawayData.messages.noWinner)
                .setTimestamp(new Date(giveawayData.endAt).toISOString());
            message.edit(giveawayData.messages.giveawayEnded, { embed: embed });
            utils.deleteGiveaway(giveawayData.giveawayID);
        }
    } else {
        let embed = new Discord.MessageEmbed()
            .setAuthor(giveawayData.prize)
            .setColor("#000000")
            .setFooter(giveawayData.messages.endedAt)
            .setDescription(giveawayData.messages.noWinner)
            .setTimestamp(new Date(giveawayData.endAt).toISOString());
        message.edit(giveawayData.messages.giveawayEnded, { embed: embed });
        utils.deleteGiveaway(giveawayData.giveawayID);
    }
}