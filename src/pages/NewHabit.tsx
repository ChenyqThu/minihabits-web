import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "../api/hooks/useHabits";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { HabitColor, HabitType, ColorScheme } from "../api/types/appTypes";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ColorPicker } from "../components/color-picker";
import moment from "moment";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import BooleanHeatmap from "../components/stats/boolean/BooleanHeatmap";
import CounterHeatmap from "../components/stats/counter/CounterHeatmap";
import { createMockHabit } from "../utils/sampleDataGenerator";
import { Checkbox } from "../components/ui/checkbox";

const getRandomColor = () => {
  const colors = Object.values(HabitColor);
  return colors[Math.floor(Math.random() * colors.length)];
};

// 预览热力图的包装器组件
function PreviewHeatmap({ 
  type, 
  color, 
  startDay,
  name,
  metric,
  mockHabit
}: { 
  type: HabitType; 
  color: HabitColor; 
  startDay: "Monday" | "Sunday";
  name: string;
  metric?: string;
  mockHabit: any; // 模拟数据从外部传入
}) {
  // 使用不同的元素包装热力图，避免ID冲突
  return (
    <div className="preview-heatmap-wrapper">
      {type === HabitType.BOOLEAN ? (
        <div key="boolean-preview">
          <BooleanHeatmap 
            habit={mockHabit} 
            startDay={startDay} 
            containerId="preview-boolean-heatmap" 
            filterYear="Past year"
          />
        </div>
      ) : (
        <div key="counter-preview">
          <CounterHeatmap 
            habit={mockHabit} 
            startDay={startDay} 
            containerId="preview-counter-heatmap" 
            filterYear="Past year"
            metric={metric}
          />
        </div>
      )}
    </div>
  );
}

export function NewHabit() {
  const [name, setName] = useState("");
  const [color, setColor] = useState<HabitColor>(getRandomColor());
  const [colorScheme, setColorScheme] = useState<ColorScheme | undefined>(undefined);
  const [type, setType] = useState<HabitType>(HabitType.BOOLEAN);
  const [targetCounter, setTargetCounter] = useState<number>(10);
  const [recordOnly, setRecordOnly] = useState<boolean>(false);
  const [metric, setMetric] = useState<string>("");
  const [startDay, setStartDay] = useState<"Monday" | "Sunday">("Sunday");
  const [isLoading, setIsLoading] = useState(false);
  const { createHabit } = useHabits();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 当切换"仅记录"选项时，更新 targetCounter
  useEffect(() => {
    if (recordOnly) {
      setTargetCounter(0);
    } else if (targetCounter === 0) {
      setTargetCounter(10);
    }
  }, [recordOnly]);

  // 仅在type、targetCounter、color或colorScheme变化时生成模拟数据
  const mockHabit = useMemo(() => {
    // 使用样本数据生成器创建模拟习惯数据
    const habit = createMockHabit(
      type, 
      color, 
      type === HabitType.COUNTER ? targetCounter : 1, 
      colorScheme,
      metric // 传递度量单位
    );
    
    // 创建显示名称和描述
    const displayName = name.trim() || "Habit Tracker";
    let description = "";
    
    if (type === HabitType.BOOLEAN) {
      description = "Daily completion tracking";
    } else if (type === HabitType.COUNTER) {
      if (recordOnly || targetCounter === 0) {
        description = "";
      } else {
        description = `Target: ${targetCounter}${metric ? ` ${metric}` : ""} per day`;
      }
    }
    
    // 添加名称和描述到模拟习惯
    habit.name = displayName;
    (habit as any).description = description;
    
    return habit;
  }, [type, targetCounter, color, colorScheme, recordOnly, metric]);
  
  // 更新其他属性，但不重新生成数据
  const previewData = useMemo(() => {
    const updatedHabit = { ...mockHabit };
    updatedHabit.name = name.trim() || "Habit Tracker";
    
    let description = "";
    if (type === HabitType.BOOLEAN) {
      description = "Daily completion tracking";
    } else if (type === HabitType.COUNTER) {
      if (recordOnly || targetCounter === 0) {
        description = "";
      } else {
        description = `Target: ${targetCounter}${metric ? ` ${metric}` : ""} per day`;
      }
    }
    (updatedHabit as any).description = description;
    
    return updatedHabit;
  }, [mockHabit, name, metric, type, targetCounter, recordOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !color) {
      toast({
        title: "Missing required fields",
        description: "Please provide both a habit name and select a color.",
        variant: "destructive",
      });
      return;
    }

    if (type === HabitType.COUNTER && !recordOnly && (!targetCounter || targetCounter <= 0)) {
      toast({
        title: "Invalid target counter",
        description: "Please provide a target counter greater than 0 for counter type habits.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createHabit(
        name,
        color,
        type,
        type === HabitType.COUNTER ? (recordOnly ? 0 : targetCounter) : undefined,
        colorScheme, // 传递配色方案
        metric, // 传递度量单位
        startDay // 传递周开始日
      );
      toast({
        title: "Habit created",
        description: "Your new habit has been created successfully.",
      });
      navigate("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理配色方案选择
  const handleSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    // 当选择了配色方案时，清除单色选择
    // 这是可选的，取决于您希望如何处理两者之间的关系
    // setColor(undefined);
  };

  // 处理单色选择
  const handleColorChange = (selectedColor: HabitColor) => {
    setColor(selectedColor);
    // 当选择了单色时，清除配色方案
    setColorScheme(undefined);
  };

  // 使用 useMemo 配合 key 属性来避免同时创建多个热力图组件
  const previewComponent = useMemo(() => (
    <PreviewHeatmap
      key={`preview-${type}-${Date.now()}`}
      type={type}
      color={color}
      startDay={startDay}
      name={name}
      metric={metric}
      mockHabit={previewData}
    />
  ), [type, color, startDay, name, metric, previewData]);

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-8">
      <div className="max-w-[1050px] mx-auto">
        <h1 className="text-2xl font-bold mx-6 mt-6 mb-4">Track a new habit</h1>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="name">Enter a title for your habit:</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Reading Tracker"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Choose a type:</Label>
              <RadioGroup
                value={type}
                onValueChange={(value: HabitType) => setType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="border rounded-md p-4 text-left">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={HabitType.BOOLEAN} id="boolean" />
                    <Label htmlFor="boolean" className="font-medium">Check</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Simple completion tracking - did you do it or not?
                  </p>
                </div>
                <div className="border rounded-md p-4 text-left">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={HabitType.COUNTER} id="counter" />
                    <Label htmlFor="counter" className="font-medium">Number</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track specific quantities like distance, time, or repetitions
                  </p>
                </div>
              </RadioGroup>
            </div>

            {type === HabitType.COUNTER && (
              <div className="space-y-4">                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetCounter">Target number:</Label>
                    <Input
                      id="targetCounter"
                      type="number"
                      min="1"
                      step="1"
                      value={recordOnly ? 0 : targetCounter}
                      onChange={(e) => setTargetCounter(parseFloat(e.target.value))}
                      placeholder="e.g., 30"
                      disabled={isLoading || recordOnly}
                      required={!recordOnly}
                    />
                    <div className="flex items-center space-x-2 mt-1">
                      <Checkbox 
                        id="recordOnly" 
                        checked={recordOnly}
                        onCheckedChange={(checked) => setRecordOnly(checked === true)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="recordOnly" className="text-xs cursor-pointer">
                        Record Only (No Target)
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metric">Metric unit:</Label>
                    <Input
                      id="metric"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      placeholder="e.g., minutes"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional unit to track (km, minutes, etc.)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="startDay">Pick a day to start your week:</Label>
              <Select
                value={startDay}
                onValueChange={(value: "Monday" | "Sunday") => setStartDay(value)}
              >
                <SelectTrigger id="startDay" className="text-left">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pick a color or scheme:</Label>
              <div className="text-left">
                <ColorPicker
                  value={color}
                  onChange={handleColorChange}
                  onSchemeChange={handleSchemeChange}
                  selectedScheme={colorScheme}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md text-left">
                {previewComponent}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading} 
            onClick={handleSubmit}
            className="w-full rounded-sm sm:w-auto"
          >
            {isLoading ? "Creating..." : "Create Habit"}
          </Button>
        </CardFooter>
      </div>
    </div>
  );
}
