const Discord = require('discord.js');

const validateEmbedColor = (embedColor) => {
    try {
        embedColor = Discord.Util.resolveColor(embedColor);
        return Number.isFinite(embedColor);
    } catch {
        return false;
    }
};

module.exports = {
    validateEmbedColor
};
