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

const embedEqual = (embed1, embed2) => {
    if (embed1.author?.name !== embed2.author?.name) return false;
    if (embed1.author?.iconURL !== embed2.author?.iconURL) return false;
    if (embed1.title !== embed2.title) return false;
    if (embed1.description !== embed2.description) return false;
    if (embed1.url !== embed2.url) return false;
    if (embed1.color !== embed2.color) return false;
    if (embed1.timestamp !== embed2.timestamp) return false;
    if (embed1.footer?.text !== embed2.footer?.text) return false;
    if (embed1.footer?.iconURL !== embed2.footer?.iconURL) return false;
    if (embed1.thumbnail?.url !== embed2.thumbnail?.url) return false;
    if (embed1.fields.length !== embed2.fields.length) return false;
    for (let i = 0; i < embed1.fields.length; i++) {
        if (embed1.fields[i].name !== embed2.fields[i]?.name) return false;
        if (embed1.fields[i].value !== embed2.fields[i]?.value) return false;
        if (embed1.fields[i].inline !== embed2.fields[i]?.inline) return false;
    }
    return true;
};

module.exports = {
    validateEmbedColor,
    embedEqual
};
