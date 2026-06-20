/**
 * @typedef {'VIP' | 'A级' | 'B级' | 'C级' | 'D级'} CustomerLevel
 */

/**
 * @typedef {'draft' | 'submitted' | 'approved' | 'in_production' | 'completed' | 'cancelled' | 'paused' | 'returned'} OrderStatus
 */

/**
 * @typedef {'待排产' | '已排产' | '生产中' | '已完工' | '已质检'} ProductionTaskStatus
 */

/**
 * @typedef {Object} MaterialEntity
 * @property {string} id
 * @property {string} name
 * @property {string} specification
 * @property {number} quantity
 * @property {string} unit
 * @property {string} description
 * @property {string} latestRequiredTime
 * @property {number=} unitPrice
 * @property {number=} amount
 */

/**
 * @typedef {Object} MaterialReadinessEntity
 * @property {string} id
 * @property {string} name
 * @property {string} specification
 * @property {number} quantity
 * @property {string} unit
 * @property {string} taskNo
 * @property {string} orderNo
 * @property {string} productName
 * @property {number} requiredQty
 * @property {number} inventoryQty
 * @property {number} inspectionQty
 * @property {number} receiptQty
 * @property {number} onlineShortQty
 * @property {number} onlineOverQty
 * @property {number} availableQty
 * @property {number} netDemandQty
 * @property {number} launchShortQty
 * @property {number} readinessRate
 * @property {'齐套' | '需跟催' | '欠料'} readinessStatus
 * @property {string} statusType
 */

/**
 * @typedef {Object} ProductionTaskEntity
 * @property {string} id
 * @property {string} taskNo
 * @property {string=} orderNo
 * @property {string=} parentTaskNo
 * @property {'normal' | 'sub'} taskType
 * @property {number=} taskLevel
 * @property {string} processName
 * @property {number} processPriority
 * @property {string} workCenter
 * @property {number} planQty
 * @property {number} completedQty
 * @property {string} unit
 * @property {number} pieceworkPrice
 * @property {number} ratedHours
 * @property {string} latestOnlineTime
 * @property {string} latestFinishTime
 * @property {string} machine
 * @property {string} machineRule
 * @property {boolean} canSplit
 * @property {ProductionTaskStatus} status
 * @property {string} planStartDate
 * @property {string} planEndDate
 * @property {string|null} actualStartDate
 * @property {string|null} actualEndDate
 * @property {string} operator
 * @property {MaterialEntity[]} materials
 * @property {ProductionTaskEntity[]} subTasks
 * @property {string} remark
 */

/**
 * @typedef {Object} FlowLogEntity
 * @property {string} id
 * @property {OrderStatus|null} fromStatus
 * @property {OrderStatus} toStatus
 * @property {string} label
 * @property {string} operator
 * @property {string} createdAt
 * @property {string} remark
 */

/**
 * @typedef {Object} OrderEntity
 * @property {number} id
 * @property {string} orderNo
 * @property {CustomerLevel} customerLevel
 * @property {string} salesperson
 * @property {string} productName
 * @property {string} specification
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {string} unit
 * @property {number} amount
 * @property {string} orderDate
 * @property {string} deliveryDate
 * @property {string} notes
 * @property {boolean} isUrgent
 * @property {OrderStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} createdBy
 * @property {ProductionTaskEntity[]} productionTasks
 * @property {MaterialEntity[]} auxiliaryMaterials
 * @property {FlowLogEntity[]} flowLogs
 * @property {number} progress
 * @property {boolean=} isStocked
 */

/**
 * @typedef {ProductionTaskEntity & {
 *   orderId: number,
 *   orderNo: string,
 *   customerLevel: CustomerLevel,
 *   productName: string,
 *   deliveryDate: string,
 *   isUrgent: boolean,
 *   completion: number,
 *   deliveryRisk: { label: string, type: string, level: number, days: number },
 *   shortageCount: number,
 *   readinessRate: number,
 *   readinessStatus: '齐套' | '需跟催' | '欠料'
 * }} PmcScheduleTaskEntity
 */

export {}
