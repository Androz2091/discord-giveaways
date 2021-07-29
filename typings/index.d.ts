declare module 'discord-giveaways' {
    import { EventEmitter } from 'events';
    import {
        Client,
        PermissionResolvable,
        ColorResolvable,
        EmojiIdentifierResolvable,
        User,
        Snowflake,
        GuildMember,
        TextChannel,
        MessageReaction,
        Message
    } from 'discord.js';

    export const version: string;
    export class GiveawaysManager extends EventEmitter {
        constructor(client: Client, options?: GiveawaysManagerOptions, init?: boolean);

        public client: Client;
        public giveaways: Giveaway[];
        public options: GiveawaysManagerOptions;
        public ready: boolean;

        public delete(messageID: Snowflake, doNotDeleteMessage?: boolean): Promise<boolean>;
        public deleteGiveaway(messageID: Snowflake): Promise<boolean>;
        public edit(messageID: Snowflake, options: GiveawayEditOptions): Promise<Giveaway>;
        public end(messageID: Snowflake): Promise<GuildMember[]>;
        public reroll(messageID: Snowflake, options?: GiveawayRerollOptions): Promise<GuildMember[]>;
        public start(channel: TextChannel, options: GiveawayStartOptions): Promise<Giveaway>;
        public pause(messageID: Snowflake, options: PauseOptions): Promise<Giveaway>;
        public unpause(messageID: Snowflake): Promise<Giveaway>;
        public on<K extends keyof GiveawaysManagerEvents>(
            event: K,
            listener: (...args: GiveawaysManagerEvents[K]) => void
        ): this;

        public once<K extends keyof GiveawaysManagerEvents>(
            event: K,
            listener: (...args: GiveawaysManagerEvents[K]) => void
        ): this;

        public emit<K extends keyof GiveawaysManagerEvents>(event: K, ...args: GiveawaysManagerEvents[K]): boolean;
    }
    interface BonusEntry {
        bonus(member?: GuildMember): number | Promise<number>;
        cumulative?: boolean;
    }
    interface LastChanceOptions {
        enabled?: boolean;
        embedColor?: ColorResolvable;
        content?: string;
        threshold?: number;
    }
    interface PauseOptions {
        isPaused: boolean;
        content: string;
        unPauseAfter: number;
        embedColor: ColorResolvable;
        durationAfterPause: number;
    }
    interface GiveawaysManagerOptions {
        storage?: string;
        updateCountdownEvery?: number;
        endedGiveawaysLifetime?: number;
        hasGuildMembersIntent?: boolean;
        default?: {
            botsCanWin?: boolean,
            exemptPermissions?: PermissionResolvable[],
            exemptMembers?: (member?: GuildMember) => boolean | Promise<boolean>,
            embedColor?: ColorResolvable,
            embedColorEnd?: ColorResolvable,
            reaction?: EmojiIdentifierResolvable,
            lastChance?: LastChanceOptions;
        };
    }
    interface GiveawayStartOptions {
        time: number;
        winnerCount: number;
        prize: string;
        hostedBy?: User;
        botsCanWin?: boolean;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: (member?: GuildMember) => boolean | Promise<boolean>;
        bonusEntries?: BonusEntry[];
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        reaction?: EmojiIdentifierResolvable;
        messages?: GiveawaysMessages;
        thumbnail?: string;
        extraData?: any;
        lastChance?: LastChanceOptions;
        pauseOptions?: PauseOptions;
    }
    interface GiveawaysMessages {
        giveaway?: string;
        giveawayEnded?: string;
        inviteToParticipate?: string;
        timeRemaining?: string;
        winMessage?: string;
        embedFooter?: string | { text?: string; iconURL?: string; };
        noWinner?: string;
        winners?: string;
        endedAt?: string;
        hostedBy?: string;
        units?: {
            seconds?: string;
            minutes?: string;
            hours?: string;
            days?: string;
            pluralS?: false;
        };
    }
    interface GiveawaysManagerEvents {
        giveawayDeleted: [Giveaway];
        giveawayEnded: [Giveaway, GuildMember[]];
        giveawayRerolled: [Giveaway, GuildMember[]];
        giveawayReactionAdded: [Giveaway, GuildMember, MessageReaction];
        giveawayReactionRemoved: [Giveaway, GuildMember, MessageReaction];
        endedGiveawayReactionAdded: [Giveaway, GuildMember, MessageReaction];
    }
    class Giveaway extends EventEmitter {
        constructor(manager: GiveawaysManager, options: GiveawayData);

        public channelID: Snowflake;
        public client: Client;
        public endAt: number;
        public ended: boolean;
        public guildID: Snowflake;
        public hostedBy?: User;
        public manager: GiveawaysManager;
        public message: Message | null;
        public messageID?: Snowflake;
        public messages: GiveawaysMessages;
        public thumbnail?: string;
        public options: GiveawayData;
        public prize: string;
        public startAt: number;
        public winnerCount: number;
        public winnerIDs: Snowflake[];

        // getters calculated using default manager options
        readonly exemptPermissions: PermissionResolvable[];
        readonly embedColor: ColorResolvable;
        readonly embedColorEnd: ColorResolvable;
        readonly botsCanWin: boolean;
        readonly reaction: EmojiIdentifierResolvable;
        readonly lastChance: LastChanceOptions;

        // getters calculated using other values
        readonly remainingTime: number;
        readonly duration: number;
        readonly messageURL: string;
        readonly remainingTimeText: string;
        readonly channel: TextChannel;
        readonly exemptMembersFunction: Function | null;
        readonly bonusEntries: BonusEntry[];
        readonly data: GiveawayData;
        readonly pauseOptions: PauseOptions;

        public exemptMembers(member: GuildMember): Promise<boolean>;
        public edit(options: GiveawayEditOptions): Promise<Giveaway>;
        public end(): Promise<GuildMember[]>;
        public fetchMessage(): Promise<Message>;
        public reroll(options?: GiveawayRerollOptions): Promise<GuildMember[]>;
        public roll(winnerCount?: number): Promise<GuildMember[]>;
        public pause(options: PauseOptions): Promise<Giveaway>;
        public unpause(): Promise<Giveaway>;
    }
    interface GiveawayEditOptions {
        newWinnerCount?: number;
        newPrize?: string;
        addTime?: number;
        setEndTimestamp?: number;
        newMessages?: GiveawaysMessages;
        newThumbnail?: string;
        newBonusEntries?: BonusEntry[];
        newExtraData?: any;
    }
    interface GiveawayRerollOptions {
        winnerCount?: number;
        messages?: {
            congrat?: string;
            error?: string;
        };
    }
    interface GiveawayData {
        startAt: number;
        endAt: number;
        winnerCount: number;
        messages: Required<GiveawaysMessages>;
        prize: string;
        channelID: Snowflake;
        guildID: Snowflake;
        ended: boolean;
        winnerIDs?: Snowflake[];
        messageID?: Snowflake;
        reaction?: EmojiIdentifierResolvable;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: string;
        bonusEntries?: string;
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        thumbnail?: string;
        hostedBy?: string;
        extraData?: any;
        lastChance?: LastChanceOptions;
        pauseOptions?: PauseOptions;
    }
}
