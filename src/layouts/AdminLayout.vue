<template>
  <div class="admin-shell">
    <aside :class="['admin-sidebar', { collapsed: isCollapsed, open: mobileMenuOpen }]">
      <div class="brand">
        <div class="brand-mark">TR</div>
        <div v-if="!isCollapsed" class="brand-copy">
          <strong>Tenant RBAC</strong>
          <span>{{ authStore.tenantCode || 'Admin' }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="route in visibleRoutes"
          :key="route.path"
          :to="route.path"
          class="nav-item"
          @click="mobileMenuOpen = false"
        >
          <component :is="route.meta?.icon" :size="20" />
          <span v-if="!isCollapsed">{{ route.meta?.title }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-main">
      <header class="topbar">
        <div class="topbar-left">
          <el-button class="mobile-toggle" text :icon="MenuIcon" @click="mobileMenuOpen = true" />
          <el-button class="desktop-toggle" text :icon="PanelLeftClose" @click="isCollapsed = !isCollapsed" />
          <div>
            <h1>{{ currentTitle }}</h1>
            <p>{{ authStore.displayName }} · {{ authStore.roles.join(' / ') || '未分配角色' }}</p>
          </div>
        </div>

        <div class="topbar-actions">
          <el-tag effect="plain">{{ authStore.tenantCode }}</el-tag>
          <el-dropdown>
            <button class="profile-button" type="button">
              <span>{{ avatarText }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>{{ authStore.userName }}</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-area">
        <RouterView />
      </main>
    </div>

    <button v-if="mobileMenuOpen" class="shell-mask" type="button" @click="mobileMenuOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu as MenuIcon, PanelLeftClose } from 'lucide-vue-next'
import { adminRoutes } from '@/router/modules'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const visibleRoutes = computed(() =>
  adminRoutes.filter((item) => authStore.hasPermission(item.meta?.permission as string | undefined)),
)

const currentTitle = computed(() => (route.meta.title as string | undefined) ?? '控制台')
const avatarText = computed(() => authStore.displayName.slice(0, 1).toUpperCase() || 'U')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
