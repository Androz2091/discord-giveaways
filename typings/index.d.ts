declare module 'discord-giveaways' {
    import { EventEmitter } from 'events';
    import {
        Client,
        PermissionResolvable,
        ColorResolvable,
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
        exemptMembers?: () => boolean;
        embedColor?: ColorResolvable;
        embedColorEnd?: ColorResolvable;
        reaction?: string;
        messages?: Partial<GiveawaysMessages>;
        extraData?: any;
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
        giveawayReactionAdded: [Giveaway, GuildMember, MessageReaction];
        giveawayReactionRemoved: [Giveaway, GuildMember, MessageReaction];
    }
    class Giveaway extends EventEmitter {
        constructor(manager: GiveawaysManager, options: GiveawayData);

        public botsCanWin: boolean;
        readonly channel: TextChannel;
        public channelID: Snowflake;
        public client: Client;
        readonly content: string;
        public data: GiveawayData;
        public embedColor: ColorResolvable;
        public embedColorEnd: ColorResolvable;
        public endAt: number;
        public ended: boolean;
        public exemptPermissions: PermissionResolvable[];
        readonly giveawayDuration: number;
        public guildID: Snowflake;
        public hostedBy: string | null;
        public manager: GiveawaysManager;
        public message: Message | null;
        public messageID: Snowflake | null;
        public messages: GiveawaysMessages;
        public options: GiveawayData;
        public prize: string;
        readonly remainingTime: number;
        readonly messageURL: string;
        public startAt: number;
        public winnerCount: number;
        public winnerIDs: Array<string>;

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
        newExtraData?: any;
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
        winnerIDs: Array<string>;
        messages: GiveawaysMessages;
        ended: boolean;
        prize: string;
        channelID: Snowflake;
        guildID: Snowflake;
        messageID?: Snowflake | null;
        reaction?: string;
        exemptPermissions?: PermissionResolvable[];
        exemptMembers?: (member: GuildMember) => boolean;
        embedColor?: string;
        embedColorEnd?: string;
        hostedBy?: string | null;
        extraData?: any;
    }
}
