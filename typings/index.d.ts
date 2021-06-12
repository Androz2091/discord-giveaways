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
        Message,
        MessageEmbed
    } from 'discord.js';

    export const version: string;
    export class GiveawaysManager extends EventEmitter {
        constructor(client: Client, options?: GiveawaysManagerOptions);

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
    }
    interface GiveawaysMessages {
        giveaway?: string;
        giveawayEnded?: string;
        inviteToParticipate?: string;
        timeRemaining?: string;
        winMessage?: string | MessageObject;
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
    interface MessageObject {
        content?: string;
        embed?: MessageEmbed;
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
        readonly reaction: string;
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

        public exemptMembers(member: GuildMember): Promise<boolean>;
        public edit(options: GiveawayEditOptions): Promise<Giveaway>;
        public end(): Promise<GuildMember[]>;
        public fetchMessage(): Promise<Message>;
        public reroll(options?: GiveawayRerollOptions): Promise<GuildMember[]>;
        public roll(winnerCount?: number): Promise<GuildMember[]>;
        public fillInString(string: string): string;
        public fillInString(embed: MessageEmbed): MessageEmbed | null;
    }
    interface GiveawayEditOptions {
        newWinnerCount?: number;
        newPrize?: string;
        addTime?: number;
        setEndTimestamp?: number;
        newMessages?: Partial<GiveawaysMessages>;
        newThumbnail?: string;
        newBonusEntries?: BonusEntry[];
        newExtraData?: any;
    }
    interface GiveawayRerollOptions {
        winnerCount?: number | null;
        messages?: {
            congrat?: string | MessageObject;
            error?: string | MessageObject;
        };
    }
    interface GiveawayData {
        startAt: number;
        endAt: number;
        winnerCount: number;
        messages: GiveawaysMessages;
        prize: string;
        channelID: Snowflake;
        guildID: Snowflake;
        ended?: boolean;
        winnerIDs?: Snowflake[];
        messageID?: Snowflake | null;
        reaction?: EmojiIdentifierResolvable;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: string;
        bonusEntries?: string;
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        thumbnail?: string;
        hostedBy?: string | null;
        extraData?: any;
        lastChance?: LastChanceOptions;
    }
}
