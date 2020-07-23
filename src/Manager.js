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
    constructor(client, options) {
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
        /**
         * Whether the Discord.js library version is the v12 one
         * @type {boolean}
         */
        this.v12 = this.options.DJSlib === 'v12';
        this._init();

        this.client.on('raw', async (packet) => {
            if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
            const giveaway = this.giveaways.find((g) => g.messageID === packet.d.message_id);
            if (!giveaway) return;
            if (giveaway.ended) return;
            const guild = (this.v12 ? this.client.guilds.cache : this.client.guilds).get(packet.d.guild_id);
            if (!guild) return;
            const member =
                (this.v12 ? guild.members.cache : guild.members).get(packet.d.user_id) ||
                (await guild.members.fetch(packet.d.user_id).catch(() => {}));
            if (!member) return;
            const channel = (this.v12 ? guild.channels.cache : guild.channels).get(packet.d.channel_id);
            if (!channel) return;
            const message =
                (this.v12 ? channel.messages.cache : channel.messages).get(packet.d.message_id) ||
                (await channel.messages.fetch(packet.d.message_id));
            if (!message) return;
            const reaction = (this.v12 ? message.reactions.cache : message.reactions).get(
                giveaway.reaction || this.options.default.reaction
            );
            if (!reaction) return;
            if(reaction.emoji.name !== packet.d.emoji.name) return;
            if(reaction.emoji.id && reaction.emoji.id !== packet.d.emoji.id) return;
            if (packet.t === 'MESSAGE_REACTION_ADD') {
                this.emit('giveawayReactionAdded', giveaway, member, reaction);
            } else {
                this.emit('giveawayReactionRemoved', giveaway, member, reaction);
            }
        });
    }

    /**
     * Ends a giveaway. This method is automatically called when a giveaway ends.
     * @param {Discord.Snowflake} messageID The message ID of the giveaway
     * @returns {Promise<Discord.GuildMember[]>} The winners
     *
     * @example
     * manager.end("664900661003157510");
     */
    end(messageID) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            giveaway.end().then(resolve).catch(reject);
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
     *      prize: "Free Steam Key",
     *      // Giveaway will last 10 seconds
     *      time: 10000,
     *      // One winner
     *      winnerCount: 1,
     *      // Limit the giveaway to members who have the Nitro Boost role
     *      exemptMembers: (member) => !member.roles.some((r) => r.name === "Nitro Boost")
     * });
     */
    start(channel, options) {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) {
                return reject('The manager is not ready yet.');
            }
            if (!options.messages) {
                options.messages = defaultGiveawayMessages;
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
                hostedBy: options.hostedBy ? options.hostedBy.toString() : null,
                messages: options.messages,
                reaction: options.reaction,
                botsCanWin: options.botsCanWin,
                exemptPermissions: options.exemptPermissions,
                exemptMembers: options.exemptMembers,
                embedColor: options.embedColor,
                embedColorEnd: options.embedColorEnd
            });
            let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
            embed
                .setAuthor(giveaway.prize)
                .setColor(giveaway.embedColor)
                .setFooter(`${giveaway.winnerCount} ${giveaway.messages.winners}`)
                .setDescription(
                    `${options.messages.inviteToParticipate}\n${giveaway.content}\n${
                        giveaway.hostedBy ? giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : ''
                    }`
                )
                .setTimestamp(new Date(giveaway.endAt).toISOString());
            let message = await channel.send(options.messages.giveaway, { embed });
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
     * manager.reroll("664900661003157510");
     */
    reroll(messageID, options = {}) {
        return new Promise(async (resolve, reject) => {
            options = merge(defaultRerollOptions, options);
            let giveawayData = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveawayData) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            let giveaway = new Giveaway(this, giveawayData);
            giveaway.reroll(options).then((winners) => {
                this.emit('giveawayRerolled', giveaway, winners)
                resolve();
            }).catch(reject);
        });
    }

    /**
     * Edits a giveaway. The modifications will be applicated when the giveaway will be updated.
     * @param {Discord.Snowflake} messageID The message ID of the giveaway to edit
     * @param {GiveawayEditOptions} options The edit options
     * @returns {Promise<Giveaway>} The edited giveaway
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
     * @param {boolean} doNotDeleteMessage Whether the giveaway message shouldn't be deleted
     * @returns {Promise<void>}
     */
    delete(messageID, doNotDeleteMessage) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageID === messageID);
            if (!giveaway) {
                return reject('No giveaway found with ID ' + messageID + '.');
            }
            if (!giveaway.channel) {
                return reject('Unable to get the channel of the giveaway with message ID ' + giveaway.messageID + '.');
            }
            if (!doNotDeleteMessage) {
                await giveaway.fetchMessage().catch(() => {});
                if (giveaway.message) {
                    // Delete the giveaway message
                    giveaway.message.delete();
                }
            }
            this.giveaways = this.giveaways.filter((g) => g.messageID !== messageID);
            await this.deleteGiveaway(messageID);
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
                let giveaways = await JSON.parse(storageContent.toString());
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
    async editGiveaway(messageID, giveawayData) {
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
            let embed = this.v12 ? new Discord.MessageEmbed() : new Discord.RichEmbed();
            embed
                .setAuthor(giveaway.prize)
                .setColor(giveaway.embedColor)
                .setFooter(`${giveaway.winnerCount} ${giveaway.messages.winners}`)
                .setDescription(
                    `${giveaway.messages.inviteToParticipate}\n${giveaway.content}\n${
                        giveaway.hostedBy ? giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : ''
                    }`
                )
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
        const rawGiveaways = await this.getAllGiveaways();
        rawGiveaways.forEach((giveaway) => {
            this.giveaways.push(new Giveaway(this, giveaway));
        });
        setInterval(() => {
            if (this.client.readyAt) this._checkGiveaway.call(this);
        }, this.options.updateCountdownEvery);
        this.ready = true;
    }
}

/**
 * Emitted when a giveaway ends.
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
 * // This can be used to add features like removing the user reaction
 * manager.on('giveawayReactionAdded', (giveaway, member, reaction) => {
 *     const hasJoinedAnotherServer = client.guilds.cache.get('39803980830938').members.has(member.id);
 *     if(!hasJoinedAnotherServer){
 *          reaction.users.remove(member.user);
 *          member.send('You must join this server to participate to the giveaway: https://discord.gg/discord-api');
 *     }
 * });
 */

/**
 * Emitted when someone remove their reaction to a giveaway.
 * @event GiveawaysManager#giveawayReactionRemoved
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who remove their reaction giveaway
 * @param {Discord.MessageReaction} reaction The reaction to enter the giveaway
 *
 * @example
 * manager.on('giveawayReactionRemoved', (giveaway, member, reaction) => {
 *      return member.send('That's sad, you won\'t be able to win the super cookie!');
 * });
 */

/**
 * Emitted when a giveaway is rerolled.
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
