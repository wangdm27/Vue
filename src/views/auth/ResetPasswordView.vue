<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-visual">
        <div class="auth-logo">TR</div>
        <h1>重置密码</h1>
        <p>设置新密码以完成重置。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form" label-position="top" @submit.prevent>
        <h2>设置新密码</h2>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="submit">重置密码</el-button>
        <div class="auth-links">
          <RouterLink to="/login">返回登录</RouterLink>
        </div>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const email = (route.query.email as string) ?? ''
const token = (route.query.token as string) ?? ''

const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function submit() {
  if (!email || !token) {
    ElMessage.error('缺少重置参数，请从邮件链接重新进入')
    return
  }

  await formRef.value?.validate()
  loading.value = true

  try {
    await authApi.resetPassword({ email, token, newPassword: form.newPassword })
    ElMessage.success('密码已重置，请使用新密码登录')
    router.push('/login')
  } catch {
    ElMessage.error('重置失败，请重试')
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
