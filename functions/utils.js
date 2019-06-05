const fs = require("fs"),
path = require("path");
let giveaways = require("../giveaways");

let parentDirectory = __dirname.split(path.sep);
parentDirectory.pop();
let jsonPath = parentDirectory.join(path.sep)+path.sep+"giveaways.json";

module.exports = {
    parseTime(milliseconds, settings){
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
        (!isDays ? "" : ((isHours || isMinutes || isSeconds) ? `{days} ${settings.messages.units.days || "days"}, ` : `{days} ${settings.messages.units.days || "days"}`))+
        (!isHours ? "" : ((isMinutes || isSeconds) ? `{hours} ${settings.messages.units.hours || "hours"}, ` : `{hours} ${settings.messages.units.hours || "hours"}`))+
        (!isMinutes ? "" : ((isSeconds) ? `{minutes} ${settings.messages.units.minutes || "minutes"}, ` : `{minutes} ${settings.messages.units.minutes || "minutes"}`))+
        (!isSeconds ? "" : `{seconds} ${settings.messages.units.seconds || "seconds"}`);
        let sentence = settings.messages.timeRemaining
            .replace("{duration}", pattern)
            .replace("{days}", days)
            .replace("{hours}", hours)
            .replace("{minutes}", minutes)
            .replace("{seconds}", seconds);
        return sentence;
    },
    deleteGiveaway(giveawayID){
        giveaways = giveaways.filter((giveaway) => giveaway.giveawayID !== giveawayID);
        fs.writeFileSync(jsonPath, JSON.stringify(giveaways), "utf-8");
    }
}