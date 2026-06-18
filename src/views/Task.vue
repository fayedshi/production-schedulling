<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Tickets } from '@element-plus/icons-vue'
import { useOrderStore, units } from '../store/order'

/** @typedef {import('../types/entities').PmcScheduleTaskEntity} PmcScheduleTaskEntity */

const route = useRoute()
const router = useRouter()
const store = useOrderStore()

const task = computed(() => store.getTaskByNo(decodeURIComponent(route.params.taskNo || '')))
const splitDialogVisible = ref(false)
const splitForm = reactive(initialSplitForm())

watch(task, current => {
  if (current && splitDialogVisible.value) resetSplitForm(buildSplitDefaults(current))
})

function initialSplitForm() {
  return {
    taskNo: '',
    processName: '下料',
    processPriority: 1,
    planQty: 1,
    unit: '个',
    pieceworkPrice: 0,
    ratedHours: 0,
    latestOnlineTime: '',
    latestFinishTime: '',
    machine: 'CNC-01',
    machineRule: '一人一机',
    splitMode: 'average',
    splitCount: 2,
    subTaskQuantities: [1, 1],
    materials: [newMaterial()]
  }
}

function newMaterial() {
  return { name: '包装膜', specification: '通用', quantity: 1, unit: '卷', description: '生产配套辅料', latestRequiredTime: '' }
}

function buildSplitDefaults(parentTask) {
  const nextIndex = parentTask.subTasks?.length || 0
  return {
    taskNo: `${parentTask.taskNo}-${String(nextIndex).padStart(2, '0')}`,
    processName: parentTask.processName || '下料',
    processPriority: nextIndex + 1,
    planQty: parentTask.planQty || 1,
    unit: parentTask.unit || '个',
    pieceworkPrice: parentTask.pieceworkPrice || 0,
    ratedHours: parentTask.ratedHours || 0,
    latestOnlineTime: parentTask.latestOnlineTime || parentTask.planStartDate || '',
    latestFinishTime: parentTask.latestFinishTime || parentTask.planEndDate || '',
    machine: parentTask.machine || 'CNC-01',
    machineRule: parentTask.machineRule || '一人一机'
  }
}

function resetSplitForm(data) {
  Object.assign(splitForm, initialSplitForm(), data)
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function taskStatusTagType(status) {
  const map = { '待排产': 'info', '已排产': 'warning', '生产中': 'primary', '已完工': 'success', '已质检': 'success' }
  return map[status] || 'info'
}

function readinessTagType(status) {
  const map = { '齐套': 'success', '需跟催': 'warning', '欠料': 'danger' }
  return map[status] || 'info'
}

function goBack() {
  router.push('/schedule')
}

function goToOrder() {
  if (task.value?.orderNo) {
    router.push(`/orders/${encodeURIComponent(task.value.orderNo)}`)
  }
}

function goToTask(taskNo) {
  router.push(`/tasks/${encodeURIComponent(taskNo)}`)
}

function openSplitDialog() {
  if (!task.value) return
  resetSplitForm(buildSplitDefaults(task.value))
  splitDialogVisible.value = true
}

function submitSplit() {
  if (!task.value) return
  try {
    store.splitTask(task.value.taskNo, { ...splitForm, materials: splitForm.materials.map(m => ({ ...m })) })
    ElMessage.success('子任务拆解成功')
    splitDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.message || '拆解失败')
  }
}
</script>

<template>
  <div class="task-detail-page">
    <el-card v-if="task" class="detail-card" shadow="never">
      <div class="detail-header">
        <div>
          <el-button :icon="ArrowLeft" text @click="goBack">返回生产任务总表</el-button>
          <h1 class="page-title">任务详情 - {{ task.taskNo }}</h1>
          <p class="page-subtitle">Task Detail · {{ task.orderNo }} · {{ task.productName }}</p>
        </div>
        <div class="header-actions">
          <el-tag :type="taskStatusTagType(task.status)" size="large">{{ task.status }}</el-tag>
          <el-button type="warning" @click="openSplitDialog">拆解任务</el-button>
          <el-button type="primary" @click="goToOrder">
            <el-icon><Tickets /></el-icon>
            查看订单
          </el-button>
        </div>
      </div>

      <el-tabs type="border-card">
        <el-tab-pane label="任务信息">
          <el-descriptions class="task-descriptions" :column="2" border>
            <el-descriptions-item label="任务号">{{ task.taskNo }}</el-descriptions-item>
            <el-descriptions-item label="订单号">{{ task.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="工序">{{ task.processName }}</el-descriptions-item>
            <el-descriptions-item label="工序优先顺序">{{ task.processPriority }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ formatNumber(task.planQty) }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ task.unit }}</el-descriptions-item>
            <el-descriptions-item label="计件单价">{{ formatCurrency(task.pieceworkPrice) }}</el-descriptions-item>
            <el-descriptions-item label="额定工时">{{ task.ratedHours }} h</el-descriptions-item>
            <el-descriptions-item label="最晚上线时间">{{ task.latestOnlineTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最晚完工时间">{{ task.latestFinishTime || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-row :gutter="16" class="summary-row">
            <el-col :xs="24" :md="8">
              <div class="summary-card">
                <div class="summary-label">完成进度</div>
                <el-progress :percentage="task.completion" :status="task.completion === 100 ? 'success' : ''" />
                <div class="summary-note">已完成 {{ formatNumber(task.completedQty) }} / {{ formatNumber(task.planQty) }}</div>
              </div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="summary-card">
                <div class="summary-label">物料齐套</div>
                <el-tag :type="readinessTagType(task.readinessStatus)" size="large">{{ task.readinessStatus }}</el-tag>
                <div class="summary-note">齐套率 {{ task.readinessRate }}%，欠料 {{ task.shortageCount }} 项</div>
              </div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="summary-card">
                <div class="summary-label">交期风险</div>
                <el-tag :type="task.deliveryRisk.type" size="large">{{ task.deliveryRisk.label }}</el-tag>
                <div class="summary-note">距目标日期 {{ task.deliveryRisk.days }} 天</div>
              </div>
            </el-col>
          </el-row>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="工作中心">{{ task.workCenter || '-' }}</el-descriptions-item>
            <el-descriptions-item label="机台">{{ task.machine || '-' }}</el-descriptions-item>
            <el-descriptions-item label="机台占用原则">{{ task.machineRule || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作员">{{ task.operator || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计划开始">{{ task.planStartDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计划结束">{{ task.planEndDate || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane :label="`子任务 (${task.subTasks?.length || 0})`">
          <el-empty v-if="!task.subTasks || task.subTasks.length === 0" description="暂无子任务" />
          <el-table v-else :data="task.subTasks" border stripe>
            <el-table-column prop="taskNo" label="任务编号" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">
                <el-button link type="primary" @click="goToTask(row.taskNo)">{{ row.taskNo }}</el-button>
                <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="processName" label="工序" width="100" />
            <el-table-column prop="processPriority" label="优先顺序" width="100" align="center" />
            <el-table-column prop="planQty" label="数量" width="100" align="right">
              <template #default="{ row }">{{ formatNumber(row.planQty) }}</template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column prop="machine" label="机台" width="100" />
            <el-table-column prop="machineRule" label="机台原则" width="120" />
            <el-table-column prop="latestOnlineTime" label="最晚上线" width="120" />
            <el-table-column prop="latestFinishTime" label="最晚完工" width="120" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="taskStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-else class="detail-card" shadow="never">
      <el-empty description="任务不存在">
        <el-button type="primary" @click="goBack">返回生产任务总表</el-button>
      </el-empty>
    </el-card>

    <el-dialog v-model="splitDialogVisible" title="拆解任务" width="900px" :close-on-click-modal="false" destroy-on-close>
      <el-alert v-if="task" type="info" :closable="false" style="margin-bottom: 16px">
        <template #title>
          {{ task.taskNo }} · {{ task.processName }} · 当前任务数量 {{ task.planQty }} {{ task.unit }}
        </template>
      </el-alert>
      <el-form :model="splitForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="任务号"><el-input v-model="splitForm.taskNo" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="工序"><el-select v-model="splitForm.processName" style="width: 100%"><el-option v-for="p in store.processNames" :key="p" :label="p" :value="p" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="优先顺序"><el-input-number v-model="splitForm.processPriority" :min="1" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="数量"><el-input-number v-model="splitForm.planQty" :min="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="单位"><el-select v-model="splitForm.unit" style="width: 100%"><el-option v-for="u in units" :key="u" :label="u" :value="u" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="计件单价"><el-input-number v-model="splitForm.pieceworkPrice" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="额定工时"><el-input-number v-model="splitForm.ratedHours" :min="0" :precision="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="最晚上线"><el-date-picker v-model="splitForm.latestOnlineTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="最晚完工"><el-date-picker v-model="splitForm.latestFinishTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="机台"><el-select v-model="splitForm.machine" style="width: 100%"><el-option v-for="m in store.machines" :key="m" :label="m" :value="m" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="机台原则"><el-select v-model="splitForm.machineRule" style="width: 100%"><el-option v-for="r in store.machineRules" :key="r" :label="r" :value="r" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="拆分方式"><el-radio-group v-model="splitForm.splitMode"><el-radio-button label="average">平均值拆</el-radio-button><el-radio-button label="custom">指定数量拆</el-radio-button></el-radio-group></el-form-item></el-col>
        </el-row>
        <el-form-item label="拆分数量">
          <template v-if="splitForm.splitMode === 'average'">
            <el-input-number v-model="splitForm.splitCount" :min="1" :max="20" />
          </template>
          <template v-else>
            <div class="quantity-list">
              <el-input-number v-for="(_, index) in splitForm.subTaskQuantities" :key="index" v-model="splitForm.subTaskQuantities[index]" :min="1" />
              <el-button @click="splitForm.subTaskQuantities.push(1)">增加</el-button>
              <el-button v-if="splitForm.subTaskQuantities.length > 1" @click="splitForm.subTaskQuantities.pop()">删除</el-button>
            </div>
          </template>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSplit">确认拆解</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.task-detail-page { padding: 20px; }
.detail-card { border-radius: 8px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 8px 0 0; font-size: 24px; color: #303133; }
.page-subtitle { margin-top: 6px; color: #7b8794; font-size: 13px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.task-descriptions { margin-bottom: 16px; }
.summary-row { margin: 16px 0; }
.summary-card { min-height: 132px; padding: 16px; border: 1px solid #e4e7ed; border-radius: 8px; background: #fafcff; }
.summary-label { margin-bottom: 12px; color: #606266; font-weight: 700; }
.summary-note { margin-top: 12px; color: #909399; font-size: 12px; }
.quantity-list { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
@media (max-width: 900px) {
  .detail-header { flex-direction: column; }
  .header-actions { flex-wrap: wrap; }
}
</style>
