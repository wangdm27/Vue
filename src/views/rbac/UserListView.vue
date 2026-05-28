<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>用户管理</h2>
        <p>查看租户用户、维护状态，并为用户分配角色。</p>
      </div>
      <el-button :icon="RefreshCw" @click="loadUsers">刷新</el-button>
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
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button v-permission="'user.update'" text :icon="Pencil" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission="'user.assign_roles'" text :icon="ShieldCheck" @click="openRoles(row)">分配角色</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="编辑用户" width="520px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="显示名称">
          <el-input v-model="editForm.displayName" />
        </el-form-item>
        <el-form-item label="邮箱">
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Pencil, RefreshCw, ShieldCheck } from 'lucide-vue-next'
import { rbacApi } from '@/api/rbac'
import type { Role, UserListItem } from '@/types/rbac'

const users = ref<UserListItem[]>([])
const roles = ref<Role[]>([])
const loading = ref(false)
const saving = ref(false)
const editVisible = ref(false)
const roleVisible = ref(false)
const selectedUser = ref<UserListItem | null>(null)
const selectedRoleIds = ref<string[]>([])

const editForm = reactive({
  userId: '',
  displayName: '',
  email: '',
  isActive: true,
})

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

function openEdit(row: UserListItem) {
  editForm.userId = row.userId
  editForm.displayName = row.displayName
  editForm.email = row.email
  editForm.isActive = row.isActive
  editVisible.value = true
}

function openRoles(row: UserListItem) {
  selectedUser.value = row
  selectedRoleIds.value = roles.value.filter((role) => row.roles.includes(role.code)).map((role) => role.roleId)
  roleVisible.value = true
}

async function saveUser() {
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
</script>
