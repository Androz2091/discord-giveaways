const Discord = require('discord.js');

const validateEmbedColor = (embedColor) => {
    try {
        Discord.Util.resolveColor(embedColor);
        if (!isNaN(embedColor) && typeof embedColor === 'number') return true;
        else return false;
    } catch {
        return false;
    }
};

module.exports = {
    validateEmbedColor
};
