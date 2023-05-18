import {Injectable, Injector} from '@angular/core';
import {UserDTO} from "@core/user/user.model";


@Injectable({providedIn: 'root'})
export class AvatarService {


    constructor(private injector: Injector) {
    }

    public baseUrl = 'user';

    avatarCache: any = {};
    canvas: HTMLCanvasElement;

    handleUserAvatar(...users: UserDTO[]) {
        users.forEach((user) => user.avatar = user.avatarUrl || this.avatar(user.id, user.name));
    }

    avatar(userId, userName) {
        let src = this.avatarCache[userId];
        if (src) {
            return src;
        }
        let canvas = this.canvas;
        if (!canvas) {
            canvas = document.createElement('canvas') as HTMLCanvasElement;
            canvas.setAttribute('id', 'canvas');
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            this.canvas = canvas;
        }

        const text = this.getAvatarText(userName);
        const hsl = this.getHsl(this.hashCode(userId));
        const backColor = 'rgb(' + this.hslToRgb(hsl[0], hsl[1], hsl[2]).toString() + ')';
        const textColor = '#ffffff';
        const width = 32;
        const height = 32;
        const fontFamily = 'Microsoft YaHei';
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        const fontSize = (width / (text.length + 1)) + 4;
        const x = width / 2;
        const y = height / 2;
        ctx.fillStyle = backColor;
        ctx.fillRect(0, 0, width, height);
        // ctx.shadowColor = 'rgba(0, 0, 0,0.9)';
        // // 将阴影向右移动15px，向上移动10px
        // ctx.shadowOffsetX = 1;
        // ctx.shadowOffsetY = 1;
        // // 轻微模糊阴影
        // ctx.shadowBlur = 2;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = textColor;
        ctx.font = 'bold ' + fontSize + 'px ' + fontFamily;
        ctx.fillText(text, x, y);

        src = canvas.toDataURL('image/png');
        if (src === 'data:,') {
            return "";
        }
        this.avatarCache[userId] = src;
        return src;
    }

    getAvatarText(name: string): string {
        if (!name) {
            return '';
        }
        const length = name.length;
        if (length === 2) {
            return name.substring(1, 2);
        } else if (length >= 3 && length <= 4) {
            return name.substring(length - 2, length);
        } else {
            return name.substring(0, 1);
        }
    }

    // 获取随机HSL
    getHsl(id: number): Array<number> {
        id = Math.abs(id);
        const H = (id % 100) / 100.0;
        const S = ((id / 100) % 100) / 100.0;
        const L = ((id / 10000) % 100) / 100.0;
        const ret = [H, S, L];
        ret[1] = 0.7 + (ret[1] * 0.2); // [0.7 - 0.9] 排除过灰颜色
        ret[2] = 0.4 + (ret[2] * 0.4); // [0.4 - 0.8] 排除过亮过暗色
        const retNew = [];
        // 数据转化到小数点后两位
        for (const item of ret) {
            retNew.push(parseFloat(item.toFixed(2)));
        }
        return retNew;
    }

    hashCode(strKey) {
        let hash = 0;
        for (let i = 0; i < strKey.length; i++) {
            hash = hash * 31 + strKey.charCodeAt(i);
            hash = this.intValue(hash);
        }
        return hash;
    }

    intValue(num: any) {
        /* tslint:disable:no-bitwise */
        const MAX_VALUE = 0x7fffffff;
        const MIN_VALUE = -0x80000000;
        if (num > MAX_VALUE || num < MIN_VALUE) {
            return num &= 0xFFFFFFFF;
        }
        return num;
        /* tslint:enable:no-bitwise */
    }

    /**
     * HSL颜色值转换为RGB
     * H，S，L 设定在 [0, 1] 之间
     * R，G，B 返回在 [0, 255] 之间
     *
     * @param H 色相
     * @param S 饱和度
     * @param L 亮度
     * @returns Array RGB色值
     */
    hslToRgb(H, S, L): Array<number> {
        let R;
        let G;
        let B;
        if (+S === 0) {
            R = G = B = L; // 饱和度为0 为灰色
        } else {
            const hue2Rgb = (p, q, t) => {
                if (t < 0) {
                    t += 1;
                }
                if (t > 1) {
                    t -= 1;
                }
                if (t < 1 / 6) {
                    return p + (q - p) * 6 * t;
                }
                if (t < 1 / 2) {
                    return q;
                }
                if (t < 2 / 3) {
                    return p + (q - p) * (2 / 3 - t) * 6;
                }
                return p;
            };
            const Q = L < 0.5 ? L * (1 + S) : L + S - L * S;
            const P = 2 * L - Q;
            R = hue2Rgb(P, Q, H + 1 / 3);
            G = hue2Rgb(P, Q, H);
            B = hue2Rgb(P, Q, H - 1 / 3);
        }
        return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)];
    }
}
