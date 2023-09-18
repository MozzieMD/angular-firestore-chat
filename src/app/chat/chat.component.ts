import { Component, ElementRef, QueryList, AfterViewInit, ViewChildren, ViewChild} from '@angular/core';
import { Message } from '../classes/message';
import { DataUrl, NgxImageCompressService } from 'ngx-image-compress';
import { Subject } from 'rxjs';
import { MessageType } from '../classes/message-type';
import { blobToDataURL } from '../functions';
import { v4 as uuidv4 } from 'uuid';
import { ChatServiceProvider } from '../interfaces/chat-service-provider';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  providers:[{provide: ChatServiceProvider, useClass: FirebaseService}]
})
export class ChatComponent implements AfterViewInit{
  @ViewChildren('message',{ read: ElementRef})
  messagesDiv!:QueryList<any>;
  @ViewChild('messageInput') messageInput!: ElementRef;

  public message: string = '';
  public nickname: string = localStorage.getItem('nickname') || '';
  public messageForEdit: Message | null = null;
  public typingTimeout: any = null;
  public uploading: boolean = false;
  public isNicknameInputVisible: boolean = this.nickname === '';
  public nicknameSubject = new Subject();
  public MessageTypes = MessageType;

  constructor(public chatService: ChatServiceProvider, private imageCompress: NgxImageCompressService) {
  }

  public scrollIntoView(): void {
    setTimeout(() => {
      this.messagesDiv.last.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  ngAfterViewInit(): void {
    this.messagesDiv.changes.subscribe((e) => {
      this.scrollIntoView();
    });
  }

  sendMessage():void {
    this.chatService.sendMessage(this.message, this.nickname);
    this.message = '';
  }

  editMessage(): void {
    let response = this.chatService.editMessage(this.messageForEdit!, this.message);
    response.then(() => {
      this.messageForEdit = null;
      this.message = '';
    }).catch((e) => {
      console.log(e);
    });
  }

  stopEdit(): void {
    this.message = '';
    this.messageForEdit = null;
  }

  edit(message: Message):void {
    if(!message.isOwner)
      return;
    this.messageForEdit = message;
    this.message = message.message;
    setTimeout(() => {this.messageInput.nativeElement.focus()}, 100);
  }

  deleteMessage(message: Message):void {
    if(!message.isOwner)
      return;
    this.chatService.deleteMessage(message);
  }

  saveNickname():void {
    localStorage.setItem('nickname', this.nickname);
  }

  toggleNickname():void {
    this.isNicknameInputVisible = !this.isNicknameInputVisible;
    this.nicknameSubject.next(this.isNicknameInputVisible);
  }

  typing():void {
    this.chatService.startTyping();
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.chatService.stopTyping();
    }, 1000);
  }

  selectImage():void {
    this.imageCompress.uploadFile().then(({image, orientation, fileName}) => {
      this.uploading = true;
      this.imageCompress.compressFile(image, orientation, 50, 50).then(
        (result: DataUrl) => {
          fetch(result)
          .then(res => res.blob())
          .then((blob)=>{
            let file = new File([blob], fileName, {type: 'image/jpeg'});
            this.chatService.uploadFile(file).then(() => {
              this.uploading = false;
            });
          });
        });
    }).catch(()=>{
      this.uploading = false;
    });
  }

  enterPressed(event: any):void {
    event.preventDefault();
    if(this.messageForEdit)
        this.editMessage();
      else
        this.sendMessage();
  }

  clipboard(event: any):void {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob = null;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        event.preventDefault();
        if(this.messageForEdit)
          return;
        blob = item.getAsFile();
        blobToDataURL(blob).then((dataurl) => {
          this.imageCompress.compressFile(dataurl, 0, 50, 50).then((result: DataUrl) => {
            fetch(result)
            .then(res => res.blob())
            .then((blob)=>{
              let file = new File([blob], uuidv4(), {type: item.type});
              this.chatService.uploadFile(file);
            });
          });
        });
      }
    }
  }
}
