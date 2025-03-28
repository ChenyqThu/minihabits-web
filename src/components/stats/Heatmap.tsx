import { HabitType, ExtendedHabit } from "@/api/types/appTypes";
import CounterHeatmap from "./counter/CounterHeatmap";
import BooleanHeatmap from "./boolean/BooleanHeatmap";
import { Habit } from "@/api/generated";

interface HeatmapProps {
  readonly habit: Habit | ExtendedHabit;
}

export default function Heatmap({ habit }: HeatmapProps) {
  // 确保 habit 可以被视为 ExtendedHabit
  const extendedHabit = habit as ExtendedHabit;
  
  switch (habit.type) {
    case HabitType.COUNTER:
      return <CounterHeatmap habit={extendedHabit} />;
    case HabitType.BOOLEAN:
      return <BooleanHeatmap habit={extendedHabit} />;
    default:
      return null;
  }
}
