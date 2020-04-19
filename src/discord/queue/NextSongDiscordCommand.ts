import { DiscordCommand } from "../DiscordCommand";

// const PAGE_SIZE = 10;

export class NextSongDiscordCommand extends DiscordCommand {
  public async validate(): Promise<boolean> {
    return true;
  }

  public async execute(): Promise<void> {
    const { streamingService } = this.dependencies;

    await streamingService.skipSong();
  }
}
