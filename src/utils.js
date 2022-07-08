const {resolveColor} = require('discord.js');

exports.validateEmbedColor = (embedColor) => {
    try {
        embedColor = resolveColor(embedColor);
        return Number.isFinite(embedColor);
    } catch {
        return false;
    }
};


