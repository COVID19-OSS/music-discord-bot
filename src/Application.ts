import { DiscordService } from "./services/DiscordService";

import { DiscordCommandListener } from "./discord/DiscordCommandListener";
import { DiscordCommandDependencies } from "./definitions/dependencies/DiscordCommandDependencies";
import { StreamingService } from "./services/StreamingService";

export class Application {
  private readonly discordService: DiscordService;
  private readonly streamingService: StreamingService;

  public constructor() {
    this.discordService = new DiscordService();

    this.streamingService = new StreamingService({ discordService: this.discordService });
    const dependencies = { discordService: this.discordService, streamingService: this.streamingService };
    this.bindListeners(dependencies);
  }

  private bindListeners(dependencies: DiscordCommandDependencies): void {
    new DiscordCommandListener(dependencies);
  }

  public async start(): Promise<void> {
    await this.discordService.start();
  }

  public async stop(): Promise<void> {
    await this.streamingService.stop();
    this.discordService.stop();
  }
}
