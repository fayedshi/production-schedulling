<template>
  <el-config-provider :locale="zhCn">
    <el-container class="app-shell">
      <el-aside width="220px" class="app-sidebar">
        <div class="brand-block">
          <div class="brand-mark">排</div>
          <div>
            <div class="brand-title">生产任务总表</div>
            <div class="brand-subtitle">Scheduling Center</div>
          </div>
        </div>
        <el-menu class="module-menu" :default-active="activeMenu" :default-openeds="['production-plan']" router
          background-color="#172033" text-color="#c9d3e3" active-text-color="#ffffff">
          <el-sub-menu>
            <template #title>
              <el-icon>
                <Calendar />
              </el-icon>
              <span>订单管理</span>
            </template>
            <el-menu-item index="/orders">
              <el-icon>
                <Tickets />
              </el-icon>
              <span>订单列表</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="production-plan">
            <template #title>
              <el-icon>
                <Calendar />
              </el-icon>
              <span>生产计划</span>
            </template>
            <el-menu-item index="/production-orders">
              <el-icon>
                <List />
              </el-icon>
              <span>生产订单总表</span>
            </el-menu-item>
            <el-menu-item index="/schedule">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>生产任务总表</span>
            </el-menu-item>

          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-container class="app-main-shell">
        <!-- <el-header class="app-header">
          <div>
            <div class="header-title">{{ route.meta.title || '排程系统' }}</div>
            <div class="header-subtitle">生产计划、产能负荷、物料齐套与交付预警</div>
          </div>
        </el-header> -->
        <el-main class="app-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, Tickets, List } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const route = useRoute()

const activeMenu = computed(() => {
  if (route.path.startsWith('/production-orders')) return '/production-orders'
  if (route.path.startsWith('/orders') || route.path.startsWith('/order/')) return '/orders'
  return '/schedule'
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
}

.app-shell {
  min-height: 100vh;
  background: #f5f7fa;
}

.app-sidebar {
  min-height: 100vh;
  background: #172033;
  color: #fff;
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.14);
}

.brand-block {
  height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f7df6;
  font-weight: 700;
  font-size: 18px;
}

.brand-title {
  font-size: 17px;
  line-height: 1.35;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #8fa2bd;
}

.module-menu {
  border-right: 0;
  padding-top: 10px;
}

.module-menu .el-menu-item {
  height: 46px;
  margin: 4px 10px;
  border-radius: 6px;
}

.module-menu .el-menu-item.is-active {
  background: #2f7df6;
}

.app-main-shell {
  min-width: 0;
}

.app-header {
  height: 76px;
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #7b8794;
}

.app-content {
  min-width: 0;
  padding: 0;
  overflow: auto;
}
</style>
