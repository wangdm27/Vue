<template>
  <main class="auth-page">
    <section class="auth-panel register-panel">
      <div class="auth-visual">
        <div class="auth-logo">TR</div>
        <h1>注册租户用户</h1>
        <p>创建后会直接进入当前租户空间，权限由租户默认角色决定。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form" label-position="top">
        <h2>注册</h2>
        <div class="form-grid two">
          <el-form-item label="租户编码" prop="tenantCode">
            <el-input v-model="form.tenantCode" />
          </el-form-item>
          <el-form-item label="用户名" prop="userName">
            <el-input v-model="form.userName" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" />
          </el-form-item>
          <el-form-item label="显示名称" prop="displayName">
            <el-input v-model="form.displayName" />
          </el-form-item>
        </div>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="submit">创建账号</el-button>
        <RouterLink to="/login">已有账号？返回登录</RouterLink>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  tenantCode: '',
  userName: '',
  email: '',
  displayName: '',
  password: '',
})

const rules: FormRules = {
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true

  try {
    await authStore.register(form)
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>
