const { EventEmitter } = require('events');
const merge = require('deepmerge');
const serialize = require('serialize-javascript');
const { writeFile, readFile, access } = require('fs/promises');
const Discord = require('discord.js');
const {
    GiveawayMessages,
    GiveawayEditOptions,
    GiveawayData,
    GiveawayRerollOptions,
    GiveawaysManagerOptions,
    GiveawayStartOptions,
    PauseOptions
} = require('./Constants.js');
const Giveaway = require('./Giveaway.js');

/**
 * Giveaways Manager
 */
class GiveawaysManager extends EventEmitter {
    /**
     * @param {Discord.Client} client The Discord Client
     * @param {GiveawaysManagerOptions} [options] The manager options
     * @param {Boolean} [init=true] If the manager should start automatically. If set to "false", for example to create a delay, the manager can be started manually with "manager._init()".
     */
    constructor(client, options, init = true) {
        super();
        if (!client?.options) throw new Error(`Client is a required option. (val=${client})`);
        if (!new Discord.Intents(client.options.intents).has(Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS)) {
            throw new Error('Client is missing the "GUILD_MESSAGE_REACTIONS" intent.');
        }

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
        this.options = merge(GiveawaysManagerOptions, options || {});

        if (init) this._init();
    }

    /**
     * Generate an embed displayed when a giveaway is running (with the remaining time)
     * @param {Giveaway} giveaway The giveaway the embed needs to be generated for
     * @param {boolean} [lastChanceEnabled=false] Whether or not to include the last chance text
     * @returns {Discord.MessageEmbed} The generated embed
     */
    generateMainEmbed(giveaway, lastChanceEnabled = false) {
        const embed = new Discord.MessageEmbed();
        embed
            .setTitle(giveaway.prize)
            .setColor(
                giveaway.pauseOptions.isPaused && giveaway.pauseOptions.embedColor
                    ? giveaway.pauseOptions.embedColor
                    : lastChanceEnabled
                        ? giveaway.lastChance.embedColor
                        : giveaway.embedColor
            )
            .setFooter(
                `${giveaway.winnerCount} ${giveaway.messages.winners}${
                    typeof giveaway.messages.embedFooter === 'object'
                        ? giveaway.messages.embedFooter.text?.length > 0
                            ? ' • ' + giveaway.messages.embedFooter.text
                            : ''
                        : ' • ' + giveaway.messages.embedFooter
                }`,
                giveaway.messages.embedFooter.iconURL
            )
            .setDescription(
                (giveaway.pauseOptions.isPaused
                    ? giveaway.pauseOptions.content + '\n\n'
                    : lastChanceEnabled
                        ? giveaway.lastChance.content + '\n\n'
                        : '') +
                    giveaway.messages.inviteToParticipate +
                    '\n' +
                    giveaway.remainingTimeText +
                    (giveaway.hostedBy ? '\n' + giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            )
            .setThumbnail(giveaway.thumbnail);
        if (giveaway.endAt !== Infinity) embed.setTimestamp(new Date(giveaway.endAt).toISOString());
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
                (giveaway.hostedBy ? '\n' + giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            );
        };

        for (
            let i = 1;
            descriptionString(formattedWinners).length > 4096 ||
            giveaway.prize.length + giveaway.messages.endedAt.length + descriptionString(formattedWinners).length > 6000;
            i++
        ) formattedWinners = formattedWinners.substr(0, formattedWinners.lastIndexOf(', <@')) + `, ${i} more`;

        const embed = new Discord.MessageEmbed();
        embed
            .setTitle(giveaway.prize)
            .setColor(giveaway.embedColorEnd)
            .setFooter(giveaway.messages.endedAt, giveaway.messages.embedFooter.iconURL)
            .setDescription(descriptionString(formattedWinners))
            .setTimestamp(new Date(giveaway.endAt).toISOString())
            .setThumbnail(giveaway.thumbnail);
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
            .setTitle(giveaway.prize)
            .setColor(giveaway.embedColorEnd)
            .setFooter(giveaway.messages.endedAt, giveaway.messages.embedFooter.iconURL)
            .setDescription(
                giveaway.messages.noWinner +
                    (giveaway.hostedBy ? '\n' + giveaway.messages.hostedBy.replace('{user}', giveaway.hostedBy) : '')
            )
            .setTimestamp(new Date(giveaway.endAt).toISOString())
            .setThumbnail(giveaway.thumbnail);
        return embed;
    }

    /**
     * Ends a giveaway. This method is automatically called when a giveaway ends.
     * @param {Discord.Snowflake} messageId The message Id of the giveaway
     * @returns {Promise<Discord.GuildMember[]>} The winners
     *
     * @example
     * manager.end('664900661003157510');
     */
    end(messageId) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');

            giveaway
                .end()
                .then((winners) => {
                    this.emit('giveawayEnded', giveaway, winners);
                    resolve(winners);
                })
                .catch(reject);
        });
    }

    /**
     * Starts a new giveaway
     *
     * @param {Discord.TextChannel|Discord.NewsChannel|Discord.ThreadChannel} channel The channel in which the giveaway will be created
     * @param {GiveawayStartOptions} options The options for the giveaway
     *
     * @returns {Promise<Giveaway>} The created giveaway.
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
            if (!this.ready) return reject('The manager is not ready yet.');
            if (!channel?.id || !channel.isText() || channel.deleted) {
                return reject(`channel is not a valid text based channel. (val=${channel})`);
            }
            if (
                channel.isThread() && !channel .permissionsFor(this.client.user)?.has([
                    (channel.locked || !channel.joined && channel.type === 'GUILD_PRIVATE_THREAD')
                        ? Discord.Permissions.FLAGS.MANAGE_THREADS
                        : Discord.Permissions.FLAGS.SEND_MESSAGES
                ])
            ) return reject(`The manager is unable to send messages in the provided ThreadChannel. (id=${channel.id})`);
            if (isNaN(options.time) || typeof options.time !== 'number' || options.time < 1) {
                return reject(`options.time is not a positive number. (val=${options.time})`);
            }
            if (typeof options.prize !== 'string' || options.prize.length > 256) {
                return reject(`options.prize is not a string or longer than 256 characters. (val=${options.prize})`);
            }
            if (!Number.isInteger(options.winnerCount) || options.winnerCount < 1) {
                return reject(`options.winnerCount is not a positive integer. (val=${options.winnerCount})`);
            }

            const validateEmbedColor = async (embedColor) => {
                try {
                    embedColor = Discord.Util.resolveColor(embedColor);
                    if (!isNaN(embedColor) && typeof embedColor === 'number') return true;
                } catch {
                    return false;
                }
            };

            const giveaway = new Giveaway(this, {
                startAt: Date.now(),
                endAt: Date.now() + options.time,
                winnerCount: options.winnerCount,
                channelId: channel.id,
                guildId: channel.guildId,
                prize: options.prize,
                hostedBy: options.hostedBy ? options.hostedBy.toString() : undefined,
                messages:
                    (options.messages && typeof options.messages === 'object')
                        ? merge(GiveawayMessages, options.messages)
                        : GiveawayMessages,
                thumbnail: typeof options.thumbnail === 'string' ? options.thumbnail : undefined,
                reaction: options.reaction || undefined,
                botsCanWin: typeof options.botsCanWin === 'boolean' ? options.botsCanWin : undefined,
                exemptPermissions: Array.isArray(options.exemptPermissions) ? options.exemptPermissions : undefined,
                exemptMembers: typeof options.exemptMembers === 'function' ? options.exemptMembers : undefined,
                bonusEntries: Array.isArray(options.bonusEntries) ? options.bonusEntries.filter((elem) => typeof elem === 'object') : undefined,
                embedColor: validateEmbedColor(options.embedColor) ? options.embedColor : undefined,
                embedColorEnd: validateEmbedColor(options.embedColorEnd) ? options.embedColorEnd : undefined,
                extraData: options.extraData,
                lastChance: (options.lastChance && typeof options.lastChance === 'object') ? options.lastChance : undefined,
                pauseOptions: (options.pauseOptions && typeof options.pauseOptions === 'object') ? options.pauseOptions : undefined
            });

            const embed = this.generateMainEmbed(giveaway);
            const message = await channel.send({ content: giveaway.messages.giveaway, embeds: [embed] });
            message.react(giveaway.reaction);
            giveaway.messageId = message.id;
            this.giveaways.push(giveaway);
            await this.saveGiveaway(giveaway.messageId, giveaway.data);
            resolve(giveaway);
        });
    }

    /**
     * Choose new winner(s) for the giveaway
     * @param {Discord.Snowflake} messageId The message Id of the giveaway to reroll
     * @param {GiveawayRerollOptions} [options] The reroll options
     * @returns {Promise<Discord.GuildMember[]>} The new winners
     *
     * @example
     * manager.reroll('664900661003157510');
     */
    reroll(messageId, options = {}) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');

            giveaway
                .reroll(options)
                .then((winners) => {
                    this.emit('giveawayRerolled', giveaway, winners);
                    resolve(winners);
                })
                .catch(reject);
        });
    }

    /**
     * Pauses a giveaway.
     * @param {Discord.Snowflake} messageId The message Id of the giveaway to pause.
     * @param {PauseOptions} [options=giveaway.pauseOptions] The pause options.
     * @returns {Promise<Giveaway>} The paused giveaway.
     *
     * @example
     * manager.pause('664900661003157510');
     */
    pause(messageId, options = {}) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');
            giveaway.pause(options).then(resolve).catch(reject);
        });
    }

    /**
     * Unpauses a giveaway.
     * @param {Discord.Snowflake} messageId The message Id of the giveaway to unpause.
     * @returns {Promise<Giveaway>} The unpaused giveaway.
     *
     * @example
     * manager.unpause('664900661003157510');
     */
    unpause(messageId) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');
            giveaway.unpause().then(resolve).catch(reject);
        });
    }

    /**
     * Edits a giveaway. The modifications will be applicated when the giveaway will be updated.
     * @param {Discord.Snowflake} messageId The message Id of the giveaway to edit
     * @param {GiveawayEditOptions} [options={}] The edit options
     * @returns {Promise<Giveaway>} The edited giveaway
     *
     * @example
     * manager.edit('664900661003157510', {
     *      newWinnerCount: 2,
     *      newPrize: 'Something new!',
     *      addTime: -10000 // The giveaway will end 10 seconds earlier
     * });
     */
    edit(messageId, options = {}) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');
            giveaway.edit(options).then(resolve).catch(reject);
        });
    }

    /**
     * Deletes a giveaway. It will delete the message and all the giveaway data.
     * @param {Discord.Snowflake} messageId  The message Id of the giveaway
     * @param {boolean} [doNotDeleteMessage=false] Whether the giveaway message shouldn't be deleted
     * @returns {Promise<Giveaway>}
     */
    delete(messageId, doNotDeleteMessage = false) {
        return new Promise(async (resolve, reject) => {
            const giveaway = this.giveaways.find((g) => g.messageId === messageId);
            if (!giveaway) return reject('No giveaway found with message Id ' + messageId + '.');

            if (!doNotDeleteMessage) {
                await giveaway.fetchMessage().catch(() => {});
                giveaway.message?.delete();
            }
            this.giveaways = this.giveaways.filter((g) => g.messageId !== messageId);
            await this.deleteGiveaway(messageId);
            this.emit('giveawayDeleted', giveaway);
            resolve(giveaway);
        });
    }

    /**
     * Delete a giveaway from the database
     * @param {Discord.Snowflake} messageId The message Id of the giveaway to delete
     * @returns {Promise<boolean>}
     */
    async deleteGiveaway(messageId) {
        await writeFile(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data), (_, v) => typeof v === 'bigint' ? serialize(v) : v),
            'utf-8'
        );
        this.refreshStorage();
        return true;
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
        const storageExists = await access(this.options.storage).then(() => true).catch(() => false);
        // If it doesn't exists
        if (!storageExists) {
            // Create the file with an empty array
            await writeFile(this.options.storage, '[]', 'utf-8');
            return [];
        } else {
            // If the file exists, read it
            const storageContent = await readFile(this.options.storage);
            try {
                const giveaways = await JSON.parse(storageContent.toString(), (_, v) => (typeof v === 'string' && /BigInt\("(-?\d+)"\)/.test(v)) ? eval(v) : v);
                if (Array.isArray(giveaways)) return giveaways;
                else {
                    console.log(storageContent, giveaways);
                    throw new SyntaxError('The storage file is not properly formatted (giveaways is not an array).');
                }
            } catch (err) {
                if (err.message === 'Unexpected end of JSON input') {
                    throw new SyntaxError('The storage file is not properly formatted (Unexpected end of JSON input).');
                } else throw err;
            }
        }
    }

    /**
     * Edit the giveaway in the database
     * @ignore
     * @param {Discord.Snowflake} messageId The message Id identifying the giveaway
     * @param {GiveawayData} giveawayData The giveaway data to save
     */
    async editGiveaway(_messageId, _giveawayData) {
        await writeFile(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data), (_, v) => typeof v === 'bigint' ? serialize(v) : v),
            'utf-8'
        );
        this.refreshStorage();
        return;
    }

    /**
     * Save the giveaway in the database
     * @ignore
     * @param {Discord.Snowflake} messageId The message Id identifying the giveaway
     * @param {GiveawayData} giveawayData The giveaway data to save
     */
    async saveGiveaway(messageId, giveawayData) {
        await writeFile(
            this.options.storage,
            JSON.stringify(this.giveaways.map((giveaway) => giveaway.data), (_, v) => typeof v === 'bigint' ? serialize(v) : v),
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
            if (giveaway.ended) {
                if (
                    !isNaN(this.options.endedGiveawaysLifetime) && typeof this.options.endedGiveawaysLifetime === 'number' &&
                    giveaway.endAt + this.options.endedGiveawaysLifetime <= Date.now()
                ) {
                    this.giveaways = this.giveaways.filter((g) => g.messageId !== giveaway.messageId);
                    await this.deleteGiveaway(giveaway.messageId);
                }
                return;
            }
            if (giveaway.remainingTime <= 0) return this.end(giveaway.messageId).catch(() => {});
            await giveaway.fetchMessage().catch(() => {});
            if (!giveaway.message?.channel) return;
            if (giveaway.pauseOptions.isPaused) {
                if (
                    (isNaN(giveaway.pauseOptions.unPauseAfter) || typeof giveaway.pauseOptions.unPauseAfter !== 'number') &&
                    (isNaN(giveaway.pauseOptions.durationAfterPause) || typeof giveaway.pauseOptions.durationAfterPause !== 'number')
                ) {
                    giveaway.options.pauseOptions.durationAfterPause = giveaway.remainingTime;
                    giveaway.endAt = Infinity;
                    await this.editGiveaway(giveaway.messageId, giveaway.data);
                }
                if (
                    !isNaN(giveaway.pauseOptions.unPauseAfter) && typeof giveaway.pauseOptions.unPauseAfter === 'number' &&
                    Date.now() < giveaway.pauseOptions.unPauseAfter
                ) this.unpause(giveaway.messageId).catch(() => {});
            }
            const embed = this.generateMainEmbed(giveaway, giveaway.lastChance.enabled && giveaway.remainingTime < giveaway.lastChance.threshold);
            giveaway.message.edit({ content: giveaway.messages.giveaway, embeds: [embed] }).catch(() => {});
            if (giveaway.remainingTime < this.options.updateCountdownEvery) {
                setTimeout(() => this.end.call(this, giveaway.messageId), giveaway.remainingTime);
            }
            if (giveaway.lastChance.enabled && (giveaway.remainingTime - giveaway.lastChance.threshold) < this.options.updateCountdownEvery) {
                setTimeout(() => {
                    const embed = this.generateMainEmbed(giveaway, true);
                    giveaway.message.edit({ content: giveaway.messages.giveaway, embeds: [embed] }).catch(() => {});
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
        const giveaway = this.giveaways.find((g) => g.messageId === packet.d.message_id);
        if (!giveaway) return;
        if (giveaway.ended && packet.t === 'MESSAGE_REACTION_REMOVE') return;
        const guild = this.client.guilds.cache.get(packet.d.guild_id) || (await this.client.guilds.fetch(packet.d.guild_id).catch(() => {}));
        if (!guild || !guild.available) return;
        if (packet.d.user_id === this.client.user.id) return;
        const member = await guild.members.fetch(packet.d.user_id).catch(() => {});
        if (!member) return;
        const channel = await this.client.channels.fetch(packet.d.channel_id).catch(() => {});
        if (!channel) return;
        const message = await channel.messages.fetch(packet.d.message_id).catch(() => {});
        if (!message) return;
        const reactions = message.reactions.cache;
        const reaction =
            reactions.find((r) => r.emoji.name === Discord.Util.resolvePartialEmoji(giveaway.reaction)?.name) ||
            reactions.get(Discord.Util.resolvePartialEmoji(giveaway.reaction)?.id);
        if (!reaction) return;
        if (reaction.emoji.name !== packet.d.emoji.name) return;
        if (reaction.emoji.id && reaction.emoji.id !== packet.d.emoji.id) return;
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            if (giveaway.ended) return this.emit('endedGiveawayReactionAdded', giveaway, member, reaction);
            this.emit('giveawayReactionAdded', giveaway, member, reaction);
        } else this.emit('giveawayReactionRemoved', giveaway, member, reaction);
    }

    /**
     * Inits the manager
     * @ignore
     * @private
     */
    async _init() {
        const rawGiveaways = await this.getAllGiveaways();
        rawGiveaways.forEach((giveaway) => this.giveaways.push(new Giveaway(this, giveaway)));
        setInterval(() => {
            if (this.client.readyAt) this._checkGiveaway.call(this);
        }, this.options.updateCountdownEvery);
        this.ready = true;

        if (!isNaN(this.options.endedGiveawaysLifetime) && typeof this.options.endedGiveawaysLifetime === 'number') {
            const endedGiveaways = this.giveaways.filter(
                (g) => g.ended && g.endAt + this.options.endedGiveawaysLifetime <= Date.now()
            );
            this.giveaways = this.giveaways.filter(
                (g) => !endedGiveaways.map((giveaway) => giveaway.messageId).includes(g.messageId)
            );
            for (const giveaway of endedGiveaways) await this.deleteGiveaway(giveaway.messageId);
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
 *          member.send('Congratulations, ' + member.user.username + ', you won: ' + giveaway.prize);
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
 * // This can be used to add features such as removing reactions of members when they do not have a specific role (= giveaway requirements)
 * // Best used with the "exemptMembers" property of the giveaways
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
 * // This can be used to add features such as a member-left-giveaway message per DM
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
 * // This can be used to add features such as a congratulatory message per DM
 * manager.on('giveawayRerolled', (giveaway, winners) => {
 *      winners.forEach((member) => {
 *          member.send('Congratulations, ' + member.user.username + ', you won: ' + giveaway.prize);
 *      });
 * });
 */

/**
 * Emitted when a giveaway was deleted.
 * @event GiveawaysManager#giveawayDeleted
 * @param {Giveaway} giveaway The giveaway instance
 *
 * @example
 * // This can be used to add logs
 * manager.on('giveawayDeleted', (giveaway) => {
 *      console.log('Giveaway with message Id ' + giveaway.messageId + ' was deleted.')
 * });
 */

module.exports = GiveawaysManager;
