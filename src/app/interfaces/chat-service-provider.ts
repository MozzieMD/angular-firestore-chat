import { Injectable } from "@angular/core";
import { Message } from "../classes/message";

@Injectable()
export abstract class ChatServiceProvider {

  abstract sendMessage(messageText: string, nickname: string): Promise<void>;
  abstract editMessage(message: Message, newMessage: string): Promise<void>;
  abstract deleteMessage(message: Message): Promise<void>;
  abstract listenToMessages(): void;
  abstract whoIsTyping(): void;
  abstract stopTyping(): void;
  abstract startTyping(): void;
  abstract uploadFile(file: File): Promise<void>;
  abstract lastMessages(): Message[];
  abstract getTyping(): string[];
}
