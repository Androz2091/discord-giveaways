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
    BonusEntry,
    PauseOptions
} = require('./Constants.js');
const GiveawaysManager = require('./Manager.js');

/**
 * Represents a Giveaway.
 */
class Giveaway extends EventEmitter {
    /**
     * @param {GiveawaysManager} manager The giveaway manager.
     * @param {GiveawayData} options The giveaway data.
     */
    constructor(manager, options) {
        super();
        /**
         * The giveaway manager.
         * @type {GiveawaysManager}
         */
        this.manager = manager;
        /**
         * The Discord client.
         * @type {Discord.Client}
         */
        this.client = manager.client;
        /**
         * The giveaway prize.
         * @type {string}
         */
        this.prize = options.prize;
        /**
         * The start date of the giveaway.
         * @type {Number}
         */
        this.startAt = options.startAt;
        /**
         * The end date of the giveaway.
         * @type {Number}
         */
        this.endAt = options.endAt === null ? Infinity : options.endAt;
        /**
         * Whether the giveaway is ended.
         * @type {Boolean}
         */
        this.ended = options.ended || false;
        /**
         * The ID of the channel of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.channelID = options.channelID;
        /**
         * The ID of the message of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.messageID = options.messageID;
        /**
         * The ID of the guild of the giveaway.
         * @type {Discord.Snowflake}
         */
        this.guildID = options.guildID;
        /**
         * The number of winners for this giveaway.
         * @type {number}
         */
        this.winnerCount = options.winnerCount;
        /**
         * The winner IDs for this giveaway after it ended.
         * @type {string[]}
         */
        this.winnerIDs = options.winnerIDs || [];
        /**
         * The mention of the user who hosts this giveaway.
         * @type {string}
         */
        this.hostedBy = options.hostedBy;
        /**
         * The giveaway messages.
         * @type {GiveawayMessages}
         */
        this.messages = options.messages;
        /**
         * The URL appearing as the thumbnail on the giveaway embed.
         * @type {string}
         */
        this.thumbnail = options.thumbnail;
        /**
         * Extra data concerning this giveaway.
         * @type {any}
         */
        this.extraData = options.extraData;
        /**
         * The giveaway data.
         * @type {GiveawayData}
         */
        this.options = options;
        /**
         * The message instance of the embed of this giveaway.
         * @type {?Discord.Message}
         */
        this.message = null;
    }

    /**
     * The link to the giveaway message.
     * @type {string}
     * @readonly
     */
    get messageURL() {
        return `https://discord.com/channels/${this.guildID}/${this.channelID}/${this.messageID}`;
    }

    /**
     * The remaining time before the end of the giveaway.
     * @type {Number}
     * @readonly
     */
    get remainingTime() {
        return this.endAt - Date.now();
    }

    /**
     * The total duration of the giveaway.
     * @type {Number}
     * @readonly
     */
    get duration() {
        return this.endAt - this.startAt;
    }

    /**
     * The color of the giveaway embed.
     * @type {Discord.ColorResolvable}
     */
    get embedColor() {
        return this.options.embedColor || this.manager.options.default.embedColor;
    }

    /**
     * The color of the giveaway embed when it has ended.
     * @type {Discord.ColorResolvable}
     */
    get embedColorEnd() {
        return this.options.embedColorEnd || this.manager.options.default.embedColorEnd;
    }

    /**
     * The reaction on the giveaway message.
     * @type {Discord.EmojiIdentifierResolvable}
     */
    get reaction() {
        return this.options.reaction || this.manager.options.default.reaction;
    }

    /**
     * If bots can win the giveaway.
     * @type {Boolean}
     */
    get botsCanWin() {
        return typeof this.options.botsCanWin === 'boolean' ? this.options.botsCanWin : this.manager.options.default.botsCanWin;
    }

    /**
     * Members with any of these permissions will not be able to win a giveaway.
     * @type {Discord.PermissionResolvable[]}
     */
    get exemptPermissions() {
        return this.options.exemptPermissions || this.manager.options.default.exemptPermissions;
    }

    /**
     * The options for the last chance system.
     * @type {LastChanceOptions}
     */
    get lastChance() {
        return merge(this.manager.options.default.lastChance, this.options.lastChance || {});
    }

    /**
     * Pause options for this giveaway
     * @type {PauseOptions}
     */
    get pauseOptions() {
        return merge(PauseOptions, this.options.pauseOptions || {});
    }

    /**
     * The array of BonusEntry objects for the giveaway.
     * @type {BonusEntry[]}
     */
    get bonusEntries() {
        return eval(this.options.bonusEntries) || [];
    }

    /**
     * The exemptMembers function of the giveaway.
     * @type {?Function}
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
     * The channel of the giveaway.
     * @type {Discord.TextChannel}
     * @readonly
     */
    get channel() {
        return this.client.channels.cache.get(this.channelID);
    }

    /**
     * Gets the content of the giveaway.
     * @type {string}
     * @readonly
     */
    get remainingTimeText() {
        if (this.endAt === Infinity) return this.messages.timeRemaining.replace('{duration}', 'Infinity');
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
     * The raw giveaway object for this giveaway.
     * @type {GiveawayData}
     */
    get data() {
        return {
            messageID: this.messageID,
            channelID: this.channelID,
            guildID: this.guildID,
            startAt: this.startAt,
            endAt: this.endAt,
            ended: this.ended,
            winnerCount: this.winnerCount,
            prize: this.prize,
            messages: this.messages,
            thumbnail: this.thumbnail,
            hostedBy: this.options.hostedBy,
            embedColor: this.options.embedColor,
            embedColorEnd: this.options.embedColorEnd,
            botsCanWin: this.options.botsCanWin,
            exemptPermissions: this.options.exemptPermissions,
            exemptMembers:
                (!this.options.exemptMembers || typeof this.options.exemptMembers === 'string')
                    ? this.options.exemptMembers || undefined
                    : serialize(this.options.exemptMembers),
            bonusEntries:
                (!this.options.bonusEntries || typeof this.options.bonusEntries === 'string')
                    ? this.options.bonusEntries || undefined
                    : serialize(this.options.bonusEntries),
            reaction: this.options.reaction,
            winnerIDs: this.winnerIDs.length ? this.winnerIDs : undefined,
            extraData: this.extraData,
            lastChance: this.options.lastChance,
            pauseOptions: this.options.pauseOptions
        };
    }

    /**
     * Fetches the giveaway message from its channel.
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
     * @param {Discord.User} user The user to check.
     * @returns {Promise<boolean>} If the entry was valid.
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
     * @param {Discord.User} user The user to check.
     * @returns {Promise<number|boolean>} The highest bonus entries the user should get or false.
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
     * Gets the giveaway winner(s).
     * @param {number} [winnerCount=this.winnerCount] The number of winners to pick.
     * @returns {Promise<Discord.GuildMember[]>} The winner(s).
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

        // Fetch all reaction users
        let userCollection = await reaction.users.fetch();
        while (userCollection.size % 100 === 0) {
            const newUsers = await reaction.users.fetch({ after: userCollection.lastKey() });
            if (newUsers.size === 0) break;
            userCollection = userCollection.concat(newUsers);
        }

        const users = userCollection
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
             * because collections/maps do not allow duplicates and so we cannot use their built in "random" function
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

        return winners.map((user) => guild.members.cache.get(user.id));
    }

    /**
     * Edits the giveaway.
     * @param {GiveawayEditOptions} options The edit options.
     * @returns {Promise<Giveaway>} The edited giveaway.
     */
    edit(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message ID ' + this.messageID + ' is already ended.');
            if (!this.channel) return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with ID ' + this.messageID + '.');

            // Update data
            if (Number.isInteger(options.newWinnerCount) && options.newWinnerCount > 0) this.winnerCount = options.newWinnerCount;
            if (typeof options.newPrize === 'string') this.prize = options.newPrize;
            if (!isNaN(options.addTime) && typeof options.addTime === 'number') this.endAt = this.endAt + options.addTime;
            if (!isNaN(options.setEndTimestamp) && typeof options.setEndTimestamp === 'number') this.endAt = options.setEndTimestamp;
            if (options.newMessages && typeof options.newMessages === 'object') this.messages = merge(this.messages, options.newMessages);
            if (typeof options.newThumbnail === 'string') this.thumbnail = options.newThumbnail;
            if (Array.isArray(options.newBonusEntries)) this.options.bonusEntries = options.newBonusEntries.filter((elem) => typeof elem === 'object');
            if (options.newExtraData) this.extraData = options.newExtraData;
            
            await this.manager.editGiveaway(this.messageID, this.data);
            if (this.remainingTime <= 0) this.manager.end(this.messageID).catch(() => {});
            else {
                const embed = this.manager.generateMainEmbed(this);
                this.message.edit(this.messages.giveaway, { embed }).catch(() => {});
            }
            resolve(this);
        });
    }

    /**
     * Ends the giveaway.
     * @returns {Promise<Discord.GuildMember[]>} The winner(s).
     */
    end() {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message ID ' + this.messageID + ' is already ended');
            if (!this.channel) return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            this.ended = true;
            this.endAt = Date.now();
            await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with ID ' + this.messageID + '.');

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
     * Rerolls the giveaway.
     * @param {GiveawayRerollOptions} [options] The reroll options.
     * @returns {Promise<Discord.GuildMember[]>}
     */
    reroll(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (!this.ended) return reject('Giveaway with message ID ' + this.messageID + ' is not ended.');
            if (!this.channel) return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with ID ' + this.messageID + '.');
            if (!options || typeof options !== 'object') return reject(`Options is not an object (val=${options})`);
            options = merge(GiveawayRerollOptions, options);
            if (options.winnerCount && (!Number.isInteger(options.winnerCount) || options.winnerCount < 1)) {
                return reject(`options.winnerCount is not a positive integer. (val=${options.winnerCount})`);
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

    /**
     * Pauses the giveaway.
     * @param {PauseOptions} options The pause options.
     * @returns {Promise<Giveaway>} The paused giveaway.
     */  
    pause(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message ID ' + this.messageID + ' is already ended.');
            if (!this.channel) return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with ID ' + this.messageID + '.');
            if (this.pauseOptions.isPaused) return reject('Giveaway with message ID ' + this.messageID + ' is already paused.');

            // Update data
            const pauseOptions = this.options.pauseOptions || {};
            if (typeof options.content === 'string') pauseOptions.content = options.content;
            if (!isNaN(options.unPauseAfter) && options.unPauseAfter === 'number') {
                if (options.unPauseAfter < Date.now()) {
                    pauseOptions.unPauseAfter = Date.now() + options.unPauseAfter;
                    this.endAt = this.endAt + options.unPauseAfter;
                } else { 
                    pauseOptions.unPauseAfter = options.unPauseAfter;
                    this.endAt = this.endAt + options.unPauseAfter - Date.now();
                }
            } else {
                pauseOptions.durationAfterPause = this.remainingTime;
                this.endAt = Infinity;
            }
            let embedColor;
            try {
                embedColor = Discord.Util.resolveColor(options.embedColor);
            } catch {
                embedColor = null;
            }
            if (!isNaN(embedColor) && typeof embedColor === 'number') pauseOptions.embedColor = options.embedColor;
            pauseOptions.isPaused = true;
            this.options.pauseOptions = pauseOptions;

            await this.manager.editGiveaway(this.messageID, this.data);
            const embed = this.manager.generateMainEmbed(this);
            this.message.edit(this.messages.giveaway, { embed }).catch(() => {});
            resolve(this);
        });
    }

    /**
     * Unpauses the giveaway.
     * @returns {Promise<Giveaway>} The unpaused giveaway.
     */
    unpause() {
        return new Promise(async (resolve, reject) => {
            if (this.ended) return reject('Giveaway with message ID ' + this.messageID + ' is already ended.');
            if (!this.channel) return reject('Unable to get the channel of the giveaway with message ID ' + this.messageID + '.');
            await this.fetchMessage().catch(() => {});
            if (!this.message) return reject('Unable to fetch message with ID ' + this.messageID + '.');
            if (!this.pauseOptions.isPaused) return reject('Giveaway with message ID ' + this.messageID + ' is not paused.');
            
            // Update data
            if (!isNaN(this.pauseOptions.durationAfterPause) && typeof this.pauseOptions.durationAfterPause == 'number') {
                this.endAt = Date.now() + this.pauseOptions.durationAfterPause;
            }
            this.options.pauseOptions.isPaused = false;

            await this.manager.editGiveaway(this.messageID, this.data);
            const embed = this.manager.generateMainEmbed(this);
            this.message.edit(this.messages.giveaway, { embed }).catch(() => {});
            resolve(this);
        });
    }
}

module.exports = Giveaway;
