<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>角色管理</h2>
        <p>创建租户角色，并为角色授权菜单与接口权限。</p>
      </div>
      <el-button v-permission="'role.create'" type="primary" :icon="Plus" @click="createVisible = true">新增角色</el-button>
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
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-permission="'role.assign_permissions'" text :icon="KeyRound" @click="openPermissions(row)">权限分配</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新增角色" width="560px">
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
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createRole">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="permissionVisible" title="角色权限分配" size="560px">
      <el-tabs model-value="Api">
        <el-tab-pane label="接口权限" name="Api">
          <PermissionChecks :items="apiPermissions" v-model="selectedPermissionIds" />
        </el-tab-pane>
        <el-tab-pane label="菜单权限" name="Menu">
          <PermissionChecks :items="menuPermissions" v-model="selectedPermissionIds" />
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
import { ElCheckbox, ElCheckboxGroup, ElMessage } from 'element-plus'
import { KeyRound, Plus } from 'lucide-vue-next'
import { rbacApi } from '@/api/rbac'
import type { Permission, Role } from '@/types/rbac'

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
const createVisible = ref(false)
const permissionVisible = ref(false)
const formRef = ref<FormInstance>()
const selectedRole = ref<Role | null>(null)
const selectedPermissionIds = ref<string[]>([])

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
const menuPermissions = computed(() => permissions.value.filter((item) => item.type === 'Menu'))

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

async function createRole() {
  await formRef.value?.validate()
  saving.value = true
  try {
    await rbacApi.createRole(form)
    ElMessage.success('角色已创建')
    createVisible.value = false
    await loadRoles()
  } finally {
    saving.value = false
  }
}

function openPermissions(row: Role) {
  selectedRole.value = row
  selectedPermissionIds.value = permissions.value
    .filter((permission) => row.permissions.includes(permission.code))
    .map((permission) => permission.permissionId)
  permissionVisible.value = true
}

async function savePermissions() {
  if (!selectedRole.value) {
    return
  }

  saving.value = true
  try {
    await rbacApi.assignRolePermissions(selectedRole.value.roleId, selectedPermissionIds.value)
    ElMessage.success('权限已更新')
    permissionVisible.value = false
    await loadRoles()
  } finally {
    saving.value = false
  }
}
</script>
