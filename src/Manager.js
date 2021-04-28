const { EventEmitter } = require('events');
const merge = require('deepmerge');
const { writeFile, readFile, exists } = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const Discord = require('discord.js');
const {
    defaultGiveawayMessages,
    defaultManagerOptions,
    defaultRerollOptions,
    GiveawayEditOptions,
    GiveawayData,
    GiveawayRerollOptions,
    GiveawaysManagerOptions,
    GiveawayStartOptions
} = require('./Constants.js');
const Giveaway = require('./Giveaway.js');

/**
 * Giveaways Manager
 */
class GiveawaysManager extends EventEmitter {
    /**
     * @param {Discord.Client} client The Discord Client
     * @param {GiveawaysManagerOptions} options The manager options
     */
    constructor(client, options, init = true) {
        super();
        if (!client) throw new Error('Client is a required option.');
        /**
         * The Discord Client
         * @type {Discord.Client}
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
        this.options = merge(defaultManagerOptions, options);
        if (init) this._init();
    }

    /**
     * Generate an embed displayed when a giveaway is running (with the remaining time)
     * @param {Giveaway} giveaway The giveaway the embed needs to be generated for
     * @param {boolean} lastChanceEnabled Whether or not to include the last chance text
     * @returns {Discord.MessageEmbed} The generated embed
     */
    generateMainEmbed(giveaway, lastChanceEnabled) {
        const embed = new Discord.MessageEmbed();
        embed
            .setAuthor(giveaway.prize)
            .setColor(lastChanceEnabled ? giveaway.lastChance.embedColor : giveaway.embedColor)
            .setFooter(`${giveaway.winnerCount} ${giveaway.messages.winners} • ${giveaway.messages.embedFooter}`)
            .setDescription(
                (lastChanceEnabled ? giveaway.lastChance.content + '\n\n' : '') +
                giveaway.messages.inviteToParticipate +
                    '\n' +
                    giveaway.remainingTimeText +
                    '\n' +
                    (giveaway.hostedBy ? giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            )
            .setTimestamp(new Date(giveaway.endAt).toISOString());
        return embed;
    }

    /**
     * Generate an embed displayed when a giveaway is ended (with the winners list)
     * @param {Giveaway} giveaway The giveaway the embed needs to be generated for
     * @param {Discord.GuildMember[]} winners The giveaway winners
     * @returns {Discord.MessageEmbed} The generated embed
     */
    generateEndEmbed(giveaway, winners) {
        let formattedWinners = winners.map((w) => `<@${w.id}>`).join(', ');

        const descriptionString = (formattedWinners) => {
            const winnersString =
                giveaway.messages.winners.substr(0, 1).toUpperCase() +
                giveaway.messages.winners.substr(1, giveaway.messages.winners.length) +
                ': ' +
                formattedWinners;

            return (
                winnersString +
                '\n' +
                (giveaway.hostedBy ? giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            );
        };

        for (
            let i = 1;
            descriptionString(formattedWinners).length > 2048 ||
            giveaway.prize.length + giveaway.messages.endedAt.length + descriptionString(formattedWinners).length > 6000;
            i++
        ) formattedWinners = formattedWinners.substr(0, formattedWinners.lastIndexOf(', <@')) + `, ${i} more`;

        const embed = new Discord.MessageEmbed();
        embed
            .setAuthor(giveaway.prize)
            .setColor(giveaway.embedColorEnd)
            .setFooter(giveaway.messages.endedAt)
            .setDescription(descriptionString(formattedWinners))
            .setTimestamp(new Date(giveaway.endAt).toISOString());
        return embed;
    }

    /**
     * Generate an embed displayed when a giveaway is ended and when there is no valid participant
     * @param {Giveaway} giveaway The giveaway the embed needs to be generated for
     * @returns {Discord.MessageEmbed} The generated embed
     */
    generateNoValidParticipantsEndEmbed(giveaway) {
        const embed = new Discord.MessageEmbed();
        embed
            .setAuthor(giveaway.prize)
            .setColor(giveaway.embedColorEnd)
            .setFooter(giveaway.messages.endedAt)
            .setDescription(
                giveaway.messages.noWinner +
                    '\n' +
                    (giveaway.hostedBy ? giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            )
            .setTimestamp(new Date(giveaway.endAt).toISOString());
        return embed;
    }

    /**
     * Ends a giveaway. This method is automatically called when a giveaway ends.
     * @param {Discord.Snowflake} messageID The message ID of the giveaway
     * @returns {Promise<Discord.GuildMember[]>} The winners
     *
     * @example
     * manager.end('664900661003157510');
     */
    end(messageID) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            giveaway
                .end()
                .then((winners) => {
                    this.emit('giveawayEnded', giveaway, winners);
                    resolve();
                })
                .catch(reject);
        });
    }

    /**
     * Starts a new giveaway
     *
     * @param {Discord.TextChannel} channel The channel in which the giveaway will be created
     * @param {GiveawayStartOptions} options The options for the giveaway
     *
     * @returns {Promise<Giveaway>}
     *
     * @example
     * manager.start(message.channel, {
     *      prize: 'Free Steam Key',
     *      // Giveaway will last 10 seconds
     *      time: 10000,
     *      // One winner
     *      winnerCount: 1,
     *      // Limit the giveaway to members who have the "Nitro Boost" role
     *      exemptMembers: (member) => !member.roles.cache.some((r) => r.name === 'Nitro Boost')
     * });
     */
    start(channel, options) {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) {
                return reject('The manager is not ready yet.');
            }
            options.messages = (options.messages && typeof options.messages === 'object')
                ? merge(defaultGiveawayMessages, options.messages)
                : defaultGiveawayMessages;
            if (!channel || !channel.id) {
                return reject(`channel is not a valid guildchannel. (val=${channel})`);
            }
            if (!options.time || isNaN(options.time)) {
                return reject(`options.time is not a number. (val=${options.time})`);
            }
            if (typeof options.prize !== 'string') {
                return reject(`options.prize is not a string. (val=${options.prize})`);
            }
            if (!Number.isInteger(options.winnerCount) || options.winnerCount < 1) {
                return reject(`options.winnerCount is not a positive integer. (val=${options.winnerCount})`);
            }
            const giveaway = new Giveaway(this, {
                startAt: Date.now(),
                endAt: Date.now() + options.time,
                winnerCount: options.winnerCount,
                winnerIDs: [],
                channelID: channel.id,
                guildID: channel.guild.id,
                ended: false,
                prize: options.prize,
                hostedBy: options.hostedBy ? options.hostedBy.toString() : null,
                messages: options.messages,
                reaction: options.reaction,
                botsCanWin: options.botsCanWin,
                exemptPermissions: Array.isArray(options.exemptPermissions) ? options.exemptPermissions : [],
                exemptMembers: options.exemptMembers,
                bonusEntries: (Array.isArray(options.bonusEntries) && options.bonusEntries.every((elem) => typeof elem === 'object')) ? options.bonusEntries : [],
                embedColor: options.embedColor,
                embedColorEnd: options.embedColorEnd,
                extraData: options.extraData,
                lastChance: options.lastChance
            });
            const embed = this.generateMainEmbed(giveaway);
            const message = await channel.send(giveaway.messages.giveaway, { embed });
            message.react(giveaway.reaction);
            giveaway.messageID = message.id;
            this.giveaways.push(giveaway);
            await this.saveGiveaway(giveaway.messageID, giveaway.data);
            resolve(giveaway);
        });
    }

    /**
     * Choose new winner(s) for the giveaway
     * @param {Discord.Snowflake} messageID The message ID of the giveaway to reroll
     * @param {GiveawayRerollOptions} options The reroll options
     * @returns {Promise<Discord.GuildMember[]>} The new winners
     *
     * @example
     * manager.reroll('664900661003157510');
     */
    reroll(messageID, options = {}) {
        return new Promise(async (resolve, reject) => {
            options = merge(defaultRerollOptions, options);
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            giveaway
                .reroll(options)
                .then((winners) => {
                    this.emit('giveawayRerolled', giveaway, winners);
                    resolve();
                })
                .catch(reject);
        });
    }

    /**
     * Edits a giveaway. The modifications will be applicated when the giveaway will be updated.
     * @param {Discord.Snowflake} messageID The message ID of the giveaway to edit
     * @param {GiveawayEditOptions} options The edit options
     * @returns {Promise<Giveaway>} The edited giveaway
     *
     * @example
     * manager.edit('664900661003157510', {
     *      newWinnerCount: 2,
     *      newPrize: 'Something new!',
     *      addTime: -10000 // The giveaway will end 10 seconds earlier
     * });
     */
    edit(messageID, options = {}) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            giveaway.edit(options).then(resolve).catch(reject);
        });
    }

    /**
     * Deletes a giveaway. It will delete the message and all the giveaway data.
     * @param {Discord.Snowflake} messageID  The message ID of the giveaway
     * @param {boolean} [doNotDeleteMessage=false] Whether the giveaway message shouldn't be deleted
     * @returns {Promise<void>}
     */
    delete(messageID, doNotDeleteMessage = false) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            if (!giveaway.channel && !doNotDeleteMessage) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            if (!doNotDeleteMessage) {
                await giveaway.fetchMessage().catch(() => {});
                if (giveaway.message) giveaway.message.delete();
            }
            this.giveaways = this.giveaways.filter((g) => g.messageID !== messageID);
            await this.deleteGiveaway(messageID);
            this.emit('giveawayDeleted', giveaway);
            resolve();
        });
    }

    /**
     * Delete a giveaway from the database
     * @param {Discord.Snowflake} messageID The message ID of the giveaway to delete
     * @returns {Promise<void>}
     */
    async deleteGiveaway(messageID) {
        await writeFileAsync(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
            'utf-8'
        );
        this.refreshStorage();
        return;
    }

    /**
     * Refresh the cache to support shards.
     * @ignore
     */
    async refreshStorage() {
        return true;
    }

    /**
     * Gets the giveaways from the storage file, or create it
     * @ignore
     * @returns {Promise<GiveawayData[]>}
     */
    async getAllGiveaways() {
        // Whether the storage file exists, or not
        const storageExists = await existsAsync(this.options.storage);
        // If it doesn't exists
        if (!storageExists) {
            // Create the file with an empty array
            await writeFileAsync(this.options.storage, '[]', 'utf-8');
            return [];
        } else {
            // If the file exists, read it
            const storageContent = await readFileAsync(this.options.storage);
            try {
                const giveaways = await JSON.parse(storageContent.toString());
                if (Array.isArray(giveaways)) {
                    return giveaways;
                } else {
                    console.log(storageContent, giveaways);
                    throw new SyntaxError('The storage file is not properly formatted (giveaways is not an array).');
                }
            } catch (e) {
                if (e.message === 'Unexpected end of JSON input') {
                    throw new SyntaxError('The storage file is not properly formatted (Unexpected end of JSON input).');
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Edit the giveaway in the database
     * @ignore
     * @param {Discord.Snowflake} messageID The message ID identifying the giveaway
     * @param {GiveawayData} giveawayData The giveaway data to save
     */
    async editGiveaway(_messageID, _giveawayData) {
        await writeFileAsync(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
            'utf-8'
        );
        this.refreshStorage();
        return;
    }

    /**
     * Save the giveaway in the database
     * @ignore
     * @param {Discord.Snowflake} messageID The message ID identifying the giveaway
     * @param {GiveawayData} giveawayData The giveaway data to save
     */
    async saveGiveaway(messageID, giveawayData) {
        await writeFileAsync(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data)),
            'utf-8'
        );
        this.refreshStorage();
        return;
    }

    /**
     * Checks each giveaway and update it if needed
     * @ignore
     * @private
     */
    _checkGiveaway() {
        if (this.giveaways.length <= 0) return;
        this.giveaways.forEach(async (giveaway) => {
            if (giveaway.ended) return;
            if (!giveaway.channel) return;
            if (giveaway.remainingTime <= 0) {
                return this.end(giveaway.messageID).catch(() => {});
            }
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message) {
                giveaway.ended = true;
                await this.editGiveaway(giveaway.messageID, giveaway.data);
                return;
            }
            const embed = this.generateMainEmbed(giveaway, giveaway.lastChance.enabled && giveaway.remainingTime < giveaway.lastChance.threshold);
            giveaway.message.edit(giveaway.messages.giveaway, { embed }).catch(() => {});
            if (giveaway.remainingTime < this.options.updateCountdownEvery) {
                setTimeout(() => this.end.call(this, giveaway.messageID), giveaway.remainingTime);
            }
            if (giveaway.lastChance.enabled && (giveaway.remainingTime - giveaway.lastChance.threshold) < this.options.updateCountdownEvery) {
                setTimeout(() => {
                    const embed = this.generateMainEmbed(giveaway, true);
                    giveaway.message.edit(giveaway.messages.giveaway, { embed }).catch(() => {});
                }, giveaway.remainingTime - giveaway.lastChance.threshold);
            }
        });
    }

    /**
     * @ignore
     * @param {any} packet 
     */
    async _handleRawPacket(packet) {
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
        const giveaway = this.giveaways.find((g) => g.messageID === packet.d.message_id);
        if (!giveaway) return;
        if (giveaway.ended && packet.t === 'MESSAGE_REACTION_REMOVE') return;
        const guild = this.client.guilds.cache.get(packet.d.guild_id);
        if (!guild) return;
        if (packet.d.user_id === this.client.user.id) return;
        const member =
            guild.members.cache.get(packet.d.user_id) ||
            (await guild.members.fetch(packet.d.user_id).catch(() => {}));
        if (!member) return;
        const channel = guild.channels.cache.get(packet.d.channel_id);
        if (!channel) return;
        const message =
            channel.messages.cache.get(packet.d.message_id) ||
            (await channel.messages.fetch(packet.d.message_id));
        if (!message) return;
        const reaction = message.reactions.cache.get(giveaway.reaction);
        if (!reaction) return;
        if (reaction.emoji.name !== packet.d.emoji.name) return;
        if (reaction.emoji.id && reaction.emoji.id !== packet.d.emoji.id) return;
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            if (giveaway.ended) return this.emit('endedGiveawayReactionAdded', giveaway, member, reaction);
            this.emit('giveawayReactionAdded', giveaway, member, reaction);
        } else {
            this.emit('giveawayReactionRemoved', giveaway, member, reaction);
        }
    }

    /**
     * Inits the manager
     * @ignore
     * @private
     */
    async _init() {
        const rawGiveaways = await this.getAllGiveaways();
        rawGiveaways.forEach((giveaway) => {
            this.giveaways.push(new Giveaway(this, giveaway));
        });
        setInterval(() => {
            if (this.client.readyAt) this._checkGiveaway.call(this);
        }, this.options.updateCountdownEvery);
        this.ready = true;
        if (!isNaN(this.options.endedGiveawaysLifetime) && typeof this.options.endedGiveawaysLifetime === 'number') {
            const endedGiveaways = this.giveaways.filter(
                (g) => g.ended && g.endAt + this.options.endedGiveawaysLifetime <= Date.now()
            );
            this.giveaways = this.giveaways.filter(
                (g) => !endedGiveaways.map((giveaway) => giveaway.messageID).includes(g.messageID)
            );
            for (const giveaway of endedGiveaways) {
                await this.deleteGiveaway(giveaway.messageID);
            }
        }

        this.client.on('raw', (packet) => this._handleRawPacket(packet));
    }
}

/**
 * Emitted when a giveaway ended.
 * @event GiveawaysManager#giveawayEnded
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember[]} winners The giveaway winners
 *
 * @example
 * // This can be used to add features such as a congratulatory message in DM
 * manager.on('giveawayEnded', (giveaway, winners) => {
 *      winners.forEach((member) => {
 *          member.send('Congratulations, '+member.user.username+', you won: '+giveaway.prize);
 *      });
 * });
 */

/**
 * Emitted when someone entered a giveaway.
 * @event GiveawaysManager#giveawayReactionAdded
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who entered the giveaway
 * @param {Discord.MessageReaction} reaction The reaction to enter the giveaway
 *
 * @example
 * // This can be used to add features like removing reactions of members when they do not have a specific role (such as giveaway requirements). Best used with the `exemptMembers` property of the giveaways. 
 * manager.on('giveawayReactionAdded', (giveaway, member, reaction) => {
 *     if (!member.roles.cache.get('123456789')) {
 *          reaction.users.remove(member.user);
 *          member.send('You must have this role to participate in the giveaway: Staff');
 *     }
 * });
 */

/**
 * Emitted when someone removed their reaction to a giveaway.
 * @event GiveawaysManager#giveawayReactionRemoved
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who remove their reaction giveaway
 * @param {Discord.MessageReaction} reaction The reaction to enter the giveaway
 *
 * @example
 * // This can be used to add features such as a member-left-giveaway message in DM
 * manager.on('giveawayReactionRemoved', (giveaway, member, reaction) => {
 *      return member.send('That\'s sad, you won\'t be able to win the super cookie!');
 * });
 */

/**
 * Emitted when someone reacted to a ended giveaway.
 * @event GiveawaysManager#endedGiveawayReactionAdded
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who reacted to the ended giveaway
 * @param {Discord.MessageReaction} reaction The reaction to enter the giveaway
 *
 * @example
 * // This can be used to prevent new participants when giveaways get rerolled
 * manager.on('endedGiveawayReactionAdded', (giveaway, member, reaction) => {
 *      return reaction.users.remove(member.user);
 * });
 */

/**
 * Emitted when a giveaway was rerolled.
 * @event GiveawaysManager#giveawayRerolled
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember[]} winners The winners of the giveaway
 *
 * @example
 * // This can be used to add features such as a congratulatory message in DM
 * manager.on('giveawayRerolled', (giveaway, winners) => {
 *      winners.forEach((member) => {
 *          member.send('Congratulations, '+member.user.username+', you won: '+giveaway.prize);
 *      });
 * });
 */

module.exports = GiveawaysManager;
