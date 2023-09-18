import { Injectable,} from '@angular/core';
import { firebaseConfig } from '../../environments/firebase'; // Import your Firebase configuration
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, updateDoc, doc, orderBy, query, onSnapshot, deleteDoc, limit, Firestore, deleteField } from 'firebase/firestore';
import { FirebaseStorage, getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import { Subject } from 'rxjs';
import { Message } from '../classes/message';
import { MessageType } from '../classes/message-type';
import { isImage } from '../functions'
import { ChatServiceProvider } from '../interfaces/chat-service-provider';

@Injectable({
  providedIn: 'root',
})

export class FirebaseService implements ChatServiceProvider {
  private app: FirebaseApp;
  private firestore: Firestore;
  private storage: FirebaseStorage;
  private messagesSubject = new Subject<Array<Message>>();
  private messages: Message[] = [];
  private typingSubject = new Subject<Array<string>>();
  private typing: string[] = [];
  private isTyping: boolean = false;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.listenToMessages();
    this.whoIsTyping();
  }

  public sendMessage = async (messageText: string, nickname: string) => {
    if(messageText === '')
      return;

    await addDoc(collection(this.firestore, 'messages'), {
      nickname: nickname!,
      message: messageText,
      owner: localStorage.getItem('userId'),
      sent_at: new Date(),
      type: await isImage(messageText) ? MessageType.Image : MessageType.Text,
    }).catch((e) => {
      console.error('Error sending message: ', e);
    });
  };

  public editMessage = async (message: Message, newMessage: string) => {
    if(message === null)
      return;

    await updateDoc(doc(this.firestore, 'messages/'+message.id), {
      message: newMessage,
      edit_on: new Date(),
      type: await isImage(message.message) ? MessageType.Image : MessageType.Text,
    }).catch((e) => {
      console.error('Error editing message: ', e);
    });
  }

  public deleteMessage = async (message: Message) => {
    if(message === null)
      return;

    await deleteDoc(doc(this.firestore, 'messages/'+message.id)).catch((e) => {
      console.error('Error deleting document: ', e);
    });
  };

  public listenToMessages = () => {
    onSnapshot(query(collection(this.firestore, 'messages'), limit(10), orderBy('sent_at', 'desc')), (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {

        if(change.type === 'removed')
          this.messages.splice(this.messages.findIndex((msg) => msg.id === change.doc.id),1);

        if(change.type === 'modified')
          this.messages[this.messages.findIndex((message) => message.id === change.doc.id)] = new Message(change.doc.id, change.doc.data());

        if(change.type === 'added')
          this.messages.push(new Message(change.doc.id, change.doc.data()));

        this.messages.sort((a, b) => {return a.sent_at.seconds - b.sent_at.seconds});

        if(this.messages.length > 10){
          this.messages.shift();
          this.deleteMessage(this.messages[0]);
        }

        this.messagesSubject.next(this.messages);
      });
    });
  }

  public startTyping = () => {
    if(this.isTyping)
      return;

    this.isTyping = true;

    let key: string = localStorage.getItem('userId')!;
    let data: {[key: string]: any} = {};
    data[key] = localStorage.getItem('nickname') ?? 'Anonymous';
    setDoc(doc(this.firestore, 'typing', 'typing'), data);
  };

  public stopTyping = () => {
    let key: string = localStorage.getItem('userId')!;
    let data: {[key: string]: any} = {};
    data[key] = deleteField();
    updateDoc(doc(this.firestore, 'typing', 'typing'), data);

    this.isTyping = false;
  };

  public whoIsTyping = () => {
    onSnapshot(collection(this.firestore, 'typing'), (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        this.typing = Object.values(change.doc.data());
        this.typingSubject.next(this.typing);
      });
    });
  };

  public uploadFile = async (file: File): Promise<void> => {
    let storageRef = ref(this.storage, file.name);

    await uploadBytes(storageRef, file).then(() => {
      getDownloadURL(storageRef).then((url) => {
        this.sendMessage(url, localStorage.getItem('nickname')!);
      });
    }).catch((e) => {
      console.error('Error uploading file: ', e);
    });
  };

  public lastMessages = (): Message[] => {
    return this.messages;
  };

  public getTyping = (): string[] => {
    return this.typing;
  }
}
