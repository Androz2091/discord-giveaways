const Discord = require('discord.js'),
    { serialize } = require('v8'); 

const validateEmbedColor = (embedColor) => {
    try {
        Discord.Util.resolveColor(embedColor);
        if (!isNaN(embedColor) && typeof embedColor === 'number') return true;
        else return false;
    } catch {
        return false;
    }
};

const embedEqual = (embed1, embed2) => serialize(embed1).equals(serialize(embed2));

module.exports = {
    validateEmbedColor,
    embedEqual
};
