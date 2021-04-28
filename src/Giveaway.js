const merge = require('deepmerge');
const serialize = require('serialize-javascript');
const Discord = require('discord.js');
const { EventEmitter } = require('events');
const {
    GiveawayEditOptions,
    GiveawayData,
    GiveawayMessages,
    GiveawayRerollOptions,
    LastChanceOptions,
    BonusEntry
} = require('./Constants.js');
const GiveawaysManager = require('./Manager.js');

/**
 * Represents a Giveaway
 */
class Giveaway extends EventEmitter {
    /**
     * @param {GiveawaysManager} manager The Giveaway Manager
     * @param {GiveawayData} options The giveaway data
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
         * @type {Discord.Client}
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
         * @type {Discord.Snowflake}
         */
        this.channelID = options.channelID;
        /**
         * The message ID of the giveaway
         * @type {Discord.Snowflake?}
         */
        this.messageID = options.messageID;
        /**
         * The guild ID of the giveaway
         * @type {Discord.Snowflake}
         */
        this.guildID = options.guildID;
        /**
         * The number of winners for this giveaway
         * @type {number}
         */
        this.winnerCount = options.winnerCount;
        /**
         * The winner IDs for this giveaway after it ended
         * @type {Array<string>}
         */
        this.winnerIDs = options.winnerIDs;
        /**
         * The mention of the user who hosts this giveaway
         * @type {?string}
         */
        this.hostedBy = options.hostedBy;
        /**
         * The giveaway messages
         * @type {GiveawayMessages}
         */
        this.messages = options.messages;
        /**
         * Extra data concerning this giveaway
         * @type {any}
         */
        this.extraData = options.extraData;
        /**
         * The giveaway data
         * @type {GiveawayData}
         */
        this.options = options;
        /**
         * The message instance of the embed of this giveaway
         * @type {Discord.Message?}
         */
        this.message = null;
    }

    /**
     * The link to the giveaway message
     * @type {string}
     * @readonly
     */
    get messageURL() {
        return `https://discord.com/channels/${this.guildID}/${this.channelID}/${this.messageID}`;
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
     * @type {Discord.ColorResolvable}
     */
    get embedColor() {
        return this.options.embedColor || this.manager.options.default.embedColor;
    }

    /**
     * The color of the giveaway embed when it's ended
     * @type {Discord.ColorResolvable}
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
     * @type {Discord.PermissionResolvable[]}
     */
    get exemptPermissions() {
        return (Array.isArray(this.options.exemptPermissions) && this.options.exemptPermissions.length) ? this.options.exemptPermissions : this.manager.options.default.exemptPermissions;
    }

    /**
     * Last chance options for this giveaway
     * @type {LastChanceOptions}
     */
    get lastChance() {
        return this.options.lastChance || this.manager.options.default.lastChance;
    }

    /**
     * The bonus entries for this giveaway
     * @type {BonusEntry[]?}
     */
    get bonusEntries() {
        const validBonusEntries = eval(this.options.bonusEntries);
        return (Array.isArray(validBonusEntries) && validBonusEntries.length) ? validBonusEntries : [];
    }

    /**
     * The exemptMembers function of the giveaway
     * @type {Function}
     */
    get exemptMembersFunction() {
        return this.options.exemptMembers
            ? (typeof this.options.exemptMembers === 'string' && this.options.exemptMembers.includes('function anonymous'))
                ? eval(`(${this.options.exemptMembers})`)
                : eval(this.options.exemptMembers) 
            : null;
    }

    /**
     * Function to filter members. If true is returned, the member won't be able to win the giveaway.
     * @property {Discord.GuildMember} member The member to check
     * @returns {Promise<boolean>} Whether the member should get exempted
     */
    async exemptMembers(member) {
        if (typeof this.exemptMembersFunction === 'function') {
            try {
                const result = await this.exemptMembersFunction(member);
                return result;
            } catch (err) {
                console.error(`Giveaway message ID: ${this.messageID}\n${serialize(this.exemptMembersFunction)}\n${err}`);
                return false;
            }
        }
        if (typeof this.manager.options.default.exemptMembers === 'function') {
            return await this.manager.options.default.exemptMembers(member);
        }
        return false;
    }

    /**
     * The channel of the giveaway
     * @type {Discord.TextChannel}
     * @readonly
     */
    get channel() {
        return this.client.channels.cache.get(this.channelID);
    }

    /**
     * Gets the content of the giveaway
     * @type {string}
     * @readonly
     */
    get remainingTimeText() {
        const roundTowardsZero = this.remainingTime > 0 ? Math.floor : Math.ceil;
        // Gets days, hours, minutes and seconds
        const days = roundTowardsZero(this.remainingTime / 86400000),
            hours = roundTowardsZero(this.remainingTime / 3600000) % 24,
            minutes = roundTowardsZero(this.remainingTime / 60000) % 60;
        let seconds = roundTowardsZero(this.remainingTime / 1000) % 60;
        // Increment seconds if equal to zero
        if (seconds === 0) seconds++;
        // Whether values are inferior to zero
        const isDay = days > 0,
            isHour = hours > 0,
            isMinute = minutes > 0;
        const dayUnit =
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
        const pattern =
            (!isDay ? '' : `{days} ${dayUnit}, `) +
            (!isHour ? '' : `{hours} ${hourUnit}, `) +
            (!isMinute ? '' : `{minutes} ${minuteUnit}, `) +
            `{seconds} ${secondUnit}`;
        // Format the pattern with the right values
        const content = this.messages.timeRemaining
            .replace('{duration}', pattern)
            .replace('{days}', days.toString())
            .replace('{hours}', hours.toString())
            .replace('{minutes}', minutes.toString())
            .replace('{seconds}', seconds.toString());
        return content;
    }

    /**
     * The raw giveaway object for this giveaway
     * @type {GiveawayData}
     */
    get data() {
        const baseData = {
            messageID: this.messageID,
            channelID: this.channelID,
            guildID: this.guildID,
            startAt: this.startAt,
            endAt: this.endAt,
            ended: this.ended,
            winnerCount: this.winnerCount,
            prize: this.prize,
            messages: this.messages,
            hostedBy: this.options.hostedBy,
            embedColor: this.options.embedColor,
            embedColorEnd: this.options.embedColorEnd,
            botsCanWin: this.options.botsCanWin,
            exemptPermissions: this.options.exemptPermissions,
            exemptMembers: (!this.options.exemptMembers || typeof this.options.exemptMembers === 'string') ? this.options.exemptMembers : serialize(this.options.exemptMembers),
            bonusEntries: typeof this.options.bonusEntries === 'string' ? this.options.bonusEntries : serialize(this.options.bonusEntries),
            reaction: this.options.reaction,
            winnerIDs: this.winnerIDs,
            extraData: this.extraData,
            lastChance: this.options.lastChance
        };
        return baseData;
    }

    /**
     * Fetches the giveaway message in its channel
     * @returns {Promise<Discord.Message>} The Discord message
     */
    async fetchMessage() {
        return new Promise(async (resolve, reject) => {
            if (!this.messageID) return;
            const message = await this.channel.messages.fetch(this.messageID).catch(() => {});
            if (!message) {
                this.manager.giveaways = this.manager.giveaways.filter((g) => g.messageID !== this.messageID);
                await this.manager.deleteGiveaway(this.messageID);
                return reject('Unable to fetch message with ID ' + this.messageID + '.');
            }
            this.message = message;
            resolve(message);
        });
    }

    /**
     * @param {Discord.User} user The user to check
     * @returns {Promise<boolean>} Whether it is a valid entry
     */
    async checkWinnerEntry(user) {
        if (this.winnerIDs.includes(user.id)) return false;
        const guild = this.channel.guild;
        const member = guild.members.cache.get(user.id) || (await guild.members.fetch(user.id).catch(() => {}));
        if (!member) return false;
        const exemptMember = await this.exemptMembers(member);
        if (exemptMember) return false;
        const hasPermission = this.exemptPermissions.some((permission) => member.permissions.has(permission));
        if (hasPermission) return false;
        return true;
    }

    /**
     * @param {Discord.User} user The user to check
     * @returns {Promise<number|boolean>} The highest bonus entries the user should get or false
     */
    async checkBonusEntries(user) {
        const member = this.channel.guild.members.cache.get(user.id);
        const entries = [];
        const cumulativeEntries = [];

        if (this.bonusEntries.length) {
            for (const obj of this.bonusEntries) {
                if (typeof obj.bonus === 'function') {
                    try {
                        const result = await obj.bonus(member);
                        if (Number.isInteger(result) && result > 0) {
                            if (obj.cumulative) {
                                cumulativeEntries.push(result);
                            } else {
                                entries.push(result);
                            }  
                        }
                    } catch (err) {
                        console.error(`Giveaway message ID: ${this.messageID}\n${serialize(obj.bonus)}\n${err}`);
                    }
                }
            }
        }

        if (cumulativeEntries.length) entries.push(cumulativeEntries.reduce((a, b) => a + b));
        if (entries.length) return Math.max.apply(Math, entries);
        return false;
    }

    /**
     * Gets the giveaway winner(s)
     * @param {number} [winnerCount=this.winnerCount] The number of winners to pick
     * @returns {Promise<Discord.GuildMember[]>} The winner(s)
     */
    async roll(winnerCount = this.winnerCount) {
        if (!this.message) return [];
        // Pick the winner
        const reactions = this.message.reactions.cache;
        const reaction = reactions.get(this.reaction) || reactions.find((r) => r.emoji.name === this.reaction);
        if (!reaction) return [];
        const guild = this.channel.guild;
        // Fetch guild members
        if (this.manager.options.hasGuildMembersIntent) await guild.members.fetch();
        const users = (await reaction.users.fetch())
            .filter((u) => !u.bot || u.bot === this.botsCanWin)
            .filter((u) => u.id !== this.message.client.user.id);
        if (!users.size) return [];

        // Bonus Entries
        let userArray;
        if (this.bonusEntries.length) {
            userArray = users.array(); // Copy all users once
            for (const user of userArray.slice()) {
                const isUserValidEntry = await this.checkWinnerEntry(user);
                if (!isUserValidEntry) continue;

                const highestBonusEntries = await this.checkBonusEntries(user);
                if (!highestBonusEntries) continue;

                for (let i = 0; i < highestBonusEntries; i++) userArray.push(user);
            }
        }

        let rolledWinners;
        if (!userArray || userArray.length <= winnerCount)
            rolledWinners = users.random(Math.min(winnerCount, users.size));
        else {
            /** 
             * Random mechanism like https://github.com/discordjs/collection/blob/master/src/index.ts#L193
             * because collections/maps do not allow dublicates and so we cannot use their built in "random" function
             */
            rolledWinners = Array.from({
                length: Math.min(winnerCount, users.size)
            }, () => userArray.splice(Math.floor(Math.random() * userArray.length), 1)[0]);
        }

        const winners = [];

        for (const u of rolledWinners) {
            const isValidEntry = !winners.some((winner) => winner.id === u.id) && (await this.checkWinnerEntry(u));
            if (isValidEntry) winners.push(u);
            else {
                // Find a new winner
                for (const user of userArray || users.array()) {
                    const isUserValidEntry = !winners.some((winner) => winner.id === user.id) && (await this.checkWinnerEntry(user));
                    if (isUserValidEntry) {
                        winners.push(user);
                        break;
                    }
                }
            }
        }

        return winners.map((user) => guild.members.cache.get(user.id) || user);
    }

    /**
     * Edits the giveaway
     * @param {GiveawayEditOptions} options The edit options
     * @returns {Promise<Giveaway>} The edited giveaway
     */
    edit(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) {
                return reject('Giveaway with message ID ' + this.messageID + ' is already ended.');
            }
            if (!this.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            }
            await this.fetchMessage().catch(() => {});
            if (!this.message) {
                return reject('Unable to fetch message with ID ' + this.messageID + '.');
            }
            // Update data
            if (Number.isInteger(options.newWinnerCount) && options.newWinnerCount > 0) this.winnerCount = options.newWinnerCount;
            if (typeof options.newPrize === 'string') this.prize = options.newPrize;
            if (options.addTime && !isNaN(options.addTime)) this.endAt = this.endAt + options.addTime;
            if (options.setEndTimestamp && !isNaN(options.setEndTimestamp)) this.endAt = options.setEndTimestamp;
            if (options.newMessages && typeof options.newMessages === 'object') this.messages = merge(this.messages, options.newMessages);
            if (Array.isArray(options.newBonusEntries) && options.newBonusEntries.every((elem) => typeof elem === 'object'))
                this.options.bonusEntries = options.newBonusEntries;
            if (options.newExtraData) this.extraData = options.newExtraData;
            // Call the db method
            await this.manager.editGiveaway(this.messageID, this.data);
            resolve(this);
        });
    }

    /**
     * Ends the giveaway
     * @returns {Promise<Discord.GuildMember[]>} The winner(s)
     */
    end() {
        return new Promise(async (resolve, reject) => {
            if (this.ended) {
                return reject('Giveaway with message ID ' + this.messageID + ' is already ended');
            }
            if (!this.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            }
            this.ended = true;
            this.endAt = Date.now();
            await this.fetchMessage().catch(() => {});
            if (!this.message) {
                return reject('Unable to fetch message with ID ' + this.messageID + '.');
            }
            const winners = await this.roll();
            await this.manager.editGiveaway(this.messageID, this.data);
            if (winners.length > 0) {
                this.winnerIDs = winners.map((w) => w.id);
                await this.manager.editGiveaway(this.messageID, this.data);
                const embed = this.manager.generateEndEmbed(this, winners);
                await this.message.edit(this.messages.giveawayEnded, { embed }).catch(() => {});
                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                const messageString = this.messages.winMessage
                    .replace('{winners}', formattedWinners)
                    .replace('{prize}', this.prize)
                    .replace('{messageURL}', this.messageURL);
                if (messageString.length <= 2000) this.message.channel.send(messageString);
                else {
                    this.message.channel.send(
                        this.messages.winMessage
                            .substr(0, this.messages.winMessage.indexOf('{winners}'))
                            .replace('{prize}', this.prize)
                            .replace('{messageURL}', this.messageURL)
                    );
                    while (formattedWinners.length >= 2000) {
                        await this.message.channel.send(formattedWinners.substr(0, formattedWinners.lastIndexOf(',', 1999)) + ',');
                        formattedWinners = formattedWinners.slice(formattedWinners.substr(0, formattedWinners.lastIndexOf(',', 1999) + 2).length);
                    }
                    this.message.channel.send(formattedWinners);
                    this.message.channel.send(
                        this.messages.winMessage
                            .substr(this.messages.winMessage.indexOf('{winners}') + 9)
                            .replace('{prize}', this.prize)
                            .replace('{messageURL}', this.messageURL)
                    );
                }
                resolve(winners);
            } else {
                const embed = this.manager.generateNoValidParticipantsEndEmbed(this);
                this.message.edit(this.messages.giveawayEnded, { embed }).catch(() => {});
                resolve([]);
            }
        });
    }

    /**
     * Rerolls the giveaway
     * @param {GiveawayRerollOptions} options
     * @returns {Promise<Discord.GuildMember[]>}
     */
    reroll(options) {
        return new Promise(async (resolve, reject) => {
            if (!this.ended) {
                return reject('Giveaway with message ID ' + this.messageID + ' is not ended.');
            }
            if (!this.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            }
            await this.fetchMessage().catch(() => {});
            if (!this.message) {
                return reject('Unable to fetch message with ID ' + this.messageID + '.');
            }
            const winners = await this.roll(options.winnerCount || undefined);
            if (winners.length > 0) {
                this.winnerIDs = winners.map((w) => w.id);
                await this.manager.editGiveaway(this.messageID, this.data);
                const embed = this.manager.generateEndEmbed(this, winners);
                await this.message.edit(this.messages.giveawayEnded, { embed }).catch(() => {});
                let formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');
                const messageString = options.messages.congrat
                    .replace('{winners}', formattedWinners)
                    .replace('{prize}', this.prize)
                    .replace('{messageURL}', this.messageURL);
                if (messageString.length <= 2000) this.message.channel.send(messageString);
                else {
                    this.message.channel.send(
                        options.messages.congrat
                            .substr(0, options.messages.congrat.indexOf('{winners}'))
                            .replace('{prize}', this.prize)
                            .replace('{messageURL}', this.messageURL)
                    );
                    while (formattedWinners.length >= 2000) {
                        await this.message.channel.send(formattedWinners.substr(0, formattedWinners.lastIndexOf(',', 1999)) + ',');
                        formattedWinners = formattedWinners.slice(formattedWinners.substr(0, formattedWinners.lastIndexOf(',', 1999) + 2).length);
                    }
                    this.message.channel.send(formattedWinners);
                    this.message.channel.send(
                        options.messages.congrat
                            .substr(options.messages.congrat.indexOf('{winners}') + 9)
                            .replace('{prize}', this.prize)
                            .replace('{messageURL}', this.messageURL)
                    );
                }
                resolve(winners);
            } else {
                this.channel.send(options.messages.error);
                resolve([]);
            }
        });
    }
}

module.exports = Giveaway;
