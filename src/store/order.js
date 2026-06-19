import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * @typedef {import('../types/entities').OrderEntity} OrderEntity
 * @typedef {import('../types/entities').ProductionTaskEntity} ProductionTaskEntity
 * @typedef {import('../types/entities').PmcScheduleTaskEntity} PmcScheduleTaskEntity
 */

// ========== Mock Data ==========

// 客户等级
export const customerLevels = ['VIP', 'A级', 'B级', 'C级', 'D级']

// 销售员
export const salespersons = ['张三', '李四', '王五', '赵六', '钱七']

// 品名列表
export const productNames = [
  '铝合金型材6063',
  '不锈钢板304',
  '碳钢板Q235',
  '铜排T2',
  '塑料颗粒ABS',
  '橡胶密封圈',
  '轴承6205',
  '螺栓M12',
  '电机Y2-132S',
  '变压器BK-100'
]

// 规格列表
export const specifications = [
  '100×100×5mm',
  '200×200×8mm',
  '50×50×3mm',
  '150×150×10mm',
  'Φ20×2mm',
  'Φ30×3mm',
  'M12×1.75',
  'M16×2.0',
  '500×300×2mm',
  '1000×100×1mm'
]

// 单位列表
export const units = ['个', '件', 'kg', '米', '套', '箱', '吨', '张', '根', '卷']

// 订单状态
export const orderStatuses = {
  draft: { label: '草稿', color: 'info', tagType: 'info' },
  submitted: { label: '已提交', color: 'warning', tagType: 'warning' },
  approved: { label: '已审核', color: 'success', tagType: 'success' },
  in_production: { label: '生产中', color: '', tagType: 'primary' },
  completed: { label: '已完成', color: '', tagType: 'success' },
  cancelled: { label: '已取消', color: '', tagType: 'danger' },
  paused: { label: '已暂停', color: '', tagType: 'warning' },
  returned: { label: '已退回', color: '', tagType: 'danger' }
}

// 流转状态
export const flowStatuses = {
  draft: '草稿',
  submitted: '已提交，待审核',
  approved: '审核通过，待排产',
  in_production: '生产中',
  completed: '已完成',
  cancelled: '已取消',
  paused: '已暂停',
  returned: '已退回给销售员'
}

// 生产任务状态
const productionStatuses = ['待排产', '已排产', '生产中', '已完工', '已质检']

// 工序、机台与机台占用原则
const processNames = ['下料', '粗加工', '精加工', '表面处理', '装配', '质检', '包装']
const workCenters = ['一号车间', '二号车间', '三号车间', '四号车间']
const machines = ['CNC-01', 'CNC-02', 'LASER-01', 'PRESS-01', 'ASM-01', 'QC-01']
const machineRules = ['一人一机', '一人多机', '多人一机']

// 辅料信息
const auxiliaryMaterialsPool = [
  { name: '包装膜', unit: '卷', unitPrice: 15.00 },
  { name: '木托盘', unit: '个', unitPrice: 45.00 },
  { name: '打包带', unit: '卷', unitPrice: 8.00 },
  { name: '防锈油', unit: '升', unitPrice: 25.00 },
  { name: '标签纸', unit: '张', unitPrice: 0.50 },
  { name: '缠绕膜', unit: '卷', unitPrice: 20.00 },
  { name: '纸箱', unit: '个', unitPrice: 12.00 },
  { name: '泡沫板', unit: '张', unitPrice: 6.00 },
  { name: '胶带', unit: '卷', unitPrice: 3.00 },
  { name: '干燥剂', unit: '包', unitPrice: 1.50 }
]

// ========== Helpers ==========

function stableHash(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

function seededInt(seed, min, max) {
  const range = max - min + 1
  return min + (stableHash(seed) % range)
}

function seededPick(seed, arr) {
  return arr[seededInt(seed, 0, arr.length - 1)]
}

function seededFloat(seed, min, max, precision = 2) {
  const base = seededInt(seed, 0, 1000000) / 1000000
  return parseFloat((min + base * (max - min)).toFixed(precision))
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function seededDate(seed, start, end) {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const offset = seededInt(seed, 0, Math.max(0, endTime - startTime))
  return new Date(startTime + offset).toISOString().slice(0, 10)
}

const BUSINESS_DATE = '2026-06-18'

function todayString() {
  return BUSINESS_DATE
}

function generateOrderNo(sequence = 1) {
  return `DD260618${String(sequence).padStart(4, '0')}`
}

function createRootTaskNo(order) {
  return `SC-${order.orderNo}-${String(order.productionTasks?.length || 0).padStart(3, '0')}`
}

function createChildTaskNo(parentTask, index) {
  return `${parentTask.taskNo}-${String(index).padStart(2, '0')}`
}

function generateTaskMaterials(taskNo, planQty) {
  const count = seededInt(`${taskNo}-material-count`, 1, 3)
  const materials = []
  const pool = [...auxiliaryMaterialsPool]
  for (let i = 0; i < count; i++) {
    const idx = seededInt(`${taskNo}-material-${i}`, 0, pool.length - 1)
    const material = pool.splice(idx, 1)[0]
    const quantity = Math.max(1, Math.ceil(planQty / seededInt(`${taskNo}-material-qty-${i}`, 8, 20)))
    materials.push({
      id: `${taskNo}-MAT-${i + 1}`,
      name: material.name,
      specification: seededPick(`${taskNo}-material-spec-${i}`, specifications),
      quantity,
      unit: material.unit,
      description: `${material.name}用于${seededPick(`${taskNo}-material-desc-${i}`, ['包装', '防护', '标识', '转运'])}`,
      latestRequiredTime: seededDate(`${taskNo}-material-date-${i}`, new Date('2026-06-01'), new Date('2026-09-15'))
    })
  }
  return materials
}

function generateProductionTasks(orderNo) {
  const taskCount = seededInt(`${orderNo}-task-count`, 1, 4)
  const tasks = []
  for (let i = 0; i < taskCount; i++) {
    const seed = `${orderNo}-task-${i}`
    const qty = seededInt(`${seed}-qty`, 10, 500)
    const done = taskCount === i + 1 ? seededInt(`${seed}-done`, 0, qty) : qty
    const processName = seededPick(`${seed}-process`, processNames)
    const taskNo = `SC-${orderNo}-${i.toString().padStart(3, '0')}`
    const planStartDate = seededDate(`${seed}-start`, new Date('2026-06-01'), new Date('2026-07-15'))
    const planEndDate = addDays(planStartDate, seededInt(`${seed}-duration`, 3, 35))
    const status = done >= qty ? '已完工' : seededPick(`${seed}-status`, productionStatuses.slice(0, 3))
    tasks.push({
      id: `TASK-${taskNo}`,
      taskNo,
      parentTaskNo: '',
      processName,
      processPriority: i + 1,
      workCenter: seededPick(`${seed}-work-center`, workCenters),
      planQty: qty,
      completedQty: done,
      unit: seededPick(`${seed}-unit`, units),
      pieceworkPrice: seededFloat(`${seed}-price`, 2, 20, 2),
      ratedHours: seededFloat(`${seed}-hours`, 1, 13, 1),
      latestOnlineTime: planStartDate,
      latestFinishTime: planEndDate,
      machine: seededPick(`${seed}-machine`, machines),
      machineRule: seededPick(`${seed}-machine-rule`, machineRules),
      canSplit: qty > 20,
      status,
      planStartDate,
      planEndDate,
      actualStartDate: ['生产中', '已完工', '已质检'].includes(status) ? addDays(planStartDate, seededInt(`${seed}-actual-start`, 0, 3)) : null,
      actualEndDate: ['已完工', '已质检'].includes(status) ? addDays(planEndDate, seededInt(`${seed}-actual-end`, -2, 2)) : null,
      operator: seededPick(`${seed}-operator`, salespersons),
      materials: generateTaskMaterials(taskNo, qty),
      subTasks: [],
      remark: ''
    })
  }
  return tasks
}

function generateAuxiliaryMaterials(orderNo = 'ORDER') {
  const count = seededInt(`${orderNo}-aux-count`, 0, 4)
  const materials = []
  const pool = [...auxiliaryMaterialsPool]
  for (let i = 0; i < count; i++) {
    const idx = seededInt(`${orderNo}-aux-${i}`, 0, pool.length - 1)
    const m = pool.splice(idx, 1)[0]
    const qty = seededInt(`${orderNo}-aux-qty-${i}`, 1, 50)
    materials.push({
      ...m,
      quantity: qty,
      amount: parseFloat((m.unitPrice * qty).toFixed(2))
    })
  }
  return materials
}

function generateFlowLogs(orderNo, status, dates) {
  const logs = []
  const flowMap = [
    { from: null, to: 'draft', label: '创建订单（草稿）', date: 'createdAt' },
    { from: 'draft', to: 'submitted', label: '提交订单', date: 'submittedAt' },
    { from: 'submitted', to: 'approved', label: '审核通过', date: 'approvedAt' },
    { from: 'approved', to: 'in_production', label: '下达生产任务', date: 'productionAt' },
    { from: 'in_production', to: 'completed', label: '生产完工', date: 'completedAt' }
  ]
  const extraFlow = {
    paused: { to: 'paused', label: '订单暂停' },
    cancelled: { to: 'cancelled', label: '订单取消' },
    returned: { to: 'returned', label: '审核退回' }
  }

  for (const f of flowMap) {
    if (f.from === null || dates[f.date]) {
      logs.push({
        id: `${orderNo}-flow-${logs.length + 1}`,
        fromStatus: f.from,
        toStatus: f.to,
        label: f.label,
        operator: f.from === null ? dates.createdBy : seededPick(`${orderNo}-flow-operator-${logs.length}`, ['张三', '李四', '王五']),
        createdAt: dates[f.date] || dates.createdAt,
        remark: ''
      })
    }
    if (f.to === status) break
  }
  // extra statuses
  if (['paused', 'cancelled', 'returned'].includes(status) && extraFlow[status]) {
    logs.push({
      id: `${orderNo}-flow-${logs.length + 1}`,
      fromStatus: 'submitted',
      toStatus: extraFlow[status].to,
      label: extraFlow[status].label,
      operator: seededPick(`${orderNo}-extra-flow-operator`, ['张三', '李四', '王五']),
      createdAt: seededDate(`${orderNo}-extra-flow-date`, new Date('2026-01-01'), new Date('2026-06-18')),
      remark: status === 'returned' ? '规格信息不完整，请补充' : ''
    })
  }
  return logs
}

// ========== Generate Mock Orders ==========

function createMockOrders(count = 25) {
  const orders = []
  const statusPool = ['draft', 'submitted', 'approved', 'in_production', 'completed', 'cancelled', 'paused', 'returned']
  for (let i = 0; i < count; i++) {
    const seed = `mock-order-${i + 1}`
    const orderNo = `DD2606${String(i + 1).padStart(6, '0')}`
    const status = seededPick(`${seed}-status`, statusPool)
    const unitPrice = seededFloat(`${seed}-unit-price`, 10, 910, 2)
    const quantity = seededInt(`${seed}-quantity`, 1, 500)
    const isUrgent = seededInt(`${seed}-urgent`, 1, 100) <= 15
    const customerLevel = seededPick(`${seed}-customer-level`, customerLevels)
    const salesperson = seededPick(`${seed}-salesperson`, salespersons)
    const createdAt = seededDate(`${seed}-created`, new Date('2025-10-01'), new Date('2026-06-10'))

    const dates = {
      createdAt,
      createdBy: salesperson,
      submittedAt: ['submitted', 'approved', 'in_production', 'completed', 'paused', 'returned'].includes(status)
        ? addDays(createdAt, seededInt(`${seed}-submitted-offset`, 1, 15)) : null,
      approvedAt: ['approved', 'in_production', 'completed'].includes(status)
        ? addDays(createdAt, seededInt(`${seed}-approved-offset`, 16, 35)) : null,
      productionAt: ['in_production', 'completed'].includes(status)
        ? addDays(createdAt, seededInt(`${seed}-production-offset`, 36, 55)) : null,
      completedAt: status === 'completed'
        ? addDays(createdAt, seededInt(`${seed}-completed-offset`, 56, 90)) : null
    }

    const order = {
      id: i + 1,
      orderNo,
      customerLevel,
      salesperson,
      productName: seededPick(`${seed}-product`, productNames),
      specification: seededPick(`${seed}-spec`, specifications),
      unitPrice,
      quantity,
      unit: seededPick(`${seed}-unit`, units),
      amount: parseFloat((unitPrice * quantity).toFixed(2)),
      orderDate: dates.createdAt,
      deliveryDate: seededDate(`${seed}-delivery`, new Date('2026-06-15'), new Date('2026-09-30')),
      notes: seededInt(`${seed}-notes`, 1, 100) <= 40 ? `订单备注信息，客户要求质量优先。${seededInt(`${seed}-contract`, 1, 99)}号合同。` : '',
      isUrgent,
      status,
      createdAt: dates.createdAt,
      updatedAt: dates.createdAt,
      createdBy: dates.createdBy,
      productionTasks: generateProductionTasks(orderNo),
      auxiliaryMaterials: generateAuxiliaryMaterials(orderNo),
      flowLogs: generateFlowLogs(orderNo, status, dates),
      progress: status === 'completed' ? 100
        : status === 'draft' ? 0
        : status === 'submitted' ? 15
        : status === 'approved' ? 30
        : status === 'in_production' ? seededInt(`${seed}-progress`, 31, 95)
        : status === 'cancelled' || status === 'returned' ? 0
        : status === 'paused' ? seededInt(`${seed}-paused-progress`, 20, 60) : 0
    }
    orders.push(order)
  }
  orders.sort((a, b) => b.orderDate.localeCompare(a.orderDate))
  return orders
}

// ========== Store ==========

export const useOrderStore = defineStore('order', () => {
  const orders = ref(createMockOrders(10))
  const loading = ref(false)
  const searchQuery = ref('')
  const statusFilter = ref('')
  const dateRange = ref([])

  // ===== Getters =====
  const filteredOrders = computed(() => {
    let list = orders.value

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.salesperson.toLowerCase().includes(q) ||
        o.specification.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q))
      )
    }

    if (statusFilter.value) {
      list = list.filter(o => o.status === statusFilter.value)
    }

    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value
      list = list.filter(o => o.orderDate >= start && o.orderDate <= end)
    }

    return list
  })

  // ===== Actions =====

  function findTaskInTree(tasks, taskNo, order, parent = null) {
    for (const task of tasks || []) {
      if (task.taskNo === taskNo) return { task, parent, siblings: tasks, order }
      const found = findTaskInTree(task.subTasks || [], taskNo, order, task)
      if (found) return found
    }
    return null
  }

  function findTaskContext(taskNo) {
    for (const order of orders.value) {
      const found = findTaskInTree(order.productionTasks || [], taskNo, order)
      if (found) return found
    }
    return null
  }

  function enrichTask(task, order) {
    const planQty = Number(task.planQty ?? task.quantity) || 0
    const completedQty = Number(task.completedQty) || 0
    const completion = planQty > 0 ? Math.min(100, Math.round((completedQty / planQty) * 100)) : 0
    const deliveryRisk = buildDeliveryRisk(order, task)
    const materials = getOrderMaterialReadiness({ ...order, productionTasks: [task] })
    const shortageCount = materials.filter(m => m.launchShortQty > 0).length
    const readinessRate = materials.length
      ? Math.round(materials.reduce((sum, item) => sum + item.readinessRate, 0) / materials.length)
      : 100

    return {
      ...task,
      orderId: order.id,
      orderNo: order.orderNo,
      customerLevel: order.customerLevel,
      productName: order.productName,
      deliveryDate: order.deliveryDate,
      isUrgent: order.isUrgent,
      planQty,
      completion,
      deliveryRisk,
      shortageCount,
      readinessRate,
      readinessStatus: shortageCount > 0 ? '欠料' : readinessRate < 100 ? '需跟催' : '齐套'
    }
  }

  function getOrderById(id) {
    return orders.value.find(o => o.id === Number(id)) || null
  }

  function getOrderByNo(orderNo) {
    return orders.value.find(o => o.orderNo === orderNo) || null
  }

  function getOrderNoById(id) {
    return getOrderById(id)?.orderNo || ''
  }

  function buildDefaultTaskMaterial(taskNo, index = 1) {
    return {
      id: `${taskNo}-MAT-${index}`,
      name: '包装膜',
      specification: '通用',
      quantity: 1,
      unit: '卷',
      description: '生产配套辅料',
      latestRequiredTime: todayString()
    }
  }

  function normalizeTaskPayload(order, payload, parentTask = null) {
    const taskNo = payload.taskNo || (parentTask ? createChildTaskNo(parentTask, parentTask.subTasks?.length || 0) : createRootTaskNo(order))
    const qty = Number(payload.planQty) || 0
    const priorityFallback = parentTask ? (parentTask.subTasks?.length || 0) + 1 : (order.productionTasks?.length || 0) + 1
    return {
      id: payload.id || `TASK-${taskNo}`,
      taskNo,
      orderNo: order.orderNo,
      parentTaskNo: parentTask?.taskNo || payload.parentTaskNo || '',
      processName: payload.processName || parentTask?.processName || '下料',
      processPriority: Number(payload.processPriority) || priorityFallback,
      workCenter: payload.workCenter || parentTask?.workCenter || '一号车间',
      planQty: qty,
      completedQty: Number(payload.completedQty) || 0,
      unit: payload.unit || parentTask?.unit || order.unit || '个',
      pieceworkPrice: Number(payload.pieceworkPrice) || Number(parentTask?.pieceworkPrice) || 0,
      ratedHours: Number(payload.ratedHours) || Number(parentTask?.ratedHours) || 0,
      salary: Number(payload.pieceworkPrice) *  Number(payload.planQty) || 0,
      latestOnlineTime: payload.latestOnlineTime || parentTask?.latestOnlineTime || '',
      latestFinishTime: payload.latestFinishTime || payload.planEndDate || parentTask?.latestFinishTime || '',
      machine: payload.machine || parentTask?.machine || '未指定',
      machineRule: payload.machineRule || parentTask?.machineRule || '一人一机',
      canSplit: payload.canSplit !== false,
      status: payload.status || '待排产',
      planStartDate: payload.planStartDate || payload.latestOnlineTime || parentTask?.planStartDate || '',
      planEndDate: payload.planEndDate || payload.latestFinishTime || parentTask?.planEndDate || '',
      actualStartDate: payload.actualStartDate || null,
      actualEndDate: payload.actualEndDate || null,
      operator: payload.operator || parentTask?.operator || order.salesperson || '',
      materials: (payload.materials && payload.materials.length ? payload.materials : [buildDefaultTaskMaterial(taskNo)]).map((m, idx) => ({
        id: m.id || `${taskNo}-MAT-${idx + 1}`,
        name: m.name || '',
        specification: m.specification || '',
        quantity: Number(m.quantity) || 0,
        unit: m.unit || '',
        description: m.description || '',
        latestRequiredTime: m.latestRequiredTime || ''
      })),
      subTasks: payload.subTasks || [],
      remark: payload.remark || ''
    }
  }

  function buildSplitQuantities(task, mode, splitCount, quantities) {
    const count = Math.max(1, Number(splitCount) || 1)
    const planQty = Number(task.planQty) || 0
    const qtyList = mode === 'custom'
      ? quantities.map(q => Number(q) || 0).filter(q => q > 0)
      : Array.from({ length: count }, (_, index) => {
          const base = Math.floor(planQty / count)
          const rest = planQty % count
          return base + (index < rest ? 1 : 0)
        })

    const total = qtyList.reduce((sum, qty) => sum + qty, 0)
    if (total > planQty) {
      throw new Error('子任务数量合计不能大于当前任务数量')
    }
    return qtyList
  }

  function refreshOrderProgress(order) {
    const tasks = order.productionTasks || []
    if (!tasks.length) return
    const total = tasks.reduce((sum, task) => sum + (Number(task.planQty) || 0), 0)
    const done = tasks.reduce((sum, task) => sum + (Number(task.completedQty) || 0), 0)
    order.progress = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : order.progress
    if (order.progress > 30 && order.status === 'approved') {
      order.status = 'in_production'
    }
  }

  // 新增订单
  function addOrder(formData) {
    const nextId = orders.value.length > 0 ? Math.max(...orders.value.map(o => o.id)) + 1 : 1
    const orderNo = generateOrderNo(nextId)
    const currentDate = todayString()
    const newOrder = {
      id: nextId,
      orderNo,
      customerLevel: formData.customerLevel,
      salesperson: formData.salesperson,
      productName: formData.productName,
      specification: formData.specification,
      unitPrice: formData.unitPrice,
      quantity: formData.quantity,
      unit: formData.unit,
      amount: parseFloat((formData.unitPrice * formData.quantity).toFixed(2)),
      orderDate: formData.orderDate || currentDate,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes || '',
      isUrgent: formData.isUrgent || false,
      status: 'draft',
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: formData.salesperson,
      productionTasks: [],
      auxiliaryMaterials: [],
      flowLogs: [{
        id: `${orderNo}-flow-1`,
        fromStatus: null,
        toStatus: 'draft',
        label: '创建订单（草稿）',
        operator: formData.salesperson,
        createdAt: currentDate,
        remark: ''
      }],
      progress: 0
    }
    orders.value.unshift(newOrder)
    return newOrder
  }

  // 保存为草稿
  function saveAsDraft(formData) {
    return addOrder(formData)
  }

  // 保存为提交
  function saveAsSubmit(formData) {
    const order = addOrder(formData)
    submitOrder(order.id)
    return order
  }

  // 提交
  function submitOrder(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order || order.status !== 'draft') return false
    order.status = 'submitted'
    order.updatedAt = todayString()
    order.progress = 15
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'draft',
      toStatus: 'submitted',
      label: '提交订单',
      operator: order.createdBy,
      createdAt: todayString(),
      remark: ''
    })
    return true
  }

  // 审核
  function approveOrder(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order || order.status !== 'submitted') return false
    order.status = 'approved'
    order.updatedAt = todayString()
    order.progress = 30
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'submitted',
      toStatus: 'approved',
      label: '审核通过',
      operator: '张三',
      createdAt: todayString(),
      remark: ''
    })
    // Generate production tasks on approve
    if (order.productionTasks.length === 0) {
      order.productionTasks = generateProductionTasks(order.orderNo)
    }
    return true
  }

  // 反审
  function reverseApprove(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order || order.status !== 'approved') return false
    order.status = 'submitted'
    order.updatedAt = todayString()
    order.progress = 15
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'approved',
      toStatus: 'submitted',
      label: '反审核，退回待审核',
      operator: '张三',
      createdAt: todayString(),
      remark: ''
    })
    return true
  }

  // 修改订单
  function updateOrder(id, formData) {
    const order = orders.value.find(o => o.id === id)
    if (!order) return false
    if (!['draft', 'returned'].includes(order.status)) return false

    Object.assign(order, {
      customerLevel: formData.customerLevel,
      salesperson: formData.salesperson,
      productName: formData.productName,
      specification: formData.specification,
      unitPrice: formData.unitPrice,
      quantity: formData.quantity,
      unit: formData.unit,
      amount: parseFloat((formData.unitPrice * formData.quantity).toFixed(2)),
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes || '',
      isUrgent: formData.isUrgent || false,
      updatedAt: todayString()
    })
    return true
  }

  // 删除订单
  function deleteOrder(id) {
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx === -1) return false
    const order = orders.value[idx]
    if (!['draft', 'cancelled', 'returned'].includes(order.status)) return false
    orders.value.splice(idx, 1)
    return true
  }

  // 取消订单
  function cancelOrder(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order) return false
    if (['completed', 'cancelled'].includes(order.status)) return false
    order.status = 'cancelled'
    order.updatedAt = todayString()
    order.progress = 0
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: order.flowLogs[order.flowLogs.length - 1]?.toStatus || 'draft',
      toStatus: 'cancelled',
      label: '订单取消',
      operator: order.createdBy,
      createdAt: todayString(),
      remark: ''
    })
    return true
  }

  // 暂停订单
  function pauseOrder(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order || !['approved', 'in_production'].includes(order.status)) return false
    order.status = 'paused'
    order.updatedAt = todayString()
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: order.flowLogs[order.flowLogs.length - 1]?.toStatus,
      toStatus: 'paused',
      label: '订单暂停',
      operator: '张三',
      createdAt: todayString(),
      remark: ''
    })
    return true
  }

  // 恢复订单（从暂停状态恢复）
  function resumeOrder(id) {
    const order = orders.value.find(o => o.id === id)
    if (!order || order.status !== 'paused') return false
    const prevLog = order.flowLogs.findLast(l => l.toStatus === 'paused')
    const prevStatus = prevLog ? prevLog.fromStatus : 'approved'
    order.status = prevStatus
    order.updatedAt = todayString()
    order.progress = prevStatus === 'approved' ? 30 : 45
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'paused',
      toStatus: prevStatus,
      label: '恢复订单',
      operator: '张三',
      createdAt: todayString(),
      remark: ''
    })
    return true
  }

  // 退回订单
  function returnOrder(id, remark = '') {
    const order = orders.value.find(o => o.id === id)
    if (!order || order.status !== 'submitted') return false
    order.status = 'returned'
    order.updatedAt = todayString()
    order.progress = 0
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'submitted',
      toStatus: 'returned',
      label: '审核退回',
      operator: '张三',
      createdAt: todayString(),
      remark: remark || '订单信息需要补充完善'
    })
    return true
  }

  // 拆解生产订单为一级任务
  function splitProductionTask(orderId, payload) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) throw new Error('订单不存在')
    const task = normalizeTaskPayload(order, payload)
    if (task.planQty > Number(order.quantity || 0)) {
      throw new Error('生产任务数量不能大于订单数量')
    }
    const index = (order.productionTasks || []).findIndex(t => t.id === payload.id || t.taskNo === payload.taskNo)
    if (index >= 0) {
      order.productionTasks.splice(index, 1, task)
    } else {
      order.productionTasks.push(task)
    }
    order.updatedAt = todayString()
    refreshOrderProgress(order)
    return task
  }

  // 拆解任务为直接子任务
  function splitTask(taskNo, payload) {
    const context = findTaskContext(taskNo)
    if (!context) throw new Error('任务不存在')
    const { task: parentTask, order } = context
    const qtyList = buildSplitQuantities(parentTask, payload.splitMode || 'average', payload.splitCount || 2, payload.subTaskQuantities || [])
    parentTask.subTasks = parentTask.subTasks || []

    const newTasks = qtyList.map((qty, index) => normalizeTaskPayload(order, {
      ...payload,
      id: '',
      taskNo: createChildTaskNo(parentTask, parentTask.subTasks.length + index),
      planQty: qty,
      materials: (payload.materials || []).map(m => ({ ...m }))
    }, parentTask))

    parentTask.subTasks.push(...newTasks)
    order.updatedAt = todayString()
    return newTasks
  }

  // 修改生产任务
  function updateProductionTask(orderId, taskId, patch) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false
    const task = (order.productionTasks || []).find(t => t.id === taskId)
    if (!task) return false
    Object.assign(task, patch)
    task.salary = Number(task.pieceworkPrice || 0) * Number(task.planQty || 0)
    order.updatedAt = todayString()
    refreshOrderProgress(order)
    return true
  }

  function updateTaskByNo(taskNo, patch) {
    const context = findTaskContext(taskNo)
    if (!context) return false
    const { task, order } = context
    const { taskNo: ignoredTaskNo, orderNo: ignoredOrderNo, id: ignoredId, parentTaskNo: ignoredParentTaskNo, ...editablePatch } = patch
    Object.assign(task, editablePatch)
    task.planQty = Number(task.planQty) || 0
    task.completedQty = Number(task.completedQty) || 0
    task.pieceworkPrice = Number(task.pieceworkPrice) || 0
    task.ratedHours = Number(task.ratedHours) || 0
    task.salary = task.pieceworkPrice * task.planQty
    task.materials = (task.materials || []).map((m, idx) => ({
      id: m.id || `${task.taskNo}-MAT-${idx + 1}`,
      name: m.name || '',
      specification: m.specification || '',
      quantity: Number(m.quantity) || 0,
      unit: m.unit || '',
      description: m.description || '',
      latestRequiredTime: m.latestRequiredTime || ''
    }))
    order.updatedAt = todayString()
    refreshOrderProgress(order)
    return true
  }

  // 删除生产任务
  function deleteProductionTask(orderId, taskId) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false
    const index = (order.productionTasks || []).findIndex(t => t.id === taskId)
    if (index === -1) return false
    order.productionTasks.splice(index, 1)
    order.updatedAt = todayString()
    refreshOrderProgress(order)
    return true
  }

  function deleteTaskByNo(taskNo) {
    const context = findTaskContext(taskNo)
    if (!context) return false
    const index = context.siblings.findIndex(t => t.taskNo === taskNo)
    if (index === -1) return false
    context.siblings.splice(index, 1)
    context.order.updatedAt = todayString()
    refreshOrderProgress(context.order)
    return true
  }

  // 结案生产订单
  function closeProductionOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false
    const tasks = order.productionTasks || []
    const allDone = tasks.length > 0 && tasks.every(t => ['已完工', '已质检'].includes(t.status))
    if (!allDone || Number(order.progress) < 100 || order.isStocked) return false
    order.status = 'completed'
    order.updatedAt = todayString()
    order.flowLogs.push({
      id: `${order.orderNo}-flow-${order.flowLogs.length + 1}`,
      fromStatus: 'in_production',
      toStatus: 'completed',
      label: '生产订单结案',
      operator: '张三',
      createdAt: todayString(),
      remark: '订单全部完工，尚未入库前结案'
    })
    return true
  }

  // 导入订单
  function importOrders(importedData) {
    let count = 0
    for (const row of importedData) {
      if (!row.productName || !row.quantity) continue
      const orderNo = generateOrderNo()
      const unitPrice = parseFloat(row.unitPrice) || 0
      const quantity = parseInt(row.quantity) || 0
      orders.value.unshift({
        id: orders.value.length > 0 ? Math.max(...orders.value.map(o => o.id)) + 1 : 1,
        orderNo,
        customerLevel: row.customerLevel || 'C级',
        salesperson: row.salesperson || '未知',
        productName: row.productName,
        specification: row.specification || '',
        unitPrice,
        quantity,
        unit: row.unit || '个',
        amount: parseFloat((unitPrice * quantity).toFixed(2)),
        orderDate: row.orderDate || todayString(),
        deliveryDate: row.deliveryDate || '',
        notes: row.notes || '',
        isUrgent: row.isUrgent === '是' || row.isUrgent === true,
        status: 'draft',
        createdAt: todayString(),
        updatedAt: todayString(),
        createdBy: row.salesperson || '未知',
        productionTasks: [],
        auxiliaryMaterials: [],
        flowLogs: [{
          id: `${orderNo}-flow-1`,
          fromStatus: null,
          toStatus: 'draft',
          label: '批量导入',
          operator: row.salesperson || '未知',
          createdAt: todayString(),
          remark: '从ERP导入'
        }],
        progress: 0
      })
      count++
    }
    return count
  }

  // ERP同步
  function erpSync() {
    const startId = orders.value.length > 0 ? Math.max(...orders.value.map(o => o.id)) + 1 : 1
    const newOrders = createMockOrders(5).map((o, index) => {
      const id = startId + index
      const orderNo = generateOrderNo(id)
      return {
        ...o,
        id,
        orderNo,
        productionTasks: generateProductionTasks(orderNo),
        auxiliaryMaterials: generateAuxiliaryMaterials(orderNo),
        orderDate: todayString(),
        createdAt: todayString(),
        updatedAt: todayString(),
        status: 'draft',
        progress: 0,
        flowLogs: [{
          id: `${orderNo}-flow-1`,
          fromStatus: null,
          toStatus: 'draft',
          label: 'ERP自动同步',
          operator: '系统',
          createdAt: todayString(),
          remark: '从ERP系统自动获取'
        }]
      }
    })
    orders.value.unshift(...newOrders)
    return newOrders.length
  }

  function diffDays(date) {
    if (!date) return 999
    const today = new Date(BUSINESS_DATE)
    today.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target - today) / 86400000)
  }

  function buildDeliveryRisk(order, task = null) {
    const days = diffDays(task?.latestFinishTime || order.deliveryDate)
    const progress = Number(order.progress) || 0
    if (days < 0 && progress < 100) return { label: '已延期', type: 'danger', level: 4, days }
    if (order.isUrgent && progress < 80) return { label: '加急跟进', type: 'danger', level: 3, days }
    if (days <= 3 && progress < 90) return { label: '临期风险', type: 'warning', level: 3, days }
    if (days <= 7 && progress < 70) return { label: '进度偏慢', type: 'warning', level: 2, days }
    return { label: '正常', type: 'success', level: 1, days }
  }

  function buildMaterialReadiness(material, order, task) {
    const seed = `${order.orderNo}-${task.taskNo}-${material.name}`
    const requiredQty = Number(material.quantity) || 0
    const inventoryQty = seededInt(`${seed}-stock`, 0, Math.max(requiredQty * 2, 8))
    const inspectionQty = seededInt(`${seed}-check`, 0, Math.max(Math.ceil(requiredQty * 0.4), 2))
    const receiptQty = seededInt(`${seed}-receipt`, 0, Math.max(Math.ceil(requiredQty * 0.8), 3))
    const onlineShortQty = seededInt(`${seed}-short`, 0, Math.max(Math.ceil(requiredQty * 0.5), 2))
    const onlineOverQty = seededInt(`${seed}-over`, 0, Math.max(Math.ceil(requiredQty * 0.3), 1))
    const availableQty = inventoryQty + inspectionQty + onlineOverQty + receiptQty - onlineShortQty
    const netDemandQty = Math.max(0, requiredQty - availableQty)
    const launchAvailableQty = inventoryQty + inspectionQty + onlineOverQty - onlineShortQty
    const launchShortQty = Math.max(0, requiredQty - launchAvailableQty)
    const status = launchShortQty > 0 ? '欠料' : netDemandQty > 0 ? '需跟催' : '齐套'

    return {
      ...material,
      orderId: order.id,
      orderNo: order.orderNo,
      productName: order.productName,
      taskNo: task.taskNo,
      processName: task.processName,
      requiredQty,
      inventoryQty,
      inspectionQty,
      receiptQty,
      onlineShortQty,
      onlineOverQty,
      availableQty,
      netDemandQty,
      launchShortQty,
      readinessRate: requiredQty > 0 ? Math.min(100, Math.round((Math.max(0, availableQty) / requiredQty) * 100)) : 100,
      readinessStatus: status,
      statusType: status === '欠料' ? 'danger' : status === '需跟催' ? 'warning' : 'success'
    }
  }

  function getOrderMaterialReadiness(order) {
    return (order.productionTasks || []).flatMap(task =>
      (task.materials || []).map(material => buildMaterialReadiness(material, order, task))
    )
  }

  // 获取生产订单总表（已审核及之后的订单）
  const productionOrders = computed(() => {
    return orders.value.filter(o =>
      ['approved', 'in_production', 'completed', 'paused'].includes(o.status)
    )
  })

  const scheduleTasks = computed(() => {
    return productionOrders.value.flatMap(order => (order.productionTasks || []).map(task => {
      const planQty = Number(task.planQty) || 0
      const completedQty = Number(task.completedQty) || 0
      const completion = planQty > 0 ? Math.min(100, Math.round((completedQty / planQty) * 100)) : 0
      const deliveryRisk = buildDeliveryRisk(order, task)
      const materials = getOrderMaterialReadiness({ ...order, productionTasks: [task] })
      const shortageCount = materials.filter(m => m.launchShortQty > 0).length
      const salary= planQty * Number(task.pieceworkPrice)
      const readinessRate = materials.length
        ? Math.round(materials.reduce((sum, item) => sum + item.readinessRate, 0) / materials.length)
        : 100

      return {
        ...task,
        orderId: order.id,
        orderNo: order.orderNo,
        customerLevel: order.customerLevel,
        productName: order.productName,
        deliveryDate: order.deliveryDate,
        isUrgent: order.isUrgent,
        completion,
        deliveryRisk,
        shortageCount,
        readinessRate,
        salary,
        readinessStatus: shortageCount > 0 ? '欠料' : readinessRate < 100 ? '需跟催' : '齐套'
      }
    }))
      .sort((a, b) => {
        if (b.deliveryRisk.level !== a.deliveryRisk.level) return b.deliveryRisk.level - a.deliveryRisk.level
        return String(a.latestFinishTime || a.planEndDate || '').localeCompare(String(b.latestFinishTime || b.planEndDate || ''))
      })
      .slice(0, 20)
  })

  const capacityLoads = computed(() => {
    const groups = scheduleTasks.value.reduce((acc, task) => {
      const key = task.machine || task.workCenter || '未分配'
      if (!acc[key]) {
        acc[key] = { name: key, workCenter: task.workCenter || '未分配', taskCount: 0, ratedHours: 0, runningCount: 0 }
      }
      acc[key].taskCount += 1
      acc[key].ratedHours += Number(task.ratedHours) || 0
      if (task.status === '生产中') acc[key].runningCount += 1
      return acc
    }, {})

    return Object.values(groups).map(item => {
      const loadRate = Math.min(140, Math.round((item.ratedHours / 40) * 100))
      return {
        ...item,
        ratedHours: Number(item.ratedHours.toFixed(1)),
        loadRate,
        bottleneck: loadRate >= 85 || item.taskCount >= 4,
        status: loadRate >= 100 ? '过载' : loadRate >= 85 ? '瓶颈' : loadRate >= 70 ? '偏高' : '正常',
        statusType: loadRate >= 100 ? 'danger' : loadRate >= 85 ? 'warning' : loadRate >= 70 ? '' : 'success'
      }
    }).sort((a, b) => b.loadRate - a.loadRate).slice(0, 10)
  })

  const materialReadinessList = computed(() => {
    return productionOrders.value
      .flatMap(order => getOrderMaterialReadiness(order))
      .sort((a, b) => b.launchShortQty - a.launchShortQty || a.latestRequiredTime.localeCompare(b.latestRequiredTime))
      .slice(0, 20)
  })

  const pmcAlerts = computed(() => {
    const alerts = []
    for (const task of scheduleTasks.value) {
      if (task.deliveryRisk.level >= 3) {
        alerts.push({
          id: `delivery-${task.taskNo}`,
          type: '交期',
          typeTag: 'danger',
          title: `${task.orderNo} ${task.deliveryRisk.label}`,
          detail: `${task.productName} · ${task.processName} · 交期 ${task.deliveryDate || '-'}`,
          orderId: task.orderId,
          priority: task.deliveryRisk.level
        })
      }
      if (task.shortageCount > 0) {
        alerts.push({
          id: `material-${task.taskNo}`,
          type: '欠料',
          typeTag: 'warning',
          title: `${task.taskNo} 存在 ${task.shortageCount} 项欠料`,
          detail: `${task.productName} · 齐套率 ${task.readinessRate}%`,
          orderId: task.orderId,
          priority: 3
        })
      }
    }
    for (const load of capacityLoads.value.filter(item => item.bottleneck).slice(0, 5)) {
      alerts.push({
        id: `capacity-${load.name}`,
        type: '产能',
        typeTag: load.statusType || 'warning',
        title: `${load.name} ${load.status}`,
        detail: `${load.workCenter} · 负荷率 ${load.loadRate}% · ${load.taskCount} 项任务`,
        orderId: null,
        priority: load.loadRate >= 100 ? 4 : 2
      })
    }
    return alerts.sort((a, b) => b.priority - a.priority).slice(0, 10)
  })

  function getTaskByNo(taskNo) {
    const context = findTaskContext(taskNo)
    return context ? enrichTask(context.task, context.order) : null
  }

  const pmcMetrics = computed(() => {
    const riskOrders = scheduleTasks.value.filter(task => task.deliveryRisk.level >= 3).length
    const shortageMaterials = materialReadinessList.value.filter(item => item.launchShortQty > 0).length
    const avgReadiness = materialReadinessList.value.length
      ? Math.round(materialReadinessList.value.reduce((sum, item) => sum + item.readinessRate, 0) / materialReadinessList.value.length)
      : 100
    const avgProgress = productionOrders.value.length
      ? Math.round(productionOrders.value.reduce((sum, order) => sum + (Number(order.progress) || 0), 0) / productionOrders.value.length)
      : 0

    return [
      { label: '生产订单', value: productionOrders.value.length, note: '已进入PMC管控' },
      { label: '待处理任务', value: scheduleTasks.value.filter(task => !['已完工', '已质检'].includes(task.status)).length, note: '未完工排程任务' },
      { label: '交付风险', value: riskOrders, note: '延期/临期/加急' },
      { label: '欠料预警', value: shortageMaterials, note: `平均齐套率 ${avgReadiness}%` },
      { label: '平均进度', value: `${avgProgress}%`, note: '订单生产达成' }
    ]
  })

  return {
    processNames,
    workCenters,
    machines,
    machineRules,
    orders,
    loading,
    searchQuery,
    statusFilter,
    dateRange,
    filteredOrders,
    productionOrders,
    scheduleTasks,
    capacityLoads,
    materialReadinessList,
    pmcAlerts,
    pmcMetrics,
    getOrderMaterialReadiness,
    buildDeliveryRisk,
    getOrderById,
    getOrderByNo,
    getOrderNoById,
    getTaskByNo,
    addOrder,
    saveAsDraft,
    saveAsSubmit,
    submitOrder,
    approveOrder,
    reverseApprove,
    updateOrder,
    deleteOrder,
    cancelOrder,
    pauseOrder,
    resumeOrder,
    returnOrder,
    splitProductionTask,
    splitTask,
    updateProductionTask,
    updateTaskByNo,
    deleteProductionTask,
    deleteTaskByNo,
    closeProductionOrder,
    importOrders,
    erpSync
  }
}, {
  persist: {
    key: 'production-scheduling-order-store',
    paths: ['orders', 'searchQuery', 'statusFilter', 'dateRange']
  }
})
