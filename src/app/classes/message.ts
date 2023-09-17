export class Message {
  public id: string;
  public nickname: string;
  public message: string;
  public sent_at: string;
  public edit_on: string | null = null;
  public isOwner: boolean = false;
  public type: 'text' | 'image' = 'text';

  constructor(id: string, data: {[key: string]: any}) {
    this.id = id;
    this.nickname = data['nickname'];
    this.message = data['message'];
    this.sent_at = data['sent_at'].toDate();
    this.edit_on = data['edit_on']?.toDate() ?? null;
    this.type = data['type'] == 'image' ? 'image' : 'text';
    if(data['owner'] === localStorage.getItem('userId')) {
      this.isOwner = true;
    }
  }
}
