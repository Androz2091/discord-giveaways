const giveaways = require("../giveaways"),
randomstring = require("randomstring"),
utils = require("./utils.js"),
fs = require("fs"),
path = require("path"),
Discord = require("discord.js");

let parentDirectory = __dirname.split(path.sep);
parentDirectory.pop();
let jsonPath = parentDirectory.join(path.sep)+path.sep+"giveaways.json";

module.exports = async function start(guildChannel, options, settings){
    return new Promise(function(resolve, reject){
        let endAt = Date.now()+options.time;
        let remaining = endAt-Date.now();
        let sentence = utils.parseTime(remaining, options);
        let embed = new Discord.RichEmbed()
            .setAuthor(options.prize)
            .setColor(settings.embedColor)
            .setFooter(options.winnersCount + " " + options.messages.winners)
            .setDescription(options.messages.inviteToParticipate+"\n"+sentence)
            .setTimestamp(new Date(endAt).toISOString());
        guildChannel.send(options.messages.giveaway, { embed: embed }).then((msg) => {
            msg.react(settings.reaction);
            let giveawayData = {
                messageID: msg.id,
                channelID: guildChannel.id,
                prize: options.prize,
                time: options.time,
                endAt: endAt,
                createdAt: Date.now(),
                giveawayID: randomstring.generate(5),
                winnersCount: options.winnersCount,
                messages: options.messages,
                ended: false
            }
            giveaways.push(giveawayData);
            fs.writeFileSync(jsonPath, JSON.stringify(giveaways), "utf-8");
            resolve(giveawayData);
        });
    });
}