import { TimeagoClock } from "ngx-timeago";
import { Observable, interval } from "rxjs";

export class TimeAgoCustomClock extends TimeagoClock{
  override tick(then: number): Observable<number> {
    return interval(30000);
  }
}
