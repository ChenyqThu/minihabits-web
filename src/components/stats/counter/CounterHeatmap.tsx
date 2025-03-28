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

interface CounterHeatmapProps {
  readonly habit: Habit | ExtendedHabit;
  readonly startDay?: "Monday" | "Sunday";
  readonly containerId?: string;
  readonly filterYear?: string;
}

export default function CounterHeatmap({ 
  habit, 
  startDay = "Sunday", 
  containerId = "counter-heatmap",
  filterYear = "Past year"
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
          padding: 5px 8px;
          border-radius: 5px;
          min-width: 80px;
          max-width: 150px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
          font-size: 12px;
          line-height: 1.4;
          text-align: left;
          color: black;
          background-color: #FFF;
        }
        
        .dark #ch-tooltip {
          color: #f2f2f2;
          background-color: #333;
          background-image: linear-gradient(to bottom, #333, #222);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        #ch-tooltip.yellow-tooltip {
          background-color: #AAA;
          background-image: linear-gradient(to bottom, #FFF8DC, #FFE87C);
          border-color: #FFD700;
        }
        
        #ch-tooltip.blue-tooltip {
          background-color: #E6F2FF;
          background-image: linear-gradient(to bottom, #E6F2FF, #B3D9FF);
          border-color: #4D94FF;
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
    if (!habit) return;

    // 清除旧的 SVG 元素
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // 如果存在旧的实例，先销毁
    if (calRef.current) {
      calRef.current.destroy();
    }

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
    const metricUnit = extendedHabit.metric || '';

    const getTooltipText = (
      timestamp: number,
      value: number | null,
      dayjsDate: { format: (format: string) => string }
    ) => {
      if (value === null) return "No data";
      
      // 格式化日期为 "周几 月 日 年" 格式，例如 "Fri Aug 30 2024"
      const dateDisplay = dayjsDate.format("MMM D YYYY, ddd");
      
      let valueDisplay = '';
      let messageDisplay = '';
      
      // 设置数值显示和信息文本
      if (!habit.targetCounter || habit.targetCounter <= 0) {
        // 没有目标的情况
        valueDisplay = `${value}${metricUnit ? ` ${metricUnit}` : ''}`;
        messageDisplay = 'Your daily habit journal will appear here!';
      } else {
        // 有目标的情况
        
        if (value >= habit.targetCounter) { 
          // 达成目标
          valueDisplay = `✅ ${value} / ${habit.targetCounter} ${metricUnit ? ` ${metricUnit}` : ''}`;
        } else {
          // 未达成目标
          valueDisplay = `💪 ${value} / ${habit.targetCounter} ${metricUnit ? ` ${metricUnit}` : ''}`;
        }

        messageDisplay = 'your daily habit journal will appear here!';
      }
      
      // 返回带有HTML格式的文本，模拟图片中的样式
      return `<div class="ch-tooltip-value">${valueDisplay}</div>
              <div class="ch-tooltip-date">${dateDisplay}</div>
              <div class="ch-tooltip-message">${messageDisplay}</div>`;
    };

    // 根据每周开始日期设置
    const weekStart = startDay === "Monday" ? 1 : 0;

    // 根据选择的过滤年份设置日期范围
    let startDate;
    let monthRange=12;
    if (selectedYear === "Past year") {
      startDate = moment().subtract(365, 'days').startOf('day').toDate();
      monthRange = 13;
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
      
      // 如果值达到或超过目标，显示✓
      if (value >= habit.targetCounter!) {
        // 可以设置标签样式
        element.setAttribute('font-size', '12px');
        element.setAttribute('style', 'fill: #fff;');
        element.setAttribute('font-weight', 'bold');
        element.setAttribute('text-anchor', 'middle');
        element.setAttribute('dominant-baseline', 'middle');
        return '✓';
      }
      
      return '';
    };

    // 设置tooltip主题类 - 根据habit颜色
    const getTooltipTheme = (timestamp: number, value: number) => {
      // 根据习惯颜色确定tooltip类
      if (habit.color === HabitColor.YELLOW || 
          habit.color === HabitColor.ORANGE) {
        return 'yellow-tooltip';
      } else if (habit.color === HabitColor.BLUE ||
                habit.color === HabitColor.TEAL) {
        return 'blue-tooltip';
      }
      return '';
    };

    // 添加带有自定义数据属性的渲染函数，用于根据完成率设置边框样式
    const renderSubDomainData = (element: SVGElement, timestamp: number, value: number | null) => {
      if (value === null || !habit.targetCounter || habit.targetCounter <= 0) return;
      
      const parent = element.parentNode as SVGElement;
      if (!parent) return;
      
      // 计算完成率（大于100%按100%计算）
      const completionRate = Math.min(value / habit.targetCounter, 1) * 100;
      
      // 根据完成率设置不同的数据属性
      if (completionRate < 30) {
        parent.setAttribute('data-completion', 'low');
      } else if (completionRate < 70) {
        parent.setAttribute('data-completion', 'medium');
      } else if (completionRate < 100) {
        parent.setAttribute('data-completion', 'high');
      } else {
        parent.setAttribute('data-completion', 'complete');
      }
      
      // 设置dash-array动画角度值，基于完成率
      parent.style.setProperty('--completion-angle', `${completionRate * 3.6}deg`);
    };

    cal.paint(
      {
        itemSelector: containerRef.current,
        data: { source: data, x: "date", y: "value", groupBy: "max" },
        range: monthRange,
        date: {
          start: startDate,
          // 禁用动画
          highlight: 'none',
          locale: {
            weekStart: weekStart // 明确设置每周的第一天
          }
        },
        domain: {
          type: "month",
          sort: "asc",
          gutter: -13,
          label: { text: "MMM", textAlign: "start", position: "top" },
        },
        subDomain: {
          type: "day",
          radius: 2,
          width: 13,
          height: 13,
          gutter: 4,
          // 正确处理日期排序，确保周开始日的正确设置
          sort: "asc",
          // 使用label函数显示完成标记，替代自定义渲染器
          label: shouldShowCheckmarks ? labelFunction : null,
          // 添加自定义数据渲染器
          data: renderSubDomainData,
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
            className: getTooltipTheme,
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
            width: 30,
            textAlign: "start",
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
            padding: [25, 0, 0, 0],
          },
        ],
      ]
    );

    return () => {
      if (calRef.current) {
        calRef.current.destroy();
        calRef.current = null;
      }
    };
  }, [habit?.completedDates, habit?.targetCounter, habit?.color, startDay, containerId, selectedYear]);

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
