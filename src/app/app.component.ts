import { Component, NgModule} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-chat';

  ngOnInit() {
    if(localStorage.getItem('userId') == undefined)
      localStorage.setItem('userId', uuidv4());
  };
}
