<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>权限字典</h2>
        <p>系统内置接口与菜单权限，供角色授权时选择。</p>
      </div>
      <el-segmented v-model="activeType" :options="['全部', 'Api', 'Menu']" />
    </div>

    <el-table v-loading="loading" :data="filteredPermissions" class="data-table" row-key="permissionId">
      <el-table-column prop="code" label="权限编码" min-width="180" />
      <el-table-column prop="name" label="权限名称" min-width="160" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="httpMethod" label="方法" width="110" />
      <el-table-column prop="route" label="接口/菜单路径" min-width="240" />
      <el-table-column prop="description" label="描述" min-width="240" />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { rbacApi } from '@/api/rbac'
import type { Permission } from '@/types/rbac'

const loading = ref(false)
const activeType = ref('全部')
const permissions = ref<Permission[]>([])

const filteredPermissions = computed(() => {
  if (activeType.value === '全部') {
    return permissions.value
  }

  return permissions.value.filter((item) => item.type === activeType.value)
})

onMounted(async () => {
  loading.value = true
  try {
    permissions.value = await rbacApi.permissions()
  } finally {
    loading.value = false
  }
})
</script>
