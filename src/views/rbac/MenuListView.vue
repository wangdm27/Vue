<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>菜单管理</h2>
        <p>展示当前用户可见菜单树，菜单可见性由菜单权限码控制。</p>
      </div>
      <el-button :icon="RefreshCw" @click="loadMenus">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="menus" class="data-table" row-key="menuId" default-expand-all>
      <el-table-column prop="name" label="菜单名称" min-width="180" />
      <el-table-column prop="code" label="菜单编码" min-width="150" />
      <el-table-column prop="path" label="路径" min-width="180" />
      <el-table-column prop="component" label="组件" min-width="180" />
      <el-table-column prop="permissionCode" label="权限码" min-width="160" />
      <el-table-column label="按钮" min-width="200">
        <template #default="{ row }">
          <el-tag v-for="btn in row.buttons" :key="btn.code" class="tag-gap" effect="plain" size="small">
            {{ btn.name }}
          </el-tag>
          <span v-if="!row.buttons?.length" class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default>
          <el-button v-permission="'role.assign_permissions'" text :icon="Pencil">编辑</el-button>
          <el-button v-permission="'role.assign_permissions'" text :icon="Settings">配置</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Pencil, RefreshCw, Settings } from 'lucide-vue-next'
import { rbacApi } from '@/api/rbac'
import type { MenuNode } from '@/types/rbac'

const menus = ref<MenuNode[]>([])
const loading = ref(false)

onMounted(loadMenus)

async function loadMenus() {
  loading.value = true
  try {
    menus.value = await rbacApi.currentMenus()
  } finally {
    loading.value = false
  }
}
</script>
