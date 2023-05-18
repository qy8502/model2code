import {MenuService} from "@delon/theme";

export class OpenStrictlyMenuService extends MenuService {
  openedByUrl(url: string | null, recursive?: boolean): void {
    const openList = [];
    this.visit(this.menus, (item, parent) => {
      if (item._open) {
        openList.push(item);
      }
    });
    super.openedByUrl(url, recursive);
    openList.forEach((item) => item._open = true);
  }

  resume(callback) {
    // 子级全部隐藏，父级隐藏
    // 子级全部无权限，父级无权限
    const callbackNew = (item, parent, depth) => {

      if (parent && !parent._hidden &&
        parent.children.lastIndexOf(item) === 0) {
        if (parent.link || parent.externalLink) {
          if (parent.children.every(node => node._hidden || !node._aclResult)) {
            parent._type = parent.externalLink ? 2 : 1;
          }
        } else {
          if (parent.children.every(node => node._hidden)) {
            parent._hidden = true;
          } else if (parent.children.every(node => !node._aclResult)) {
            parent._aclResult = false;
          } else if (parent.children.every(node => node._hidden || !node._aclResult)) {
            parent._hidden = true;
          }
        }
      }

      if (callback) {
        callback(item, parent, depth);
      }
    };
    super.resume(callbackNew);
  }

}
