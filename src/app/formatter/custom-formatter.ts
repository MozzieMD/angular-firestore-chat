import { TimeagoDefaultFormatter} from 'ngx-timeago';
export class CustomFormatter extends TimeagoDefaultFormatter {
  override format(then: number): string {
    if(new Date().getTime() + 10000 <= then || then >= new Date().getTime() - 10000){
      return 'now';
    }
    if(new Date().getTime() + 60000 <= then || then >= new Date().getTime() - 60000){
      return 'few seconds ago';
    }
    return super.format(then);
  }

}
