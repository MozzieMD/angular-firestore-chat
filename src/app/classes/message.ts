import { DocumentData, Timestamp } from "firebase/firestore";
import { MessageType } from "./message-type";
export class Message {
  public id: string;
  public nickname: string;
  public message: string;
  public sent_at: Timestamp;
  public edit_on: Timestamp | null = null;
  public isOwner: boolean = false;
  public type: MessageType = MessageType.Text;

  constructor(
    id: string,
    data: {
      nickname: string,
      message: string,
      sent_at: Timestamp,
      edit_on: Timestamp | null,
      type: MessageType,
      owner: string
    } extends DocumentData ? DocumentData : any) {
        this.id = id;
        this.nickname = data['nickname'];
        this.message = data['message'];
        this.sent_at = data['sent_at'];
        this.edit_on = data['edit_on'] ?? null;
        this.type = data['type'];
        if(data['owner'] === localStorage.getItem('userId')) {
          this.isOwner = true;
        }
  }
}

