<template>
  <el-dialog v-model="dialogVisible" :title="title" width="1080px" :close-on-click-modal="false" destroy-on-close @open="resetForm">
    <el-alert v-if="contextTitle" type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>{{ contextTitle }}</template>
    </el-alert>

    <el-form :model="form" label-width="110px">
      <el-row :gutter="16">
        <!-- <el-col :span="8"><el-form-item label="任务号"><el-input v-model="form.taskNo" disabled /></el-form-item></el-col> -->
        <el-col :span="8"><el-form-item label="工序"><el-select v-model="form.processName" style="width: 100%"><el-option v-for="p in processNames" :key="p" :label="p" :value="p" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="优先顺序"><el-input-number v-model="form.processPriority" :min="1" style="width: 100%" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8"><el-form-item label="数量"><el-input-number v-model="form.planQty" :min="1" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="单位"><el-select v-model="form.unit" style="width: 100%"><el-option v-for="u in units" :key="u" :label="u" :value="u" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="计件单价"><el-input-number v-model="form.pieceworkPrice" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8"><el-form-item label="额定工时"><el-input-number v-model="form.ratedHours" :min="0" :precision="1" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="最晚上线"><el-date-picker v-model="form.latestOnlineTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="最晚完工"><el-date-picker v-model="form.latestFinishTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8"><el-form-item label="机台"><el-select v-model="form.machine" style="width: 100%"><el-option v-for="m in machines" :key="m" :label="m" :value="m" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="机台原则"><el-select v-model="form.machineRule" style="width: 100%"><el-option v-for="r in machineRules" :key="r" :label="r" :value="r" /></el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="平均拆分"><el-checkbox v-model="form.averageSplit" @change="handleAverageChange"></el-checkbox></el-form-item></el-col>
      </el-row>
      <el-form-item label="拆分任务数量">
        <el-input-number v-model="form.splitCount" :min="1" :max="20" @change="syncAverageItems" />
      </el-form-item>
    </el-form>

    <div class="section-title">拆分明细</div>
    <div class="split-item" v-for="(item, index) in form.splitItems" :key="index">
      <div class="split-item-head">
        <el-form-item :label="`任务 ${index + 1} 零件数`" label-width="110px">
          <el-input-number v-model="item.planQty" :min="1" :disabled="form.averageSplit" />
        </el-form-item>
        <!-- <div v-if="!form.averageSplit" class="split-actions">
          <el-button @click="addSplitItem">增加任务</el-button>
          <el-button v-if="form.splitItems.length > 1" @click="removeSplitItem(index)">删除任务</el-button>
        </div> -->
      </div>
      <el-table :data="item.materials" border size="small">
        <el-table-column label="材辅料名称" min-width="140"><template #default="{ row }"><el-select v-model="row.name" style="width: 100%" @change="name => handleMaterialNameChange(row, name)"><el-option v-for="m in materialOptions" :key="m.name" :label="m.name" :value="m.name" /></el-select></template></el-table-column>
        <el-table-column label="规格" min-width="120"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
        <el-table-column label="数量" width="130"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" style="width: 100%" /></template></el-table-column>
        <el-table-column label="单位" width="110"><template #default="{ row }"><el-select v-model="row.unit" style="width: 100%"><el-option v-for="u in units" :key="u" :label="u" :value="u" /></el-select></template></el-table-column>
        <el-table-column label="描述" min-width="170"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
        <el-table-column label="最晚需求时间" width="160"><template #default="{ row }"><el-date-picker v-model="row.latestRequiredTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></template></el-table-column>
        <el-table-column label="操作" width="80" align="center"><template #default="{ $index }"><el-button link type="danger" size="small" :disabled="item.materials.length === 1" @click="removeMaterial(item, $index)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button class="add-material-btn" @click="addMaterial(item)">增加材辅料</el-button>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认拆解</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { materialOptions as defaultMaterialOptions, units as defaultUnits } from '../store/order'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '拆解任务' },
  contextTitle: { type: String, default: '' },
  defaults: { type: Object, default: () => ({}) },
  processNames: { type: Array, default: () => [] },
  machines: { type: Array, default: () => [] },
  machineRules: { type: Array, default: () => [] },
  units: { type: Array, default: () => defaultUnits },
  materialOptions: { type: Array, default: () => defaultMaterialOptions }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const form = reactive(initialForm())

watch(() => props.defaults, () => {
  if (dialogVisible.value) resetForm()
}, { deep: true })

watch(() => [form.splitCount, form.planQty], () => {
  if (form.averageSplit) syncAverageItems()
})

function defaultMaterial() {
  const first = props.materialOptions[0] || { name: '包装膜', unit: '卷' }
  return { name: first.name, specification: '通用', quantity: 1, unit: first.unit, description: '生产配套辅料', latestRequiredTime: '' }
}

function initialForm() {
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
    averageSplit: true,
    splitCount: 2,
    splitItems: []
  }
}

function cloneMaterials(materials) {
  return (materials?.length ? materials : [defaultMaterial()]).map(item => ({ ...defaultMaterial(), ...item }))
}

function resetForm() {
  Object.assign(form, initialForm(), props.defaults)
  form.averageSplit = props.defaults.averageSplit ?? props.defaults.splitMode !== 'custom'
  if (props.defaults.splitItems?.length) {
    form.splitItems = props.defaults.splitItems.map(item => ({ planQty: Number(item.planQty) || 1, materials: cloneMaterials(item.materials) }))
    if (form.averageSplit) syncAverageItems()
  } else if (form.averageSplit) {
    syncAverageItems()
  } else {
    const quantities = props.defaults.subTaskQuantities?.length ? props.defaults.subTaskQuantities : [1]
    form.splitItems = quantities.map(qty => ({ planQty: Number(qty) || 1, materials: cloneMaterials(props.defaults.materials) }))
  }
}

function splitQuantities(total, count) {
  const base = Math.floor(Number(total || 0) / count)
  const rest = Number(total || 0) % count
  return Array.from({ length: count }, (_, index) => base + (index < rest ? 1 : 0))
}

function syncAverageItems() {
  const count = Math.max(1, Number(form.splitCount) || 1)
  const quantities = splitQuantities(form.planQty, count)
  const sourceMaterials = cloneMaterials(props.defaults.materials)
  form.splitItems = quantities.map(qty => ({
    planQty: qty,
    materials: sourceMaterials.map(material => ({
      ...material,
      quantity: Math.max(1, Math.ceil((Number(material.quantity) || 1) * qty / Math.max(1, Number(form.planQty) || 1)))
    }))
  }))
}

function handleAverageChange(checked) {
  if (checked) syncAverageItems()
  if (!checked && !form.splitItems.length) addSplitItem()
}



// function removeSplitItem(index) {
//   if (form.splitItems.length === 1) return
//   form.splitItems.splice(index, 1)
// }

function addMaterial(item) {
  item.materials.push(defaultMaterial())
}

function removeMaterial(item, index) {
  if (item.materials.length === 1) return
  item.materials.splice(index, 1)
}

function handleMaterialNameChange(row, name) {
  const found = props.materialOptions.find(item => item.name === name)
  if (found) row.unit = found.unit
}

function submit() {
  emit('submit', {
    ...form,
    splitMode: form.averageSplit ? 'average' : 'custom',
    subTaskQuantities: form.splitItems.map(item => Number(item.planQty) || 0),
    materials: form.splitItems[0]?.materials.map(item => ({ ...item })) || [],
    splitItems: form.splitItems.map(item => ({
      planQty: Number(item.planQty) || 0,
      materials: item.materials.map(material => ({ ...material }))
    }))
  })
}
</script>

<style scoped>
.section-title { font-weight: 700; color: #303133; margin: 12px 0 8px; }
.split-item { padding: 12px; margin-bottom: 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fafcff; }
.split-item-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.split-actions { display: flex; gap: 8px; }
.add-material-btn { margin-top: 10px; }
</style>
