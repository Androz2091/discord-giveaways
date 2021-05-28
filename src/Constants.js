const Discord = require('discord.js');

/**
 * The Giveaway messages that are used to display the giveaway content
 * @typedef GiveawayMessages
 *
 * @property {string} [giveaway='@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉'] Displayed above the giveaway embed when the giveaway is running.
 * @property {string} [giveawayEnded='@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉'] Displayed above the giveaway embed when the giveaway is ended.
 * @property {string} [inviteToParticipate='React with 🎉 to participate!'] Displayed in the giveaway embed. Incite people to react to the giveaway.
 * @property {string} [timeRemaining='Time remaining: **{duration}**'] Displayed below inviteToParticipate in the giveaway embed. {duration} will be replaced automatically with the time remaining.
 * @property {string} [winMessage='{mentionHost}\nCongratulations, {winners}! You won **{prize}**!\n{messageURL}'] Sent in the channel when the giveaway is ended.
 * @property {string} [embedFooter='Powered by the discord-giveaways package'] The footer of the giveaway embed.
 * @property {string} [noWinner='Giveaway cancelled, no valid participations.'] Sent in the channel if there's no valid winner for the giveaway.
 * @property {string} [winners='winner(s)'] Displayed next to the embed footer, used to display the number of winners of the giveaways.
 * @property {string} [endedAt='Ended at'] Displayed next to the embed footer, used to display the giveaway end date.
 * @property {string} [hostedBy='Hosted by: {user}'] Below the inviteToParticipate message, in the description of the embed.
 * @property {Object} [units]
 * @property {string} [units.seconds='seconds'] The name of the 'seconds' units
 * @property {string} [units.minutes='minutes'] The name of the 'minutes' units
 * @property {string} [units.hours='hours'] The name of the 'hours' units
 * @property {string} [units.days='days'] The name of the 'days' units
 * @property {Boolean} [units.pluralS='false'] Whether to force removing the "S" which marks the plural when the value is lower than 2
 */
exports.GiveawayMessages = {};

/**
 * The start options for new giveaways
 * @typedef GiveawayStartOptions
 *
 * @property {number} time The giveaway duration
 * @property {number} winnerCount The number of winners for the giveaway
 * @property {string} prize The giveaway prize
 * @property {Discord.User} [hostedBy] The user who hosts the giveaway
 * @property {Boolean} [botsCanWin] Whether the bots are able to win a giveaway.
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions won't be able to win a giveaway.
 * @property {Function} [exemptMembers] Function to filter members. If true is returned, the member won't be able to win the giveaway.
 * @property {BonusEntry[]} [bonusEntries] An array of BonusEntry objects.
 * @property {Discord.ColorResolvable} [embedColor] The giveaway embeds color when they are running
 * @property {Discord.ColorResolvable} [embedColorEnd] The giveaway embeds color when they are ended
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction to participate to the giveaways
 * @property {GiveawayMessages} [messages] The giveaway messages
 * @property {any} [extraData] The extra data value for this giveaway
 * @property {LastChanceOptions} [lastChance] The last chance system options
 */
exports.GiveawayStartOptions = {};

/**
 * Default giveaway messages
 * @type {GiveawayMessages}
 */
exports.defaultGiveawayMessages = {
    giveaway: '@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉',
    giveawayEnded: '@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
    inviteToParticipate: 'React with 🎉 to participate!',
    timeRemaining: 'Time remaining: **{duration}**',
    winMessage: '{mentionHost}\nCongratulations, {winners}! You won **{prize}**!\n{messageURL}',
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
 * Bonus entry object.
 * @typedef BonusEntry
 *
 * @property {Function} bonus The filter function that takes one parameter, a member and returns the amount of entries.
 * @property {boolean} [cumulative] Whether the amount of entries from the function can get summed with other amounts of entries.
 */
exports.BonusEntry = {};

/**
 * The last chance options
 * @typedef LastChanceOptions
 *
 * @property {boolean} [enabled] Whether the last chance system is enabled
 * @property {string} [content] The text of the embed when last chance is enabled
 * @property {number} [threshold] The number of ms after which the last chance system will be enabled
 * @property {string} [embedColor] The color of the embed when last chance is enabled
 */
exports.LastChanceOptions = {
    enabled: false,
    content: '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
    threshold: 5000,
    embedColor: '#FF0000'
};

/**
 * The giveaways manager options
 * @typedef GiveawaysManagerOptions
 *
 * @property {string} [storage='./giveaways.json'] The storage path for the giveaways.
 * @property {number} [updateCountdownEvery=5000] The giveaway update interval (in ms).
 * @property {number} [endedGiveawaysLifetime=null] The time (in ms) after which a ended giveaway should get deleted from the DB. ⚠ Giveaways deleted from the DB cannot get rerolled anymore!
 * @property {boolean} [hasGuildMembersIntent=false] Whether the client instance has access to the GUILD_MEMBERS intent. If set to true, everything will be faster.
 * @property {GiveawayStartOptions} [default] The default options for new giveaways.
 * @property {Boolean} [default.botsCanWin=false] Whether the bots are able to win a giveaway.
 * @property {Discord.PermissionResolvable[]} [default.exemptPermissions=[]] Members with any of these permissions won't be able to win a giveaway.
 * @property {Function} [default.exemptMembers] Function to filter members. If true is returned, the member won't be able to win a giveaway.
 * @property {Discord.ColorResolvable} [default.embedColor='#FF0000'] The giveaways embed color when they are running
 * @property {Discord.ColorResolvable} [default.embedColorEnd='#000000'] The giveaways embed color when they are ended
 * @property {Discord.EmojiIdentifierResolvable} [default.reaction='🎉'] The reaction to participate in the giveaways
 * @property {LastChanceOptions} [default.lastChance] The last chance system parameters
 */
exports.GiveawaysManagerOptions = {};

/**
 * Defaults options for the GiveawaysManager
 * @type {GiveawaysManagerOptions}
 */
exports.defaultManagerOptions = {
    storage: './giveaways.json',
    updateCountdownEvery: 5000,
    endedGiveawaysLifetime: null,
    hasGuildMemberIntent: false,
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
 * The reroll method options
 * @typedef GiveawayRerollOptions
 *
 * @property {number?} [winnerCount=this.winnerCount] The number of winners to pick
 * @property {Object} [messages] The messages used in this method
 * @property {string} [messages.congrat='{mentionHost}\n:tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}'] The message used if there are winners
 * @property {string} [messages.error='No valid participations, no new winner(s) can be chosen!'] The message used if no winner can be choosen
 */
exports.GiveawayRerollOptions = {};

/**
 * Default reroll options
 * @type {GiveawayRerollOptions}
 */
exports.defaultRerollOptions = {
    winnerCount: null,
    messages: {
        congrat: '{mentionHost}\n:tada: New winner(s): {winners}! Congratulations, you won **{prize}**!\n{messageURL}',
        error: 'No valid participations, no new winner(s) can be chosen!'
    }
};

/**
 * The edit method options
 * @typedef GiveawayEditOptions
 *
 * @property {number} [newWinnerCount] The new number of winners
 * @property {string} [newPrize] The new giveaway prize
 * @property {number} [addTime] Number of milliseconds to add to the giveaway duration
 * @property {number} [setEndTimestamp] The timestamp of the new end date
 * @property {GiveawayMessages} [newMessages] The new giveaway messages
 * @property {any} [newExtraData] The new extra data value for this giveaway
 * @property {BonusEntry[]} [newBonusEntries] The new BonusEntry objects
 */
exports.GiveawayEditOptions = {};

/**
 * Raw giveaway object (used to store giveaways in the database).
 * @typedef GiveawayData
 *
 * @property {number} startAt The start date of the giveaway
 * @property {number} endAt The end date of the giveaway
 * @property {number} winnerCount The number of winners of the giveaway
 * @property {Discord.Snowflake[]} winnerIDs winnerIDs The winner IDs of the giveaway after it ended
 * @property {GiveawayMessages} messages The giveaway messages
 * @property {boolean} ended Whether the giveaway is ended
 * @property {string} prize The prize of the giveaway
 * @property {Discord.Snowflake} channelID The ID of the channel
 * @property {Discord.Snowflake} guildID The ID of the guild
 * @property {Discord.Snowflake?} [messageID] The ID of the message
 * @property {Discord.EmojiIdentifierResolvable} [reaction] The reaction of the giveaway
 * @property {boolean} [botsCanWin] Whether the bots can win the giveaway
 * @property {Discord.PermissionResolvable[]} [exemptPermissions] Members with any of these permissions won't be able to win the giveaway
 * @property {string?} [exemptMembers] Filter function to exempt members from winning the giveaway
 * @property {string} [bonusEntries] The array of BonusEntry objects for the giveaway
 * @property {Discord.ColorResolvable} [embedColor] The color of the giveaway embed
 * @property {Discord.ColorResolvable} [embedColorEnd] The color of the giveaway ended when it's ended
 * @property {string?} [hostedBy] Mention of user who hosts the giveaway
 * @property {any} [extraData] The extra data value for this giveaway
 * @property {LastChanceOptions} [lastChance] The last chance system options
 */
exports.GiveawayData = {};
