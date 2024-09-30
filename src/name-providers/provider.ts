export type ProvidedPlayer = {
    username: string;
    uuid: string;
}

export type ProvidedGuild = {
    name: string;
    tag: string;
}

type NameProvider = {
    name: string;
    type: 'guild' | 'player';
}

export type PlayerNameProvider = {
    type: 'player';
    fetchNameList: () => Promise<ProvidedPlayer[]>;
} & NameProvider

export type GuildNameProvider = {
    type: 'guild';
    fetchNameList: () => Promise<ProvidedGuild[]>;
} & NameProvider
