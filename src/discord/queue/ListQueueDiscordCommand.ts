import { DiscordCommand } from "../DiscordCommand";
import { MessageEmbed } from "discord.js";

// const PAGE_SIZE = 10;

export class ListQueueDiscordCommand extends DiscordCommand {
  public async validate(): Promise<boolean> {
    return true;
  }

  public async execute(): Promise<void> {
    const { streamingService } = this.dependencies;

    const queueEmbed = new MessageEmbed()
      .setColor("#52afe8")
      .setTitle(`:musical_note: Current Song Queue - ${streamingService.queueSize} song(s)`);

    streamingService.queueItems.forEach((item, index) => {
      queueEmbed.addField(`${index + 1}. ${item.videoTitle} by ${item.videoAuthor}`, `Requested by <@${item.queuedByDiscordId}> - (${Math.floor(Number(item.videoLengthSeconds) / 60)}:${(Number(item.videoLengthSeconds) % 60).toString().padStart(2, "0")})`);
    });

    await this.message.channel.send(queueEmbed);
  }
}
