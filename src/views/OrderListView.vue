<template>
  <div class="order-list-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增订单
        </el-button>
        <el-button type="success" @click="openImportDialog">
          <el-icon><Upload /></el-icon>
          导入订单
        </el-button>
        <el-button type="warning" @click="handleErpSync">
          <el-icon><Refresh /></el-icon>
          ERP同步
        </el-button>
      </div>
    </div>
    <!-- Search / Filter Bar -->
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
        <el-form-item label="开单日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <!-- Data Table -->
    <el-card class="table-card" shadow="never">
      <el-table :data="paginatedOrders" stripe border v-loading="store.loading" style="width: 100%" :default-sort="{ prop: 'orderDate', order: 'descending' }">
        <el-table-column prop="orderNo" label="订单号" width="160" fixed />
        <el-table-column prop="customerLevel" label="客户等级" width="100">
          <template #default="{ row }">
            <el-tag :type="customerLevelTagType(row.customerLevel)" size="small">{{ row.customerLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salesperson" label="销售员" width="90" />
        <el-table-column prop="productName" label="品名" width="160" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格" width="130" show-overflow-tooltip />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template #default="{ row }">{{ row.unitPrice.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="amount" label="金额" width="110" align="right">
          <template #default="{ row }">{{ row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="orderDate" label="开单日期" width="110" sortable />
        <el-table-column prop="deliveryDate" label="交货日期" width="110" />
        <el-table-column prop="isUrgent" label="是否加急" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isUrgent" type="danger" size="small">加急</el-tag>
            <span v-else class="text-muted">否</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatuses[row.status]?.tagType || 'info'" size="small">{{ orderStatuses[row.status]?.label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="140">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.progress === 100 ? 'success' : ''" :stroke-width="14" />
          </template>
        </el-table-column>
        <!-- <el-table-column prop="notes" label="备注" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.notes" class="notes-cell">{{ row.notes }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column> -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" size="small" @click="goToDetail(row.orderNo)">详情</el-button>
              <template v-if="row.status === 'draft'">
                <el-button link type="success" size="small" @click="handleSubmit(row)">提交</el-button>
                <el-button link type="warning" size="small" @click="goToDetail(row.orderNo, 'true')">修改</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
              <template v-else-if="row.status === 'submitted'">
                <el-button link type="success" size="small" @click="handleApprove(row)">审核</el-button>
                <el-button link type="danger" size="small" @click="handleReturn(row)">退回</el-button>
              </template>
              <template v-else-if="row.status === 'approved'">
                <el-button link type="warning" size="small" @click="handleReverseApprove(row)">反审</el-button>
                <el-button link type="warning" size="small" @click="handlePause(row)">暂停</el-button>
                <el-button link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
              </template>
              <template v-else-if="row.status === 'in_production'">
                <el-button link type="warning" size="small" @click="handlePause(row)">暂停</el-button>
                <el-button link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
              </template>
              <template v-else-if="row.status === 'paused'">
                <el-button link type="success" size="small" @click="handleResume(row)">恢复</el-button>
                <el-button link type="danger" size="small" @click="handleCancel(row)">取消</el-button>
              </template>
              <template v-else-if="row.status === 'returned'">
                <el-button link type="warning" size="small" @click="goToDetail(row.orderNo, 'true')">修改</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
              <template v-else-if="row.status === 'cancelled'">
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 30, 50]" :total="store.filteredOrders.length" layout="total, sizes, prev, pager, next, jumper" background @size-change="currentPage = 1" />
      </div>
    </el-card>
    <!-- Add / Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑订单' : '新增订单'" width="680px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="right">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户等级" prop="customerLevel">
              <el-select v-model="formData.customerLevel" placeholder="请选择客户等级" style="width: 100%">
                <el-option v-for="level in customerLevels" :key="level" :label="level" :value="level" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售员" prop="salesperson">
              <el-select v-model="formData.salesperson" placeholder="请选择销售员" style="width: 100%">
                <el-option v-for="sp in salespersons" :key="sp" :label="sp" :value="sp" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品名" prop="productName">
              <el-select v-model="formData.productName" placeholder="请选择或搜索品名" filterable style="width: 100%">
                <el-option v-for="pn in productNames" :key="pn" :label="pn" :value="pn" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" prop="specification">
              <el-select v-model="formData.specification" placeholder="请选择规格" style="width: 100%">
                <el-option v-for="spec in specifications" :key="spec" :label="spec" :value="spec" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="formData.unitPrice" :min="0.01" :precision="2" :step="10" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" :step="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="formData.unit" placeholder="请选择单位" style="width: 100%">
                <el-option v-for="u in units" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input-number :model-value="computedAmount" disabled controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否加急">
              <el-switch v-model="formData.isUrgent" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开单日期" prop="orderDate">
              <el-date-picker v-model="formData.orderDate" type="date" placeholder="请选择开单日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货日期" prop="deliveryDate">
              <el-date-picker v-model="formData.deliveryDate" type="date" placeholder="请选择交货日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.notes" type="textarea" :maxlength="200" show-word-limit :rows="3" placeholder="请输入备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="info" @click="handleSaveDraft">保存为草稿</el-button>
        <el-button type="primary" @click="handleSaveSubmit">保存并提交</el-button>
      </template>
    </el-dialog>
    <!-- Import Dialog -->
    <el-dialog v-model="importDialogVisible" title="导入订单" width="650px" :close-on-click-modal="false" destroy-on-close>
      <el-alert title="导入说明" type="info" :closable="false" show-icon style="margin-bottom: 16px">
        <template #default>
          <p style="margin: 4px 0; line-height: 1.8">请粘贴 JSON 数组数据，每条记录为一个订单对象。支持的字段：</p>
          <pre style="background: #f5f7fa; padding: 8px; border-radius: 4px; font-size: 12px; margin: 4px 0">{
  "productName": "品名（必填）",
  "quantity": 100（必填）,
  "customerLevel": "客户等级（选填，默认C级）",
  "salesperson": "销售员（选填）",
  "specification": "规格（选填）",
  "unitPrice": 10.50（选填）,
  "unit": "单位（选填，默认'个'）",
  "orderDate": "2026-06-15（选填）",
  "deliveryDate": "2026-07-01（选填）",
  "notes": "备注（选填）",
  "isUrgent": "是"（选填，填"是"或true表示加急）
}</pre>
        </template>
      </el-alert>
      <el-input v-model="importJsonText" type="textarea" :rows="12" placeholder='[
  { "productName": "不锈钢板304", "quantity": 50, "customerLevel": "A级" },
  { "productName": "轴承6205", "quantity": 200, "salesperson": "张三" }
]' />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importLoading">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Refresh } from '@element-plus/icons-vue'
import { useOrderStore, orderStatuses, customerLevels, salespersons, productNames, specifications, units } from '../store/order'

const router = useRouter()
const store = useOrderStore()

// ========== Search ==========
const searchForm = reactive({
  query: '',
  status: '',
  dateRange: []
})

function handleSearch() {
  store.searchQuery = searchForm.query
  store.statusFilter = searchForm.status
  store.dateRange = searchForm.dateRange
  currentPage.value = 1
}

function handleReset() {
  searchForm.query = ''
  searchForm.status = ''
  searchForm.dateRange = []
  store.searchQuery = ''
  store.statusFilter = ''
  store.dateRange = []
  currentPage.value = 1
}

// ========== Pagination ==========
const currentPage = ref(1)
const pageSize = ref(20)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return store.filteredOrders.slice(start, end)
})

// ========== Navigation ==========
function goToDetail(orderNo, isEdit = 'false') {
  router.push(`/orders/${encodeURIComponent(orderNo)}/${isEdit}`)
}

// ========== Customer Level Tag Type ==========
function customerLevelTagType(level) {
  const map = { 'VIP': 'danger', 'A级': 'warning', 'B级': 'success', 'C级': 'info', 'D级': '' }
  return map[level] || 'info'
}

// ========== Add / Edit Dialog ==========
const dialogVisible = ref(false)
const isEditMode = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const initialFormData = () => ({
  customerLevel: 'C级',
  salesperson: '',
  productName: '',
  specification: '',
  unitPrice: 0.00,
  quantity: 1,
  unit: '个',
  orderDate: new Date().toISOString().slice(0, 10),
  deliveryDate: '',
  isUrgent: false,
  notes: ''
})

const formData = reactive(initialFormData())

const formRules = {
  customerLevel: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
  salesperson: [{ required: true, message: '请选择销售员', trigger: 'change' }],
  productName: [{ required: true, message: '请选择品名', trigger: 'change' }],
  specification: [{ required: true, message: '请选择规格', trigger: 'change' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择开单日期', trigger: 'change' }]
}

const computedAmount = computed(() => {
  return parseFloat((formData.unitPrice * formData.quantity).toFixed(2))
})

function resetFormData() {
  Object.assign(formData, initialFormData())
}

function openAddDialog() {
  isEditMode.value = false
  editingId.value = null
  resetFormData()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEditMode.value = true
  editingId.value = row.id
  Object.assign(formData, {
    customerLevel: row.customerLevel,
    salesperson: row.salesperson,
    productName: row.productName,
    specification: row.specification,
    unitPrice: row.unitPrice,
    quantity: row.quantity,
    unit: row.unit,
    orderDate: row.orderDate,
    deliveryDate: row.deliveryDate || '',
    isUrgent: row.isUrgent,
    notes: row.notes || ''
  })
  dialogVisible.value = true
}

async function handleSaveDraft() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEditMode.value) {
      const ok = store.updateOrder(editingId.value, { ...formData })
      if (!ok) {
        ElMessage.error('只能修改草稿或已退回的订单')
        return
      }
      ElMessage.success('订单修改成功（草稿）')
    } else {
      store.saveAsDraft({ ...formData })
      ElMessage.success('订单已保存为草稿')
    }
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '未知错误'))
  }
}

async function handleSaveSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEditMode.value) {
      const ok = store.updateOrder(editingId.value, { ...formData })
      if (!ok) {
        ElMessage.error('只能修改草稿或已退回的订单')
        return
      }
      store.submitOrder(editingId.value)
      ElMessage.success('订单已修改并提交')
    } else {
      store.saveAsSubmit({ ...formData })
      ElMessage.success('订单已保存并提交')
    }
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '未知错误'))
  }
}

// ========== Row Actions ==========

function handleSubmit(row) {
  ElMessageBox.confirm(
    `确认提交订单 <strong>${row.orderNo}</strong> 吗？提交后将进入审核流程。`,
    '提交确认',
    { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.submitOrder(row.id)
    if (ok) {
      ElMessage.success('订单已提交，等待审核')
    } else {
      ElMessage.error('提交失败，订单状态不正确')
    }
  }).catch(() => {})
}

function handleApprove(row) {
  ElMessageBox.confirm(
    `确认审核通过订单 <strong>${row.orderNo}</strong> 吗？通过后将进入排产流程。`,
    '审核确认',
    { confirmButtonText: '审核通过', cancelButtonText: '取消', type: 'success', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.approveOrder(row.id)
    if (ok) {
      ElMessage.success('订单审核通过')
    } else {
      ElMessage.error('审核失败，订单状态不正确')
    }
  }).catch(() => {})
}

function handleReverseApprove(row) {
  ElMessageBox.confirm(
    `确认对订单 <strong>${row.orderNo}</strong> 执行反审吗？反审后将退回至"已提交"状态。`,
    '反审确认',
    { confirmButtonText: '确认反审', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.reverseApprove(row.id)
    if (ok) {
      ElMessage.success('订单已反审')
    } else {
      ElMessage.error('反审失败，订单状态不正确')
    }
  }).catch(() => {})
}

function handlePause(row) {
  ElMessageBox.confirm(
    `确认暂停订单 <strong>${row.orderNo}</strong> 吗？暂停后生产任务将中止。`,
    '暂停确认',
    { confirmButtonText: '确认暂停', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.pauseOrder(row.id)
    if (ok) {
      ElMessage.success('订单已暂停')
    } else {
      ElMessage.error('暂停失败，只有已审核或生产中的订单可以暂停')
    }
  }).catch(() => {})
}

function handleResume(row) {
  ElMessageBox.confirm(
    `确认恢复订单 <strong>${row.orderNo}</strong> 吗？恢复后订单将回到暂停前的状态。`,
    '恢复确认',
    { confirmButtonText: '确认恢复', cancelButtonText: '取消', type: 'success', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.resumeOrder(row.id)
    if (ok) {
      ElMessage.success('订单已恢复')
    } else {
      ElMessage.error('恢复失败，订单状态不正确')
    }
  }).catch(() => {})
}

function handleReturn(row) {
  ElMessageBox.prompt(
    `请输入退回订单 <strong>${row.orderNo}</strong> 的原因（选填）：`,
    '退回确认',
    { confirmButtonText: '确认退回', cancelButtonText: '取消', type: 'warning',
      dangerouslyUseHTMLString: true, inputType: 'textarea',
      inputPlaceholder: '请输入退回原因...' }
  ).then(({ value }) => {
    const ok = store.returnOrder(row.id, value || '')
    if (ok) {
      ElMessage.success('订单已退回')
    } else {
      ElMessage.error('退回失败，只有已提交的订单可以退回')
    }
  }).catch(() => {})
}

function handleCancel(row) {
  ElMessageBox.confirm(
    `确认取消订单 <strong>${row.orderNo}</strong> 吗？取消后不可恢复！`,
    '取消确认',
    { confirmButtonText: '确认取消', cancelButtonText: '返回', type: 'error', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.cancelOrder(row.id)
    if (ok) {
      ElMessage.success('订单已取消')
    } else {
      ElMessage.error('取消失败，已完成或已取消的订单无法取消')
    }
  }).catch(() => {})
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确认删除订单 <strong>${row.orderNo}</strong> 吗？此操作不可恢复！`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'error', dangerouslyUseHTMLString: true }
  ).then(() => {
    const ok = store.deleteOrder(row.id)
    if (ok) {
      ElMessage.success('订单已删除')
    } else {
      ElMessage.error('删除失败，只能删除草稿、已取消或已退回的订单')
    }
  }).catch(() => {})
}

// ========== Import Dialog ==========
const importDialogVisible = ref(false)
const importJsonText = ref('')
const importLoading = ref(false)

function openImportDialog() {
  importJsonText.value = ''
  importDialogVisible.value = true
}

function handleImport() {
  if (!importJsonText.value.trim()) {
    ElMessage.warning('请输入要导入的 JSON 数据')
    return
  }

  let parsed
  try {
    parsed = JSON.parse(importJsonText.value)
  } catch (e) {
    ElMessage.error('JSON 格式错误，请检查：' + e.message)
    return
  }

  if (!Array.isArray(parsed)) {
    ElMessage.error('请粘贴 JSON 数组格式的数据，例如：[{...}, {...}]')
    return
  }

  if (parsed.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  importLoading.value = true
  try {
    const count = store.importOrders(parsed)
    ElMessage.success(`成功导入 ${count} 条订单`)
    importDialogVisible.value = false
  } catch (e) {
    ElMessage.error('导入失败：' + (e.message || '未知错误'))
  } finally {
    importLoading.value = false
  }
}

// ========== ERP Sync ==========
function handleErpSync() {
  ElMessageBox.confirm(
    '确认从 ERP 系统同步最新订单数据吗？同步将导入最近新增的订单。',
    'ERP同步确认',
    { confirmButtonText: '确认同步', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    const count = store.erpSync()
    ElMessage.success(`ERP同步完成，共导入 ${count} 条订单`)
  }).catch(() => {})
}

// ========== Init ==========
onMounted(() => {
  searchForm.query = store.searchQuery
  searchForm.status = store.statusFilter
  searchForm.dateRange = store.dateRange
})
</script>
<style scoped>
.order-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-card {
  margin-bottom: 16px;
}

.search-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.table-card {
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}

.notes-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 160px;
}
</style>