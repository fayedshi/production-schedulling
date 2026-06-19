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
        <el-table-column prop="orderNo" label="订单号" width="160" fixed />
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
        <el-table-column prop="deliveryDate" label="交货日期" width="110" sortable />
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
              <el-button link size="small" type="primary" @click="goToDetail(row.orderNo)">详情</el-button>
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

    <TaskSplitDialog
      v-model="splitDialogVisible"
      title="拆解生产任务"
      :context-title="splitContextTitle"
      :defaults="splitDefaults"
      :process-names="store.processNames"
      :machines="store.machines"
      :machine-rules="store.machineRules"
      @submit="submitSplit"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore, orderStatuses } from '../store/order'
import TaskSplitDialog from '../components/TaskSplitDialog.vue'

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

const splitDefaults = computed(() => {
  if (!selectedOrder.value) return {}
  const order = selectedOrder.value
  return {
    taskNo: `SC-${order.orderNo}-${String(order.productionTasks?.length || 0).padStart(3, '0')}`,
    planQty: order.quantity,
    unit: order.unit,
    latestFinishTime: order.deliveryDate || ''
  }
})

const splitContextTitle = computed(() => {
  if (!selectedOrder.value) return ''
  const order = selectedOrder.value
  return `${order.orderNo} · ${order.productName} · 订单数量 ${order.quantity} ${order.unit}`
})

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

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function canClose(order) {
  const tasks = order.productionTasks || []
  return Number(order.progress) >= 100 && tasks.length > 0 && tasks.every(task => ['已完工', '已质检'].includes(task.status)) && !order.isStocked && order.status !== 'completed'
}

function openSplitDialog(order) {
  selectedOrder.value = order
  splitDialogVisible.value = true
}

function submitSplit(formData) {
  if (!selectedOrder.value) return
  if (Number(formData.planQty) > Number(selectedOrder.value.quantity)) {
    ElMessage.error('生产任务数量不能大于订单数量')
    return
  }
  try {
    store.splitProductionTask(selectedOrder.value.id, formData)
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
</script>

<style scoped>
.production-order-container { padding: 20px; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 20px 0; }
.table-card { margin-bottom: 16px; }
.action-buttons { display: flex; flex-wrap: wrap; gap: 2px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-muted { color: #c0c4cc; font-size: 12px; }
</style>
