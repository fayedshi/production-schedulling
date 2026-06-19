<template>
  <el-dialog v-model="dialogVisible" :title="title" width="980px" :close-on-click-modal="false" destroy-on-close @open="resetForm">
    <el-alert v-if="contextTitle" type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>{{ contextTitle }}</template>
    </el-alert>

    <el-form :model="form" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="8"><el-form-item label="任务号"><el-input v-model="form.taskNo" disabled /></el-form-item></el-col>
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
        <el-col :span="8"><el-form-item label="拆分方式"><el-radio-group v-model="form.splitMode"><el-radio-button label="average">平均值拆</el-radio-button><el-radio-button label="custom">指定数量拆</el-radio-button></el-radio-group></el-form-item></el-col>
      </el-row>
      <el-form-item label="拆分数量">
        <template v-if="form.splitMode === 'average'">
          <el-input-number v-model="form.splitCount" :min="1" :max="20" />
        </template>
        <template v-else>
          <div class="quantity-list">
            <el-input-number v-for="(_, index) in form.subTaskQuantities" :key="index" v-model="form.subTaskQuantities[index]" :min="1" />
            <el-button @click="form.subTaskQuantities.push(1)">增加</el-button>
            <el-button v-if="form.subTaskQuantities.length > 1" @click="form.subTaskQuantities.pop()">删除</el-button>
          </div>
        </template>
      </el-form-item>
    </el-form>

    <div class="section-title">材辅料信息</div>
    <el-table :data="form.materials" border size="small">
      <el-table-column label="材辅料名称" min-width="130"><template #default="{ row }"><el-input v-model="row.name" /></template></el-table-column>
      <el-table-column label="规格" min-width="120"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
      <el-table-column label="数量" width="130"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" style="width: 100%" /></template></el-table-column>
      <el-table-column label="单位" width="100"><template #default="{ row }"><el-input v-model="row.unit" /></template></el-table-column>
      <el-table-column label="描述" min-width="170"><template #default="{ row }"><el-input v-model="row.description" /></template></el-table-column>
      <el-table-column label="最晚需求时间" width="160"><template #default="{ row }"><el-date-picker v-model="row.latestRequiredTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></template></el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeMaterial($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button class="add-material-btn" @click="form.materials.push(newMaterial())">增加材辅料</el-button>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认拆解</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { units as defaultUnits } from '../store/order'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '拆解任务' },
  contextTitle: { type: String, default: '' },
  defaults: { type: Object, default: () => ({}) },
  processNames: { type: Array, default: () => [] },
  machines: { type: Array, default: () => [] },
  machineRules: { type: Array, default: () => [] },
  units: { type: Array, default: () => defaultUnits }
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

function newMaterial() {
  return { name: '包装膜', specification: '通用', quantity: 1, unit: '卷', description: '生产配套辅料', latestRequiredTime: '' }
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
    splitMode: 'average',
    splitCount: 2,
    subTaskQuantities: [1, 1],
    materials: [newMaterial()]
  }
}

function cloneMaterials(materials) {
  return (materials?.length ? materials : [newMaterial()]).map(item => ({ ...newMaterial(), ...item }))
}

function resetForm() {
  Object.assign(form, initialForm(), props.defaults)
  form.subTaskQuantities = [...(props.defaults.subTaskQuantities || form.subTaskQuantities)]
  form.materials = cloneMaterials(props.defaults.materials)
}

function removeMaterial(index) {
  if (form.materials.length === 1) return
  form.materials.splice(index, 1)
}

function submit() {
  emit('submit', {
    ...form,
    subTaskQuantities: [...form.subTaskQuantities],
    materials: form.materials.map(item => ({ ...item }))
  })
}
</script>

<style scoped>
.quantity-list { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.section-title { font-weight: 700; color: #303133; margin: 12px 0 8px; }
.add-material-btn { margin-top: 10px; }
</style>
