import { DiscordService } from "../../services/DiscordService";
import { StreamingService } from "../../services/StreamingService";

export interface DiscordCommandDependencies {
  discordService: DiscordService;
  streamingService: StreamingService;
}
