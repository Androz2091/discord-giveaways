const fs = require("fs"),
path = require("path");

let parentDirectory = __dirname.split(path.sep);
parentDirectory.pop();
let jsonPath = parentDirectory.join(path.sep)+path.sep+"giveaways.json";

module.exports = {
    parseTime(milliseconds, options){
        let roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
        let days = roundTowardsZero(milliseconds / 86400000),
		hours = roundTowardsZero(milliseconds / 3600000) % 24,
        minutes = roundTowardsZero(milliseconds / 60000) % 60,
        seconds = roundTowardsZero(milliseconds / 1000) % 60;
        let isDays = days > 0,
        isHours = hours > 0,
        isMinutes = minutes > 0,
        isSeconds = seconds > 0;
        let pattern = 
        (!isDays ? "" : ((isHours || isMinutes || isSeconds) ? `{days} ${options.messages.units.days}, ` : `{days} ${options.messages.units.days}`))+
        (!isHours ? "" : ((isMinutes || isSeconds) ? `{hours} ${options.messages.units.hours}, ` : `{hours} ${options.messages.units.hours}`))+
        (!isMinutes ? "" : ((isSeconds) ? `{minutes} ${options.messages.units.minutes}, ` : `{minutes} ${options.messages.units.minutes}`))+
        (!isSeconds ? "" : `{seconds} ${options.messages.units.seconds}`);
        let sentence = options.messages.timeRemaining
            .replace("{duration}", pattern)
            .replace("{days}", days)
            .replace("{hours}", hours)
            .replace("{minutes}", minutes)
            .replace("{seconds}", seconds);
        return sentence;
    },
    deleteGiveaway(giveawayID){
        let giveaways = require(jsonPath);
        giveaways.find((g) => g.giveawayID === giveawayID).ended = true;
        fs.writeFileSync(jsonPath, JSON.stringify(giveaways), "utf-8");
    }
}