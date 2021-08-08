const Discord = require('discord.js');

/**
 * The Giveaway messages that are used to display the giveaway content.
 * @typedef GiveawayMessages
 *
 * @property {string} [giveaway='🎉🎉 **GIVEAWAY** 🎉🎉'] Displayed above the giveaway embed when the giveaway is running.
 * @property {string} [giveawayEnded='🎉🎉 **GIVEAWAY ENDED** 🎉🎉'] Displayed above the giveaway embed when the giveaway has ended.
 * @property {string} [inviteToParticipate='React with 🎉 to participate!'] Displayed in the giveaway embed. Invite people to react to the giveaway.
 * @property {string} [timeRemaining='Time remaining: **{duration}**'] Displayed below "inviteToParticipate" in the giveaway embed. "{duration}" will be replaced automatically with the time remaining.
 * @property {string} [winMessage='Congratulations, {winners}! You won **{prize}**!\n{messageURL}'] Sent in the channel when the giveaway is ended.
 * @property {string|EmbedFooterObject} [embedFooter='Powered by the discord-giveaways package'] The footer of the giveaway embed.
 * @property {string} [noWinner='Giveaway cancelled, no valid participations.'] Sent in the channel if there is no valid winner for the giveaway.
 * @property {string} [winners='winner(s)'] Displayed next to the embed footer, used to display the number of winners of the giveaways.
 * @property {string} [endedAt='Ended at'] Displayed next to the embed footer, used to display the giveaway end date.
 * @property {string} [hostedBy='Hosted by: {user}'] Below the "inviteToParticipate" message, in the description of the embed.
 * @property {Object} [units]
 * @property {string} [units.seconds='seconds'] The name of the "seconds" unit.
 * @property {string} [units.minutes='minutes'] The name of the "minutes" unit.
 * @property {string} [units.hours='hours'] The name of the "hours" unit.
 * @property {string} [units.days='days'] The name of the "days" unit.
 * @property {Boolean} [units.pluralS='false'] Whether to force the removal of "S" which marks the plural when the value is lower than two.
 */
exports.GiveawayMessages = {
    giveaway: '🎉🎉 **GIVEAWAY** 🎉🎉',
    giveawayEnded: '🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
    inviteToParticipate: 'React with 🎉 to participate!',
    timeRemaining: 'Time remaining: **{duration}**',
    winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
    embedFooter: 'Powered by the discord-giveaways package',
    noWinner: 'Giveaway cancelled, no valid participations.',
    winners: 'winner(s)',
    endedAt: 'Ended at',
    hostedBy: 'Hosted by: {user}',
    units: {
        seconds: 'seconds',
        minutes: 'minutes',
        hours: 'hours',
        days: 'days',
        pluralS: false
    }
};

/**
 * Embed Footer object.
 * @typedef EmbedFooterObject
 *
 * @property {string} [text] The text of the footer. If the value is a empty string then "embedFooter" will not show up in the giveaway embed.
 * @property {string} [iconURL] The icon URL of the footer.
 */

/**
 * The start options for new giveaways.
 * @typedef GiveawayStartOptions
 *
 * @property {number} time The giveaway duration.
 * @property {number} winnerCount The number of winners for the giveaway.
 * @property {string} prize The giveaway prize.
 * @property {Discord.User} [hostedBy] The user who hosts the giveaway.
 * @property {Boolean} [botsCanWin] If bots can win the giveaway.
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions will not be able to win a giveaway.
 * @property {Function} [exemptMembers] Function to filter members. If true is returned, the member will not be able to win the giveaway.
 * @property {BonusEntry[]} [bonusEntries] An array of BonusEntry objects.
 * @property {Discord.ColorResolvable} [embedColor] The color of the giveaway embed when it is running.
 * @property {Discord.ColorResolvable} [embedColorEnd] The color of the giveaway embed when it has ended.
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction to participate in the giveaway.
 * @property {GiveawayMessages} [messages] The giveaway messages.
 * @property {string} [thumbnail] The URL appearing as the thumbnail on the giveaway embed.
 * @property {any} [extraData] The extra data for this giveaway.
 * @property {LastChanceOptions} [lastChance] The options for the last chance system.
 * @property {PauseOptions} [pauseOptions] The options for the pause system.
 */
exports.GiveawayStartOptions = {};

/**
 * Bonus entry object.
 * @typedef BonusEntry
 *
 * @property {Function} bonus The filter function that takes one parameter, a member and returns the amount of entries.
 * @property {boolean} [cumulative] If the amount of entries from the function can get summed with other amounts of entries.
 */
exports.BonusEntry = {};

/**
 * The last chance options.
 * @typedef LastChanceOptions
 *
 * @property {boolean} [enabled=false] If the last chance system is enabled.
 * @property {string} [content='⚠️ **LAST CHANCE TO ENTER !** ⚠️'] The text of the embed when the last chance system is enabled.
 * @property {number} [threshold=5000] The number of milliseconds before the giveaway ends when the last chance system will be enabled.
 * @property {Discord.ColorResolvable} [embedColor='#FF0000'] The color of the embed when last chance is enabled.
 */
exports.LastChanceOptions = {
    enabled: false,
    content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
    threshold: 5000,
    embedColor: '#FF0000'
};

/**
 * The pause options.
 * @typedef PauseOptions
 *
 * @property {boolean} [isPaused=false] If the giveaway is paused.
 * @property {string} [content='⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️'] The text of the embed when the giveaway is paused.
 * @property {number} [unPauseAfter=null] The number of milliseconds after which the giveaway will automatically unpause.
 * @property {Discord.EmbedColorResolveAble} [embedColor='#FFFF00'] The color of the embed when the giveaway is paused.
 * @property {number} [durationAfterPause=null|this.remainingTime] The remaining duration after the giveaway is unpaused. ⚠ This property gets set by the manager so that the pause system works properly. It is not recommended to set it manually!
 */
exports.PauseOptions = {
    isPaused: false,
    content: '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
    unPauseAfter: null,
    embedColor: '#FFFF00',
    durationAfterPause: null
};

/**
 * The giveaways manager options.
 * @typedef GiveawaysManagerOptions
 *
 * @property {string} [storage='./giveaways.json'] The storage path for the giveaways.
 * @property {number} [updateCountdownEvery=5000] The giveaway update interval in milliseconds.
 * @property {number} [endedGiveawaysLifetime=null] The number of milliseconds after which ended giveaways should get deleted from the DB. ⚠ Giveaways deleted from the DB cannot get rerolled anymore!
 * @property {Object} [default] The default options for new giveaways.
 * @property {Boolean} [default.botsCanWin=false] If bots can win giveaways.
 * @property {Discord.PermissionResolvable[]} [default.exemptPermissions=[]] Members with any of these permissions won't be able to win a giveaway.
 * @property {Function} [default.exemptMembers] Function to filter members. If true is returned, the member won't be able to win a giveaway.
 * @property {Discord.ColorResolvable} [default.embedColor='#FF0000'] The color of the giveaway embeds when they are running.
 * @property {Discord.ColorResolvable} [default.embedColorEnd='#000000'] The color of the giveaway embeds when they have ended.
 * @property {Discord.EmojiIdentifierResolvable} [default.reaction='🎉'] The reaction to participate in giveaways.
 * @property {LastChanceOptions} [default.lastChance] The options for the last chance system.
 */
exports.GiveawaysManagerOptions = {
    storage: './giveaways.json',
    updateCountdownEvery: 5000,
    endedGiveawaysLifetime: null,
    default: {
        botsCanWin: false,
        exemptPermissions: [],
        exemptMembers: () => false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉',
        lastChance: {
            enabled: false,
            content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
            threshold: 5000,
            embedColor: '#FF0000'
        }
    }
};

/**
 * The reroll method options.
 * @typedef GiveawayRerollOptions
 *
 * @property {number} [winnerCount=giveaway.winnerCount] The number of winners to pick.
 * @property {Object} [messages] The messages used in this method.
 * @property {string} [messages.congrat=':tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}'] The message used if there are new winners.
 * @property {string} [messages.error='No valid participations, no new winner(s) can be chosen!'] The message used if no new winner(s) could be chosen.
 */
exports.GiveawayRerollOptions = {
    winnerCount: null,
    messages: {
        congrat: ':tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}',
        error: 'No valid participations, no new winner(s) can be chosen!'
    }
};

/**
 * The edit method options.
 * @typedef GiveawayEditOptions
 *
 * @property {number} [newWinnerCount] The new number of winners.
 * @property {string} [newPrize] The new giveaway prize.
 * @property {number} [addTime] Number of milliseconds to add to the giveaway duration.
 * @property {number} [setEndTimestamp] The timestamp of the new end date.
 * @property {GiveawayMessages} [newMessages] The new giveaway messages. Will get merged with the existing object, if there.
 * @property {string} [newThumbnail] The new thumbnail url.
 * @property {any} [newExtraData] The new extra data for this giveaway.
 * @property {BonusEntry[]} [newBonusEntries] The new BonusEntry objects.
 * @property {LastChanceOptions} [newLastChance] The new options for the last chance system. Will get merged with the existing object, if there.
 */
exports.GiveawayEditOptions = {};

/**
 * Raw giveaway object (used to store giveaways in the database).
 * @typedef GiveawayData
 *
 * @property {number} startAt The start date of the giveaway.
 * @property {number} endAt The end date of the giveaway.
 * @property {number} winnerCount The number of winners for the giveaway.
 * @property {boolean} ended If the giveaway has ended.
 * @property {GiveawayMessages} messages The giveaway messages.
 * @property {string} prize The giveaway prize.
 * @property {string} [thumbnail] The URL appearing as the thumbnail on the giveaway embed.
 * @property {Discord.Snowflake} channelId The Id of the channel.
 * @property {Discord.Snowflake} guildId The Id of the guild.
 * @property {Discord.Snowflake[]} [winnerIds] The winner Ids of the giveaway after it ended.
 * @property {Discord.Snowflake} [messageId] The Id of the message.
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction to participate in the giveaway.
 * @property {boolean} [botsCanWin] If bots can win the giveaway.
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions will not be able to win the giveaway.
 * @property {string} [exemptMembers] Filter function to exempt members from winning the giveaway.
 * @property {string} [bonusEntries] The array of BonusEntry objects for the giveaway.
 * @property {Discord.ColorResolvable} [embedColor] The color of the giveaway embed when it is running.
 * @property {Discord.ColorResolvable} [embedColorEnd] The color of the giveaway embed when it has ended.
 * @property {string} [hostedBy] The mention of the user who hosts the giveaway.
 * @property {any} [extraData] The extra data for this giveaway.
 * @property {LastChanceOptions} [lastChance] The options for the last chance system.
 * @property {PauseOptions} [pauseOptions] The options for the pause system.
 */
exports.GiveawayData = {};
