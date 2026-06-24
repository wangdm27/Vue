<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>角色管理</h2>
        <p>创建租户角色，并为角色授权菜单与接口权限。</p>
      </div>
      <el-button v-permission="'role.create'" type="primary" :icon="Plus" @click="openCreate">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="roles" class="data-table" row-key="roleId">
      <el-table-column prop="code" label="角色编码" min-width="150" />
      <el-table-column prop="name" label="角色名称" min-width="160" />
      <el-table-column prop="description" label="描述" min-width="240" />
      <el-table-column label="默认角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.isDefault ? 'success' : 'info'">{{ row.isDefault ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限数量" width="120">
        <template #default="{ row }">{{ row.permissions.length }}</template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button v-permission="'role.assign_permissions'" text :icon="KeyRound" @click="openPermissions(row)">权限分配</el-button>
          <el-button v-permission="'role.update'" text :icon="Pencil" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission="'role.delete'" text type="danger" :icon="Trash2" @click="deleteRole(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑角色 -->
    <el-dialog v-model="formVisible" :title="isEditing ? '编辑角色' : '新增角色'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid two">
          <el-form-item label="角色编码" prop="code">
            <el-input v-model="form.code" />
          </el-form-item>
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>
        </div>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="默认角色">
          <el-switch v-model="form.isDefault" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配 Drawer -->
    <el-drawer v-model="permissionVisible" title="角色权限分配" size="620px">
      <el-tabs v-model="permissionTab">
        <el-tab-pane label="接口权限" name="api">
          <PermissionChecks :items="apiPermissions" v-model="selectedApiPermissionIds" />
        </el-tab-pane>
        <el-tab-pane label="菜单权限" name="menu">
          <PermissionChecks :items="menuPermissions" v-model="selectedMenuPermissionIds" />
        </el-tab-pane>
        <el-tab-pane label="按钮权限" name="button">
          <PermissionChecks :items="buttonPermissions" v-model="selectedButtonPermissionIds" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePermissions">保存</el-button>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElCheckbox, ElCheckboxGroup, ElMessage, ElMessageBox } from 'element-plus'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { rbacApi } from '@/api/rbac'
import type { Permission, Role, RolePermissionSummary, UpdateRoleRequest } from '@/types/rbac'

const PermissionChecks = defineComponent({
  props: {
    items: { type: Array<Permission>, required: true },
    modelValue: { type: Array<string>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        ElCheckboxGroup,
        {
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: Array<string | number>) =>
            emit('update:modelValue', value.map((item) => String(item))),
          class: 'permission-checks',
        },
        () =>
          props.items.map((item) =>
            h(
              ElCheckbox,
              { key: item.permissionId, label: item.permissionId },
              () => h('span', [h('strong', item.name), h('small', `${item.code} · ${item.route || item.type}`)]),
            ),
          ),
      )
  },
})

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const loading = ref(false)
const saving = ref(false)
const formVisible = ref(false)
const permissionVisible = ref(false)
const isEditing = ref(false)
const editingRoleId = ref('')
const formRef = ref<FormInstance>()
const selectedRole = ref<Role | null>(null)

const permissionTab = ref('api')

const selectedApiPermissionIds = ref<string[]>([])
const selectedMenuPermissionIds = ref<string[]>([])
const selectedButtonPermissionIds = ref<string[]>([])

const form = reactive({
  code: '',
  name: '',
  description: '',
  isDefault: false,
})

const rules: FormRules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

const apiPermissions = computed(() => permissions.value.filter((item) => item.type === 'Api'))

const menuPermissions = computed(() => {
  const menuPerms = permissions.value.filter((item) => item.type === 'Menu')
  return menuPerms
})

const buttonPermissions = computed(() => {
  // 按钮权限没有独立type，从菜单按钮子权限中收集
  // 通过 RolePermissionSummary.buttonPermissionIds 来确定
  return permissions.value.filter((item) => item.type === 'Api' && item.code.includes('.'))
})

onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions()])
})

async function loadRoles() {
  loading.value = true
  try {
    roles.value = await rbacApi.roles()
  } finally {
    loading.value = false
  }
}

async function loadPermissions() {
  permissions.value = await rbacApi.permissions()
}

function openCreate() {
  isEditing.value = false
  editingRoleId.value = ''
  form.code = ''
  form.name = ''
  form.description = ''
  form.isDefault = false
  formVisible.value = true
}

function openEdit(row: Role) {
  isEditing.value = true
  editingRoleId.value = row.roleId
  form.code = row.code
  form.name = row.name
  form.description = row.description
  form.isDefault = row.isDefault
  formVisible.value = true
}

async function saveRole() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload: UpdateRoleRequest = {
      code: form.code,
      name: form.name,
      description: form.description,
      isDefault: form.isDefault,
    }

    if (isEditing.value) {
      await rbacApi.updateRole(editingRoleId.value, payload)
      ElMessage.success('角色已更新')
    } else {
      await rbacApi.createRole(payload)
      ElMessage.success('角色已创建')
    }

    formVisible.value = false
    await loadRoles()
  } finally {
    saving.value = false
  }
}

async function deleteRole(row: Role) {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？此操作不可恢复。`, '删除角色', {
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
    await rbacApi.deleteRole(row.roleId)
    ElMessage.success('角色已删除')
    await loadRoles()
  } finally {
    saving.value = false
  }
}

async function openPermissions(row: Role) {
  selectedRole.value = row

  try {
    const summary: RolePermissionSummary = await rbacApi.getRolePermissions(row.roleId)
    selectedApiPermissionIds.value = [...summary.apiPermissionIds]
    selectedMenuPermissionIds.value = [...summary.menuPermissionIds]
    selectedButtonPermissionIds.value = [...summary.buttonPermissionIds]
  } catch {
    // fallback: 从角色permissions推断
    selectedApiPermissionIds.value = permissions.value
      .filter((p) => p.type === 'Api' && row.permissions.includes(p.code))
      .map((p) => p.permissionId)
    selectedMenuPermissionIds.value = permissions.value
      .filter((p) => p.type === 'Menu' && row.permissions.includes(p.code))
      .map((p) => p.permissionId)
    selectedButtonPermissionIds.value = []
  }

  permissionTab.value = 'api'
  permissionVisible.value = true
}

async function savePermissions() {
  if (!selectedRole.value) {
    return
  }

  saving.value = true
  try {
    // 保存接口权限
    const allPermIds = [...selectedApiPermissionIds.value, ...selectedMenuPermissionIds.value, ...selectedButtonPermissionIds.value]
    await rbacApi.assignRolePermissions(selectedRole.value.roleId, allPermIds)

    // 保存菜单分配
    await rbacApi.assignRoleMenus(selectedRole.value.roleId, {
      menuPermissionIds: selectedMenuPermissionIds.value,
      buttonPermissionIds: selectedButtonPermissionIds.value,
    })

    ElMessage.success('权限已更新')
    permissionVisible.value = false
    await loadRoles()
  } finally {
    saving.value = false
  }
}
</script>
