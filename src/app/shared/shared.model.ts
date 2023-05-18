import {format} from 'date-fns';
import {Type} from "@angular/core";

export interface PageList<T> {
  list: T[];
  count?: number;
}

export function createPageList(data: any, T: Type<any>) {
  if (data.list && data.list instanceof Array) {
    data.list = data.list.map(item => new T(item));
  }
  return data;
}

export function createArray(data: any, T: Type<any>) {
  if (data instanceof Array) {
    data = data.map(item => new T(item));
  }
  return data;
}

export class SearchParam {

  /**
   * 分页页码
   */
  pageIndex = 1;

  /**
   * 分页大小
   */
  pageSize = 20;

  /**
   * 是否返回数据数量
   */
  count?: boolean;

  toParam(): any {
    const praram = Object.assign(this);
    praram.count = praram.pageIndex < 2;
    Object.keys(praram).forEach((key) => (this[key] === null || this[key] === '') ? delete this[key] : null);
    return praram;
  }
}

export interface EnumItem {
  [key: string]: any;

  value: string;
  label: string;
}

export function createEnumMap(type: any): { [value: string]: EnumItem } {
  const map = {};
  Object.values(type).forEach((item) => {
    if (typeof((item as EnumItem).value) !== "undefined") {
      (item as EnumItem).text = (item as EnumItem).text || (item as EnumItem).label;
      map[(item as EnumItem).value] = (item as EnumItem);
    }
  });
  return map;
}

export function createEnumArray(type: any): EnumItem[] {
  return Object.values(type);
}

export function formatDate(source: Date): string {
  return format(source, "YYYY-MM-DD");
}

export function formatDateTime(source: Date): string {
  return format(source, "YYYY-MM-DD HH:mm:ss");
}

export function formatTime(source: Date): string {
  return format(source, "HH:mm:ss");
}

