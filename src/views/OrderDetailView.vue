    <script setup>
    import { ref, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { ArrowLeft } from '@element-plus/icons-vue'
    import { useOrderStore, orderStatuses } from '../store/order'

    const route = useRoute()
    const router = useRouter()
    const store = useOrderStore()

    const order = ref(null)
    const activeTab = ref('info')

    // ========== Formatting helpers ==========

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '-'
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '-'
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    const formatNumber = (val) => {
      if (val == null) return '-'
      return Number(val).toLocaleString('zh-CN')
    }

    const formatCurrency = (val) => {
      if (val == null) return ''
      return Number(val).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    // ========== Computed ==========

    const statusLabel = computed(() => {
      if (!order.value) return ''
      const cfg = orderStatuses[order.value.status]
      return cfg ? cfg.label : order.value.status
    })

    const statusTagType = computed(() => {
      if (!order.value) return 'info'
      const cfg = orderStatuses[order.value.status]
      return cfg ? cfg.tagType : 'info'
    })

    const urgentType = computed(() => {
      return order.value && order.value.isUrgent ? 'danger' : 'info'
    })

    const urgentText = computed(() => {
      return order.value && order.value.isUrgent ? '加急' : '否'
    })

    const visibleActions = computed(() => {
      if (!order.value) return []
      const s = order.value.status
      switch (s) {
        case 'draft':
          return [
            { key: 'submit', label: '提交', type: 'primary' },
            { key: 'edit', label: '修改', type: 'warning' },
            { key: 'delete', label: '删除', type: 'danger' },
          ]
        case 'submitted':
          return [
            { key: 'approve', label: '审核', type: 'success' },
            { key: 'return', label: '退回', type: 'warning' },
          ]
        case 'approved':
          return [
            { key: 'reverseApprove', label: '反审', type: 'warning' },
            { key: 'pause', label: '暂停', type: '' },
            { key: 'cancel', label: '取消', type: 'danger' },
          ]
        case 'in_production':
          return [
            { key: 'pause', label: '暂停', type: '' },
            { key: 'cancel', label: '取消', type: 'danger' },
          ]
        case 'paused':
          return [
            { key: 'resume', label: '恢复', type: 'success' },
            { key: 'cancel', label: '取消', type: 'danger' },
          ]
        case 'returned':
          return [
            { key: 'edit', label: '修改', type: 'warning' },
            { key: 'delete', label: '删除', type: 'danger' },
          ]
        case 'cancelled':
          return [
            { key: 'delete', label: '删除', type: 'danger' },
          ]
        case 'completed':
          return []
        default:
          return []
      }
    })

    const totalMaterialAmount = computed(() => {
      if (!order.value || !order.value.auxiliaryMaterials) return 0
      return order.value.auxiliaryMaterials.reduce((sum, m) => {
        const price = Number(m.unitPrice) || 0
        const qty = Number(m.quantity) || 0
        return sum + price * qty
      }, 0)
    })

    const stepStatusMap = computed(() => {
      if (!order.value) return { active: 0, steps: [] }
      const s = order.value.status
      const forwardOrder = ['draft', 'submitted', 'approved', 'in_production', 'completed']

      const steps = [
        { title: '草稿', status: 'wait' },
        { title: '已提交', status: 'wait' },
        { title: '已审核', status: 'wait' },
        { title: '生产中', status: 'wait' },
        { title: '已完成', status: 'wait' },
      ]

      if (s === 'returned') {
        steps[0].status = 'finish'
        steps[1].status = 'error'
        steps[1].title = '已退回'
        return { active: 1, steps }
      }
      if (s === 'cancelled') {
        const idx = Math.min(forwardOrder.indexOf('approved'), 2)
        for (let i = 0; i < idx; i++) steps[i].status = 'finish'
        for (let i = idx; i < steps.length; i++) steps[i].status = 'wait'
        steps[idx].status = 'error'
        steps[idx].title = '已取消'
        return { active: idx, steps }
      }
      if (s === 'paused') {
        for (let i = 0; i < 3; i++) steps[i].status = 'finish'
        steps[3].status = 'error'
        steps[3].title = '已暂停'
        return { active: 3, steps }
      }

      const statusIndex = forwardOrder.indexOf(s)
      if (statusIndex === -1) return { active: 0, steps }

      for (let i = 0; i < statusIndex; i++) {
        steps[i].status = 'finish'
      }
      steps[statusIndex].status = 'process'
      return { active: statusIndex, steps }
    })

    // ========== Task helpers ==========

    const completionRate = (task) => {
      if (!task || task.planQty == null || task.completedQty == null) return 0
      const plan = Number(task.planQty)
      if (plan === 0) return 0
      return Math.round((Number(task.completedQty) / plan) * 100)
    }

    const taskStatusTagType = (status) => {
      const map = {
        '待排产': 'info',
        '已排产': 'warning',
        '生产中': '',
        '已完工': 'success',
        '已质检': 'success',
      }
      return map[status] || 'info'
    }

    const materialRowAmount = (row) => {
      if (row.amount != null) return formatCurrency(row.amount)
      const price = Number(row.unitPrice) || 0
      const qty = Number(row.quantity) || 0
      return formatCurrency(price * qty)
    }

    // ========== Timeline color ==========

    const getTimelineColor = (log) => {
      const to = log.toStatus
      if (['cancelled', 'returned'].includes(to)) return '#F56C6C'
      if (to === 'paused') return '#E6A23C'
      const forwardFlow = ['draft', 'submitted', 'approved', 'in_production', 'completed']
      const fromIndex = forwardFlow.indexOf(log.fromStatus)
      const toIndex = forwardFlow.indexOf(to)
      if (fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex) return '#67C23A'
      if (toIndex !== -1 && (fromIndex === -1 || fromIndex === null)) return '#67C23A'
      return '#909399'
    }

    const getCustomerLevelType = (level) => {
      const map = { 'VIP': 'danger', 'A级': 'warning', 'B级': 'success', 'C级': 'info', 'D级': '' }
      return map[level] || 'info'
    }

    // ========== Init ==========

    const loadOrder = () => {
      const orderNo = route.params.orderNo
      const id = route.params.id
      const found = orderNo ? store.getOrderByNo(decodeURIComponent(orderNo)) : store.getOrderById(id)
      if (found) {
        order.value = found
      } else {
        ElMessage.error('订单不存在')
      }
    }

    onMounted(() => {
      loadOrder()
    })

    // ========== Navigation ==========

    const goBack = () => {
      router.push('/orders')
    }

    const goToTask = (taskNo, isEdit) => {
      router.push(`/tasks/${encodeURIComponent(taskNo)}/${isEdit}`)
    }

    // ========== Actions ==========

    const handleSubmit = async () => {
      try {
        await ElMessageBox.confirm('确认提交该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info',
        })
        store.submitOrder(order.value.id)
        ElMessage.success('订单已提交')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleEdit = () => {
      ElMessage.info('请返回列表页进行修改操作')
    }

    const handleDelete = async () => {
      try {
        await ElMessageBox.confirm('确认删除该订单吗？此操作不可恢复！', '警告', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        })
        store.deleteOrder(order.value.id)
        ElMessage.success('订单已删除')
        router.push('/orders')
      } catch {
        // user cancelled
      }
    }

    const handleApprove = async () => {
      try {
        await ElMessageBox.confirm('确认审核通过该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info',
        })
        store.approveOrder(order.value.id)
        ElMessage.success('订单已审核')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleReturn = async () => {
      try {
        const result = await ElMessageBox.prompt('请输入退回原因', '退回订单', {
          confirmButtonText: '确定退回',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入退回原因（选填）',
        })
        store.returnOrder(order.value.id, result.value || '')
        ElMessage.success('订单已退回')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleReverseApprove = async () => {
      try {
        await ElMessageBox.confirm('确认反审该订单吗？订单将回到已提交状态。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        store.reverseApprove(order.value.id)
        ElMessage.success('订单已反审')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handlePause = async () => {
      try {
        await ElMessageBox.confirm('确认暂停该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        store.pauseOrder(order.value.id)
        ElMessage.success('订单已暂停')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleResume = async () => {
      try {
        await ElMessageBox.confirm('确认恢复该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info',
        })
        store.resumeOrder(order.value.id)
        ElMessage.success('订单已恢复')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleCancel = async () => {
      try {
        await ElMessageBox.confirm('确认取消该订单吗？取消后订单将无法继续生产。', '警告', {
          confirmButtonText: '确定取消',
          cancelButtonText: '返回',
          type: 'warning',
        })
        store.cancelOrder(order.value.id)
        ElMessage.success('订单已取消')
        loadOrder()
      } catch {
        // user cancelled
      }
    }

    const handleAction = (actionKey) => {
      const handlers = {
        submit: handleSubmit,
        edit: handleEdit,
        delete: handleDelete,
        approve: handleApprove,
        return: handleReturn,
        reverseApprove: handleReverseApprove,
        pause: handlePause,
        resume: handleResume,
        cancel: handleCancel,
      }
      const handler = handlers[actionKey]
      if (handler) handler()
    }
</script>

    <template>
      <div class="detail-container" v-if="order">
        <!-- Header Card -->
        <el-card class="header-card" shadow="never">
          <div class="detail-header">
            <div class="header-left">
              <el-button :icon="ArrowLeft" @click="goBack" text></el-button>
              <h2 class="page-title">订单 {{ order.orderNo }}- 详情</h2>
              <el-tag :type="statusTagType" size="large" effect="dark">{{ statusLabel }}</el-tag>
              <el-tag :type="urgentType" v-if="urgentType == 'danger'" size="large" effect="plain">
                {{ urgentText }}
              </el-tag>
            </div>
            <div class="header-right" v-if="visibleActions.length > 0">
              <el-button v-for="action in visibleActions" :key="action.key" :type="action.type || 'default'"
                @click="handleAction(action.key)" size="default">
                {{ action.label }}
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- Tabs Card -->
        <el-card class="tabs-card" shadow="never">
          <el-tabs v-model="activeTab" type="border-card">

            <!-- =================== Tab 1: 订单信息 =================== -->
            <el-tab-pane label="订单信息" name="info">
              <div class="tab-content">
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="订单号" label-class-name="desc-label">
                    {{ order.orderNo }}
                  </el-descriptions-item>
                  <el-descriptions-item label="客户等级">
                    <el-tag :type="getCustomerLevelType(order.customerLevel)" size="small">
                      {{ order.customerLevel }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="销售员">{{ order.salesperson }}</el-descriptions-item>
                  <el-descriptions-item label="品名">{{ order.productName }}</el-descriptions-item>
                  <el-descriptions-item label="规格">{{ order.specification }}</el-descriptions-item>
                  <el-descriptions-item label="单价">{{ formatCurrency(order.unitPrice) }}</el-descriptions-item>
                  <el-descriptions-item label="数量">{{ formatNumber(order.quantity) }}</el-descriptions-item>
                  <el-descriptions-item label="单位">{{ order.unit }}</el-descriptions-item>
                  <el-descriptions-item label="金额">{{ formatCurrency(order.amount) }}</el-descriptions-item>
                  <el-descriptions-item label="开单日期">{{ formatDate(order.orderDate) }}</el-descriptions-item>
                  <el-descriptions-item label="交货日期">{{ formatDate(order.deliveryDate) }}</el-descriptions-item>
                  <el-descriptions-item label="是否加急">
                    <el-tag :type="urgentType" size="small">{{ urgentText }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="备注">
                    <div class="notes-text">{{ order.notes || '-' }}</div>
                  </el-descriptions-item>
                  <el-descriptions-item label="创建人">{{ order.createdBy }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatDateTime(order.createdAt) }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ formatDateTime(order.updatedAt) }}</el-descriptions-item>
                  <el-descriptions-item label="">
                    <!-- spacer cell to keep grid balanced -->
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>

            <!-- =================== Tab 2: 生产任务信息 =================== -->
            <el-tab-pane label="生产任务信息" name="tasks">
              <div class="tab-content">
                <el-empty v-if="!order.productionTasks || order.productionTasks.length === 0" description="暂无生产任务" />
                <el-table v-else :data="order.productionTasks" border stripe style="width: 100%" size="default">
                
                  <el-table-column prop="taskNo" label="任务编号" min-width="210" show-overflow-tooltip>
                    <template #default="{ row }">
                      <el-button link type="primary" @click="goToTask(row.taskNo, 'false')">{{ row.taskNo }}</el-button>
                      <!-- <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag> -->
                    </template>
                  </el-table-column>
                  <el-table-column prop="processName" label="工序" min-width="100" />
                  <el-table-column prop="processPriority" label="优先顺序" min-width="90" align="center" />
                  <el-table-column prop="workCenter" label="工作中心" min-width="120" />
                  <el-table-column prop="machine" label="机台" min-width="100" />
                  <el-table-column prop="machineRule" label="机台原则" min-width="110" />
                  <el-table-column prop="planQty" label="计划数量" min-width="100" align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.planQty) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="completedQty" label="完工数量" min-width="100" align="center">
                    <template #default="{ row }">
                      {{ formatNumber(row.completedQty) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="pieceworkPrice" label="计件单价" min-width="100" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.pieceworkPrice) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="ratedHours" label="额定工时" min-width="90" align="right" />
                  <el-table-column label="完成率" min-width="170">
                    <template #default="{ row }">
                      <div class="progress-cell">
                        <span class="progress-text">{{ completionRate(row) }}%</span>
                        <el-progress :percentage="completionRate(row)" :stroke-width="8" :show-text="false"
                          class="progress-bar-inline" />
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" min-width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="taskStatusTagType(row.status)" size="small">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="计划开始" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ formatDate(row.planStartDate) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="计划结束" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ formatDate(row.planEndDate) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="最晚上线" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ formatDate(row.latestOnlineTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="最晚完工" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ formatDate(row.latestFinishTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="实际开始" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ row.actualStartDate ? formatDate(row.actualStartDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="实际结束" min-width="120" align="center">
                    <template #default="{ row }">
                      {{ row.actualEndDate ? formatDate(row.actualEndDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="operator" label="操作员" min-width="100" align="center" />
                </el-table>
              </div>
            </el-tab-pane>

            <!-- =================== Tab 3: 流转状态 =================== -->
            <el-tab-pane label="流转状态" name="flow">
              <div class="tab-content">
                <el-empty v-if="!order.flowLogs || order.flowLogs.length === 0" description="暂无流转记录" />
                <el-timeline v-else>
                  <el-timeline-item v-for="log in order.flowLogs" :key="log.id"
                    :timestamp="formatDateTime(log.createdAt)" :color="getTimelineColor(log)" placement="top"
                    size="large">
                    <div class="timeline-item-content">
                      <div class="timeline-operator">{{ log.operator }}</div>
                      <div class="timeline-label">{{ log.label }}</div>
                      <div class="timeline-remark" v-if="log.remark">
                        {{ log.remark }}
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>

            <!-- =================== Tab 4: 辅料信息 =================== -->
            <el-tab-pane label="辅料信息" name="materials">
              <div class="tab-content">
                <el-empty v-if="!order.auxiliaryMaterials || order.auxiliaryMaterials.length === 0"
                  description="暂无辅料信息" />
                <template v-else>
                  <el-table :data="order.auxiliaryMaterials" border stripe style="width: 100%" size="default">
                    <el-table-column prop="name" label="辅料名称" min-width="140" />
                    <el-table-column prop="unit" label="单位" min-width="80" align="center" />
                    <el-table-column label="单价" min-width="120" align="right">
                      <template #default="{ row }">
                        {{ formatCurrency(row.unitPrice) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="quantity" label="数量" min-width="100" align="center">
                      <template #default="{ row }">
                        {{ formatNumber(row.quantity) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" min-width="140" align="right">
                      <template #default="{ row }">
                        {{ materialRowAmount(row) }}
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="material-total">
                    <span class="material-total-label">合计金额：</span>
                    <span class="material-total-value">
                      {{ formatCurrency(totalMaterialAmount) }}
                    </span>
                  </div>
                </template>
              </div>
            </el-tab-pane>

            <!-- =================== Tab 5: 进度状态 =================== -->
            <el-tab-pane label="进度状态" name="progress">
              <div class="tab-content progress-tab-content">
                <div class="progress-section">
                  <h3 class="section-title">整体进度</h3>
                  <div class="progress-wrapper">
                    <el-progress :percentage="order.progress || 0" :stroke-width="22" :text-inside="true"
                      :status="order.progress === 100 ? 'success' : undefined" />
                  </div>
                </div>
                <div class="steps-section">
                  <h3 class="section-title">订单阶段</h3>
                  <el-steps :active="stepStatusMap.active" align-center process-status="process"
                    finish-status="success">
                    <el-step v-for="(step, index) in stepStatusMap.steps" :key="index" :title="step.title"
                      :status="step.status" />
                  </el-steps>
                </div>
              </div>
            </el-tab-pane>

          </el-tabs>
        </el-card>
      </div>

      <!-- Not Found State -->
      <div class="detail-container empty-container" v-else>
        <el-card shadow="never">
          <el-empty description="订单不存在">
            <el-button type="primary" @click="goBack">返回列表</el-button>
          </el-empty>
        </el-card>
      </div>
    </template>

<style scoped>
/* ===== Layout ===== */
.detail-container {
  padding: 20px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.header-card {
  margin-bottom: 16px;
}

.tabs-card {
  margin-top: 16px;
}

/* ===== Header ===== */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ===== Status Section ===== */
.status-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== Tab Content ===== */
.tab-content {
  padding: 8px 0;
}

.desc-label {
  font-weight: 600;
}

.notes-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #303133;
}

/* ===== Production Tasks ===== */
.subtask-detail {
  padding: 10px 18px 14px;
  background: #fafafa;
}

.subtask-title {
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.progress-cell {
  display: flex;
  align-items: center;
}

.progress-text {
  font-size: 13px;
  color: #606266;
  width: 38px;
  text-align: right;
  flex-shrink: 0;
}

.progress-bar-inline {
  flex: 1;
  margin-left: 8px;
  min-width: 80px;
}

/* ===== Timeline ===== */
.timeline-item-content {
  padding-bottom: 8px;
}

.timeline-operator {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
  font-size: 14px;
}

.timeline-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.timeline-remark {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
  line-height: 1.4;
}

/* ===== Auxiliary Materials ===== */
.material-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-top: none;
  font-size: 14px;
}

.material-total-label {
  color: #606266;
  font-weight: 600;
}

.material-total-value {
  color: #F56C6C;
  font-weight: 700;
  font-size: 16px;
  margin-left: 8px;
}

/* ===== Progress & Steps ===== */
.progress-tab-content {
  padding: 24px 0;
}

.progress-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  text-align: center;
}

.progress-wrapper {
  max-width: 500px;
  margin: 0 auto;
}

.steps-section {
  max-width: 800px;
  margin: 0 auto;
}
</style>
