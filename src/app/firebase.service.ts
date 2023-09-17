import { Injectable,} from '@angular/core';
import { firebaseConfig } from '../environments/firebase'; // Import your Firebase configuration
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, orderBy, query, onSnapshot, deleteDoc, limit, Firestore, deleteField } from 'firebase/firestore';
import { FirebaseStorage, getStorage, ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage';
import { Subject } from 'rxjs';
import { Message } from './classes/message';

@Injectable({
  providedIn: 'root',
})

export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;
  private storage: FirebaseStorage;
  private messagesSubject = new Subject();
  private messages: Array<Message> = [];
  private typingSubject = new Subject();
  private typing: Array<string> = [];
  private isTyping: boolean = false;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.listenToMessages();
    this.whoIsTyping();
  }

  public sendMessage = async (messageText: string, nickname: string, image: boolean = false) => {
    if(nickname !== '')
      localStorage.setItem('nickname', nickname);
    if(messageText === '')
      return;
    await addDoc(collection(this.firestore, 'messages'), {
      nickname: nickname!,
      message: messageText,
      owner: localStorage.getItem('userId'),
      sent_at: new Date(),
      type: image ? 'image' : 'text',
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
    }).catch((e) => {
      console.error('Error editing message: ', e);
    });
  }

  public deleteMessage = async (message: Message) => {
    if(message === null)
      return;
    await deleteDoc(doc(this.firestore, 'messages/'+message.id)).then(() => {
      this.removeFile(message);
    }).catch((e) => {
      console.error('Error deleting document: ', e);
    });
  };

  public listenToMessages = () => {
    onSnapshot(query(collection(this.firestore, 'messages'), limit(10), orderBy('sent_at', 'desc')), (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if(change.type === 'removed')
          this.messages.splice(this.messages.findIndex((msg) => msg.id === change.doc.id),1);
        if(change.type === 'modified'){
          this.messages[this.messages.findIndex((message) => message.id === change.doc.id)] = new Message(change.doc.id, change.doc.data());
        }
        if(change.type === 'added'){
          this.messages.push(new Message(change.doc.id, change.doc.data()));
        }

        this.messages.sort((a, b) => {return b.sent_at > a.sent_at ? -1 : 1});
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
    updateDoc(doc(this.firestore, 'typing', 'typing'), data);
  };

  public stopTyping = () => {
    let key: string = localStorage.getItem('userId')!;
    let data: {[key: string]: any} = {};
    data[key] = deleteField();
    this.isTyping = false;
    updateDoc(doc(this.firestore, 'typing', 'typing'), data);
  };

  public whoIsTyping = () => {
    onSnapshot(collection(this.firestore, 'typing'), (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        this.typing = Object.values(change.doc.data());
        this.typingSubject.next(this.typing);
      });
    });
  };

  public uploadFile = async (file: File) => {
    let storageRef = ref(this.storage, file.name);
    await uploadBytes(storageRef, file).then(() => {
      getDownloadURL(storageRef).then((url) => {
        this.sendMessage(url, localStorage.getItem('nickname')!, true);
      });
    }).catch((e) => {
      console.error('Error uploading file: ', e);
    });
  };

  public removeFile = (message: Message) => {
    if(message.type !== 'image')
      return;
    let storageRef = ref(this.storage, message.message);
    deleteObject(storageRef);
  };

  public lastMessages = () => {
    return this.messages;
  };

  public getTyping = () => {
    return this.typing;
  }
}
