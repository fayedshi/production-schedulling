import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/orders'
  },
  
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('../views/OrderListView.vue'),
    meta: { title: '订单管理' }
  },
  {
    path: '/production-orders',
    name: 'ProductionOrderList',
    component: () => import('../views/ProductionOrderList.vue'),
    meta: { title: '生产订单总表' }
  },
  {
    path: '/schedule',
    name: 'ScheduleDashboard',
    component: () => import('../views/ScheduledTaskDashboard.vue'),
    meta: { title: '生产任务总表' }
  },
  {
    path: '/tasks/:taskNo/:editMode',
    name: 'TaskDetail',
    component: () => import('../views/TaskDetail.vue'),
    meta: { title: '任务详情' }
  },
  {
    path: '/orders/id/:id(\\d+)',
    name: 'OrderDetailById',
    component: () => import('../views/OrderDetailView.vue'),
    meta: { title: '订单详情' }
  },
  {
    path: '/orders/:orderNo',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetailView.vue'),
    meta: { title: '订单详情' }
  },
  {
    path: '/order/:id(\\d+)',
    redirect: to => `/orders/id/${to.params.id}`
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/schedule'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
