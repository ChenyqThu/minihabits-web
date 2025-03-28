/**
 * 格式化数值，保留指定位数的小数
 * @param value 数值
 * @param digits 小数位数，默认为2
 * @returns 格式化后的数值字符串
 */
export function formatNumber(value: number, digits: number = 2): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(digits);
}

/**
 * 格式化包含单位的数值
 * @param value 数值
 * @param unit 单位 (可选)
 * @param digits 小数位数，默认为2
 * @returns 格式化后的带单位的字符串
 */
export function formatNumberWithUnit(value: number, unit?: string, digits: number = 2): string {
  const formattedValue = formatNumber(value, digits);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * 将字符串解析为数字
 * @param value 要解析的字符串
 * @returns 解析后的数字，如果无法解析则返回0
 */
export function parseNumberInput(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
} 