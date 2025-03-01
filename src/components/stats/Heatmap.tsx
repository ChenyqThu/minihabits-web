import { Habit, HabitType } from "@/types/habit";
import CounterHeatmap from "./counter/CounterHeatmap";
import BooleanHeatmap from "./boolean/BooleanHeatmap";

interface HeatmapProps {
  readonly habit: Habit;
}

export default function Heatmap({ habit }: HeatmapProps) {
  switch (habit.type) {
    case HabitType.COUNTER:
      return <CounterHeatmap habit={habit} />;
    case HabitType.BOOLEAN:
      return <BooleanHeatmap habit={habit} />;
    default:
      return null;
  }
}
