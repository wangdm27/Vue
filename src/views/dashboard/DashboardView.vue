<template>
  <section class="page-stack">
    <div class="hero-strip">
      <div>
        <span>Tenant · RBAC · Menu</span>
        <h2>权限与租户空间总览</h2>
        <p>当前租户的访问入口、角色授权和菜单能力会随登录用户的权限实时收敛。</p>
      </div>
      <el-button type="primary" :icon="RefreshCw" @click="refresh">刷新权限</el-button>
    </div>

    <div class="stat-grid">
      <article class="metric-card">
        <span>租户</span>
        <strong>{{ authStore.tenantCode }}</strong>
        <p>{{ authStore.tenantId }}</p>
      </article>
      <article class="metric-card">
        <span>角色</span>
        <strong>{{ authStore.roles.length }}</strong>
        <p>{{ authStore.roles.join(' / ') || '暂无角色' }}</p>
      </article>
      <article class="metric-card">
        <span>权限</span>
        <strong>{{ authStore.permissions.length }}</strong>
        <p>按钮与路由均按权限码控制</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

async function refresh() {
  await authStore.refreshProfile()
  ElMessage.success('权限信息已刷新')
}
</script>
