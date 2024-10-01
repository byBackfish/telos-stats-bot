import { DataSavingService } from "./service/DataSavingService";
import { PlayerService } from "./service/PlayerService";

const playerService = new PlayerService({
	cacheTimeout: 1000 * 60 * 60 * 12,
	shouldRefreshCache: true,
});

await playerService.loadGuilds();
await playerService.loadPlayers();

const service = new DataSavingService(playerService, {
	cycleTimeout: 1000 * 60 * 15,
	apiTimeout: 1500,
});

await service.start();
