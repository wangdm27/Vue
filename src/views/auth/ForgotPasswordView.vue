<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-visual">
        <div class="auth-logo">TR</div>
        <h1>忘记密码</h1>
        <p>输入租户编码和注册邮箱，如果邮箱存在将发送重置链接。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form" label-position="top" @submit.prevent>
        <h2>重置密码</h2>
        <el-form-item label="租户编码" prop="tenantCode">
          <el-input v-model="form.tenantCode" placeholder="demo" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="admin@example.com" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="submit">发送重置链接</el-button>
        <div class="auth-links">
          <RouterLink to="/login">返回登录</RouterLink>
        </div>
      </el-form>

      <el-result v-if="submitted" icon="success" title="重置链接已发送" sub-title="如果邮箱存在，重置链接已发送到您的邮箱。">
        <template #extra>
          <el-button type="primary" @click="$router.push('/login')">返回登录</el-button>
        </template>
      </el-result>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitted = ref(false)

const form = reactive({
  tenantCode: '',
  email: '',
})

const rules: FormRules = {
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true

  try {
    await authApi.forgotPassword(form)
    submitted.value = true
  } catch {
    ElMessage.error('请求失败，请重试')
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
