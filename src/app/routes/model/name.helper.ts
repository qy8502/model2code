/**
 * 驼峰式
 */
export function toCamel(str) {
  str = str.replace(/([^_])(?:_+([^_]))/g, ($0, $1, $2) => {
    return $1 + $2.toUpperCase();
  });
  return str.substring(0, 1).toLowerCase() + str.substring(1);
}

export function toAbbr(str) {
  if (!str)
    return str;
//  let temp = str.replace(/[A-Z]/g, (match) => {
  const temp = str.replace(/([A-Z]+(?![a-z]))|([A-Z])/g, (match) => {
    return " " + match;
  });
  const matches = temp.match(/\b(\w)/g);
  const abbr = matches.join('').toUpperCase();
  return abbr;
}

export function toAbbrLower(str) {
  if (!str)
    return str;
  return toAbbr(str).toLowerCase();
}

/**
 * 首字母大写驼峰式
 */
export function toPascal(str) {
  str = toCamel(str);
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * 小写横线分隔
 */
export function toLowerLine(str) {
//  let temp = str.replace(/[A-Z]/g, (match) => {
  let temp = str.replace(/([A-Z]+(?![a-z]))|([A-Z])/g, (match) => {
    return "-" + match.toLowerCase();
  });
  if (temp.slice(0, 1) === '-') { // 如果首字母是大写，执行replace时会多一个_，这里需要去掉
    temp = temp.slice(1);
  }
  return temp;
}

/**
 * 小写下划线分隔
 */
export function toLowerUnderline(str) {
  // let temp = str.replace(/[A-Z]/g, (match) => {
  let temp = str.replace(/([A-Z]+(?![a-z]))|([A-Z])/g, (match) => {
    return "_" + match.toLowerCase();
  });
  if (temp.slice(0, 1) === '_') { // 如果首字母是大写，执行replace时会多一个_，这里需要去掉
    temp = temp.slice(1);
  }
  return temp;
}

/**
 * 大写下划线分隔
 */
export function toUpperUnderline(str) {
  return toLowerUnderline(str).toUpperCase();
}


/**
 * 根据名称获取颜色
 */
export function nameToColor(name: string): string {
  const hsl = getHsl(hashCode(name));
  return 'rgb(' + hslToRgb(hsl[0], hsl[1], hsl[2]).toString() + ')';
}

export function nameToLightColor(name: string): string {
  const hsl = getHsl(hashCode(name));
  return 'rgb(' + hslToRgb(hsl[0], hsl[1], hsl[2]).toString() + ',0.04)';
}


/**
 * 获取随机HSL
 */
function getHsl(id: number): Array<number> {
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

function hashCode(strKey) {
  let hash = 0;
  for (let i = 0; i < strKey.length; i++) {
    hash = hash * 31 + strKey.charCodeAt(i);
    hash = intValue(hash);
  }
  return hash;
}

function intValue(num: any) {
  const MAX_VALUE = 0x7fffffff;
  const MIN_VALUE = -0x80000000;
  if (num > MAX_VALUE || num < MIN_VALUE) {
    // Forbidden bitwise operation
    return num &= 0xFFFFFFFF; // tslint:disable-line
  }
  return num;
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
function hslToRgb(H, S, L): Array<number> {
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
