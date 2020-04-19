import { Message } from "discord.js";

import { DiscordCommand } from "./DiscordCommand";
import { DiscordCommandType } from "./DiscordCommandType";
import { DiscordCommandDependencies } from "../definitions/dependencies/DiscordCommandDependencies";

import { NextSongDiscordCommand } from "./queue/NextSongDiscordCommand";
import { QueueSongDiscordCommand } from "./queue/QueueSongDiscordCommand";
import { ListQueueDiscordCommand } from "./queue/ListQueueDiscordCommand";
import { DequeueSongDiscordCommand } from "./queue/DequeueSongDiscordCommand";

export class DiscordCommandRegistry {
  private static getRegistry(): Map<string, DiscordCommand> {
    const registry = new Map<DiscordCommandType, DiscordCommand>();
    registry.set(DiscordCommandType.NEXT_SONG, NextSongDiscordCommand.prototype);
    registry.set(DiscordCommandType.QUEUE_SONG, QueueSongDiscordCommand.prototype);
    registry.set(DiscordCommandType.LIST_QUEUE, ListQueueDiscordCommand.prototype);
    registry.set(DiscordCommandType.DEQUEUE_SONG, DequeueSongDiscordCommand.prototype);
    return registry;
  }

  public static getCommand(command: string, args: Array<string>, message: Message, dependencies: DiscordCommandDependencies): DiscordCommand | null {
    const registry = this.getRegistry();

    const CommandForType = registry.get(command.toLowerCase());
    if (!CommandForType) return null;

    const ReflectedCommand = Object.create(CommandForType);
    return new ReflectedCommand.constructor(dependencies, command, args, message);
  }
}
