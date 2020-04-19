import bind from "bind-decorator";
import ytdl from "ytdl-core";

import { Mutex } from "async-mutex";
import { MessageEmbed, TextChannel, VoiceChannel, VoiceConnection } from "discord.js";

import { StreamingDependencies } from "../definitions/dependencies/StreamingDependencies";
import { SongQueueItem } from "../definitions/messages/SongQueueItem";
import { Readable } from "stream";

export class StreamingService {
  private readonly dependencies: StreamingDependencies;

  private readonly streamingMutex: Mutex;
  private readonly songQueue: Array<SongQueueItem>;

  private voiceChannelConnection?: VoiceConnection;
  private currentStream?: Readable;

  constructor(dependencies: StreamingDependencies) {
    this.dependencies = dependencies;

    this.songQueue = [];
    this.streamingMutex = new Mutex();
  }

  public get isPlaying(): boolean {
    return this.voiceChannelConnection !== undefined;
  }

  public get queueSize(): number {
    return this.songQueue.length;
  }

  public get queueItems(): Array<SongQueueItem> {
    return [...this.songQueue];
  }

  public async queueSong(queueItem: SongQueueItem): Promise<void> {
    const release = await this.streamingMutex.acquire();
    this.songQueue.push(queueItem);
    release();

    if (!this.isPlaying) setImmediate(async () => await this.popQueue());
  }

  public async skipSong(): Promise<void> {
    const release = await this.streamingMutex.acquire();

    if (this.currentStream) this.currentStream.destroy();
    this.songQueue.shift();

    release();
    setImmediate(async () => this.popQueue());
  }

  @bind
  public async popQueue(): Promise<void> {
    const { discordService: { discordInstance } } = this.dependencies;

    if (this.streamingMutex.isLocked()) return;

    console.log("Acquiring lock in queue")
    const release = await this.streamingMutex.acquire();
    try {
      if (this.songQueue.length > 0) {
        const queueItem = this.songQueue[0];
        if (!queueItem) throw Error("Expected song on queue pop");

        console.log("Now playing", queueItem.videoTitle);

        if (!this.voiceChannelConnection) {
          const voiceChannel = await discordInstance.channels.fetch(queueItem.streamingChannelId) as VoiceChannel;
          this.voiceChannelConnection = await voiceChannel.join();
        }

        const originChannel = await discordInstance.channels.fetch(queueItem.originChannelId) as TextChannel;
        const embed = new MessageEmbed()
          .setTitle(`:musical_note: Playing Song`)
          .setColor("#52afe8")
          .setDescription(`${queueItem.videoTitle} by ${queueItem.videoAuthor}`)
          .setThumbnail(`https://img.youtube.com/vi/${queueItem.videoId}/mqdefault.jpg`);

        const confirmationMessage = await originChannel.send(embed);
        await confirmationMessage.delete({ timeout: 5 * 1000 });

        this.currentStream = await ytdl(queueItem.videoUrl);
        this.voiceChannelConnection.play(this.currentStream);

        this.currentStream.once("end", async () => await this.handleSongEnd());
      }
      else {
        console.log("Leaving channel");
        if (this.voiceChannelConnection) {
          await this.voiceChannelConnection.disconnect();
          this.voiceChannelConnection = undefined;
        }
      }
    }
    catch (e) {
      console.error(e);
    }
    finally {
      console.log("Releasing lock in queue");
      release();
    }
  }

  @bind
  private async handleSongEnd(): Promise<void> {
    const { discordService: { discordInstance } } = this.dependencies;

    const release = await this.streamingMutex.acquire();
    const message = this.songQueue.shift();

    const originChannel = await discordInstance.channels.fetch(message!.originChannelId) as TextChannel;
    const embed = new MessageEmbed()
      .setTitle(`:musical_note: Song Ended`)
      .setColor("#52afe8")
      .setDescription(`${message?.videoTitle} by ${message?.videoAuthor}`)
      .setThumbnail(`https://img.youtube.com/vi/${message?.videoId}/mqdefault.jpg`);
    const confirmationMessage = await originChannel.send(embed);

    release();

    setTimeout(async () => await this.popQueue(), 250);
    await confirmationMessage.delete({ timeout: 3 * 1000 });
  }

  public async stop(): Promise<void> {
    if (this.voiceChannelConnection) {
      await this.voiceChannelConnection.disconnect();
      console.log("Disconnected from VC");
    }
  }

}
