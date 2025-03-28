import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";
import {
  CreateHabitDto,
  UpdateHabitDto,
  HabitsService,
  OpenAPI,
  HabitStatsOutput,
  Habit,
} from "../generated";
import { HabitColor, HabitType, ColorScheme, ExtendedHabit } from "../types/appTypes";
import { useCallback } from "react";

export function useHabits() {
  const { accessToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Set the authorization token for the OpenAPI client
  if (accessToken) {
    OpenAPI.TOKEN = accessToken;
  }

  // Fetch all habits
  const {
    data: habits = [],
    isLoading,
    error,
    refetch: refreshHabits,
  } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!isAuthenticated || !accessToken) {
        return [];
      }

      return HabitsService.habitsControllerGetHabits();
    },
    enabled: isAuthenticated && !!accessToken,
  });

  // Get a single habit by ID
  const getHabitById = async (habitId: string): Promise<Habit> => {
    try {
      const habit = await HabitsService.habitsControllerGetHabit({
        id: habitId,
      });
      
      // 获取习惯的扩展属性
      const extendedHabit = habit as ExtendedHabit;
      
      try {
        // 从localStorage获取colorScheme
        const colorScheme = localStorage.getItem(`habit_${habitId}_colorScheme`);
        if (colorScheme) {
          extendedHabit.colorScheme = colorScheme as ColorScheme;
        }
        
        // 从localStorage获取metric (针对counter类型)
        if (habit.type === 'counter') {
          const metric = localStorage.getItem(`habit_${habitId}_metric`);
          if (metric) {
            extendedHabit.metric = metric;
          }
        }
        
        // 从localStorage获取weekStart
        const weekStart = localStorage.getItem(`habit_${habitId}_weekStart`);
        if (weekStart && (weekStart === 'Monday' || weekStart === 'Sunday')) {
          extendedHabit.weekStart = weekStart;
        }
      } catch (error) {
        console.error("Error getting extended properties from localStorage:", error);
      }
      
      return extendedHabit;
    } catch (error) {
      console.error("Error fetching habit:", error);
      throw error;
    }
  };

  // Get stats for a habit
  const getStats = useCallback(
    async (habitId: string): Promise<HabitStatsOutput> => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const apiStats = await HabitsService.habitsControllerGetHabitStats({
        id: habitId,
      });
      return apiStats;
    },
    [isAuthenticated, accessToken]
  );

  // Create a new habit
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: CreateHabitDto) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const habit = await HabitsService.habitsControllerCreateHabit({
        requestBody: habitData,
      });
      return habit;
    },
    onSuccess: () => {
      // Invalidate the habits query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Update a habit
  const updateHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      data,
    }: {
      habitId: string;
      data: UpdateHabitDto;
    }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const habit = await HabitsService.habitsControllerUpdateHabit({
        id: habitId,
        requestBody: data,
      });
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Delete a habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const habit = await HabitsService.habitsControllerDeleteHabit({
        id: habitId,
      });
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Track a habit
  const trackHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      date,
    }: {
      habitId: string;
      date: string;
    }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const habit = await HabitsService.habitsControllerTrackHabit({
        id: habitId,
        requestBody: { date },
      });
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Untrack a habit
  const untrackHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      date,
    }: {
      habitId: string;
      date: string;
    }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated");
      }

      const habit = await HabitsService.habitsControllerUntrackHabit({
        id: habitId,
        requestBody: { date },
      });
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Wrapper functions to match the original context API
  const createHabit = async (
    name: string,
    color?: string,
    type: string = "boolean",
    targetCounter?: number,
    colorScheme?: ColorScheme,
    metric?: string,
    weekStart?: "Monday" | "Sunday"
  ) => {
    // Validate color is a valid HabitColor
    const validColor = (color as HabitColor) || undefined;

    // Validate type is a valid HabitType
    const validType = (type as HabitType) || "boolean";

    const habitData: CreateHabitDto = {
      name,
      color: validColor,
      type: validType,
      targetCounter: validType === "counter" ? targetCounter : undefined,
      // 后端API暂不支持以下字段
      // metric: validType === "counter" ? metric : undefined,
      // weekStart,
    };

    const habit = await createHabitMutation.mutateAsync(habitData);
    
    // 存储前端特有属性到localStorage
    const habitId = habit._id;

    // 存储colorScheme到本地
    if (colorScheme) {
      localStorage.setItem(`habit_${habitId}_colorScheme`, colorScheme);
    }
    
    // 存储metric到本地
    if (metric && validType === "counter") {
      localStorage.setItem(`habit_${habitId}_metric`, metric);
    }
    
    // 存储weekStart到本地
    if (weekStart) {
      localStorage.setItem(`habit_${habitId}_weekStart`, weekStart);
    }
    
    return habit;
  };

  const updateHabit = async (
    habitId: string,
    data: {
      name?: string;
      color?: string;
      targetCounter?: number;
      type?: string;
      colorScheme?: ColorScheme | null;
      metric?: string | null;
      weekStart?: "Monday" | "Sunday";
    }
  ) => {
    // 处理colorScheme (前端特有，API不支持)
    if (data.colorScheme) {
      localStorage.setItem(`habit_${habitId}_colorScheme`, data.colorScheme);
    } else if (data.colorScheme === null) {
      // 如果明确设置为null，则删除
      localStorage.removeItem(`habit_${habitId}_colorScheme`);
    }
    
    // 处理metric (前端特有，API不支持)
    if (data.metric) {
      localStorage.setItem(`habit_${habitId}_metric`, data.metric);
    } else if (data.metric === null) {
      localStorage.removeItem(`habit_${habitId}_metric`);
    }
    
    // 处理weekStart (前端特有，API不支持)
    if (data.weekStart) {
      localStorage.setItem(`habit_${habitId}_weekStart`, data.weekStart);
    }
    
    // Only include properties that are in UpdateHabitDto
    const updateData: UpdateHabitDto = {
      name: data.name,
      color: data.color as HabitColor,
      // API暂不支持以下字段
      // targetCounter: data.targetCounter,
    };

    const habit = await updateHabitMutation.mutateAsync({
      habitId,
      data: updateData,
    });
    return habit;
  };

  const deleteHabit = async (habitId: string) => {
    const habit = await deleteHabitMutation.mutateAsync(habitId);
    return habit;
  };

  const trackHabit = async (habitId: string, date: string) => {
    const habit = await trackHabitMutation.mutateAsync({ habitId, date });
    return habit;
  };

  const untrackHabit = async (habitId: string, date: string) => {
    const habit = await untrackHabitMutation.mutateAsync({ habitId, date });
    return habit;
  };

  // Aliases for increment/decrement to match the original context API
  const incrementHabit = trackHabit;
  const decrementHabit = untrackHabit;

  return {
    habits,
    isLoading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    trackHabit,
    untrackHabit,
    incrementHabit,
    decrementHabit,
    refreshHabits,
    getStats,
    getHabitById,
    // Additional properties for more granular loading states
    isCreating: createHabitMutation.isPending,
    isUpdating: updateHabitMutation.isPending,
    isDeleting: deleteHabitMutation.isPending,
    isTracking: trackHabitMutation.isPending,
    isUntracking: untrackHabitMutation.isPending,
  };
}
