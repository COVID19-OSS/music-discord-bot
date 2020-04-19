export interface SongQueueItem {
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
  videoLengthSeconds: string;
  queuedByDiscordId: string;
  streamingChannelId: string;
  originChannelId: string;
}
