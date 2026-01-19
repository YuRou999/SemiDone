import type { Task } from '../types';

export interface ReportOptions {
  type: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  includeCompleted: boolean;
  includeOverdue: boolean;
  includePending: boolean;
}

export interface ReportData {
  period: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  tasks: {
    completed: Task[];
    pending: Task[];
    overdue: Task[];
  };
  insights: {
    mostProductiveDay?: string;
    averageTasksPerDay: number;
    priorityDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

/**
 * 生成周/月报告markdown内容
 */
export function generateReportMarkdown(data: ReportData, options: ReportOptions): string {
  const { type, startDate, endDate } = options;
  const isWeekly = type === 'week';
  
  const formatDate = (date: Date) => date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const periodText = isWeekly ? '周报' : '月报';
  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  let markdown = `# 📊 事半·SemiDone ${periodText}

**报告期间**：${dateRange}  
**生成时间**：${new Date().toLocaleString('zh-CN')}

---

## 📈 总览统计

| 指标 | 数量 | 占比 |
|------|------|------|
| 📋 总任务数 | ${data.summary.totalTasks} | 100% |
| ✅ 已完成 | ${data.summary.completedTasks} | ${(data.summary.completionRate * 100).toFixed(1)}% |
| ⏳ 待完成 | ${data.summary.pendingTasks} | ${((data.summary.pendingTasks / data.summary.totalTasks) * 100).toFixed(1)}% |
| ⚠️ 已逾期 | ${data.summary.overdueTasks} | ${((data.summary.overdueTasks / data.summary.totalTasks) * 100).toFixed(1)}% |

### 🎯 效率指标
- **完成率**: ${(data.summary.completionRate * 100).toFixed(1)}%
- **日均任务**: ${data.insights.averageTasksPerDay.toFixed(1)} 个
${data.insights.mostProductiveDay ? `- **最高效日期**: ${data.insights.mostProductiveDay}` : ''}

### 🔥 优先级分布
- 🔴 **高优先级**: ${data.insights.priorityDistribution.high} 个
- 🟡 **中优先级**: ${data.insights.priorityDistribution.medium} 个  
- 🟢 **低优先级**: ${data.insights.priorityDistribution.low} 个

---

`;

  // 已完成任务
  if (options.includeCompleted && data.tasks.completed.length > 0) {
    markdown += `## ✅ 已完成任务 (${data.tasks.completed.length}个)

`;
    data.tasks.completed.forEach((task, index) => {
      const priorityIcon = getPriorityIcon(task.priority);
      const completedDate = new Date(task.updatedAt).toLocaleDateString('zh-CN');
      
      markdown += `### ${index + 1}. ${priorityIcon} ${task.title}
${task.description ? `**描述**: ${task.description}\n` : ''}**完成日期**: ${completedDate}
${task.dueDate ? `**原定期限**: ${new Date(task.dueDate).toLocaleDateString('zh-CN')}\n` : ''}
`;
    });
    markdown += '\n---\n\n';
  }

  // 待完成任务
  if (options.includePending && data.tasks.pending.length > 0) {
    markdown += `## ⏳ 待完成任务 (${data.tasks.pending.length}个)

`;
    data.tasks.pending.forEach((task, index) => {
      const priorityIcon = getPriorityIcon(task.priority);
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '无期限';
      
      markdown += `### ${index + 1}. ${priorityIcon} ${task.title}
${task.description ? `**描述**: ${task.description}\n` : ''}**期限**: ${dueDate}
**创建时间**: ${new Date(task.createdAt).toLocaleDateString('zh-CN')}

`;
    });
    markdown += '\n---\n\n';
  }

  // 逾期任务
  if (options.includeOverdue && data.tasks.overdue.length > 0) {
    markdown += `## ⚠️ 逾期任务 (${data.tasks.overdue.length}个)

> ⚠️ **注意**：以下任务已超过预定期限，建议优先处理或重新规划时间。

`;
    data.tasks.overdue.forEach((task, index) => {
      const priorityIcon = getPriorityIcon(task.priority);
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '';
      const overdueDays = task.dueDate ? Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      markdown += `### ${index + 1}. ${priorityIcon} ${task.title}
${task.description ? `**描述**: ${task.description}\n` : ''}**逾期期限**: ${dueDate}
**逾期天数**: ${overdueDays} 天
**创建时间**: ${new Date(task.createdAt).toLocaleDateString('zh-CN')}

`;
    });
    markdown += '\n---\n\n';
  }

  // 总结和建议
  markdown += `## 💡 ${periodText}总结

### 🌟 亮点成就
${data.summary.completionRate >= 0.8 ? '- 🎉 完成率超过80%，执行力很棒！' : ''}
${data.summary.completedTasks > 0 ? `- 📈 成功完成 ${data.summary.completedTasks} 个任务` : ''}
${data.insights.priorityDistribution.high > 0 && data.tasks.completed.filter(t => t.priority === 'high').length > 0 ? '- 🎯 高优先级任务得到及时处理' : ''}

### 📋 改进建议
${data.summary.completionRate < 0.6 ? '- 📊 完成率较低，建议重新评估任务量或优化时间管理' : ''}
${data.summary.overdueTasks > 0 ? `- ⏰ 有 ${data.summary.overdueTasks} 个逾期任务，建议优先处理或调整期限` : ''}
${data.insights.priorityDistribution.high > data.tasks.completed.filter(t => t.priority === 'high').length ? '- 🔥 建议优先关注高优先级任务的完成' : ''}
${data.summary.pendingTasks > 10 ? '- 📝 待办任务较多，建议拆分大任务或设置里程碑' : ''}

### 🎯 下${isWeekly ? '周' : '月'}计划
- 专注完成逾期和高优先级任务
- 合理规划新任务的时间节点
- 保持当前的工作节奏${data.summary.completionRate >= 0.7 ? '（当前节奏不错）' : ''}

---

> 📱 **由事半·SemiDone自动生成** | ${new Date().toLocaleString('zh-CN')}
> 
> 💪 继续保持，每一个完成的任务都是向目标迈进的一步！
`;

  return markdown;
}

function getPriorityIcon(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

/**
 * 分析任务数据生成报告数据
 */
export function analyzeTasksForReport(tasks: Task[], options: ReportOptions): ReportData {
  const { startDate, endDate } = options;
  
  // 筛选时间范围内的任务
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const taskUpdateDate = task.completed ? new Date(task.updatedAt) : null;
    
    // 任务创建时间或完成时间在报告期间内
    return (taskDate >= startDate && taskDate <= endDate) ||
           (taskUpdateDate && taskUpdateDate >= startDate && taskUpdateDate <= endDate);
  });

  // 分类任务
  const completedTasks = filteredTasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= startDate && 
    new Date(task.updatedAt) <= endDate
  );
  
  const pendingTasks = filteredTasks.filter(task => !task.completed);
  
  const overdueTasks = filteredTasks.filter(task => 
    !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  );

  // 计算统计数据
  const totalTasks = filteredTasks.length;
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

  // 优先级分布
  const priorityDistribution = filteredTasks.reduce((acc, task) => {
    acc[task.priority]++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  // 日均任务数
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageTasksPerDay = totalTasks / daysDiff;

  // 找出最高效的日期（完成任务最多的日期）
  let mostProductiveDay = '';
  if (completedTasks.length > 0) {
    const dayCompletionCount: { [key: string]: number } = {};
    completedTasks.forEach(task => {
      const day = new Date(task.updatedAt).toLocaleDateString('zh-CN');
      dayCompletionCount[day] = (dayCompletionCount[day] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(dayCompletionCount));
    mostProductiveDay = Object.keys(dayCompletionCount).find(day => dayCompletionCount[day] === maxCount) || '';
  }

  const periodFormat = options.type === 'week' ? '周' : '月';
  const period = `${startDate.getFullYear()}年${startDate.getMonth() + 1}${periodFormat}第${Math.ceil(startDate.getDate() / 7)}${options.type === 'week' ? '周' : ''}`;

  return {
    period,
    summary: {
      totalTasks,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate
    },
    tasks: {
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks
    },
    insights: {
      mostProductiveDay,
      averageTasksPerDay,
      priorityDistribution
    }
  };
}

/**
 * 获取本周的开始和结束日期
 */
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // 周一为一周开始
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * 获取本月的开始和结束日期
 */
export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
