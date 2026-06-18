<template>
  <div class="production-order-container">
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input v-model="searchForm.query" placeholder="订单号 / 品名 / 销售员" clearable style="width: 240px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option v-for="(val, key) in orderStatuses" :key="key" :label="val.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="交货日期">
          <el-date-picker v-model="searchForm.deliveryRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item label="加急">
          <el-select v-model="searchForm.urgent" placeholder="全部" clearable style="width: 110px">
            <el-option label="加急" value="yes" />
            <el-option label="非加急" value="no" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="paginatedOrders" stripe border style="width: 100%" row-key="id">
        <!-- <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="expanded-panel">
              <div class="subtask-title">一级生产任务</div>
              <el-table :data="row.productionTasks || []" border stripe size="small" empty-text="暂无生产任务">
                <el-table-column prop="taskNo" label="任务号" min-width="190" show-overflow-tooltip>
                  <template #default="{ row: task }">
                    <el-button link type="primary" size="small" @click="goToTask(task.taskNo)">{{ task.taskNo }}</el-button>
                    <el-tag v-if="task.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="orderNo" label="订单号" min-width="150">
                  <template #default>{{ row.orderNo }}</template>
                </el-table-column>
                <el-table-column prop="processName" label="工序" width="90" />
                <el-table-column prop="processPriority" label="优先顺序" width="90" align="center" />
                <el-table-column prop="planQty" label="数量" width="90" align="right" />
                <el-table-column prop="unit" label="单位" width="70" />
                <el-table-column prop="pieceworkPrice" label="计件单价" width="100" align="right">
                  <template #default="{ row: task }">{{ formatCurrency(task.pieceworkPrice) }}</template>
                </el-table-column>
                <el-table-column prop="ratedHours" label="额定工时" width="90" align="right" />
                <el-table-column prop="latestOnlineTime" label="最晚上线" width="120" />
                <el-table-column prop="latestFinishTime" label="最晚完工" width="120" />
                <el-table-column prop="machine" label="机台" width="100" />
                <el-table-column prop="machineRule" label="机台占用" width="120" />
                <el-table-column label="子任务" width="90" align="center">
                  <template #default="{ row: task }">
                    <el-tag v-if="task.subTasks?.length" type="danger" effect="plain">{{ task.subTasks.length }} 个</el-tag>
                    <span v-else class="text-muted">无</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="90">
                  <template #default="{ row: task }">
                    <el-tag :type="taskStatusTagType(task.status)" size="small">{{ task.status }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column> -->
        <el-table-column prop="orderNo" label="订单号" width="160" fixed />
        <!-- <el-table-column label="操作" prop="orderNo" width="230" fixed="left">
          <template #default="{ row }">
            <el-button link size="small" @click="goToDetail(row.orderNo)">{{row.orderNo}}</el-button>
          </template>
        </el-table-column> -->
        <el-table-column prop="customerLevel" label="客户等级" width="100">
          <template #default="{ row }">
            <el-tag :type="customerLevelTagType(row.customerLevel)" size="small">{{ row.customerLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salesperson" label="销售员" width="90" />
        <el-table-column prop="productName" label="品名" width="160" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格" width="130" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="amount" label="金额" width="110" align="right">
          <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.notes || '-' }}</template>
        </el-table-column>
        <el-table-column prop="orderDate" label="开单日期" width="110" sortable />
        <el-table-column prop="deliveryDate" label="交货日期" width="110" sortable />
        <el-table-column label="交付风险" width="110">
          <template #default="{ row }">
            <el-tag :type="store.buildDeliveryRisk(row).type" size="small">{{ store.buildDeliveryRisk(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="齐套状态" width="110">
          <template #default="{ row }">
            <el-tag :type="orderReadiness(row).type" size="small">{{ orderReadiness(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isUrgent" label="是否加急" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isUrgent" type="danger" size="small">加急</el-tag>
            <span v-else class="text-muted">否</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="流转状态" width="110">
          <template #default="{ row }">
            <el-tag :type="orderStatuses[row.status]?.tagType || 'info'" size="small">{{ orderStatuses[row.status]?.label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link size="small" @click="goToDetail(row.orderNo)">详情</el-button>
              <el-button link type="primary" size="small" @click="openSplitDialog(row)">拆解生产任务</el-button>
              <el-button v-if="['approved', 'in_production'].includes(row.status)" link type="warning" size="small" @click="handlePause(row)">暂停</el-button>
              <el-button v-if="canClose(row)" link type="success" size="small" @click="handleClose(row)">结案</el-button>              
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 30, 50]" :total="filteredOrders.length" layout="total, sizes, prev, pager, next, jumper" background @size-change="currentPage = 1" />
      </div>
    </el-card>

    <el-dialog v-model="splitDialogVisible" title="拆解生产任务" width="900px" :close-on-click-modal="false" destroy-on-close>
      <el-alert v-if="selectedOrder" type="info" :closable="false" style="margin-bottom: 16px">
        <template #title>
          {{ selectedOrder.orderNo }} · {{ selectedOrder.productName }} · 订单数量 {{ selectedOrder.quantity }} {{ selectedOrder.unit }}
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

      <!-- <div class="section-title">材料/辅料</div>
      <el-table :data="splitForm.materials" border size="small">
        <el-table-column label="材料名称" min-width="120"><template #default="{ row }"><el-input v-model="row.name" /></template></el-table-column>
        <el-table-column label="规格" min-width="110"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
        <el-table-column label="数量" width="120"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" style="width: 100%" /></template></el-table-column>
        <el-table-column label="单位" width="100"><template #default="{ row }"><el-input v-model="row.unit" /></template></el-table-column>
        <el-table-column label="描述" min-width="160"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
        <el-table-column label="最晚需求" width="150"><template #default="{ row }"><el-date-picker v-model="row.latestRequiredTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></template></el-table-column>
      </el-table>
      <el-button class="add-material-btn" @click="addMaterial">增加辅料</el-button> -->

      <template #footer>
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSplit">确认拆解</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tickets } from '@element-plus/icons-vue'
import { useOrderStore, orderStatuses, units } from '../store/order'

const router = useRouter()
const store = useOrderStore()

const searchForm = reactive({
  query: '',
  status: '',
  deliveryRange: [],
  urgent: ''
})
const appliedFilters = reactive({ ...searchForm })
const currentPage = ref(1)
const pageSize = ref(20)
const splitDialogVisible = ref(false)
const selectedOrder = ref(null)

const splitForm = reactive(initialSplitForm())

const filteredOrders = computed(() => {
  let list = store.productionOrders.slice()
  if (appliedFilters.query) {
    const q = appliedFilters.query.toLowerCase()
    list = list.filter(order =>
      order.orderNo.toLowerCase().includes(q) ||
      order.productName.toLowerCase().includes(q) ||
      order.salesperson.toLowerCase().includes(q)
    )
  }
  if (appliedFilters.status) list = list.filter(order => order.status === appliedFilters.status)
  if (appliedFilters.deliveryRange?.length === 2) {
    const [start, end] = appliedFilters.deliveryRange
    list = list.filter(order => order.deliveryDate >= start && order.deliveryDate <= end)
  }
  if (appliedFilters.urgent) list = list.filter(order => appliedFilters.urgent === 'yes' ? order.isUrgent : !order.isUrgent)
  return list.sort((a, b) => String(a.deliveryDate || '').localeCompare(String(b.deliveryDate || '')))
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
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

function resetSplitForm(data) {
  Object.assign(splitForm, initialSplitForm(), data)
}

function handleSearch() {
  Object.assign(appliedFilters, searchForm)
  currentPage.value = 1
}

function handleReset() {
  Object.assign(searchForm, { query: '', status: '', deliveryRange: [], urgent: '' })
  Object.assign(appliedFilters, searchForm)
  currentPage.value = 1
}

function customerLevelTagType(level) {
  const map = { 'VIP': 'danger', 'A级': 'warning', 'B级': 'success', 'C级': 'info', 'D级': '' }
  return map[level] || 'info'
}

function taskStatusTagType(status) {
  const map = { '待排产': 'info', '已排产': 'warning', '生产中': 'primary', '已完工': 'success', '已质检': 'success' }
  return map[status] || 'info'
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function collectMaterials(order) {
  return store.getOrderMaterialReadiness(order)
}

function orderReadiness(order) {
  const materials = collectMaterials(order)
  if (!materials.length) return { label: '无物料', type: 'info' }
  if (materials.some(material => material.launchShortQty > 0)) return { label: '欠料', type: 'danger' }
  if (materials.some(material => material.netDemandQty > 0)) return { label: '需跟催', type: 'warning' }
  return { label: '齐套', type: 'success' }
}

function canClose(order) {
  const tasks = order.productionTasks || []
  return Number(order.progress) >= 100 && tasks.length > 0 && tasks.every(task => ['已完工', '已质检'].includes(task.status)) && !order.isStocked && order.status !== 'completed'
}

function openSplitDialog(order) {
  selectedOrder.value = order
  const nextNo = `SC-${order.orderNo}-${String(order.productionTasks?.length || 0).padStart(3, '0')}`
  resetSplitForm({ taskNo: nextNo, planQty: order.quantity, unit: order.unit, latestFinishTime: order.deliveryDate || '' })
  splitDialogVisible.value = true
}

function addMaterial() {
  splitForm.materials.push(newMaterial())
}

function submitSplit() {
  if (!selectedOrder.value) return
  if (Number(splitForm.planQty) > Number(selectedOrder.value.quantity)) {
    ElMessage.error('生产任务数量不能大于订单数量')
    return
  }
  try {
    store.splitProductionTask(selectedOrder.value.id, { ...splitForm, materials: splitForm.materials.map(m => ({ ...m })) })
    ElMessage.success('生产任务拆解成功')
    splitDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.message || '拆解失败')
  }
}

function handlePause(order) {
  ElMessageBox.confirm(`确认暂停订单 ${order.orderNo} 吗？`, '暂停确认', { type: 'warning' })
    .then(() => {
      const ok = store.pauseOrder(order.id)
      ok ? ElMessage.success('订单已暂停') : ElMessage.error('暂停失败')
    })
    .catch(() => {})
}

function handleClose(order) {
  ElMessageBox.confirm(`确认结案订单 ${order.orderNo} 吗？`, '结案确认', { type: 'success' })
    .then(() => {
      const ok = store.closeProductionOrder(order.id)
      ok ? ElMessage.success('订单已结案') : ElMessage.error('结案条件未满足')
    })
    .catch(() => {})
}

function goToDetail(orderNo) {
  router.push(`/orders/${encodeURIComponent(orderNo)}`)
}

function goToTask(taskNo) {
  router.push(`/tasks/${encodeURIComponent(taskNo)}`)
}
</script>

<style scoped>
.production-order-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 16px; }
.page-title { font-size: 22px; font-weight: 600; color: #303133; margin: 0; }
.page-subtitle { margin-top: 6px; color: #7b8794; font-size: 13px; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 20px 0; }
.table-card { margin-bottom: 16px; }
.expanded-panel { padding: 10px 18px 14px; background: #fafafa; }
.action-buttons { display: flex; flex-wrap: wrap; gap: 2px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-muted { color: #c0c4cc; font-size: 12px; }
.subtask-block { margin-top: 12px; }
.subtask-title, .section-title { font-weight: 700; color: #303133; margin: 12px 0 8px; }
.quantity-list { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.add-material-btn { margin-top: 10px; }
</style>
