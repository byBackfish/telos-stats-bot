import { getPlayerProfile } from "../api";
import type { GuildProfile } from "../api/struct/guild";
import type { PlayerProfile } from "../api/struct/player";
import { type ObjectPath } from "../discord/util/typeUtils";
export type LeaderboardType =
    | {
        name: string;
        category: "player";
        type: "calculated"
        getValue: (profile: PlayerProfile) => number;
      } | {
        name: string;
        category: "player";
        type: "path"
        path: ObjectPath<PlayerProfile>;
      }
    | {
        name: string;
        category: "guild";
        getValue: (profile: GuildProfile<"username" | "uuid">) => number;
      };

const createPlayerStat = (name: string, getValue: ObjectPath<PlayerProfile> | ((profile: PlayerProfile) => number)): LeaderboardType => {
    if(typeof getValue === 'string') {
        return {
            name,
            category: "player",
            type: "path",
            path: getValue
        }
    }
    return {
        name,
        category: "player",
        type: 'calculated',
        getValue
    }
}

const isNumberPath = (data: any, path: string): boolean => {
  const keys = path.split('.');
  let current: any = data;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }

  return typeof current === 'number';
};


const IGNORED_PROPERTIES = [
    "characters",
    "previousRanking"
]
const isIgnoredProperty = (key: string): boolean => {
    return IGNORED_PROPERTIES.includes(key);
  };

const generateAllProviders = async (name: string): Promise<LeaderboardType[]> => {
  const playerProfile = await getPlayerProfile(name);

  const allFields = (data: any, parentKey: string = ''): string[] => {
    return Object.keys(data).flatMap((key) => {
      if (isIgnoredProperty(key)) {
        return [];
      }

      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof data[key] === 'object' && data[key] !== null) {
        return allFields(data[key], fullKey);
      }
      return fullKey;
    });
  };

  const allPaths = allFields(playerProfile)

  const providers: LeaderboardType[] = allPaths
    .filter(path => isNumberPath(playerProfile, path))
    .map(path => createPlayerStat(path, path as any));

  return providers;
};


export const getLeaderboardTypes = async () => await generateAllProviders('byBackfish');
