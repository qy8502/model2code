import {Injectable, Injector} from '@angular/core';
import {Router} from '@angular/router';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponseBase,
} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError, mergeMap} from 'rxjs/operators';
import {NzNotificationService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {environment} from '@env/environment';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {CacheService} from "@delon/cache";


export const IGNORE_ERROR_KEY = '_ignore_error';
export const IGNORE_ERROR: any = {};
IGNORE_ERROR[IGNORE_ERROR_KEY] = true;

const CODEMESSAGE = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户登录状态已经失效，请重新登录。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 默认HTTP拦截器，其注册细节见 `app.module.ts`
 */
@Injectable()
export class DefaultInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {
  }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  private get cache(): CacheService {
    return this.injector.get(CacheService);
  }

// 并发请求可能会同时返回多个401错误，在一个时间段内只弹出一次提示！
  error401 = false;

  private goTo(url: string) {
    setTimeout(() => this.injector.get(Router).navigateByUrl(url));
  }

  private handleError(ev: HttpErrorResponse, req: HttpRequest<any>): Observable<any> {

    let errortext = "";
    if (ev.error && ev.error.validationErrors && ev.error.validationErrors.length) {
      ev.error.validationErrors.forEach((item) => {
        errortext += (item.message + " ");
      });
    } else if (ev.error && ev.error.consumerMessage) {
      errortext = ev.error.consumerMessage;
    } else {
      errortext = CODEMESSAGE[ev.status] || ev.statusText;
    }

    switch (ev.status) {
      case 401: // 未登录状态码
        // 请求错误 401: https://preview.pro.ant.design/api/401 用户没有权限（令牌、用户名、密码错误）。
        (this.injector.get(DA_SERVICE_TOKEN) as ITokenService).clear();
        this.goTo('/passport/login');
        // 并发请求可能会同时返回多个401错误，在一个时间段内只弹出一次提示！
        errortext = this.error401 ? CODEMESSAGE["401"] : errortext;
        setTimeout(() => this.error401 = false, 1000);
        break;
      case 403:
      case 404:
      case 500:
        // this.goTo(`/exception/${ev.status}`);
        break;
      default:
        console.warn('未可知错误，大部分是由于后端不支持CORS或无效配置引起', ev);
        break;
    }

    if (!(req.params.has(IGNORE_ERROR_KEY) ||
      new RegExp("[?|&]" + IGNORE_ERROR_KEY + "=[^&]+").test(req.urlWithParams))) {
      this.notification.error('错误', errortext);
    }
    return throwError(ev);
  }

  private handleData(ev: HttpResponseBase, req: HttpRequest<any>): Observable<any> {
    // 可能会因为 `throw` 导出无法执行 `_HttpClient` 的 `end()` 操作
    if (ev.status > 0) {
      this.injector.get(_HttpClient).end();
    }
    // 任何修改操作都清除缓存，防止更新的内容不能正常获取
    if (['POST', 'PUT', 'DELETE'].indexOf(req.method) >= 0) {
      this.cache.clear();
    }
    if (ev instanceof HttpErrorResponse) {
      return this.handleError(ev, req);
    } else {
      return of(ev);
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 统一加上服务端前缀
    let url = req.url;
    if (!url.startsWith('//') && !url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('assets/') && !url.startsWith('/assets/')) {
      url = environment.SERVER_URL + url;
    }

    const newReq = req.clone({url});
    return next.handle(newReq).pipe(
      mergeMap((event: any) => {
        // 允许统一对请求错误处理
        if (event instanceof HttpResponseBase) return this.handleData(event, req);
        // 若一切都正常，则后续操作
        return of(event);
      }),
      catchError((err: HttpErrorResponse) => this.handleData(err, req)),
    );
  }
}
