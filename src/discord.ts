import { CustomClient } from './discord/index';
import './env'
import { PlayerService } from './service/PlayerService';

(async () => {
    const playerService = new PlayerService({
        cacheTimeout: 1000 * 60 * 60 * 12,
        shouldRefreshCache: false
    })

    await playerService.loadPlayers()

    const bot = new CustomClient(playerService);
    bot.login();
})()
