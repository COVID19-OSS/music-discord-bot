import { DiscordCommand } from "../DiscordCommand";

export class DequeueSongDiscordCommand extends DiscordCommand {
  public async validate(): Promise<boolean> {
    return false;
  }

  public async execute(): Promise<void> {
  }
}
