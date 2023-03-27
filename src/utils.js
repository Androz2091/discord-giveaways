const { resolveColor } = require('discord.js');

exports.validateEmbedColor = (embedColor) => {
    try {
        embedColor = resolveColor(embedColor);
        return Number.isFinite(embedColor);
    } catch {
        return false;
    }
};

exports.embedEqual = (embed1, embed2) => {
    if (embed1.author?.name !== embed2.author?.name) return false;
    if (embed1.author?.icon_url !== embed2.author?.icon_url) return false;
    if (embed1.title !== embed2.title) return false;
    if (embed1.description !== embed2.description) return false;
    if (embed1.url !== embed2.url) return false;
    if (embed1.color !== embed2.color) return false;
    if (embed1.footer?.text !== embed2.footer?.text) return false;
    if (embed1.footer?.icon_url !== embed2.footer?.icon_url) return false;
    if (embed1.thumbnail?.url !== embed2.thumbnail?.url) return false;
    if (embed1.image?.url !== embed2.image?.url) return false;
    if (embed1.fields?.length !== embed2.fields?.length) return false;
    for (let i = 0; i < embed1.fields?.length; i++) {
        if (embed1.fields[i].name !== embed2.fields[i]?.name) return false;
        if (embed1.fields[i].value !== embed2.fields[i]?.value) return false;
        if (embed1.fields[i].inline !== embed2.fields[i]?.inline) return false;
    }
    return true;
};

exports.buttonEqual = (button1, button2) => {
    if (button1.custom_Id !== button2.custom_Id) return false;
    if (button1.label !== button2.label) return false;
    if (button1.style !== button2.style) return false;
    if (button1.emoji?.name !== button2.emoji?.name) return false;
    if (button1.emoji?.id !== button2.emoji?.id) return false;
    if (button1.url !== button2.url) return false;
    if (button1.disabled !== button2.disabled) return false;
    return true;
};
