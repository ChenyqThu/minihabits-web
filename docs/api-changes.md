# MiniHabits API 变更文档

本文档用于记录前端对后端API的需求变更，以便后端团队能够相应地调整API和数据结构。

## 习惯追踪功能增强

### 1. 颜色方案支持

在原有的单一颜色选择基础上，我们引入了对多种颜色方案(Color Schemes)的支持，以增强热力图的可视化效果。这些配色方案基于d3-scale-chromatic库提供的标准配色。

**变更点**：
- 添加了`colorScheme`字段，支持多种预定义的颜色方案
- 目前在前端通过localStorage存储该属性，但后端需要考虑将其持久化

**数据结构示例**：
```typescript
interface Habit {
  // 原有字段
  _id: string;
  name: string;
  userId: string;
  color: string; // 单色值
  // ...
  
  // 新增字段
  colorScheme?: string; // 例如 "Blues", "Viridis", "Spectral" 等
}
```

### 2. Counter类型习惯增强

针对Counter类型的习惯，增加了更多功能支持。

**变更点**：
- 添加了`metric`字段，用于标识计数单位（如"km", "分钟", "步"等）
- 支持小数值记录，保留2位小数
- 例如：用户可以记录"跑步5.75公里"

**数据结构示例**：
```typescript
interface Habit {
  // 原有字段
  _id: string;
  name: string;
  type: "boolean" | "counter";
  targetCounter: number; // 现在支持小数值，如10.5
  completedDates: Record<string, number>; // 支持小数值，如5.75
  // ...
  
  // 新增字段
  metric?: string; // 例如 "km", "min", "steps" 等
}
```

### 3. 周开始日设置

增加了对周开始日的自定义支持，使热力图展示符合用户的习惯。

**变更点**：
- 添加了`weekStart`字段，用于指定用户偏好的周开始日

**数据结构示例**：
```typescript
interface Habit {
  // 原有字段
  // ...
  
  // 新增字段
  weekStart?: "Monday" | "Sunday"; // 默认为 "Sunday"
}
```

### 4. 接口变更摘要

#### 4.1 创建习惯接口

```typescript
// 原有的创建习惯DTO
export type CreateHabitDto = {
  name: string;
  color?: string;
  type?: 'boolean' | 'counter';
  targetCounter?: number;
};

// 增强后的创建习惯DTO
export type CreateHabitDto = {
  name: string;
  color?: string;
  type?: 'boolean' | 'counter';
  targetCounter?: number; // 现在支持小数值
  
  // 新增字段
  colorScheme?: string;
  metric?: string;
  weekStart?: "Monday" | "Sunday";
};
```

#### 4.2 更新习惯接口

```typescript
// 原有的更新习惯DTO
export type UpdateHabitDto = {
  name?: string;
  color?: string;
};

// 增强后的更新习惯DTO
export type UpdateHabitDto = {
  name?: string;
  color?: string;
  
  // 新增字段
  colorScheme?: string | null; // null表示删除当前配色方案
  metric?: string;
  targetCounter?: number; // 支持小数值
  weekStart?: "Monday" | "Sunday";
};
```

#### 4.3 跟踪习惯接口（仅针对Counter类型）

对于Counter类型的习惯，计数值字段需要支持小数。

```typescript
// 原有的跟踪习惯DTO
export type TrackHabitDto = {
  date: string;
  value?: number; // 原本只支持整数
};

// 增强后的跟踪习惯DTO
export type TrackHabitDto = {
  date: string;
  value?: number; // 现在支持小数值，保留2位小数
};
```

## 接口调整优先级

1. **高优先级**：
   - `colorScheme`字段添加（显著提升用户体验）
   - 周开始日设置（影响展示一致性）

2. **中优先级**：
   - Counter类型小数支持（提升精确度）
   - `metric`单位字段（提高可读性）

## 技术注意事项

- 这些更改应当向后兼容，确保旧版客户端仍然可以正常工作
- `colorScheme`字段可以作为用户偏好存储在用户设置中，也可以存储在习惯对象中
- 对于MongoDB存储，小数值无需特殊处理，但API端点需要调整验证规则以接受小数输入 