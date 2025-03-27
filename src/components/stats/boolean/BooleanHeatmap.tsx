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
import { CalendarIcon } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface BooleanHeatmapProps {
  readonly habit: Habit;
  readonly startDay?: "Monday" | "Sunday";
  readonly containerId?: string;
  readonly filterYear?: string;
}

export default function BooleanHeatmap({ 
  habit, 
  startDay = "Sunday", 
  containerId = "boolean-heatmap",
  filterYear = "Past 365d"
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
    // 添加"Past 365d"选项
    years.add("Past 365d");
    
    // 从数据中提取所有年份
    Object.keys(habit.completedDates).forEach(date => {
      const year = date.split("-")[0];
      years.add(year);
    });
    
    // 转换为数组，降序排列，确保Past 365d在首位
    const sortedYears = Array.from(years)
      .filter(year => year !== "Past 365d")
      .sort((a, b) => parseInt(b) - parseInt(a));
    
    setAvailableYears(["Past 365d", ...sortedYears]);
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
    moment.updateLocale('en', { 
      week: { 
        dow: weekStart,  // 设置每周开始日
        doy: 7 + weekStart // 确保年份的第一周正确计算
      } 
    });

    // 根据选择的过滤年份设置日期范围
    let startDate, endDate;
    if (selectedYear === "Past 365d") {
      endDate = moment().toDate();
      startDate = moment().subtract(365, 'days').toDate();
    } else {
      startDate = moment(`${selectedYear}-01-01`).toDate();
      endDate = moment(`${selectedYear}-12-31`).toDate();
    }

    cal.paint(
      {
        itemSelector: containerRef.current,
        data: { source: data, x: "date", y: "value" },
        date: {
          start: startDate,
          end: endDate,
          // 禁用动画
          highlight: 'none',
          locale: {
            firstWeekday: weekStart // 明确设置每周的第一天
          }
        },
        domain: {
          type: "month",
          sort: "asc",
          label: { text: "MMM", textAlign: "start", position: "top" },
        },
        subDomain: {
          type: "ghDay",
          radius: 2,
          width: 12,
          height: 12,
          gutter: 4,
          // 正确处理日期排序，确保周开始日的正确设置
          sort: "asc",
          shift: {
            day: weekStart // 明确设置周开始日
          }
        },
        scale: {
          color: {
            range: [theme === "dark" ? "#161b22" : "#EDEDED", habit.color],
            interpolate: "hsl",
            type: "linear",
            domain: [0, 1],
          },
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
              return reorderedDays.map((d, i) => (i % 2 == 0 ? "" : d));
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

  // 处理年份选择
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Yearly Heatmap</CardTitle>
          <CardDescription>
            Your habit completion throughout the year
          </CardDescription>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Filter by year</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex flex-col p-2 space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium text-gray-500 border-b">Filter by year</div>
              {availableYears.map(year => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => handleYearSelect(year)}
                >
                  {selectedYear === year && (
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  )}
                  {year}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div ref={containerRef} id={containerId} className="w-full flex justify-center"></div>
      </CardContent>
    </Card>
  );
}
