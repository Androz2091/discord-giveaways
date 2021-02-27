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
        constructor(client: Client, options?: GiveawaysManagerOptions);

        public client: Client;
        public giveaways: Giveaway[];
        public options: GiveawaysManagerOptions;
        public ready: boolean;

        public delete(messageID: Snowflake, doNotDeleteMessage?: boolean): Promise<void>;
        // @ts-ignore-next-line
        public async deleteGiveaway(messageID: Snowflake): Promise<void>;
        public edit(messageID: Snowflake, options: GiveawayEditOptions): Promise<Giveaway>;
        public end(messageID: Snowflake): Promise<GuildMember[]>;
        public reroll(messageID: Snowflake, options?: GiveawayRerollOptions): Promise<GuildMember[]>;
        public start(channel: TextChannel, options: GiveawayStartOptions): Promise<Giveaway>;

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
        bonus(member: GuildMember): number | Promise<number>;
        cumulative: boolean;
    }
    interface LastChanceOptions {
        enabled: boolean;
        embedColor: string;
        content: string;
        threshold: number;
    }
    interface GiveawaysManagerOptions {
        storage?: string;
        updateCountdownEvery?: number;
        endedGiveawaysLifetime?: number;
        hasGuildMembersIntent?: boolean;
        default?: GiveawayStartOptions;
    }
    interface GiveawayStartOptions {
        time?: number;
        winnerCount?: number;
        prize?: string;
        hostedBy?: User;
        botsCanWin?: boolean;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: () => boolean | Promise<boolean>;
        bonusEntries?: BonusEntry[];
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        reaction?: EmojiIdentifierResolvable;
        messages?: Partial<GiveawaysMessages>;
        extraData?: any;
        lastChance?: LastChanceOptions;
        isDrop?: boolean;
    }
    interface GiveawaysMessages {
        giveaway?: string;
        giveawayEnded?: string;
        inviteToParticipate?: string;
        timeRemaining?: string;
        winMessage?: string;
        embedFooter?: string;
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
        public data: GiveawayData;
        public endAt: number;
        public ended: boolean;
        public guildID: Snowflake;
        public hostedBy: User | null;
        public manager: GiveawaysManager;
        public message: Message | null;
        public messageID: Snowflake | null;
        public messages: GiveawaysMessages;
        public options: GiveawayData;
        public prize: string;
        public startAt: number;
        public winnerCount: number;
        public winnerIDs: Snowflake[];

        // getters calculated using default manager options
        readonly exemptPermissions: PermissionResolvable[];
        readonly giveawayDuration: number;
        readonly embedColor: ColorResolvable;
        readonly embedColorEnd: ColorResolvable;
        readonly botsCanWin: boolean;
        readonly reaction: string;

        // getters calculated using other values
        readonly remainingTime: number;
        readonly messageURL: string;
        readonly content: string;
        readonly channel: TextChannel;
        readonly bonusEntries: BonusEntry[];
        readonly isDrop: boolean;

        public exemptMembers(): boolean;
        public edit(options: GiveawayEditOptions): Promise<Giveaway>;
        public end(): Promise<GuildMember[]>;
        // @ts-ignore-next-line
        public async fetchMessage(): Promise<Message>;
        public reroll(options: GiveawayRerollOptions): Promise<GuildMember[]>;
        // @ts-ignore-next-line
        public async roll(winnerCount?: number): Promise<GuildMember[]>;
    }
    interface GiveawayEditOptions {
        newWinnerCount?: number;
        newPrize?: string;
        addTime?: number;
        setEndTimestamp?: number;
        newMessages?: Partial<GiveawaysMessages>;
        newBonusEntries?: BonusEntry[];
        newExtraData?: any;
        newIsDrop?: boolean;
    }
    interface GiveawayRerollOptions {
        winnerCount?: number | null;
        messages?: {
            congrat?: string;
            error?: string;
        };
    }
    interface GiveawayData {
        startAt: number;
        endAt: number;
        winnerCount: number;
        winnerIDs: Snowflake[];
        messages: GiveawaysMessages;
        ended: boolean;
        prize: string;
        channelID: Snowflake;
        guildID: Snowflake;
        messageID?: Snowflake | null;
        reaction?: EmojiIdentifierResolvable;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: (member: GuildMember) => boolean;
        bonusEntries?: string;
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        hostedBy?: string | null;
        extraData?: any;
        lastChance?: LastChanceOptions;
        isDrop?: boolean;
    }
}
