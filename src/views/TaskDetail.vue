<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Tickets } from '@element-plus/icons-vue'
import { useOrderStore, units } from '../store/order.js'
import TaskSplitDialog from '../components/TaskSplitDialog.vue'
import useCommonFunction from '../hooks/useCommonFunction.ts'

/** @typedef {import('../types/entities.js').PmcScheduleTaskEntity} PmcScheduleTaskEntity */

const route = useRoute()
const router = useRouter()
const store = useOrderStore()

const task = computed(() => store.getTaskByNo(decodeURIComponent(route.params.taskNo || '')))

const splitDialogVisible = ref(false)
const normalSplitDialogVisible = ref(false)
const editMode = ref(route.params.editMode === 'true')
const activeTab=ref("taskInfo");
// console.log("editMode 真实类型与值:", editMode.value, typeof editMode.value)

const editForm = reactive(initialEditForm())
const taskStatuses = ['待排产', '已排产', '生产中', '已完工', '已质检']

const splitDefaults = computed(() => task.value ? buildSplitDefaults(task.value) : {})
const normalSplitDefaults = computed(() => task.value ? buildSplitDefaults(task.value) : {})
const splitContextTitle = computed(() => task.value ? '当前任务 '+`${task.value.taskNo} · ${task.value.processName} · 当前任务零件数量 ${task.value.planQty} ${task.value.unit}` : '')
const isNormalTask = computed(() => !task.value || (task.value.taskType || 'normal') === 'normal')
const childTasks = computed(() => task.value?.subTasks || [])
const subTasks = computed(() => childTasks.value.filter(item => (item.taskType || 'normal') === 'sub'))
const nextLevelTasks = computed(() => childTasks.value.filter(item => (item.taskType || 'normal') === 'normal'))
const nextLevelLabel = computed(() => `${Number(task.value?.taskLevel || 1) + 1} 级任务`)
const { handleDelete } = useCommonFunction();

onMounted(()=>{
  console.log(task.taskLevel);
})
function initialEditForm() {
  return {
    taskNo: task.value.taskNo || '',
    orderNo: task.value.orderNo || '',
    processName: '下料',
    processPriority: 1,
    workCenter: '一号车间',
    status: '待排产',
    planQty: 1,
    completedQty: 0,
    unit: '个',
    pieceworkPrice: 0,
    ratedHours: 0,
    latestOnlineTime: '',
    latestFinishTime: '',
    planStartDate: '',
    planEndDate: '',
    actualStartDate: null,
    actualEndDate: null,
    machine: 'CNC-01',
    machineRule: '一人一机',
    operator: '',
    materials: [newMaterial()],
    remark: ''
  }
}

function newMaterial() {
  return { name: '包装膜', specification: '通用', quantity: 1, unit: '卷', description: '生产配套辅料', latestRequiredTime: '' }
}

function cloneMaterials(materials) {
  return (materials?.length ? materials : [newMaterial()]).map(item => ({ ...newMaterial(), ...item }))
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
    machineRule: parentTask.machineRule || '一人一机',
    materials: parentTask.materials?.length ? parentTask.materials.map(item => ({ ...item })) : undefined
  }
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

function goBack() {
  router.push('/schedule')
}

function goToOrder() {
  if (task.value?.orderNo) {
    router.push(`/orders/${encodeURIComponent(task.value.orderNo)}`)
  }
}

function goToTask(taskNo, isEdit) {
  router.push(`/tasks/${encodeURIComponent(taskNo)}/${isEdit}`)
}

function openSplitDialog() {
  if (!task.value || !isNormalTask.value) return
  splitDialogVisible.value = true
}

function openNormalSplitDialog() {
  if (!task.value || !isNormalTask.value) return
  normalSplitDialogVisible.value = true
}

function submitSplit(formData) {
  if (!task.value) return
  try {
    store.splitTask(task.value.taskNo, formData)
    ElMessage.success('子任务拆分成功')
    splitDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.message || '拆分失败')
  }
}

function submitNormalSplit(formData) {
  if (!task.value) return
  try {
    store.splitNormalTask(task.value.taskNo, formData)
    ElMessage.success('普通任务拆分成功')
    normalSplitDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.message || '拆分失败')
  }
}

function startEdit() {
  if (!task.value) return
  Object.assign(editForm, initialEditForm(), {
    taskNo: task.value.taskNo,
    orderNo: task.value.orderNo,
    processName: task.value.processName,
    processPriority: task.value.processPriority,
    workCenter: task.value.workCenter,
    status: task.value.status,
    planQty: task.value.planQty,
    completedQty: task.value.completedQty,
    unit: task.value.unit,
    pieceworkPrice: task.value.pieceworkPrice,
    ratedHours: task.value.ratedHours,
    latestOnlineTime: task.value.latestOnlineTime,
    latestFinishTime: task.value.latestFinishTime,
    planStartDate: task.value.planStartDate,
    planEndDate: task.value.planEndDate,
    actualStartDate: task.value.actualStartDate,
    actualEndDate: task.value.actualEndDate,
    machine: task.value.machine,
    machineRule: task.value.machineRule,
    operator: task.value.operator,
    materials: cloneMaterials(task.value.materials),
    remark: task.value.remark || ''
  })
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

function removeMaterial(index) {
  if (editForm.materials.length === 1) return
  editForm.materials.splice(index, 1)
}

function saveTask() {
  if (!task.value) return
  const ok = store.updateTaskByNo(task.value.taskNo, {
    processName: editForm.processName,
    processPriority: editForm.processPriority,
    workCenter: editForm.workCenter,
    status: editForm.status,
    planQty: editForm.planQty,
    completedQty: editForm.completedQty,
    unit: editForm.unit,
    pieceworkPrice: editForm.pieceworkPrice,
    ratedHours: editForm.ratedHours,
    latestOnlineTime: editForm.latestOnlineTime,
    latestFinishTime: editForm.latestFinishTime,
    planStartDate: editForm.planStartDate,
    planEndDate: editForm.planEndDate,
    actualStartDate: editForm.actualStartDate,
    actualEndDate: editForm.actualEndDate,
    machine: editForm.machine,
    machineRule: editForm.machineRule,
    operator: editForm.operator,
    materials: editForm.materials.map(item => ({ ...item })),
    remark: editForm.remark
  })
  if (ok) {
    ElMessage.success('任务已保存')
    editMode.value = false
  } else {
    ElMessage.error('保存失败')
  }
}
</script>

<template>
  <div class="task-detail-page">
    <el-card v-if="task" class="detail-card" shadow="never">
      <div class="detail-header">
        <div>
          <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
          <p class="page-title">任务详情-{{ task.taskNo }}

            <!-- <p class="page-subtitle">Task Detail · {{ task.orderNo }} · {{ task.productName }}</p> -->
            <el-tag :type="taskStatusTagType(editMode ? editForm.status : task.status)" size="large">{{ editMode ?
              editForm.status : task.status }}</el-tag>
            <el-tag v-if="isNormalTask" type="success" size="large">第 {{ task.taskLevel || 1 }} 级普通任务</el-tag>
            <el-tag v-else type="info" size="large">子任务</el-tag>
          </p>
        </div>
        <div class="header-actions">

          <template v-if="editMode">
            <el-button type="primary" @click="saveTask">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button type="warning" @click="startEdit">修改</el-button>
            <el-button v-if="isNormalTask" type="warning" plain @click="openNormalSplitDialog">拆分{{ (task.taskLevel || 1) +1 }}级任务</el-button>
            <el-button v-if="isNormalTask" type="warning" plain @click="openSplitDialog">拆分子任务</el-button>
            <el-button type="primary" @click="goToOrder">
              <el-icon>
                <Tickets />
              </el-icon>
              查看订单
            </el-button>
          </template>
        </div>
      </div>

      <el-tabs type="border-card" v-model="activeTab" >
        <el-tab-pane label="任务信息" name="taskInfo">
          <template v-if="editMode" >
            <el-form :model="editForm" label-width="110px">
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="任务号"><el-input v-model="editForm.taskNo"
                      disabled /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="订单号"><el-input v-model="editForm.orderNo"
                      disabled /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="工序"><el-select v-model="editForm.processName"
                      style="width: 100%"><el-option v-for="p in store.processNames" :key="p" :label="p"
                        :value="p" /></el-select></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="优先顺序"><el-input-number v-model="editForm.processPriority"
                      :min="1" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="工作中心"><el-select v-model="editForm.workCenter"
                      style="width: 100%"><el-option v-for="w in store.workCenters" :key="w" :label="w"
                        :value="w" /></el-select></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="状态"><el-select v-model="editForm.status"
                      style="width: 100%"><el-option v-for="s in taskStatuses" :key="s" :label="s"
                        :value="s" /></el-select></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="数量"><el-input-number v-model="editForm.planQty" :min="1"
                      style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="完工数量"><el-input-number v-model="editForm.completedQty" :min="0"
                      style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="单位"><el-select v-model="editForm.unit"
                      style="width: 100%"><el-option v-for="u in units" :key="u" :label="u"
                        :value="u" /></el-select></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="计件单价"><el-input-number v-model="editForm.pieceworkPrice" :min="0"
                      :precision="2" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="额定工时"><el-input-number v-model="editForm.ratedHours" :min="0"
                      :precision="1" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="操作员"><el-input
                      v-model="editForm.operator" /></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="最晚上线"><el-date-picker v-model="editForm.latestOnlineTime"
                      type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="最晚完工"><el-date-picker v-model="editForm.latestFinishTime"
                      type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="计划开始"><el-date-picker v-model="editForm.planStartDate"
                      type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="计划结束"><el-date-picker v-model="editForm.planEndDate" type="date"
                      value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="实际开始"><el-date-picker v-model="editForm.actualStartDate"
                      type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="实际结束"><el-date-picker v-model="editForm.actualEndDate"
                      type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="8"><el-form-item label="机台"><el-select v-model="editForm.machine"
                      style="width: 100%"><el-option v-for="m in store.machines" :key="m" :label="m"
                        :value="m" /></el-select></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="机台原则"><el-select v-model="editForm.machineRule"
                      style="width: 100%"><el-option v-for="r in store.machineRules" :key="r" :label="r"
                        :value="r" /></el-select></el-form-item></el-col>
              </el-row>
              <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item>
            </el-form>
          </template>
          <template v-else>
            <el-descriptions class="task-descriptions" :column="2" border>
              <el-descriptions-item label="任务号">{{ task.taskNo }}</el-descriptions-item>
              <el-descriptions-item label="订单号">{{ task.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="任务类型">{{ isNormalTask ? '普通任务' : '子任务' }}</el-descriptions-item>
              <el-descriptions-item label="任务层级">{{ isNormalTask ? `第 ${task.taskLevel || 1} 级` : '-' }}</el-descriptions-item>
              <el-descriptions-item label="工序">{{ task.processName }}</el-descriptions-item>
              <el-descriptions-item label="工序优先顺序">{{ task.processPriority }}</el-descriptions-item>
              <el-descriptions-item label="数量">{{ formatNumber(task.planQty) }}</el-descriptions-item>
              <el-descriptions-item label="完工数量">{{ formatNumber(task.completedQty) }}</el-descriptions-item>
              <el-descriptions-item label="单位">{{ task.unit }}</el-descriptions-item>
              <el-descriptions-item label="计件单价">{{ formatCurrency(task.pieceworkPrice) }}</el-descriptions-item>
              <el-descriptions-item label="额定工时">{{ task.ratedHours }} h</el-descriptions-item>
              <el-descriptions-item label="最晚上线时间">{{ task.latestOnlineTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最晚完工时间">{{ task.latestFinishTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="工作中心">{{ task.workCenter || '-' }}</el-descriptions-item>
              <el-descriptions-item label="机台">{{ task.machine || '-' }}</el-descriptions-item>
              <el-descriptions-item label="机台占用原则">{{ task.machineRule || '-' }}</el-descriptions-item>
              <el-descriptions-item label="操作员">{{ task.operator || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划开始">{{ task.planStartDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划结束">{{ task.planEndDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="实际开始">{{ task.actualStartDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="实际结束">{{ task.actualEndDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{ task.remark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <el-row :gutter="16" class="summary-row">
              <el-col :xs="24" :md="8">
                <div class="summary-card">
                  <div class="summary-label">完成进度</div>
                  <el-progress :percentage="task.completion" :status="task.completion === 100 ? 'success' : ''" />
                  <div class="summary-note">已完成 {{ formatNumber(task.completedQty) }} / {{ formatNumber(task.planQty) }}
                  </div>
                </div>
              </el-col>
            </el-row>
          </template>
        </el-tab-pane>

        <el-tab-pane label="材辅料信息" name="materials">
          <template v-if="editMode">
            <el-table :data="editForm.materials" border size="small">
              <el-table-column label="材辅料名称" min-width="130"><template #default="{ row }"><el-input
                    v-model="row.name" /></template></el-table-column>
              <el-table-column label="规格" min-width="120"><template #default="{ row }"><el-input
                    v-model="row.specification" /></template></el-table-column>
              <el-table-column label="数量" width="130"><template #default="{ row }"><el-input-number
                    v-model="row.quantity" :min="1" style="width: 100%" /></template></el-table-column>
              <el-table-column label="单位" width="100"><template #default="{ row }"><el-input
                    v-model="row.unit" /></template></el-table-column>
              <el-table-column label="描述" min-width="170"><template #default="{ row }"><el-input
                    v-model="row.description" /></template></el-table-column>
              <el-table-column label="最晚需求时间" width="160"><template #default="{ row }"><el-date-picker
                    v-model="row.latestRequiredTime" type="date" value-format="YYYY-MM-DD"
                    style="width: 100%" /></template></el-table-column>
              <el-table-column label="操作" width="80" align="center"><template #default="{ $index }"><el-button link
                    type="danger" size="small"
                    @click="removeMaterial($index)">删除</el-button></template></el-table-column>
            </el-table>
            <el-button class="add-material-btn" @click="editForm.materials.push(newMaterial())">增加材辅料</el-button>
          </template>
          <template v-else>
            <el-empty v-if="!task.materials || task.materials.length === 0" description="暂无材辅料" />
            <el-table v-else :data="task.materials" border stripe>
              <el-table-column prop="name" label="材辅料名称" min-width="140" />
              <el-table-column prop="specification" label="规格" min-width="140" show-overflow-tooltip />
              <el-table-column prop="quantity" label="数量" width="100" align="right">
                <template #default="{ row }">{{ formatNumber(row.quantity) }}</template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
              <el-table-column prop="latestRequiredTime" label="最晚需求时间" width="140" />
            </el-table>
          </template>
        </el-tab-pane>

        <el-tab-pane v-if=isNormalTask :label="`子任务 (${subTasks.length})`"   name="subTasks">
          <el-empty v-if="subTasks.length === 0" description="暂无子任务" />
          <el-table v-else :data="subTasks" border stripe>
            <el-table-column prop="taskNo" label="任务编号" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">
                <el-button link type="primary" @click="goToTask(row.taskNo, 'false')">{{ row.taskNo }}</el-button>
                <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="processName" label="工序" width="100" />
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">{{ (row.taskType || 'normal') === 'normal' ? '普通任务' : '子任务' }}</template>
            </el-table-column>
            <el-table-column label="层级" width="80" align="center">
              <template #default="{ row }">{{ (row.taskType || 'normal') === 'normal' ? row.taskLevel || '-' : '-' }}</template>
            </el-table-column>
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
            <el-table-column label="" width="70" fixed="right">
              <template #default="{ row }">

                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane v-if=isNormalTask :label="`${nextLevelLabel} (${nextLevelTasks.length})`" name="nextLevelTasks">
          <el-empty v-if="nextLevelTasks.length === 0" :description="`暂无${nextLevelLabel}`" />
          <el-table v-else :data="nextLevelTasks" border stripe>
            <el-table-column prop="taskNo" label="任务编号" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">
                <el-button link type="primary" @click="goToTask(row.taskNo, 'false')">{{ row.taskNo }}</el-button>
                <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="processName" label="工序" width="100" />
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">{{ (row.taskType || 'normal') === 'normal' ? '普通任务' : '子任务' }}</template>
            </el-table-column>
            <el-table-column label="层级" width="80" align="center">
              <template #default="{ row }">{{ (row.taskType || 'normal') === 'normal' ? row.taskLevel || '-' : '-' }}</template>
            </el-table-column>
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
            <el-table-column label="" width="70" fixed="right">
              <template #default="{ row }">

                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <TaskSplitDialog v-model="splitDialogVisible" title="拆分子任务" :context-title="splitContextTitle"
      :defaults="splitDefaults" :process-names="store.processNames" :machines="store.machines"
      :machine-rules="store.machineRules" :material-options="store.materialOptions" @submit="submitSplit" />
    <TaskSplitDialog v-model="normalSplitDialogVisible" title="拆分普通任务" :context-title="splitContextTitle"
      :defaults="normalSplitDefaults" :process-names="store.processNames" :machines="store.machines"
      :machine-rules="store.machineRules" :material-options="store.materialOptions" disable-average @submit="submitNormalSplit" />
  </div>
</template>

<style scoped>
.task-detail-page {
  padding: 20px;
}

.detail-card {
  border-radius: 8px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 8px 0 0;
  font-size: 24px;
  color: #303133;
}

.page-subtitle {
  margin-top: 6px;
  color: #7b8794;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-descriptions {
  margin-bottom: 16px;
}

.summary-row {
  margin: 16px 0;
}

.summary-card {
  min-height: 132px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafcff;
}

.summary-label {
  margin-bottom: 12px;
  color: #606266;
  font-weight: 700;
}

.summary-note {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
}

.add-material-btn {
  margin-top: 10px;
}

@media (max-width: 900px) {
  .detail-header {
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
