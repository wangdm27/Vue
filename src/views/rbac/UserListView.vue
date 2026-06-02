<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>用户管理</h2>
        <p>新增、查看、编辑和删除租户用户，并为用户分配角色。</p>
      </div>
      <div class="toolbar-actions">
        <el-button v-permission="'user.create'" type="primary" :icon="Plus" @click="openCreate">新增用户</el-button>
        <el-button :icon="RefreshCw" @click="loadUsers">刷新</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="users" class="data-table" row-key="userId">
      <el-table-column prop="userName" label="用户名" min-width="130" />
      <el-table-column prop="displayName" label="显示名称" min-width="150" />
      <el-table-column prop="email" label="邮箱" min-width="220" />
      <el-table-column label="角色" min-width="220">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles" :key="role" class="tag-gap" effect="plain">{{ role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button v-permission="'user.update'" text :icon="Pencil" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission="'user.assign_roles'" text :icon="ShieldCheck" @click="openRoles(row)">分配角色</el-button>
          <el-button
            v-permission="'user.delete'"
            text
            type="danger"
            :icon="Trash2"
            :disabled="row.isTenantOwner"
            @click="deleteUser(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新增用户" width="640px" class="responsive-dialog">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <div class="form-grid two">
          <el-form-item label="用户名" prop="userName">
            <el-input v-model="createForm.userName" />
          </el-form-item>
          <el-form-item label="显示名称" prop="displayName">
            <el-input v-model="createForm.displayName" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="createForm.email" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="createForm.password" type="password" show-password />
          </el-form-item>
        </div>
        <el-form-item label="状态">
          <el-switch v-model="createForm.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="初始角色">
          <el-checkbox-group v-model="createForm.roleIds" class="check-list compact">
            <el-checkbox v-for="role in roles" :key="role.roleId" :label="role.roleId">
              <strong>{{ role.name }}</strong>
              <span>{{ role.code }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑用户" width="520px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-position="top">
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="editForm.displayName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="roleVisible" title="分配角色" size="460px">
      <el-checkbox-group v-model="selectedRoleIds" class="check-list">
        <el-checkbox v-for="role in roles" :key="role.roleId" :label="role.roleId">
          <strong>{{ role.name }}</strong>
          <span>{{ role.code }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRoles">保存</el-button>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { rbacApi } from '@/api/rbac'
import type { CreateUserRequest, Role, UserListItem } from '@/types/rbac'

const users = ref<UserListItem[]>([])
const roles = ref<Role[]>([])
const loading = ref(false)
const saving = ref(false)
const createVisible = ref(false)
const editVisible = ref(false)
const roleVisible = ref(false)
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const selectedUser = ref<UserListItem | null>(null)
const selectedRoleIds = ref<string[]>([])

const createForm = reactive<CreateUserRequest>({
  userName: '',
  displayName: '',
  email: '',
  password: '',
  isActive: true,
  roleIds: [],
})

const editForm = reactive({
  userId: '',
  displayName: '',
  email: '',
  isActive: true,
})

const createRules: FormRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少 3 位', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
}

const editRules: FormRules = {
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles()])
})

async function loadUsers() {
  loading.value = true
  try {
    users.value = await rbacApi.users()
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  roles.value = await rbacApi.roles()
}

async function openCreate() {
  resetCreateForm()
  createVisible.value = true
  await nextTick()
  createFormRef.value?.clearValidate()
}

function openEdit(row: UserListItem) {
  editForm.userId = row.userId
  editForm.displayName = row.displayName
  editForm.email = row.email
  editForm.isActive = row.isActive
  editVisible.value = true
  nextTick(() => editFormRef.value?.clearValidate())
}

function openRoles(row: UserListItem) {
  selectedUser.value = row
  selectedRoleIds.value = roles.value.filter((role) => row.roles.includes(role.code)).map((role) => role.roleId)
  roleVisible.value = true
}

async function createUser() {
  await createFormRef.value?.validate()
  saving.value = true
  try {
    await rbacApi.createUser({ ...createForm, roleIds: [...createForm.roleIds] })
    ElMessage.success('用户已创建')
    createVisible.value = false
    await loadUsers()
  } finally {
    saving.value = false
  }
}

async function saveUser() {
  await editFormRef.value?.validate()
  saving.value = true
  try {
    await rbacApi.updateUser(editForm.userId, editForm)
    ElMessage.success('用户已更新')
    editVisible.value = false
    await loadUsers()
  } finally {
    saving.value = false
  }
}

async function deleteUser(row: UserListItem) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.displayName || row.userName}」吗？此操作不可恢复。`, '删除用户', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
  } catch {
    return
  }

  saving.value = true
  try {
    await rbacApi.deleteUser(row.userId)
    ElMessage.success('用户已删除')
    await loadUsers()
  } finally {
    saving.value = false
  }
}

async function saveRoles() {
  if (!selectedUser.value) {
    return
  }

  saving.value = true
  try {
    await rbacApi.assignUserRoles(selectedUser.value.userId, selectedRoleIds.value)
    ElMessage.success('角色已分配')
    roleVisible.value = false
    await loadUsers()
  } finally {
    saving.value = false
  }
}

function resetCreateForm() {
  createForm.userName = ''
  createForm.displayName = ''
  createForm.email = ''
  createForm.password = ''
  createForm.isActive = true
  createForm.roleIds = []
}
</script>
