const { Collection, Message, version } = require('discord.js');
const { EventEmitter } = require('events');

/**
 * Represents a Giveaway
 */
class Giveaway extends EventEmitter {
    /**
     * @param {GiveawaysManager} manager The Giveaway Manager
     * @param {Object} options The giveaway data
     */
    constructor(manager, options) {
        super();
        /**
         * The Giveaway manager
         * @type {GiveawaysManager}
         */
        this.manager = manager;
        /**
         * The Discord Client
         * @type {Client}
         */
        this.client = manager.client;
        /**
         * The giveaway prize
         * @type {string}
         */
        this.prize = options.prize;
        /**
         * The start date of the giveaway
         * @type {Number}
         */
        this.startAt = options.startAt;
        /**
         * The end date of the giveaway
         * @type {Number}
         */
        this.endAt = options.endAt;
        /**
         * Whether the giveaway is ended
         * @type {Boolean}
         */
        this.ended = options.ended;
        /**
         * The channel ID of the giveaway
         * @type {Snowflake}
         */
        this.channelID = options.channelID;
        /**
         * The message ID of the giveaway
         * @type {Snowflake}
         */
        this.messageID = options.messageID;
        /**
         * The guild ID of the giveaway
         * @type {Snowflake}
         */
        this.guildID = options.guildID;
        /**
         * The number of winners for this giveaway
         * @type {number}
         */
        this.winnerCount = parseInt(options.winnerCount);
        /**
         * The mention of the user who hosts this giveaway
         * @type {?string}
         */
        this.hostedBy = options.hostedBy;
        /**
         * The giveaway messages
         * @type {GiveawaysMessages}
         */
        this.messages = options.messages;
        /**
         * The giveaway data
         * @type {Object}
         */
        this.options = options;
    }

    /**
     * The remaining time before the end of the giveaway
     * @type {Number}
     * @readonly
     */
    get remainingTime() {
        return this.endAt - Date.now();
    }

    /**
     * The total duration of the giveaway
     * @type {Number}
     * @readonly
     */
    get giveawayDuration() {
        return this.endAt - this.startAt;
    }

    /**
     * The color of the giveaway embed
     * @type {string}
     */
    get embedColor() {
        return this.options.embedColor || this.manager.options.default.embedColor;
    }

    /**
     * The color of the giveaway embed when it's ended
     * @type {string}
     */
    get embedColorEnd() {
        return this.options.embedColorEnd || this.manager.options.default.embedColorEnd;
    }

    /**
     * The reaction on the giveaway message
     * @type {string}
     */
    get reaction() {
        return this.options.reaction || this.manager.options.default.reaction;
    }

    /**
     * Whether the bots are able to win the giveaway
     * @type {Boolean}
     */
    get botsCanWin() {
        return this.options.botsCanWin || this.manager.options.default.botsCanWin;
    }

    /**
     * Members with any of these permissions won't be able to win a giveaway.
     * @type {Array<PermissionsResolvable>}
     */
    get exemptPermissions() {
        return this.options.exemptPermissions || this.manager.options.default.exemptPermissions;
    }

    /**
     * Function to filter members. If true is returned, the member won't be able to win the giveaway.
     * @type {Function}
     */
    get exemptMembers() {
        return this.options.exemptMembers || this.manager.options.default.exemptMembers;
    }

    /**
     * The channel of the giveaway
     * @type {Channel}
     * @readonly
     */
    get channel() {
        return this.manager.v12 ? this.client.channels.cache.get(this.channelID) : this.client.channels.get(this.channelID);
    }

    /**
     * Gets the content of the giveaway
     * @type {string}
     * @readonly
     */
    get content() {
        let roundTowardsZero = this.remainingTime > 0 ? Math.floor : Math.ceil;
        // Gets days, hours, minutes and seconds
        let days = roundTowardsZero(this.remainingTime / 86400000),
            hours = roundTowardsZero(this.remainingTime / 3600000) % 24,
            minutes = roundTowardsZero(this.remainingTime / 60000) % 60,
            seconds = roundTowardsZero(this.remainingTime / 1000) % 60;
        // Increment seconds if equal to zero
        if (seconds === 0) seconds++;
        // Whether values are inferior to zero
        let isDay = days > 0,
            isHour = hours > 0,
            isMinute = minutes > 0;
        let dayUnit =
                days < 2 && (this.messages.units.pluralS || this.messages.units.days.endsWith('s'))
                    ? this.messages.units.days.substr(0, this.messages.units.days.length - 1)
                    : this.messages.units.days,
            hourUnit =
                hours < 2 && (this.messages.units.pluralS || this.messages.units.hours.endsWith('s'))
                    ? this.messages.units.hours.substr(0, this.messages.units.hours.length - 1)
                    : this.messages.units.hours,
            minuteUnit =
                minutes < 2 && (this.messages.units.pluralS || this.messages.units.minutes.endsWith('s'))
                    ? this.messages.units.minutes.substr(0, this.messages.units.minutes.length - 1)
                    : this.messages.units.minutes,
            secondUnit =
                seconds < 2 && (this.messages.units.pluralS || this.messages.units.seconds.endsWith('s'))
                    ? this.messages.units.seconds.substr(0, this.messages.units.seconds.length - 1)
                    : this.messages.units.seconds;
        // Generates a first pattern
        let pattern =
            (!isDay ? '' : `{days} ${dayUnit}, `) +
            (!isHour ? '' : `{hours} ${hourUnit}, `) +
            (!isMinute ? '' : `{minutes} ${minuteUnit}, `) +
            `{seconds} ${secondUnit}`;
        // Format the pattern with the right values
        let content = this.messages.timeRemaining
            .replace('{duration}', pattern)
            .replace('{days}', days)
            .replace('{hours}', hours)
            .replace('{minutes}', minutes)
            .replace('{seconds}', seconds);
        return content;
    }

    /**
     * Fetches the giveaway message in its channel
     * @returns {Promise<Message>} The Discord message
     */
    async fetchMessage() {
        return new Promise(async (resolve, reject) => {
            let message = null;
            if (this.manager.v12) {
                message = await this.channel.messages.fetch(this.messageID).catch(() => {});
            } else {
                message = await this.channel.fetchMessage(this.messageID).catch(() => {});
            }
            if (!message) {
                return reject('Unable to fetch message with ID ' + this.messageID + '.');
            }
            this.message = message;
            resolve(message);
        });
    }

    /**
     * Gets the giveaway winner(s)
     * @param {number} winnerCount The number of winners to pick
     * @returns {Array<GuildMember>} The winner(s)
     */
    async roll(winnerCount) {
        // Pick the winner
        let reaction = (this.manager.v12 ? this.message.reactions.cache :  this.message.reactions).find(r => r.emoji.name === this.reaction);
        if (!reaction) return new Collection();
        let users = (this.manager.v12 ? await reaction.users.fetch() : await reaction.fetchUsers())
            .filter(u => u.bot === this.botsCanWin)
            .filter(u => u.id !== this.message.client.id)
            .filter(u => this.manager.v12 ? this.channel.guild.members.cache.get(u.id) : this.channel.guild.members.get(u.id))
            .filter(u => !(this.exemptMembers(this.manager.v12 ? this.channel.guild.members.cache.get(u.id) : this.channel.guild.members.get(u.id))))
            .filter(u => !this.exemptPermissions.some(p => (this.manager.v12 ? this.channel.guild.members.cache.get(u.id) : this.channel.guild.members.get(u.id)).hasPermission(p)))
            .random(winnerCount || this.winnerCount)
            .filter(u => u);
        return users;
    }
}

module.exports = Giveaway;
