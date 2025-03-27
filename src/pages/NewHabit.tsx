import { useState } from "react";
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
import { HabitColor, HabitType } from "../api/types/appTypes";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ColorPicker } from "../components/color-picker";
import moment from "moment";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import BooleanHeatmap from "../components/stats/boolean/BooleanHeatmap";
import CounterHeatmap from "../components/stats/counter/CounterHeatmap";
import { createMockHabit } from "../utils/sampleDataGenerator";

const getRandomColor = () => {
  const colors = Object.values(HabitColor);
  return colors[Math.floor(Math.random() * colors.length)];
};

// 预览热力图的包装器组件
function PreviewHeatmap({ 
  type, 
  color, 
  targetCounter, 
  startDay 
}: { 
  type: HabitType; 
  color: HabitColor; 
  targetCounter: number; 
  startDay: "Monday" | "Sunday"; 
}) {
  // 使用样本数据生成器创建模拟习惯数据
  const mockHabit = createMockHabit(type, color, targetCounter || 1);

  // 使用不同的元素包装热力图，避免ID冲突
  return (
    <div className="preview-heatmap-wrapper">
      {type === HabitType.BOOLEAN ? (
        <div key="boolean-preview">
          <BooleanHeatmap 
            habit={mockHabit} 
            startDay={startDay} 
            containerId="preview-boolean-heatmap" 
            filterYear="Past 365d"
          />
        </div>
      ) : (
        <div key="counter-preview">
          <CounterHeatmap 
            habit={mockHabit} 
            startDay={startDay} 
            containerId="preview-counter-heatmap" 
            filterYear="Past 365d"
          />
        </div>
      )}
    </div>
  );
}

export function NewHabit() {
  const [name, setName] = useState("");
  const [color, setColor] = useState<HabitColor>(getRandomColor());
  const [type, setType] = useState<HabitType>(HabitType.BOOLEAN);
  const [targetCounter, setTargetCounter] = useState<number>(1);
  const [metric, setMetric] = useState<string>("");
  const [startDay, setStartDay] = useState<"Monday" | "Sunday">("Sunday");
  const [isLoading, setIsLoading] = useState(false);
  const { createHabit } = useHabits();
  const navigate = useNavigate();
  const { toast } = useToast();

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

    if (type === HabitType.COUNTER && (!targetCounter || targetCounter <= 0)) {
      toast({
        title: "Invalid target counter",
        description: "Please provide a target counter greater than 0 for counter type habits.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createHabit(
        name,
        color,
        type,
        type === HabitType.COUNTER ? targetCounter : undefined
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

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-8">
      <Card className="max-w-[1000px] mx-auto">
        <h1 className="text-2xl font-bold mx-6 mt-6 mb-4">Track a new habit</h1>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="name">Enter a title for your habit:</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Read for 10 minutes"
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
              <div className="space-y-2">
                <Label htmlFor="metric">Choose a metric, i.e. kilometer, minute, step:</Label>
                <Input
                  id="metric"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  placeholder="e.g., kilometer, minute, step"
                  disabled={isLoading}
                />
              </div>
            )}

            {type === HabitType.COUNTER && (
              <div className="space-y-2">
                <Label htmlFor="targetCounter">Target {metric ? metric : "number"}:</Label>
                <Input
                  id="targetCounter"
                  type="number"
                  min="1"
                  value={targetCounter}
                  onChange={(e) => setTargetCounter(parseInt(e.target.value))}
                  placeholder={`e.g., 5 ${metric}`}
                  disabled={isLoading}
                  required
                />
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
                  <SelectItem value="Monday">Mondays</SelectItem>
                  <SelectItem value="Sunday">Sundays</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pick a color:</Label>
              <div className="text-left">
                <ColorPicker
                  value={color}
                  onChange={(value: HabitColor) => setColor(value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md text-left">
                <PreviewHeatmap 
                  type={type} 
                  color={color} 
                  targetCounter={targetCounter} 
                  startDay={startDay as "Monday" | "Sunday"} 
                />
                <div className="mt-4 space-y-1 text-sm border rounded-md p-4">
                  <div className="flex items-center">
                    <span className="mr-2">Streak:</span>
                    <span className="font-medium">1182 days</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Average:</span>
                    <span className="font-medium">4.99</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 mt-2">
                    <div>
                      <span className="mr-2">Today:</span>
                      <span className="font-medium">8.78</span>
                    </div>
                    <div className="text-muted-foreground">
                      Your daily habit journal will appear here!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading} 
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Creating..." : "Create Habit"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
