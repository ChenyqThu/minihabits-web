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
import { useTheme } from "@/components/theme-provider";
import { YearFilter } from "@/components/stats/YearFilter";
import { ExtendedHabit, ColorScheme } from "@/api/types/appTypes";

interface BooleanHeatmapProps {
  readonly habit: Habit | ExtendedHabit;
  readonly startDay?: "Monday" | "Sunday";
  readonly containerId?: string;
  readonly filterYear?: string;
}

export default function BooleanHeatmap({ 
  habit, 
  startDay = "Sunday", 
  containerId = "boolean-heatmap",
  filterYear = "Past year"
}: BooleanHeatmapProps) {
  const { theme } = useTheme();
  const calRef = useRef<CalHeatmap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<string>(filterYear);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

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
        value: completed ? 1 : 0,
      })
    );

    const getTooltipText = (
      value: number | null,
      date: { format: (format: string) => string }
    ) => {
      const status = value ? "Completed" : "No data";
      return `${status} on ${date.format("LL")}`;
    };

    // 根据每周开始日期设置
    const weekStart = startDay === "Monday" ? 1 : 0;

    // 根据选择的过滤年份设置日期范围
    let startDate;
    let monthRange=12;
    if (selectedYear === "Past year") {
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      monthRange = 13;
    } else {
      startDate = new Date(`${selectedYear}-01-01`);
    }

    // 配置颜色方案
    const extendedHabit = habit as ExtendedHabit;
    const colorScheme = extendedHabit.colorScheme;
    let colorConfig: any;

    if (colorScheme) {
      // 使用配色方案
      colorConfig = {
        scheme: colorScheme,
        type: "linear",
        domain: [0, 1]
      };
    } else {
      // 使用自定义颜色
      colorConfig = {
        range: [theme === "dark" ? "#161b22" : "#EDEDED", habit.color],
        interpolate: "hsl",
        type: "linear",
        domain: [0, 1],
      };
    }

    cal.paint(
      {
        itemSelector: containerRef.current,
        data: { source: data, x: "date", y: "value" },
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
          sort: "asc"
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
            text: (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              _: any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              value: any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dayjsDate: any
            ) => getTooltipText(value, dayjsDate),
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
  }, [habit?.completedDates, habit, theme, startDay, containerId, selectedYear]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{habit.name || "Yearly Heatmap"}</CardTitle>
          <CardDescription>
            {(habit as any).description || "Your habit completion throughout the year"}
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
