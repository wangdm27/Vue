<template>
  <main class="auth-page">
    <section class="auth-panel register-panel">
      <div class="auth-visual">
        <div class="auth-logo">TR</div>
        <h1>创建新租户</h1>
        <p>创建租户并设置管理员账号，创建成功后将自动登录。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form" label-position="top">
        <h2>租户信息</h2>
        <div class="form-grid two">
          <el-form-item label="租户编码" prop="code">
            <el-input v-model="form.code" placeholder="如：mycompany" />
          </el-form-item>
          <el-form-item label="租户名称" prop="name">
            <el-input v-model="form.name" placeholder="如：我的公司" />
          </el-form-item>
        </div>

        <h2>管理员信息</h2>
        <div class="form-grid two">
          <el-form-item label="用户名" prop="adminUserName">
            <el-input v-model="form.adminUserName" placeholder="管理员用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="adminEmail">
            <el-input v-model="form.adminEmail" placeholder="admin@example.com" />
          </el-form-item>
          <el-form-item label="显示名称" prop="adminDisplayName">
            <el-input v-model="form.adminDisplayName" placeholder="管理员显示名称" />
          </el-form-item>
          <el-form-item label="密码" prop="adminPassword">
            <el-input v-model="form.adminPassword" type="password" show-password placeholder="至少 6 位" />
          </el-form-item>
        </div>

        <el-button type="primary" size="large" :loading="loading" @click="submit">创建租户并登录</el-button>
        <div class="auth-links">
          <RouterLink to="/login">已有租户？返回登录</RouterLink>
          <RouterLink to="/register">已有租户？注册用户</RouterLink>
        </div>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { tenancyApi } from '@/api/tenancy'
import { useAuthStore } from '@/stores/auth'
import type { CreateTenantRequest } from '@/types/rbac'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<CreateTenantRequest>({
  code: '',
  name: '',
  adminUserName: '',
  adminEmail: '',
  adminDisplayName: '',
  adminPassword: '',
})

const rules: FormRules = {
  code: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和横线', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  adminUserName: [
    { required: true, message: '请输入管理员用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少 3 位', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效邮箱', trigger: 'blur' }
  ],
  adminDisplayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  adminPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true

  try {
    await tenancyApi.create(form)
    ElMessage.success('租户创建成功，请使用管理员账号登录')
    
    await authStore.login({
      tenantCode: form.code,
      userName: form.adminUserName,
      password: form.adminPassword,
    })
    
    router.push('/dashboard')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '创建失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-links {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.auth-links a {
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.auth-links a:hover {
  text-decoration: underline;
}
</style>
