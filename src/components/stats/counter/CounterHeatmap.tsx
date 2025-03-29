import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "cal-heatmap/cal-heatmap.css";
import moment from "moment";
// @ts-expect-error - CalHeatmapLabel is not typed
import CalHeatmapLabel from "cal-heatmap/plugins/CalendarLabel";
// @ts-expect-error - CalHeatmapTooltip is not typed
import CalHeatmapTooltip from "cal-heatmap/plugins/Tooltip";
// @ts-expect-error - CalHeatmap is not typed
import CalHeatmap from "cal-heatmap";
import { useEffect, useRef, useState } from "react";
import { Habit } from "@/api/generated";
import { getColorRange, HabitColor, ExtendedHabit, ColorScheme } from "@/api/types/appTypes";
import { YearFilter } from "@/components/stats/YearFilter";
import { start } from "repl";
import { FontSizeIcon } from "@radix-ui/react-icons";

interface CounterHeatmapProps {
  readonly habit: Habit | ExtendedHabit;
  readonly startDay?: "Monday" | "Sunday";
  readonly containerId?: string;
  readonly filterYear?: string;
  readonly metric?: string;
}

export default function CounterHeatmap({ 
  habit, 
  startDay = "Sunday", 
  containerId = "counter-heatmap",
  filterYear = "Past year",
  metric = ""
}: CounterHeatmapProps) {
  const calRef = useRef<CalHeatmap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<string>(filterYear);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // 添加自定义的 tooltip 和 heat-map 样式到文档头部
  useEffect(() => {
    // 检查是否已存在样式表
    const styleId = "cal-heatmap-custom-tooltip";
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        #ch-tooltip {
          border-radius: 3px;
          text-align: left;
          color: black;
          background-color: #FFF;
        }
        
        #ch-tooltip-arrow {
          margin-left: 0px !important;
        }
        
        .dark #ch-tooltip {
          color: #f2f2f2;
          background-color: #333;
          background-image: linear-gradient(to bottom, #333, #222);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        #ch-tooltip .ch-tooltip-value {
          font-size: 12px;
          font-weight: bold;
          display: block;
          margin: 0px 0;
          padding: 0;
        }
        
        #ch-tooltip .ch-tooltip-date {
          font-size: 11px;
          color: #666;
          display: block;
          margin-bottom: 2px;
        }
        
        .dark #ch-tooltip .ch-tooltip-date {
          color: #bbb;
        }
        
        #ch-tooltip .ch-tooltip-message {
          font-size: 12px;
          font-style: italic;
          color: #333;
          display: block;
          margin-top: 2px;
        }
        
        .dark #ch-tooltip .ch-tooltip-message {
          color: #aaa;
        }
        
        /* 热力图格子hover动画和变换效果 */
        g rect.ch-subdomain-bg {
          outline: 1px solid rgba(32, 45, 52, .06);
          outline-offset: -1px;
          transition: transform 0.2s ease;
          transform-origin: center;
        }

        .dark g rect.ch-subdomain-bg {
          outline: 1px solid rgba(255, 255, 255, .06);
          outline-offset: -1px;
        }
        
        /* 动画时钟边框效果 */
        g:hover rect.ch-subdomain-bg {
          stroke-width: 0.5px !important;
          stroke:rgba(0, 0, 0, 0.5) !important;
          stroke-dasharray: 0 100;
          stroke-dashoffset: 0;
          animation: dash-animation 0.5s ease-in-out forwards;
        }
        
        @keyframes dash-animation {
          to {
            stroke-dasharray: 100 0;
          }
        }
        
        .dark g:hover rect.ch-subdomain-bg {
          stroke: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* 防止文本被选中 */
        .ch-plugin-calendar-label-text {
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          font-size: 12px !important;
          fill: var(--label) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // 清理时移除样式表
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // 获取可用的年份列表
  useEffect(() => {
    if (!habit || !habit.completedDates) return;
    
    const years = new Set<string>();
    // 添加"Past year"选项
    years.add("Past year");
    
    // 从数据中提取所有年份
    Object.keys(habit.completedDates).forEach(date => {
      const year = date.split("-")[0];
      years.add(year);
    });
    
    // 转换为数组，降序排列，确保Past year在首位
    const sortedYears = Array.from(years)
      .filter(year => year !== "Past year")
      .sort((a, b) => parseInt(b) - parseInt(a));
    
    setAvailableYears(["Past year", ...sortedYears]);
  }, [habit?.completedDates]);

  useEffect(() => {
    // 确保在组件挂载和卸载时正确处理热力图
    if (!habit || !containerRef.current) return;
    
    // 强制清除容器内所有内容
    containerRef.current.innerHTML = '';
    
    // 确保旧实例被销毁
    if (calRef.current) {
      try {
        calRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying previous heatmap:', e);
      }
      calRef.current = null;
    }
    
    // 引入延迟以确保DOM完全清理
    const timer = setTimeout(() => {
      if (!containerRef.current) return; // 防止组件已卸载的情况
      
      const cal = new CalHeatmap();
      calRef.current = cal;

      const data = Object.entries(habit.completedDates).map(
        ([date, completed]) => ({
          date,
          value: completed ? completed : 0,
        })
      );

      // 计算数据中的最大值，用于无目标习惯的颜色域设置
      const maxValue = data.reduce((max, item) => {
        return Math.max(max, item.value || 0);
      }, 0);

      // 获取度量单位（如果有）
      const extendedHabit = habit as ExtendedHabit;
      // const metricUnit = extendedHabit.metric || '';

      const getTooltipText = (
        timestamp: number,
        value: number | null,
        dayjsDate: { format: (format: string) => string }
      ) => {
        
        // 格式化日期为 "周几 月 日 年" 格式，例如 "Fri Aug 30 2024"
        const dateDisplay = dayjsDate.format("MMM D YYYY, ddd");
        
        let valueDisplay = '';
        let messageDisplay = '';
        
        // 设置数值显示和信息文本
        if (value === null) {
          valueDisplay = 'No data';
        } else if (!habit.targetCounter || habit.targetCounter <= 0) {
          // 没有目标的情况
          valueDisplay = `${value}${metric ? ` ${metric}` : ''}`;
        } else {
          // 有目标的情况
          
          if (value >= habit.targetCounter) { 
            // 达成目标
            valueDisplay = `✅ ${value} ${metric ? ` ${metric}` : ''}`;
          } else {
            // 未达成目标
            valueDisplay = `💪 ${value} ${metric ? ` ${metric}` : ''}`;
          }

        }
        messageDisplay = ' ';
        // 返回带有HTML格式的文本，模拟图片中的样式
        return `<div class="ch-tooltip-value">${valueDisplay}</div>
                <div class="ch-tooltip-date">${dateDisplay}</div>
                <div class="ch-tooltip-message">${messageDisplay}</div>`;
      };

      // 根据每周开始日期设置
      const weekStart = startDay === "Monday" ? 1 : 0;

      // 根据选择的过滤年份设置日期范围
      let startDate;
      let range=1;
      if (selectedYear === "Past year") {
        startDate = moment().subtract(365, 'days').startOf('day').toDate();
        range = 2;
      } else {
        // 确保显示的是用户选择的年份，不要用startOf('year')来避免时区问题
        startDate = new Date(`${selectedYear}-01-01`);
      }

      // 配置颜色方案
      const colorScheme = extendedHabit.colorScheme;
      let colorConfig: any;

      // 设置颜色域的阈值
      // 对于有目标的习惯，使用目标值作为最高阈值
      // 对于无目标的习惯，使用数据中的最大值作为阈值范围
      const isTargetDefined = habit.targetCounter && habit.targetCounter > 0;
      const maxThreshold = isTargetDefined ? habit.targetCounter : maxValue;
      
      // 如果maxThreshold为0（可能是空数据），设置为1避免除以0的错误
      const thresholdBase = maxThreshold || 1;
      
      // 设置四个阈值点：25%, 50%, 75%, 100%
      const thresholds = [
        0.25 * thresholdBase,
        0.5 * thresholdBase,
        0.75 * thresholdBase,
        thresholdBase
      ];

      if (colorScheme) {
        // 使用配色方案
        colorConfig = {
          scheme: colorScheme,
          type: "threshold",
          domain: thresholds,
        };
      } else {
        // 使用自定义颜色范围
        colorConfig = {
          range: getColorRange[habit.color as HabitColor],
          type: "threshold",
          domain: thresholds,
        };
      }

      // 检查是否需要显示完成标记（当 targetCounter 存在且大于 0 时）
      const shouldShowCheckmarks = habit.targetCounter && habit.targetCounter > 0;

      // 使用 subDomain.label 来显示完成标记
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelFunction = function(timestamp: number, value: any, element: SVGElement) {
        // 如果值为空或不需要显示标记，返回空字符串
        if (!shouldShowCheckmarks || value === null || value === undefined) {
          return '';
        }
        
        // 如果值达到或超过目标，显示线稿图案
        if (value >= habit.targetCounter!) {
          // 设置标签样式
          element.setAttribute('style', 'fill: hsl(var(--secondary)); font-size: 8px; pointer-events: none; user-select: none;');
          //return '✦';
          return '✦';
        }
        
        return '';
      };

      // 添加自定义的 pastDay 模板，仅显示过去365天的数据
      const pastDayTemplate = (DateHelper: any) => ({
        name: 'pastDay',
        parent: 'day',
        rowsCount: () => 7, // 一周7天
        
        columnsCount: (ts: number) => {
          // 获取当前处理的年份和当前年份
          const year = moment(ts).year();
          const currentYear = moment().year();
          const pastYearStart = moment().subtract(365, 'days').startOf('day');
          
          // 根据处理的年份确定起始日和结束日
          let startDay, endDay;
          if (year === currentYear - 1) { // 去年
            startDay = pastYearStart; // 过去365天的起始日
            endDay = moment(pastYearStart).endOf('year'); // 去年年底
          } else if (year === currentYear) { // 今年
            startDay = moment(year, 'YYYY').startOf('year'); // 今年1月1日
            endDay = moment(); // 今天
          } else {
            return 0; // 其他年份不处理
          }
          
          // 计算从起始日到结束日的天数
          const days = endDay.diff(startDay, 'days');
          
          // 调整起始日的星期几，考虑 weekStart
          const startDayOfWeek = startDay.day() - weekStart < 0 ? 
            startDay.day() + 6 : 
            startDay.day() - weekStart;
          
          // 计算周数，加1确保有足够的空间
          return Math.ceil((days + startDayOfWeek) / 7);
        },
        
        mapping: (startTimestamp: number, endTimestamp: number) => {
          // 获取当前处理的年份和当前年份
          const year = moment(startTimestamp).year();
          const currentYear = moment().year();
          const pastYearStart = moment().subtract(365, 'days').startOf('day');
          const today = moment().endOf('day');
          
          // 生成日期区间
          return DateHelper.intervals(
            'day',
            startTimestamp,
            DateHelper.date(endTimestamp)
          )
            .map((ts: number) => {
              const date = moment(ts);
              
              // 只处理过去365天到今天范围内的日期
              if (date.isBefore(pastYearStart) || date.isAfter(today)) {
                return null;
              }
              
              // 根据年份确定起始日
              let startDay;
              if (date.year() === currentYear - 1) { // 去年的日期
                startDay = pastYearStart; // 从过去365天的起始日计算
              } else if (date.year() === currentYear) { // 今年的日期
                startDay = moment(date).startOf('year'); // 从今年1月1日计算
              } else {
                return null; // 其他年份不处理
              }
              
              // 调整起始日的星期几，考虑 weekStart
              const startDayOfWeek = startDay.day() - weekStart < 0 ? 
                startDay.day() + 6 : 
                startDay.day() - weekStart;
              
              // 计算与起始日的天数差
              const dayDiff = date.diff(startDay, 'days');
              
              // 计算 x 坐标（列）
              const x = Math.floor((dayDiff + startDayOfWeek) / 7);
              
              // 计算 y 坐标（行）- 周几，使用简化公式
              const y = date.day() - weekStart < 0 ? 
                date.day() + 6 : 
                date.day() - weekStart;
              
              return {
                t: ts,
                x: x,
                y: y,
              };
            })
            .filter((n: any) => n !== null);
        },
      });

      // 添加自定义模板
      cal.addTemplates(pastDayTemplate);

      // 设置subdomain类型，根据是否是"Past year"来决定
      const subDomainType = selectedYear === "Past year" ? "pastDay" : "day";

      // 准备月份标签函数
      const getMonthLabels = () => {
        // 初始化结果数组，包含53列的空字符串
        const result = Array(53).fill('');
        
        // 确定起始日期
        let startDay;
        if (selectedYear === "Past year") {
          // Past year模式：从过去365天开始
          startDay = moment().subtract(365, 'days');
        } else {
          // 特定年份模式：从当年1月1日开始
          startDay = moment(`${selectedYear}-01-01`);
        }
        
        // 记录起始日期是星期几(0-6)，用于计算偏移量.考虑周开始日的情况，如果是周1开始，需要减去1，出现负数，则需要加7
        const startDayOfWeek = startDay.day() - weekStart < 0 ? startDay.day() - weekStart + 7 : startDay.day() - weekStart;
        
        // 确定当前月份，如果startDay不是月初，需要先添加当月标签
        let currentDate = startDay.clone();
        let monthsAdded = 0;
        const maxMonths = 12; // 最多添加12个月份标签
        
        // 如果startDay不是月初第一天，直接将其移动到下月第一天
        if (startDay.date() !== 1) {
          // 移动到下个月第一天
          currentDate = startDay.clone().add(1, 'month').startOf('month');
        }
        else {
          result[0] = startDay.format('MMM');
          monthsAdded++;
          currentDate = currentDate.add(1, 'month');
        }
        
        // 从startDay或下个月初开始，逐月添加标签
        while (monthsAdded < maxMonths) {
          // 计算当前日期与起始日期相差天数
          const daysDiff = currentDate.diff(startDay, 'days');
          
          // 计算对应的列位置 = (相差天数 + 起始日期的星期几) / 7
          const columnPosition = Math.floor((daysDiff + startDayOfWeek) / 7);
          
          // 如果列位置在有效范围内，添加月份标签
          if (columnPosition < 53 && columnPosition >= 0) {
            result[columnPosition] = currentDate.format('MMM');
            monthsAdded++;
          }
          
          // 移动到下一个月第一天
          currentDate = currentDate.add(1, 'month');
        }
        
        return result;
      };

      cal.paint(
        {
          itemSelector: containerRef.current,
          data: { source: data, x: "date", y: "value", groupBy: "max" },
          range: range,
          date: {
            start: startDate,
            locale: {
              weekStart: weekStart // 明确设置每周的第一天
            }
          },
          domain: {
            type: "year",
            sort: "asc",
            gutter: -13,
            label: { text: "" },
          },
          subDomain: {
            type: subDomainType,
            radius: 2,
            width: 13,
            height: 13,
            gutter: 4,
            // 正确处理日期排序，确保周开始日的正确设置
            sort: "asc",
            // 使用label函数显示完成标记，替代自定义渲染器
            label: shouldShowCheckmarks ? labelFunction : null,
          },
          scale: {
            color: colorConfig,
          },
          animationDuration: 0, // 禁用动画
        },
        [
          [
            CalHeatmapTooltip,
            {
              text: getTooltipText,
              // popper.js 配置选项
              placement: 'top',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 8],
                  },
                },
              ],
            },
          ],
          [
            CalHeatmapLabel,
            {
              width: 25,
              textAlign: "end",
              position: "left",
              key: "weekLabels",
              text: () => {
                const days = moment.weekdaysShort();
                // 根据起始日重新排序
                const reorderedDays = [...days.slice(weekStart), ...days.slice(0, weekStart)];
                // 固定显示周一、周三、周五
                return reorderedDays.map((d, i) => {
                  // 找出对应于周一、周三、周五的索引位置
                  const mondayIndex = weekStart === 1 ? 0 : 1;
                  const wednesdayIndex = weekStart === 1 ? 2 : 3;
                  const fridayIndex = weekStart === 1 ? 4 : 5;
                  
                  // 只在周一、周三、周五的位置显示文本
                  return i === mondayIndex || i === wednesdayIndex || i === fridayIndex ? d : "";
                });
              },
              padding: [0, 8, 0, 0],
            },
          ],
          [
            CalHeatmapLabel,
            {
              key: "monthLabels", // 唯一键标识
              position: "top",
              textAlign: "start",
              text: getMonthLabels,
              padding: [0, 0, 8, 0],
            },
          ],
        ]
      );
    }, 10);
    
    return () => {
      clearTimeout(timer);
      if (calRef.current) {
        try {
          calRef.current.destroy();
        } catch (e) {
          console.warn('Error in cleanup:', e);
        }
        calRef.current = null;
      }
    };
  }, [habit?.completedDates, habit?.targetCounter, habit?.color, startDay, containerId, selectedYear, metric]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{habit.name || "Yearly Heatmap"}</CardTitle>
          <CardDescription>
            {(habit as any).description || (habit.targetCounter && habit.targetCounter > 0 
              ? `Daily Target: ${habit.targetCounter}${(habit as ExtendedHabit).metric || ''}`
              : "Daily Record (No Target)")}
          </CardDescription>
        </div>
        <YearFilter 
          availableYears={availableYears}
          selectedYear={selectedYear}
          onYearSelect={setSelectedYear}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div ref={containerRef} id={containerId} className="w-full flex justify-center"></div>
      </CardContent>
    </Card>
  );
}
