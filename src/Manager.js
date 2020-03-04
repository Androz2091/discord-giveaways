const { EventEmitter } = require('events');
const mergeOptions = require('merge-options');
const { writeFile, readFile, exists } = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const Discord = require('discord.js');
const { defaultGiveawaysManagerOptions, defaultGiveawaysMessages, defaultGiveawayRerollOptions } = require('./Util');
const Giveaway = require('./Giveaway');

/**
 * Giveaways Manager
 */
class GiveawaysManager extends EventEmitter {
    /**
     * @param {Client} client The Discord Client
     * @param {GiveawaysManagerOptions} options The manager options
     */
    constructor(client, options) {
        super();
        if (!client) throw new Error('Client is a required option.');
        /**
         * The Discord Client
         * @type {Client}
         */
        this.client = client;
        /**
         * Whether the manager is ready
         * @type {Boolean}
         */
        this.ready = false;
        /**
         * The giveaways managed by this manager
         * @type {Giveaway[]}
         */
        this.giveaways = [];
        /**
         * The manager options
         * @type {GiveawaysManagerOptions}
         */
        this.options = mergeOptions(defaultGiveawaysManagerOptions, options);
        /**
         * Whether the Discord.js library version is the v12 one
         * @type {boolean}
         */
        this.v12 = this.options.DJSlib === 'v12';
        this._init();
    }

    /**
     * Ends a giveaway. This method is automatically called when a giveaway ends.
     * @param {string} messageID The message ID of the giveaway
     * @returns {Promise<GuildMember[]>} The winners
     *
     * @example
     * manager.end("664900661003157510");
     */
    end(messageID) {
        return new Promise(async (resolve, reject) => {
            let giveawayData = this.giveaways.find(g => g.messageID === messageID);
            if (!giveawayData) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            let giveaway = new Giveaway(this, giveawayData);
            if (giveaway.ended) {
                return reject('Giveaway with message ID ' + giveaway.messageID + ' is already ended');
            }
            if (!giveaway.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message) {
                return reject('Unable to fetch message with ID ' + giveaway.messageID + '.');
            }
            let winners = await giveaway.roll();
            this.emit('end', giveaway, winners);
            if (winners.length > 0) {
                let formattedWinners = winners.map(w => '<@' + w.id + '>').join(', ');
                let str =
                    giveaway.messages.winners.substr(0, 1).toUpperCase() +
                    giveaway.messages.winners.substr(1, giveaway.messages.winners.length) +
                    ': ' +
                    formattedWinners;
                let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
                embed
                    .setAuthor(giveaway.prize)
                    .setColor(giveaway.embedColorEnd)
                    .setFooter(giveaway.messages.endedAt)
                    .setDescription(`${str}\n${giveaway.hostedBy ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy) : ""}`)
                    .setTimestamp(new Date(giveaway.endAt).toISOString());
                giveaway.message.edit(giveaway.messages.giveawayEnded, { embed });
                giveaway.message.channel.send(
                    giveaway.messages.winMessage
                        .replace('{winners}', formattedWinners)
                        .replace('{prize}', giveaway.prize)
                );
                this._markAsEnded(giveaway.messageID);
                resolve(winners);
            } else {
                let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
                embed
                    .setAuthor(giveaway.prize)
                    .setColor(giveaway.embedColorEnd)
                    .setFooter(giveaway.messages.endedAt)
                    .setDescription(`${giveaway.messages.noWinner}\n${giveaway.hostedBy ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy) : ""}`)
                    .setTimestamp(new Date(giveaway.endAt).toISOString());
                giveaway.message.edit(giveaway.messages.giveawayEnded, { embed });
                this._markAsEnded(giveaway.messageID);
                resolve();
            }
        });
    }

    /**
     * Starts a new giveaway
     *
     * @param {Channel} channel The channel in which the giveaway will be created
     * @param {GiveawayStartOptions} options The options for the giveaway
     *
     * @returns {Promise<Giveaway>}
     *
     * @example
     * manager.start(message.channel, {
     *      prize: "Free Steam Key",
     *      // Giveaway will last 10 seconds
     *      time: 10000,
     *      // One winner
     *      winnerCount: 1,
     *      // Limit the giveaway to members who have the Nitro Boost role
     *      exemptMembers: (member) => !member.roles.some((r) => r.name === "Nitro Boost")
     * });
     */
    start(channel, options = {}) {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) {
                return reject('The manager is not ready yet.');
            }
            if (!options.messages) {
                options.messages = defaultGiveawaysMessages;
            }
            if (!channel || !channel.id) {
                return reject(`channel is not a valid guildchannel. (val=${channel})`);
            }
            if (!options.time || isNaN(options.time)) {
                return reject(`options.time is not a number. (val=${options.time})`);
            }
            if (!options.prize) {
                return reject(`options.prize is not a string. (val=${options.prize})`);
            }
            if (!options.winnerCount || isNaN(options.winnerCount)) {
                return reject(`options.winnerCount is not a number. (val=${options.winnerCount})`);
            }
            let giveaway = new Giveaway(this, {
                startAt: Date.now(),
                endAt: Date.now() + options.time,
                winnerCount: options.winnerCount,
                channelID: channel.id,
                guildID: channel.guild.id,
                ended: false,
                prize: options.prize,
                hostedBy: (options.hostedBy ? options.hostedBy.toString() : null),
                messages: options.messages,
                reaction: options.reaction,
                botsCanWin: options.botsCanWin,
                exemptPermissions: options.exemptPermissions,
                exemptMembers: options.exemptMembers,
                embedColor: options.embedColor,
                embedColorEnd: options.embedColorEnd,
                reaction: options.reaction
            });
            let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
            embed
                .setAuthor(giveaway.prize)
                .setColor(giveaway.embedColor)
                .setFooter(`${giveaway.winnerCount} ${giveaway.messages.winners}`)
                .setDescription(`${options.messages.inviteToParticipate}\n${giveaway.content}\n${giveaway.hostedBy ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy) : ""}`)
                .setTimestamp(new Date(giveaway.endAt).toISOString());
            let message = await channel.send(options.messages.giveaway, { embed });
            message.react(giveaway.reaction);
            giveaway.messageID = message.id;
            this.giveaways.push(giveaway);
            await this._saveGiveaway(giveaway);
            resolve(giveaway);
        });
    }

    /**
     * Choose new winner(s) for the giveaway
     * @param {string} messageID The message ID of the giveaway to reroll
     * @param {GiveawayRerollOptions} options The reroll options
     * @returns {Promise<GuildMember[]>} The new winners
     *
     * @example
     * manager.reroll("664900661003157510");
     */
    reroll(messageID, options = {}) {
        return new Promise(async (resolve, reject) => {
            options = mergeOptions(defaultGiveawayRerollOptions, options);
            let giveawayData = this.giveaways.find(g => g.messageID === messageID);
            if (!giveawayData) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            let giveaway = new Giveaway(this, giveawayData);
            if (!giveaway.ended) {
                return reject('Giveaway with message ID ' + giveaway.messageID + ' is not ended.');
            }
            if (!giveaway.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message) {
                return reject('Unable to fetch message with ID ' + giveaway.messageID + '.');
            }
            let winners = await giveaway.roll();
            if (winners.length > 0) {
                let formattedWinners = winners.map(w => '<@' + w.id + '>').join(', ');
                giveaway.channel.send(options.messages.congrat.replace('{winners}', formattedWinners));
                resolve(winners);
            } else {
                giveaway.channel.send(options.messages.error);
                resolve(new Array());
            }
        });
    }

    /**
     * Edits a giveaway. The modifications will be applicated when the giveaway will be updated.
     * @param {string} messageID The message ID of the giveaway to edit
     * @param {GiveawayEditOptions} options The edit options
     * @returns {Giveaway} The edited giveaway
     *
     * @example
     * manager.edit("664900661003157510", {
     *      newWinnerCount: 2,
     *      newPrize: "Something new!",
     *      addTime: -10000 // The giveaway will end 10 seconds earlier
     * });
     */
    edit(messageID, options = {}) {
        return new Promise(async (resolve, reject) => {
            let giveawayData = this.giveaways.find(g => g.messageID === messageID);
            if (!giveawayData) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            let giveaway = new Giveaway(this, giveawayData);
            if (giveaway.ended) {
                return reject('Giveaway with message ID ' + giveaway.messageID + ' is already ended.');
            }
            if (!giveaway.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message) {
                return reject('Unable to fetch message with ID ' + giveaway.messageID + '.');
            }
            // Update data
            let modifiedGiveawayData = giveawayData;
            if (options.newWinnerCount) modifiedGiveawayData.winnerCount = options.newWinnerCount;
            if (options.newPrize) modifiedGiveawayData.prize = options.newPrize;
            if (options.addTime) modifiedGiveawayData.endAt = giveawayData.endAt + options.addTime;
            if (options.setEndTimestamp) modifiedGiveawayData.endAt = options.setEndTimestamp;
            // Save the giveaway
            let newGiveaway = new Giveaway(this, modifiedGiveawayData);
            this._saveGiveaway(newGiveaway);
            resolve(newGiveaway);
        });
    }

    /**
     * Deletes a giveaway. It will delete the message and all the giveaway data.
     * @param {string} messageID  The message ID of the giveaway
     * @param {Boolean} doNotDeleteMessage Whether the giveaway message shouldn't be deleted
     * @returns {Promise<void>}
     */
    delete(messageID, doNotDeleteMessage) {
        return new Promise(async (resolve, reject) => {
            let giveawayData = this.giveaways.find(g => g.messageID === messageID);
            if (!giveawayData) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            let giveaway = new Giveaway(this, giveawayData);
            if (!giveaway.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            if(!doNotDeleteMessage){
                await giveaway.fetchMessage().catch(() => {});
                if (giveaway.message) {
                    // Delete the giveaway message
                    giveaway.message.delete();
                }
            }
            this.giveaways = this.giveaways.filter(g => g.messageID !== giveawayData.messageID);
            await writeFileAsync(this.options.storage, JSON.stringify(this.giveaways), 'utf-8');
            resolve();
        });
    }

    /**
     * Gets the giveaways from the storage file, or create it
     * @ignore
     * @private
     * @returns {Array<Giveaways>}
     */
    async _initStorage() {
        // Whether the storage file exists, or not
        let storageExists = await existsAsync(this.options.storage);
        // If it doesn't exists
        if (!storageExists) {
            // Create the file with an empty array
            await writeFileAsync(this.options.storage, '[]', 'utf-8');
            return [];
        } else {
            // If the file exists, read it
            let storageContent = await readFileAsync(this.options.storage);
            try {
                let giveaways = await JSON.parse(storageContent);
                if (Array.isArray(giveaways)) {
                    return giveaways;
                } else {
                    throw new SyntaxError('The storage file is not properly formatted.');
                }
            } catch (e) {
                if (e.message === 'Unexpected end of JSON input') {
                    throw new SyntaxError('The storage file is not properly formatted.', e);
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Save the giveaway to the storage file
     * @ignore
     * @private
     * @param {Giveaway} giveaway The giveaway to save
     */
    async _saveGiveaway(giveaway) {
        this.giveaways = this.giveaways.filter(g => g.messageID !== giveaway.messageID);
        let giveawayData = {
            messageID: giveaway.messageID,
            channelID: giveaway.channelID,
            guildID: giveaway.guildID,
            startAt: giveaway.startAt,
            endAt: giveaway.endAt,
            ended: giveaway.ended,
            winnerCount: giveaway.winnerCount,
            prize: giveaway.prize,
            messages: giveaway.messages
        };
        if (giveaway.options.hostedBy) giveawayData.hostedBy = giveaway.options.hostedBy;
        if (giveaway.options.embedColor) giveawayData.embedColor = giveaway.options.embedColor;
        if (giveaway.options.embedColorEnd) giveawayData.embedColorEnd = giveaway.options.embedColorEnd;
        if (giveaway.options.botsCanWin) giveawayData.botsCanWin = giveaway.options.botsCanWin;
        if (giveaway.options.exemptPermissions) giveawayData.exemptPermissions = giveaway.options.exemptPermissions;
        if (giveaway.options.exemptMembers) giveawayData.exemptMembers = giveaway.options.exemptMembers;
        if (giveaway.options.reaction) giveawayData.reaction = giveaway.options.reaction;
        this.giveaways.push(giveawayData);
        await writeFileAsync(this.options.storage, JSON.stringify(this.giveaways), 'utf-8');
        return;
    }

    /**
     * Mark a giveaway as ended
     * @private
     * @ignore
     * @param {string} messageID The message ID of the giveaway
     */
    async _markAsEnded(messageID) {
        this.giveaways.find(g => g.messageID === messageID).ended = true;
        await writeFileAsync(this.options.storage, JSON.stringify(this.giveaways), 'utf-8');
        return;
    }

    /**
     * Checks each giveaway and update it if needed
     * @ignore
     * @private
     */
    _checkGiveaway() {
        if (this.giveaways.length <= 0) return;
        this.giveaways.forEach(async giveawayData => {
            let giveaway = new Giveaway(this, giveawayData);
            if (giveaway.ended) return;
            if (!giveaway.channel) return;
            if (giveaway.remainingTime <= 0) {
                return this.end(giveaway.messageID).catch(e => console.error(e));
            }
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message) {
                giveaway.ended = true;
                await this._markAsEnded(giveaway.messageID);
                return;
            }
            let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
            embed
                .setAuthor(giveaway.prize)
                .setColor(giveaway.embedColor)
                .setFooter(`${giveaway.winnerCount} ${giveaway.messages.winners}`)
                .setDescription(`${giveaway.messages.inviteToParticipate}\n${giveaway.content}\n${giveaway.hostedBy ? giveaway.messages.hostedBy.replace("{user}", giveaway.hostedBy) : ""}`)
                .setTimestamp(new Date(giveaway.endAt).toISOString());
            giveaway.message.edit(giveaway.messages.giveaway, { embed });
            if (giveaway.remainingTime < this.options.updateCountdownEvery) {
                setTimeout(() => this.end.call(this, giveaway.messageID), giveaway.remainingTime);
            }
        });
    }

    /**
     * Inits the manager
     * @ignore
     * @private
     */
    async _init() {
        this.giveaways = await this._initStorage();
        setInterval(() => {
            if (this.client.readyAt) this._checkGiveaway.call(this);
        }, this.options.updateCountdownEvery);
        this.ready = true;
    }
}

/**
 * Emitted when a giveaway ends.
 * @event GiveawaysManager#end
 * @param {Giveaway} giveaway The giveaway instance
 * @param {GuildMember[]} winners The giveaway winners
 * 
 * @example
 * // This can be used to add features such as a congratulatory message in DM
 * manager.on('end', (giveaway, winners) => {
 *      winners.forEach((member) => {
 *          member.send('Congratulations, '+member.user.username+', you won: '+giveaway.prize);
 *      });
 * });
 */

module.exports = GiveawaysManager;
