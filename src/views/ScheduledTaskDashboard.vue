<template>
  <div class="schedule-page">
    <!-- <div class="page-header">
      <div>
        <h1 class="page-title">生产排程 PMC 看板</h1>
        <p class="page-subtitle">围绕主生产计划、产能负荷、物料齐套和交付风险进行滚动管控</p>
      </div>
      <div class="header-actions">
        <el-button @click="goToProductionOrders">
          <el-icon><List /></el-icon>
          生产总表
        </el-button>
        <el-button type="primary" @click="goToOrders">
          <el-icon><Tickets /></el-icon>
          订单管理
        </el-button>
      </div>
    </div> -->

    <!-- <el-row :gutter="16" class="metric-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="item in metrics" :key="item.label">
        <el-card class="metric-card" shadow="never">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-note">{{ item.note }}</div>
        </el-card>
      </el-col>
    </el-row> -->

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
            <!-- <el-table-column prop="taskNo" label="任务编号" min-width="190" show-overflow-tooltip /> -->
            <el-table-column prop="taskNo" label="任务编号" min-width="30" show-overflow-tooltip>
                    <template #default="{ row }">
                      <el-button link type="primary" @click="goToTask(row.taskNo)">{{ row.taskNo }}</el-button>
                      <el-tag v-if="row.subTasks?.length" type="danger" size="small" effect="dark">子</el-tag>
                    </template>
            </el-table-column>
            <el-table-column prop="orderNo" label="订单号" min-width="20" show-overflow-tooltip />
            <!-- <el-table-column prop="productName" label="品名" min-width="150" show-overflow-tooltip /> -->
            
            <el-table-column prop="processName" label="工序" width="60" />
            <el-table-column prop="workCenter" label="车间" width="85" />
            <el-table-column prop="planQty" label="数量" width="80" />
            <el-table-column prop="pieceworkPrice" label="计件单价" width="100" />
            <el-table-column prop="ratedHours" label="额定工时" width="100" />
            <el-table-column prop="salary" label="合计工资" width="100" />
            <!-- <el-table-column prop="machine" label="机台" width="100" /> -->
            <!-- <el-table-column label="计划周期" min-width="205">
              <template #default="{ row }">
                {{ row.planStartDate || row.latestOnlineTime || '-' }} 至 {{ row.planEndDate || row.latestFinishTime || '-' }}
              </template>
            </el-table-column> -->
            <!-- <el-table-column label="交期风险" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.deliveryRisk.type" size="small">{{ row.deliveryRisk.label }}</el-tag>
              </template>
            </el-table-column> -->
            <!-- <el-table-column label="齐套" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="readinessTagType(row.readinessStatus)" size="small">{{ row.readinessStatus }}</el-tag>
              </template>
            </el-table-column> -->
            <el-table-column label="进度" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.completion" :status="row.completion === 100 ? 'success' : ''" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="86" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="goToTask(row.taskNo)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- <el-col :xs="24" :xl="8">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>PMC 异常预警</span>
              <el-tag type="danger" effect="plain">{{ alerts.length }}</el-tag>
            </div>
          </template>
          <div class="alert-list" v-if="alerts.length">
            <div class="alert-item" v-for="alert in alerts" :key="alert.id" @click="alert.orderId && goToOrder(alert.orderId)">
              <div class="alert-main">
                <el-tag :type="alert.typeTag" size="small">{{ alert.type }}</el-tag>
                <div>
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-detail">{{ alert.detail }}</div>
                </div>
              </div>
              <el-icon v-if="alert.orderId"><ArrowRight /></el-icon>
            </div>
          </div>
          <el-empty v-else description="暂无异常预警" :image-size="80" />
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>产能负荷 TOP5</span>
              <el-tag type="warning" effect="plain">瓶颈资源</el-tag>
            </div>
          </template>
          <div class="capacity-list">
            <div class="capacity-item" v-for="item in capacityLoads.slice(0, 5)" :key="item.name">
              <div class="capacity-topline">
                <span>{{ item.name }}</span>
                <el-tag :type="item.statusType" size="small">{{ item.status }}</el-tag>
              </div>
              <div class="capacity-meta">{{ item.workCenter }} · {{ item.taskCount }} 项 · {{ item.ratedHours }} h</div>
              <el-progress :percentage="Math.min(item.loadRate, 100)" :stroke-width="12" :status="item.loadRate >= 100 ? 'exception' : item.loadRate >= 85 ? 'warning' : 'success'" />
            </div>
          </div>
        </el-card>
      </el-col> -->
    </el-row>

    <!-- <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :xl="14">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>物料齐套与欠料分析</span>
              <el-tag type="info" effect="plain">{{ materials.length }} 项物料</el-tag>
            </div>
          </template>
          <el-table :data="materials" border stripe height="360" empty-text="暂无物料数据">
            <el-table-column prop="orderNo" label="订单号" min-width="145" show-overflow-tooltip />
            <el-table-column prop="taskNo" label="任务号" min-width="160" show-overflow-tooltip />
            <el-table-column prop="name" label="物料" min-width="120" show-overflow-tooltip />
            <el-table-column prop="requiredQty" label="备料需量" width="90" align="right" />
            <el-table-column prop="inventoryQty" label="库存" width="80" align="right" />
            <el-table-column prop="inspectionQty" label="待检" width="80" align="right" />
            <el-table-column prop="receiptQty" label="待收" width="80" align="right" />
            <el-table-column prop="onlineShortQty" label="在线欠量" width="90" align="right" />
            <el-table-column prop="availableQty" label="可用" width="80" align="right" />
            <el-table-column prop="netDemandQty" label="净需求" width="90" align="right" />
            <el-table-column prop="launchShortQty" label="上线欠料" width="90" align="right" />
            <el-table-column label="状态" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusType" size="small">{{ row.readinessStatus }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="10">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>PMC 管控原则</span>
              <el-tag effect="plain">PC + MC</el-tag>
            </div>
          </template>
          <div class="principle-grid">
            <div class="principle-card" v-for="item in principles" :key="item.title">
              <div class="principle-title">{{ item.title }}</div>
              <div class="principle-text">{{ item.text }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, List, Tickets } from '@element-plus/icons-vue'
import { useOrderStore } from '../store/order'

const router = useRouter()
const store = useOrderStore()

const metrics = computed(() => store.pmcMetrics)
const scheduleTasks = computed(() => store.scheduleTasks)
const capacityLoads = computed(() => store.capacityLoads)
const materials = computed(() => store.materialReadinessList)
const alerts = computed(() => store.pmcAlerts)

const principles = [
  { title: '主计划滚动', text: '以未完成订单、生产日报和单位产能为基础，每日更新主生产计划。' },
  { title: '产能瓶颈', text: '识别高负荷工序、模具和机台，优先处理影响交付的瓶颈资源。' },
  { title: '物料三不', text: '围绕不断料、不囤料、不呆滞，联动库存、待检、待收和在线欠量。' },
  { title: 'MRP 齐套', text: '按 BOM、库存和 MPS 推算净需求与上线欠料，支撑齐套生产。' }
]

function customerLevelTagType(level) {
  const map = { 'VIP': 'danger', 'A级': 'warning', 'B级': 'success', 'C级': 'info', 'D级': '' }
  return map[level] || 'info'
}

function readinessTagType(status) {
  const map = { '齐套': 'success', '需跟催': 'warning', '欠料': 'danger' }
  return map[status] || 'info'
}

function goToOrders() {
  router.push('/orders')
}

function goToProductionOrders() {
  router.push('/production-orders')
}

function goToTask(taskNo) {
  router.push(`/tasks/${encodeURIComponent(taskNo)}`)
}

function goToOrder(id) {
  const orderNo = store.getOrderNoById(id)
  if (orderNo) router.push(`/orders/${encodeURIComponent(orderNo)}`)
}
</script>

<style scoped>
.schedule-page { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.page-title { font-size: 24px; color: #303133; margin: 0; }
.page-subtitle { margin-top: 6px; color: #7b8794; font-size: 13px; }
.header-actions { display: flex; gap: 10px; }
.metric-grid { margin-bottom: 16px; }
.metric-card, .panel-card { border-radius: 6px; border-color: #e4e7ed; }
.metric-card { min-height: 118px; }
.metric-label { color: #7b8794; font-size: 13px; }
.metric-value { margin-top: 12px; font-size: 28px; line-height: 1; color: #1f2937; font-weight: 700; }
.metric-note { margin-top: 12px; color: #909399; font-size: 12px; }
.content-row { align-items: flex-start; margin-bottom: 16px; }
.panel-card { margin-bottom: 16px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #303133; }
.alert-list, .capacity-list { display: flex; flex-direction: column; gap: 10px; }
.alert-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid #ebeef5; cursor: pointer; }
.alert-item:last-child { border-bottom: 0; }
.alert-main { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.alert-title { font-size: 13px; color: #303133; font-weight: 600; }
.alert-detail { margin-top: 4px; color: #909399; font-size: 12px; }
.capacity-item { padding-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.capacity-item:last-child { border-bottom: 0; padding-bottom: 0; }
.capacity-topline { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; color: #303133; }
.capacity-meta { margin: 6px 0; color: #909399; font-size: 12px; }
.principle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.principle-card { min-height: 96px; padding: 14px; border: 1px solid #e4e7ed; border-radius: 8px; background: #fafcff; }
.principle-title { color: #1f2937; font-weight: 700; margin-bottom: 8px; }
.principle-text { color: #606266; font-size: 13px; line-height: 1.7; }
@media (max-width: 900px) {
  .page-header { align-items: flex-start; flex-direction: column; }
  .principle-grid { grid-template-columns: 1fr; }
}
</style>
