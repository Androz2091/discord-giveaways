const Discord = require('discord.js');

/**
 * The Giveaway messages that are used to display the giveaway content
 * @typedef GiveawaysMessages
 *
 * @property {string} [giveaway='@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉'] Displayed above the giveaway embed when the giveaway is running.
 * @property {string} [giveawayEnded='@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉'] Displayed above the giveaway embed when the giveaway is ended.
 * @property {string} [inviteToParticipate='React with 🎉 to participate!'] Displayed in the giveaway embed. Incite people to react to the giveaway.
 * @property {string} [timeRemaining='Time remaining: **{duration}**!'] Displayed below inviteToParticipate in the giveaway embed. {duration} will be replaced automatically with the time remaining.
 * @property {string} [winMessage='Congratulations, {winners}! You won **{prize}**!'] Sent in the channel when the giveaway is ended.
 * @property {string} [embedFooter='Powered by the discord-giveaways package'] The footer of the giveaway embed.
 * @property {string} [noWinner='Giveaway cancelled, no valid participations.'] Sent in the channel if there's no valid winner for the giveaway.
 * @property {string} [winners='winner(s)'] Displayed next to the embed footer, used to display the number of winners of the giveaways.
 * @property {string} [endedAt='End at'] Displayed next to the embed footer, used to display the giveaway end date.
 * @property {Object} [units]
 * @property {string} [units.seconds='seconds'] The name of the 'seconds' units
 * @property {string} [units.minutes='minutes'] The name of the 'minutes' units
 * @property {string} [units.hours='hours'] The name of the 'hours' units
 * @property {string} [units.days='days'] The name of the 'days' units
 * @property {Boolean} [units.pluralS='false'] Whether to force removing the "S" which marks the plural when the value is lower than 2
 */
const GiveawaysMessages = {
    giveaway: '@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉',
    giveawayEnded: '@everyone\n\n🎉🎉 **GIVEAWAY ENDED** 🎉🎉',
    timeRemaining: 'Time remaining: **{duration}**',
    inviteToParticipate: 'React with 🎉 to participate!',
    winMessage: 'Congratulations, {winners}! You won **{prize}**!',
    embedFooter: 'Powered by the discord-giveaways package',
    noWinner: 'Giveaway cancelled, no valid participations.',
    hostedBy: 'Hosted by: {user}',
    winners: 'winner(s)',
    endedAt: 'End at',
    units: {
        seconds: 'seconds',
        minutes: 'minutes',
        hours: 'hours',
        days: 'days',
        pluralS: false
    }
};

/**
 * The giveaways manager options
 * @typedef GiveawaysManagerOptions
 *
 * @property {string} [storage='./giveaways.json'] The storage path for the giveaways.
 * @property {number} [updateCountdownEvery=5000] The giveaway update interval (in ms).
 * @property {string} [DJSlib] The Discord.js library version you want to use
 * @property {Object} [default] The default options for new giveaways.
 * @property {Boolean} [botsCanWin=false] Whether the bots are able to win a giveaway.
 * @property {Array<PermissionsResolvable>} [exemptPermissions=[]] Members with any of these permissions won't be able to win a giveaway.
 * @property {Function} [exemptMembers] Function to filter members. If true is returned, the member won't be able to win the giveaway.
 * @property {string} [embedColor='#FF0000'] The giveaway embeds color when they are running
 * @property {string} [embedColorEnd='#000000'] The giveaway embeds color when they are ended
 * @property {string} [reaction='🎉'] The reaction to participate to the giveaways
 */
const GiveawaysManagerOptions = {
    storage: './giveaways.json',
    updateCountdownEvery: 5000,
    DJSlib: Discord.version.split('.')[0] === '12' ? 'v12' : 'v11',
    default: {
        botsCanWin: false,
        exemptPermissions: [],
        exemptMembers: () => false,
        embedColor: '#FF0000',
        reaction: '🎉'
    }
};

/**
 * The start options for new giveaways
 * @typedef {GiveawayStartOptions}
 *
 * @property {string} time The giveaway duration
 * @property {string} winnerCount The number of winners for the giveaway
 * @property {string} prize The giveaway prize
 * @property {User} [hostedBy] The user who hosts the giveaway
 * @property {Boolean} [botsCanWin] Whether the bots are able to win a giveaway.
 * @property {Array<PermissionsResolvable>} [exemptPermissions] Members with any of these permissions won't be able to win a giveaway.
 * @property {Function} [exemptMembers] Function to filter members. If true is returned, the member won't be able to win the giveaway.
 * @property {string} [embedColor] The giveaway embeds color when they are running
 * @property {string} [embedColorEnd] The giveaway embeds color when they are ended
 * @property {string} [reaction] The reaction to participate to the giveaways
 */
const GiveawayStartOptions = {};

/**
 * The reroll method options
 * @typedef {GiveawayRerollOptions}
 *
 * @property {number} [winnerCount=this.winnerCount] The number of winners to pick
 * @property {Object} [messages] The messages used in this method
 * @property {string} [messages.congrat=':tada: New winner(s) : {winners}! Congratulations!'] The message used if there are winners
 * @property {string} [messages.error='No valid participations, no winners can be chosen!'] The message used if no winner can be choosen
 */
const GiveawayRerollOptions = {
    winnerCount: null,
    messages: {
        congrat: ':tada: New winner(s) : {winners}! Congratulations!',
        error: 'No valid participations, no winners can be chosen!'
    }
};

/**
 * The edit method options
 * @typedef {GiveawayEditOptions}
 *
 * @property {number} [newWinnerCount] The new number of winners
 * @property {string} [newPrize] The new giveaway prize
 * @property {number} [addTime] Number of milliseconds to add to the giveaway duration
 * @property {number} [setEndTimestamp] The timestamp of the new end date
 */
const GiveawayEditOptions = {};

module.exports = {
    defaultGiveawaysMessages: GiveawaysMessages,
    defaultGiveawaysManagerOptions: GiveawaysManagerOptions,
    defaultGiveawayRerollOptions: GiveawayRerollOptions
};
