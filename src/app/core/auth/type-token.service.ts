import {DelonAuthConfig, IStore, ITokenModel, TokenService} from "@delon/auth";
import {BehaviorSubject} from "rxjs/internal/BehaviorSubject";
import {Observable} from "rxjs";
import {share} from "rxjs/operators";

// 将ITokenModel转成string的方法，可以定义null的时候的string为""或其他特定字符
const stringToken = (data: ITokenModel) => (data && data.token ? data.token : "");
const UNINITIALIZED = 'UNINITIALIZED';

export class TypeTokenService extends TokenService {

  type: any;
  lastToken: string = UNINITIALIZED;
  protected changeByGet$: BehaviorSubject<ITokenModel | null>;

  changeByGet(): Observable<ITokenModel | null> {
    return this.changeByGet$.pipe(share());
  }

  constructor(options: DelonAuthConfig, store: IStore, type: any) {
    super(options, store);
    this.changeByGet$ = new BehaviorSubject(null);
    this.type = type;
  }

  set(data: ITokenModel): boolean {
    this.lastToken = stringToken(data);
    return super.set(data);
  }

  get(type?: any): any {
    const token = super.get(this.type) as ITokenModel;
    const newToken = stringToken(token);
    if (newToken !== this.lastToken) {
      const changable = this.lastToken !== UNINITIALIZED;
      this.lastToken = newToken;
      // change$是私有的，如果java将无能为力，但是这是JS，可以为所欲为。
      if (changable) {
        this.changeByGet$.next(token);
      }
    }
    return token;
  }

  clear() {
    this.lastToken = stringToken(null);
    super.clear();
  }
}
