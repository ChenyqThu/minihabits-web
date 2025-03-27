import { Habit } from "../api/generated";
import { HabitColor, HabitType } from "../api/types/appTypes";

/**
 * 生成从指定起始日期到当前日期的样本数据
 * @param type 习惯类型（boolean或counter）
 * @param startDate 起始日期，默认为2023年1月1日
 * @param endDate 结束日期，默认为当天
 * @returns 日期与完成情况的映射对象
 */
export function generateSampleData(
  type: HabitType,
  startDate: string = "2023-01-01",
  endDate: string = new Date().toISOString().split("T")[0]
): Record<string, number> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data: Record<string, number> = {};
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split("T")[0];
    const dayOfWeek = currentDate.getDay(); // 0 是周日，6 是周六
    const month = currentDate.getMonth(); // 0-11 表示一月到十二月
    
    if (type === HabitType.BOOLEAN) {
      // 生成更符合真实习惯的数据模式
      let completionProbability = 0.7; // 基础完成概率
      
      // 周末完成率较低
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        completionProbability -= 0.2;
      }
      
      // 春季（3-5月）完成率较高
      if (month >= 2 && month <= 4) {
        completionProbability += 0.1;
      }
      
      // 冬季（12-2月）完成率较低
      if (month === 11 || month === 0 || month === 1) {
        completionProbability -= 0.1;
      }
      
      // 每月初（1-5日）完成率较高（新月新气象）
      const dayOfMonth = currentDate.getDate();
      if (dayOfMonth <= 5) {
        completionProbability += 0.1;
      }
      
      // 确保概率在0-1范围内
      completionProbability = Math.max(0, Math.min(1, completionProbability));
      
      data[dateString] = Math.random() < completionProbability ? 1 : 0;
    } else if (type === HabitType.COUNTER) {
      // 计数类型数据生成
      let baseValue: number;
      
      // 工作日（1-5）通常计数较高
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        baseValue = Math.floor(Math.random() * 6) + 5; // 5-10
      } else {
        // 周末计数较低
        baseValue = Math.floor(Math.random() * 5); // 0-4
      }
      
      // 夏季（6-8月）计数会略高
      if (month >= 5 && month <= 7) {
        baseValue = Math.min(10, baseValue + 2);
      }
      
      // 偶尔的"完美日"
      if (Math.random() < 0.1) {
        baseValue = 10;
      }
      
      // 偶尔的"失败日"
      if (Math.random() < 0.05) {
        baseValue = 0;
      }
      
      data[dateString] = baseValue;
    }
    
    // 前进一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 创建连续性模式（连续几天完成/未完成）
  const streakProbability = 0.3; // 发生连续性的概率
  const maxStreakLength = 5; // 最大连续长度
  
  const dateKeys = Object.keys(data).sort();
  for (let i = 0; i < dateKeys.length - 1; i++) {
    if (Math.random() < streakProbability) {
      const streakLength = Math.floor(Math.random() * maxStreakLength) + 2;
      const streakValue = type === HabitType.BOOLEAN ? 
        (Math.random() > 0.7 ? 1 : 0) : 
        Math.floor(Math.random() * 11);
      
      for (let j = 0; j < streakLength && i + j < dateKeys.length; j++) {
        data[dateKeys[i + j]] = streakValue;
      }
      
      i += streakLength - 1;
    }
  }
  
  return data;
}

/**
 * 为预览创建模拟习惯数据
 * @param type 习惯类型
 * @param color 习惯颜色
 * @param targetCounter 目标计数（对于计数型习惯）
 * @returns 模拟的习惯对象
 */
export function createMockHabit(
  type: HabitType,
  color: HabitColor,
  targetCounter: number = 1
): Habit {
  return {
    _id: type === HabitType.BOOLEAN ? "preview-boolean-habit" : "preview-counter-habit",
    name: "Preview Habit",
    type: type,
    color: color,
    targetCounter: targetCounter,
    completedDates: generateSampleData(type),
    createdAt: new Date().toISOString(),
    userId: "preview-user",
    currentStreak: 14,
    longestStreak: 20
  } as Habit;
} 