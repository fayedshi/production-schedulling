<template>
  <div class="schedule-page">
    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :xl="16">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>生产任务总表</span>
              <el-tag type="info" effect="plain">{{ scheduleTasks.length }} 项任务</el-tag>
            </div>
          </template>
          <el-table :data="scheduleTasks" border stripe height="430" empty-text="暂无生产任务">
            <el-table-column prop="taskNo" label="任务编号" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <el-button link type="primary" @click="goToTask(row.taskNo,'false')">{{ row.taskNo }}</el-button>
                <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="orderNo" label="订单号" min-width="145" show-overflow-tooltip />
            <el-table-column prop="processName" label="工序" width="80" />
            <el-table-column prop="workCenter" label="车间" width="90" />
            <el-table-column prop="planQty" label="数量" width="80" align="right" />
            <el-table-column prop="pieceworkPrice" label="计件单价" width="100" align="right">
              <template #default="{ row }">{{ formatCurrency(row.pieceworkPrice) }}</template>
            </el-table-column>
            <el-table-column prop="ratedHours" label="额定工时" width="100" align="right" />
            <el-table-column prop="salary" label="合计工资" width="100" align="right">
              <template #default="{ row }">{{ formatCurrency(row.salary) }}</template>
            </el-table-column>
            <el-table-column label="进度" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.completion" :status="row.completion === 100 ? 'success' : ''" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goToTask(row.taskNo,'false')">详情</el-button>
                <el-button link type="warning" size="small" @click="goToTask(row.taskNo,'true')">修改</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- <el-dialog v-model="editDialogVisible" title="修改生产任务" width="980px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="editForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="任务编号"><el-input v-model="editForm.taskNo" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="订单号"><el-input v-model="editForm.orderNo" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="工序"><el-select v-model="editForm.processName" style="width: 100%"><el-option v-for="p in store.processNames" :key="p" :label="p" :value="p" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="优先顺序"><el-input-number v-model="editForm.processPriority" :min="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="工作中心"><el-select v-model="editForm.workCenter" style="width: 100%"><el-option v-for="w in store.workCenters" :key="w" :label="w" :value="w" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="状态"><el-select v-model="editForm.status" style="width: 100%"><el-option v-for="s in taskStatuses" :key="s" :label="s" :value="s" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="计划数量"><el-input-number v-model="editForm.planQty" :min="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="完工数量"><el-input-number v-model="editForm.completedQty" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="单位"><el-select v-model="editForm.unit" style="width: 100%"><el-option v-for="u in units" :key="u" :label="u" :value="u" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="计件单价"><el-input-number v-model="editForm.pieceworkPrice" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="额定工时"><el-input-number v-model="editForm.ratedHours" :min="0" :precision="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="操作员"><el-input v-model="editForm.operator" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="最晚上线"><el-date-picker v-model="editForm.latestOnlineTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="最晚完工"><el-date-picker v-model="editForm.latestFinishTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="计划开始"><el-date-picker v-model="editForm.planStartDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="计划结束"><el-date-picker v-model="editForm.planEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="机台"><el-select v-model="editForm.machine" style="width: 100%"><el-option v-for="m in store.machines" :key="m" :label="m" :value="m" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="机台原则"><el-select v-model="editForm.machineRule" style="width: 100%"><el-option v-for="r in store.machineRules" :key="r" :label="r" :value="r" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>

      <div class="section-title">材辅料信息</div>
      <el-table :data="editForm.materials" border size="small">
        <el-table-column label="材辅料名称" min-width="130"><template #default="{ row }"><el-input v-model="row.name" /></template></el-table-column>
        <el-table-column label="规格" min-width="120"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
        <el-table-column label="数量" width="130"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" style="width: 100%" /></template></el-table-column>
        <el-table-column label="单位" width="100"><template #default="{ row }"><el-input v-model="row.unit" /></template></el-table-column>
        <el-table-column label="描述" min-width="170"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
        <el-table-column label="最晚需求时间" width="160"><template #default="{ row }"><el-date-picker v-model="row.latestRequiredTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></template></el-table-column>
        <el-table-column label="操作" width="80" align="center"><template #default="{ $index }"><el-button link type="danger" size="small" @click="removeMaterial($index)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button class="add-material-btn" @click="editForm.materials.push(newMaterial())">增加材辅料</el-button>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog> -->
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore, units } from '../store/order'
import { fa } from 'element-plus/es/locales.mjs'
import useCommonFunction from '../hooks/useCommonFunction'

const router = useRouter()
const store = useOrderStore()
const scheduleTasks = computed(() => store.scheduleTasks)
const editDialogVisible = ref(false)
const taskStatuses = ['待排产', '已排产', '生产中', '已完工', '已质检']
const { handleDelete } = useCommonFunction();

const editForm = reactive(initialEditForm())

function initialEditForm() {
  return {
    taskNo: '',
    orderNo: '',
    processName: '下料',
    processPriority: 1,
    workCenter: '一号车间',
    planQty: 1,
    completedQty: 0,
    unit: '个',
    pieceworkPrice: 0,
    ratedHours: 0,
    latestOnlineTime: '',
    latestFinishTime: '',
    machine: 'CNC-01',
    machineRule: '一人一机',
    status: '待排产',
    planStartDate: '',
    planEndDate: '',
    actualStartDate: null,
    actualEndDate: null,
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

function openEditDialog(row) {
  Object.assign(editForm, initialEditForm(), {
    taskNo: row.taskNo,
    orderNo: row.orderNo,
    processName: row.processName,
    processPriority: row.processPriority,
    workCenter: row.workCenter,
    planQty: row.planQty,
    completedQty: row.completedQty,
    unit: row.unit,
    pieceworkPrice: row.pieceworkPrice,
    ratedHours: row.ratedHours,
    latestOnlineTime: row.latestOnlineTime,
    latestFinishTime: row.latestFinishTime,
    machine: row.machine,
    machineRule: row.machineRule,
    status: row.status,
    planStartDate: row.planStartDate,
    planEndDate: row.planEndDate,
    actualStartDate: row.actualStartDate,
    actualEndDate: row.actualEndDate,
    operator: row.operator,
    materials: cloneMaterials(row.materials),
    remark: row.remark || ''
  })
  editDialogVisible.value = true
}

function removeMaterial(index) {
  if (editForm.materials.length === 1) return
  editForm.materials.splice(index, 1)
}

function submitEdit() {
  const ok = store.updateTaskByNo(editForm.taskNo, {
    processName: editForm.processName,
    processPriority: editForm.processPriority,
    workCenter: editForm.workCenter,
    planQty: editForm.planQty,
    completedQty: editForm.completedQty,
    unit: editForm.unit,
    pieceworkPrice: editForm.pieceworkPrice,
    ratedHours: editForm.ratedHours,
    latestOnlineTime: editForm.latestOnlineTime,
    latestFinishTime: editForm.latestFinishTime,
    machine: editForm.machine,
    machineRule: editForm.machineRule,
    status: editForm.status,
    planStartDate: editForm.planStartDate,
    planEndDate: editForm.planEndDate,
    actualStartDate: editForm.actualStartDate,
    actualEndDate: editForm.actualEndDate,
    operator: editForm.operator,
    materials: editForm.materials.map(item => ({ ...item })),
    remark: editForm.remark
  })
  ok ? ElMessage.success('任务已修改') : ElMessage.error('修改失败')
  if (ok) editDialogVisible.value = false
}


function formatCurrency(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function goToTask(taskNo,boolVal) {
  router.push(`/tasks/${encodeURIComponent(taskNo)}/${boolVal}`)
}
</script>

<style scoped>
.schedule-page { padding: 20px; }
.content-row { align-items: flex-start; margin-bottom: 16px; }
.panel-card { margin-bottom: 16px; border-radius: 6px; border-color: #e4e7ed; }
.panel-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #303133; }
.section-title { font-weight: 700; color: #303133; margin: 12px 0 8px; }
.add-material-btn { margin-top: 10px; }
@media (max-width: 900px) {
  .page-header { align-items: flex-start; flex-direction: column; }
}
</style>
