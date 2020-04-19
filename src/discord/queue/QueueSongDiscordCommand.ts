import ytdl from "ytdl-core-discord";

import { DiscordCommand } from "../DiscordCommand";
import { DiscordCommandType } from "../DiscordCommandType";
import { MessageEmbed } from "discord.js";
import { SongQueueItem } from "../../definitions/messages/SongQueueItem";

const { DISCORD_PREFIX } = process.env;

export class QueueSongDiscordCommand extends DiscordCommand {
  public async validate(): Promise<boolean> {
    const { streamingService } = this.dependencies;

    if (this.args.length !== 1) {
      await this.message.channel.send(`Usage \`${DISCORD_PREFIX}${DiscordCommandType.QUEUE_SONG} <youtube-url>\``)
      return false;
    }

    if (!streamingService.isPlaying && !this.message.member?.voice) {
      await this.message.channel.send("You must be in a voice channel to play a song");
      return false;
    }

    return true;
  }

  public async execute(): Promise<void> {
    const { streamingService } = this.dependencies;

    const videoMetadata = await ytdl.getBasicInfo(this.args[0]);

    const author = videoMetadata.author.user || videoMetadata.author.name;

    const confirmationMessage = await this.message.channel.send(new MessageEmbed()
      .setTitle(`:musical_note: Queued Song ${streamingService.queueSize + 1}`)
      .setDescription(`${videoMetadata.title} by ${author}`)
      .setColor("#52afe8")
      .setThumbnail(`https://img.youtube.com/vi/${videoMetadata.video_id}/mqdefault.jpg`));

    const item: SongQueueItem = {
      videoUrl: this.args[0],
      videoId: videoMetadata.video_id,
      queuedByDiscordId: this.message.author.id,
      streamingChannelId: this.message.member?.voice.channel?.id!,
      originChannelId: this.message.channel.id,
      videoAuthor: author,
      videoLengthSeconds: videoMetadata.length_seconds,
      videoTitle: videoMetadata.title
    };

    await streamingService.queueSong(item);

    await Promise.all([
      await this.message.delete(),
      await confirmationMessage.delete({ timeout: 5 * 1000 })
    ])
  }
}
