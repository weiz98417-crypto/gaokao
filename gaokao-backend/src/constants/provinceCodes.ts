/**
 * 省份名称与行政区划代码映射（GB/T 2260）
 *
 * 本文件同时被后端源码与 prisma/seed.ts 引用，保证名称-代码转换单一来源。
 */

export const PROVINCE_CODE_MAP: Record<string, string> = {
  北京市: '11',
  天津市: '12',
  河北省: '13',
  山西省: '14',
  内蒙古自治区: '15',
  辽宁省: '21',
  吉林省: '22',
  黑龙江省: '23',
  上海市: '31',
  江苏省: '32',
  浙江省: '33',
  安徽省: '34',
  福建省: '35',
  江西省: '36',
  山东省: '37',
  河南省: '41',
  湖北省: '42',
  湖南省: '43',
  广东省: '44',
  广西壮族自治区: '45',
  海南省: '46',
  重庆市: '50',
  四川省: '51',
  贵州省: '52',
  云南省: '53',
  西藏自治区: '54',
  陕西省: '61',
  甘肃省: '62',
  青海省: '63',
  宁夏回族自治区: '64',
  新疆维吾尔自治区: '65',
};

export const PROVINCE_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_CODE_MAP).map(([name, code]) => [code, name])
);

/**
 * 根据省份中文名获取行政区划代码
 * @param name 省份中文名（支持简称，如 北京、广东、内蒙古）
 * @returns 行政区划代码，未知时返回 '00'
 */
export function getProvinceCode(name: string): string {
  const normalized = normalizeProvinceName(name);
  return PROVINCE_CODE_MAP[normalized] ?? '00';
}

/**
 * 省份名称归一化：将简称/不完整名称转为标准全称
 * @param name 原始省份名
 * @returns 标准省份名
 */
function normalizeProvinceName(name: string): string {
  const trimmed = name.trim();

  // 已是全称
  if (PROVINCE_CODE_MAP[trimmed]) {
    return trimmed;
  }

  // 直辖市
  const municipalities = ['北京', '天津', '上海', '重庆'];
  if (municipalities.includes(trimmed)) {
    return `${trimmed}市`;
  }

  // 自治区
  const autonomousRegions: Record<string, string> = {
    内蒙古: '内蒙古自治区',
    广西: '广西壮族自治区',
    西藏: '西藏自治区',
    宁夏: '宁夏回族自治区',
    新疆: '新疆维吾尔自治区',
  };
  if (autonomousRegions[trimmed]) {
    return autonomousRegions[trimmed];
  }

  // 普通省份：尝试加 "省"
  const withProvince = `${trimmed}省`;
  if (PROVINCE_CODE_MAP[withProvince]) {
    return withProvince;
  }

  return trimmed;
}

/**
 * 根据行政区划代码获取省份中文名
 * @param code 行政区划代码
 * @returns 省份中文名，未知时返回 undefined
 */
export function getProvinceName(code: string): string | undefined {
  return PROVINCE_NAME_BY_CODE[code];
}
