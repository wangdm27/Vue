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
                <el-dropdown-item @click="changePwdVisible = true">修改密码</el-dropdown-item>
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

    <!-- 修改密码 Dialog -->
    <el-dialog v-model="changePwdVisible" title="修改密码" width="440px">
      <el-form ref="changePwdFormRef" :model="changePwdForm" :rules="changePwdRules" label-position="top" @submit.prevent>
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="changePwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="changePwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="changePwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="changePwdSaving" @click="saveChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Menu as MenuIcon, PanelLeftClose } from 'lucide-vue-next'
import { adminRoutes } from '@/router/modules'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const changePwdVisible = ref(false)
const changePwdSaving = ref(false)
const changePwdFormRef = ref<FormInstance>()

const changePwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const changePwdRules: FormRules = {
  oldPassword: [{ required: true, min: 6, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '新密码至少 6 位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== changePwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const visibleRoutes = computed(() =>
  adminRoutes.filter((item) => authStore.hasPermission(item.meta?.permission as string | undefined)),
)

const currentTitle = computed(() => (route.meta.title as string | undefined) ?? '控制台')
const avatarText = computed(() => authStore.displayName.slice(0, 1).toUpperCase() || 'U')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function saveChangePassword() {
  await changePwdFormRef.value?.validate()
  changePwdSaving.value = true

  try {
    await authApi.changePassword(changePwdForm)
    ElMessage.success('密码已修改')
    changePwdVisible.value = false
    changePwdForm.oldPassword = ''
    changePwdForm.newPassword = ''
    changePwdForm.confirmPassword = ''
  } finally {
    changePwdSaving.value = false
  }
}
</script>