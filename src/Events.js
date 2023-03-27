/**
 * @typedef {Object} Events
 * @property {string} EndedGiveawayReactionAdded endedGiveawayReactionAdded
 * @property {string} GiveawayDeleted giveawayDeleted'
 * @property {string} GiveawayEnded giveawayEnded
 * @property {string} GiveawayMemberJoined giveawayMemberJoined
 * @property {string} GiveawayMemberLeft giveawayMemberLeft
 * @property {string} GiveawayRerolled giveawayRerolled
 */

// JSDoc for IntelliSense purposes
/**
 * @type {Events}
 * @ignore
 */
module.exports = {
    EndedGiveawayReactionAdded: 'endedGiveawayReactionAdded',
    GiveawayDeleted: 'giveawayDeleted',
    GiveawayEnded: 'giveawayEnded',
    GiveawayMemberJoined: 'giveawayMemberJoined',
    GiveawayMemberLeft: 'giveawayMemberLeft',
    GiveawayRerolled: 'giveawayRerolled'
};

/**
 * Emitted when someone reacted to an ended giveaway.
 * @event GiveawaysManager#endedGiveawayReactionAdded
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who reacted to the ended giveaway
 * @param {Discord.MessageReaction} reaction The reaction object
 *
 * @example
 * // This can be used to prevent new participants when giveaways with reactions get rerolled
 * manager.on('endedGiveawayReactionAdded', (giveaway, member, reaction) => {
 *      return reaction.users.remove(member.user);
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
 * Emitted when someone joined a giveaway.
 * @event GiveawaysManager#giveawayMemberJoined
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who joined the giveaway
 * @param {Discord.MessageReaction|Discord.ButtonInteraction} interaction The reaction to enter the giveaway
 *
 * @example
 * // This can be used to add features such as giveaway requirements
 * // Best used with the "exemptMembers" property of the giveaways
 * manager.on('giveawayMemberJoined', (giveaway, member, reaction) => {
 *     if (!member.roles.cache.get('123456789')) {
 *          const index = giveaway.entrantIds.indexOf(member.id);
            giveaway.entrantIds.splice(index, 1);
 *          member.send('You must have this role to participate in the giveaway: Staff');
 *     }
 * });
 * @example
 * // This can be used to add features such as giveaway requirements
 * // Best used with the "exemptMembers" property of the giveaways
 * manager.on('giveawayMemberJoined', (giveaway, member, reaction) => {
 *     if (!member.roles.cache.get('123456789')) {
 *          reaction.users.remove(member.user);
 *          member.send('You must have this role to participate in the giveaway: Staff');
 *     }
 * });
 */

/**
 * Emitted when someone left a giveaway.
 * @event GiveawaysManager#giveawayMemberLeft
 * @param {Giveaway} giveaway The giveaway instance
 * @param {Discord.GuildMember} member The member who remove their reaction giveaway
 * @param {Discord.MessageReaction} reaction The reaction to enter the giveaway
 *
 * @example
 * // This can be used to add features such as a leave message in DM
 * manager.on('giveawayMemberLeft', (giveaway, member, interaction) => {
 *      return member.send('That\'s sad, you won\'t be able to win the super cookie!');
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
