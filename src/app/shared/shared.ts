export interface EnumItem {
  value: string;
  label: string;
  key?: string;

  [key: string]: any;
}

export function createEnumMap(type: any): { [key: string]: EnumItem } {
  const map = {};
  Object.values(type).forEach((item) => (item as EnumItem).value ? map[(item as EnumItem).value] = (item as EnumItem) : null);
  return map;
}

export function createEnumArray(type: any): EnumItem[] {
  return Object.values(type);
}
