<!-- src/schema/statistic/StatisticEditor.vue -->
<template>
  <div class="space-y-6 p-2 sm:p-4">
    <!-- 1. 概览数据卡片 -->
    <section>
      <h2 class="text-lg sm:text-xl font-semibold mb-4 tracking-tight px-1">
        概览数据
      </h2>
      <!-- Mobile: 1列, Tablet: 2列, Desktop: 3列 -->
      <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 用户消息 -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">用户消息</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ statisticData.userMessageCount }}
            </div>
            <p class="text-xs text-muted-foreground">累计发送的消息数量</p>
          </CardContent>
        </Card>

        <!-- 模型回复 -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">模型回复</CardTitle>
            <Bot class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ statisticData.modelMessageCount }}
            </div>
            <p class="text-xs text-muted-foreground">累计接收的回复数量</p>
          </CardContent>
        </Card>

        <!-- 总计 -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">总交互数</CardTitle>
            <MessageSquare class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalMessageCount }}</div>
            <p class="text-xs text-muted-foreground">所有对话交互总和</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- 2. 月度活跃热力图 -->
    <section>
      <!-- 头部控制栏：移动端垂直堆叠，桌面端水平分布 -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0 px-1"
      >
        <h2 class="text-lg sm:text-xl font-semibold tracking-tight">
          活跃度热力图
        </h2>

        <!-- 月份控制 -->
        <div
          class="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 bg-muted/30 p-1 rounded-lg sm:bg-transparent sm:p-0"
        >
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            @click="changeMonth(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <div class="w-32 text-center font-medium text-sm sm:text-base">
            {{ currentYear }}年 {{ currentMonth + 1 }}月
          </div>

          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            @click="changeMonth(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            @click="resetToToday"
            class="ml-1 h-8 px-2 text-xs sm:text-sm"
          >
            今
          </Button>
        </div>
      </div>

      <Card>
        <CardContent class="p-3 sm:p-6">
          <!-- 星期表头 -->
          <div class="grid grid-cols-7 mb-2">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center text-[10px] sm:text-xs text-muted-foreground font-medium py-1"
            >
              {{ day }}
            </div>
          </div>

          <!-- 日历网格 -->
          <!-- Mobile: gap-1, Desktop: gap-2 -->
          <div class="grid grid-cols-7 gap-1 sm:gap-2">
            <!--
              注意：此处我们将 Tooltip 包裹在 div 外层，
              但在移动端我们主要依靠点击事件(click)来展示信息。
            -->
            <div
              v-for="day in calendarGrid"
              :key="day.dateStr"
              class="relative group"
            >
              <TooltipProvider>
                <Tooltip :delayDuration="0">
                  <TooltipTrigger as-child>
                    <button
                      type="button"
                      @click="handleDayClick(day)"
                      class="w-full aspect-square rounded-md flex items-center justify-center relative transition-all border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      :class="[
                        getCellColorClass(day.count),
                        !day.isCurrentMonth ? 'opacity-30' : 'opacity-100',
                        day.isToday
                          ? 'ring-2 ring-primary ring-offset-2 z-10'
                          : '',
                        selectedDay?.dateStr === day.dateStr
                          ? 'ring-2 ring-primary ring-offset-1 z-10 scale-105 shadow-sm'
                          : '',
                      ]"
                    >
                      <span
                        class="text-[10px] sm:text-xs select-none"
                        :class="
                          day.count > 0
                            ? 'text-primary-foreground font-medium'
                            : 'text-muted-foreground'
                        "
                      >
                        {{ day.dayNum }}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <!-- Tooltip 仅在支持 hover 的设备上有意义，移动端不显示 tooltip 内容，依靠下方详情栏 -->
                  <TooltipContent class="hidden sm:block">
                    <p class="font-semibold">{{ day.dateStr }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ day.count }} 次会话
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <!-- 移动端适配：选中日期详情展示区域 (替代 Tooltip) -->
          <div
            v-if="selectedDay"
            class="mt-4 p-3 rounded-lg bg-muted/50 border flex items-center justify-between animate-in fade-in slide-in-from-top-1"
          >
            <div class="flex flex-col">
              <span class="text-xs text-muted-foreground font-medium"
                >选中日期</span
              >
              <span class="text-sm font-bold">{{ selectedDay.dateStr }}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs text-muted-foreground font-medium"
                >活跃度</span
              >
              <span class="text-sm font-bold text-primary"
                >{{ selectedDay.count }} 次会话</span
              >
            </div>
          </div>

          <!-- 图例 -->
          <div
            class="mt-6 flex items-center justify-end space-x-2 text-[10px] sm:text-xs text-muted-foreground"
          >
            <span>少</span>
            <div class="flex space-x-1">
              <div class="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-secondary"></div>
              <div
                class="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900"
              ></div>
              <div
                class="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700"
              ></div>
              <div
                class="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-emerald-600 dark:bg-emerald-600"
              ></div>
              <div
                class="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-emerald-800 dark:bg-emerald-500"
              ></div>
            </div>
            <span>多</span>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFileContent } from "@/features/FileSystem/composables/useFileContent";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Bot,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

// --- 类型定义 ---
interface Statistic {
  userMessageCount: number;
  modelMessageCount: number;
  timeIntervals: {
    [dateKey: string]: { start: string; end: string }[];
  };
}

interface CalendarCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  count: number;
}

// --- Props & Data Fetching ---
const props = defineProps<{ path: string }>();

// 使用 useFileContent 获取数据
const remoteContent = useFileContent<Statistic>(props.path);

// 安全访问数据的计算属性
const statisticData = computed<Statistic>(() => {
  return (
    remoteContent.value || {
      userMessageCount: 0,
      modelMessageCount: 0,
      timeIntervals: {},
    }
  );
});

// --- 概览统计逻辑 ---
const totalMessageCount = computed(() => {
  return (
    statisticData.value.userMessageCount + statisticData.value.modelMessageCount
  );
});

// --- 日历/热力图逻辑 ---
const currentDate = ref(new Date());
const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

// 选中的日期（用于移动端显示详情）
const selectedDay = ref<CalendarCell | null>(null);

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// 切换月份
const changeMonth = (delta: number) => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + delta);
  currentDate.value = newDate;
  // 切换月份时重置选中状态
  selectedDay.value = null;
};

// 回到今天
const resetToToday = () => {
  currentDate.value = new Date();
  selectedDay.value = null;
};

// 处理日期点击
const handleDayClick = (day: CalendarCell) => {
  if (selectedDay.value?.dateStr === day.dateStr) {
    selectedDay.value = null; // 再次点击取消
  } else {
    selectedDay.value = day;
  }
};

/**
 * 生成当前视图的日历网格数据
 */
const calendarGrid = computed<CalendarCell[]>(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDayOfMonth);
  const neededToEnd = 6 - endDate.getDay();
  endDate.setDate(endDate.getDate() + neededToEnd);

  const grid: CalendarCell[] = [];
  const iterator = new Date(startDate);
  const todayStr = new Date().toISOString().slice(0, 10);

  while (iterator <= endDate) {
    const dateStr = iterator.toISOString().slice(0, 10);
    const count = statisticData.value.timeIntervals[dateStr]?.length || 0;

    grid.push({
      date: new Date(iterator),
      dateStr,
      dayNum: iterator.getDate(),
      isCurrentMonth: iterator.getMonth() === month,
      isToday: dateStr === todayStr,
      count,
    });

    iterator.setDate(iterator.getDate() + 1);
  }

  return grid;
});

/**
 * 根据活跃度返回 Tailwind 类名
 */
const getCellColorClass = (count: number): string => {
  if (count === 0)
    return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  if (count <= 2)
    return "bg-emerald-200 dark:bg-emerald-900 border-emerald-200";
  if (count <= 5)
    return "bg-emerald-400 dark:bg-emerald-700 border-emerald-400";
  if (count <= 10)
    return "bg-emerald-600 dark:bg-emerald-600 border-emerald-600";
  return "bg-emerald-800 dark:bg-emerald-500 border-emerald-800";
};
</script>
