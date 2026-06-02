<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>租户管理</h2>
        <p>维护租户基础信息、管理员账号和当前租户配置。</p>
      </div>
      <el-button v-permission="'tenant.create'" type="primary" :icon="Plus" @click="openCreate">新增租户</el-button>
    </div>

    <el-table v-loading="loading" :data="tenants" class="data-table" row-key="tenantId">
      <el-table-column prop="code" label="租户编码" min-width="140" />
      <el-table-column prop="name" label="租户名称" min-width="180" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button text :icon="Settings" @click="openConfig(row)">配置</el-button>
          <el-button v-permission="'tenant.create'" text :icon="Pencil" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新增租户" width="720px" class="responsive-dialog">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <div class="form-grid two">
          <el-form-item label="租户编码" prop="code">
            <el-input v-model="createForm.code" />
          </el-form-item>
          <el-form-item label="租户名称" prop="name">
            <el-input v-model="createForm.name" />
          </el-form-item>
          <el-form-item label="管理员用户名" prop="adminUserName">
            <el-input v-model="createForm.adminUserName" />
          </el-form-item>
          <el-form-item label="管理员邮箱" prop="adminEmail">
            <el-input v-model="createForm.adminEmail" />
          </el-form-item>
          <el-form-item label="管理员名称" prop="adminDisplayName">
            <el-input v-model="createForm.adminDisplayName" />
          </el-form-item>
          <el-form-item label="管理员密码" prop="adminPassword">
            <el-input v-model="createForm.adminPassword" type="password" show-password />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createTenant">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑租户" width="520px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="租户名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="租户状态">
          <el-switch v-model="editForm.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="updateTenant">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="configVisible" title="租户配置" size="420px">
      <div class="config-list" v-if="selectedTenant">
        <label>租户 ID</label>
        <strong>{{ selectedTenant.tenantId }}</strong>
        <label>接口租户头</label>
        <strong>X-Tenant-Id: {{ selectedTenant.tenantId }}</strong>
        <label>路由隔离</label>
        <el-tag effect="plain">按 JWT tenant_id 与请求头隔离</el-tag>
        <label>数据状态</label>
        <el-switch v-model="selectedTenant.isActive" disabled active-text="启用" inactive-text="停用" />
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Pencil, Plus, Settings } from 'lucide-vue-next'
import { tenancyApi } from '@/api/tenancy'
import type { CreateTenantRequest, Tenant } from '@/types/rbac'

const tenants = ref<Tenant[]>([])
const loading = ref(false)
const saving = ref(false)
const createVisible = ref(false)
const editVisible = ref(false)
const configVisible = ref(false)
const createFormRef = ref<FormInstance>()
const selectedTenant = ref<Tenant | null>(null)

const createForm = reactive<CreateTenantRequest>({
  code: '',
  name: '',
  adminUserName: '',
  adminEmail: '',
  adminDisplayName: '',
  adminPassword: '',
})

const editForm = reactive({
  tenantId: '',
  name: '',
  isActive: true,
})

const createRules: FormRules = {
  code: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  adminUserName: [{ required: true, message: '请输入管理员用户名', trigger: 'blur' }],
  adminEmail: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  adminDisplayName: [{ required: true, message: '请输入管理员名称', trigger: 'blur' }],
  adminPassword: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
}

onMounted(loadTenants)

async function loadTenants() {
  loading.value = true

  try {
    const list = await tenancyApi.list().catch(() => [])

    if (list.length > 0) {
      tenants.value = list
      return
    }

    const current = await tenancyApi.current().catch(() => null)
    tenants.value = current ? [current] : []
  } catch {
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createVisible.value = true
}

function openEdit(row: Tenant) {
  editForm.tenantId = row.tenantId
  editForm.name = row.name
  editForm.isActive = row.isActive
  editVisible.value = true
}

function openConfig(row: Tenant) {
  selectedTenant.value = row
  configVisible.value = true
}

async function createTenant() {
  await createFormRef.value?.validate()
  saving.value = true

  try {
    await tenancyApi.create(createForm)
    ElMessage.success('租户已创建')
    createVisible.value = false
    await loadTenants()
  } finally {
    saving.value = false
  }
}

async function updateTenant() {
  saving.value = true

  try {
    await tenancyApi.update(editForm.tenantId, {
      name: editForm.name,
      isActive: editForm.isActive,
    })
    ElMessage.success('租户已更新')
    editVisible.value = false
    await loadTenants()
  } finally {
    saving.value = false
  }
}
</script>
