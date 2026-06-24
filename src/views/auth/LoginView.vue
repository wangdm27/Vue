<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-visual">
        <div class="auth-logo">TR</div>
        <h1>多租户权限管理</h1>
        <p>面向后台团队的租户、用户、角色、权限与菜单配置中心。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form" label-position="top" @keyup.enter="submit">
        <h2>登录</h2>
        <el-form-item label="租户编码" prop="tenantCode">
          <el-input v-model="form.tenantCode" placeholder="demo" />
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="form.userName" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="submit">登录系统</el-button>
        <div class="auth-links">
          <RouterLink to="/forgot-password">忘记密码？</RouterLink>
          <RouterLink to="/register">已有租户？注册用户</RouterLink>
          <RouterLink to="/tenant-register">没有租户？创建租户</RouterLink>
        </div>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  tenantCode: '',
  userName: '',
  password: '',
})

const rules: FormRules = {
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  try {
    await formRef.value?.validate()
    loading.value = true

    const response = await authStore.login(form)
    console.log('登录成功:', response)
    
    const redirect = (route.query.redirect as string | undefined) ?? '/dashboard'
    console.log('准备跳转到:', redirect)
    
    await router.push(redirect)
  } catch (error: any) {
    console.error('登录失败:', error)
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