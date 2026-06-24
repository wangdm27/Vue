<template>
  <section class="page-stack">
    <div class="page-toolbar">
      <div>
        <h2>审计日志</h2>
        <p>查看系统中各类实体的操作审计记录。</p>
      </div>
      <el-button :icon="RefreshCw" @click="loadLogs">刷新</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="queryParams.entityType" placeholder="实体类型" clearable style="width: 150px" @clear="loadLogs" />
      <el-input v-model="queryParams.action" placeholder="操作类型" clearable style="width: 150px" @clear="loadLogs" />
      <el-date-picker
        v-model="timeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DDTHH:mm:ss"
        style="width: 360px"
      />
      <el-button type="primary" @click="loadLogs">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="pagedLogs.items" class="data-table" row-key="auditLogId">
      <el-table-column prop="entityType" label="实体类型" min-width="130" />
      <el-table-column prop="entityId" label="实体ID" min-width="150" />
      <el-table-column prop="action" label="操作" width="120" />
      <el-table-column prop="performedBy" label="操作人" min-width="130" />
      <el-table-column prop="performedAt" label="操作时间" min-width="180" />
      <el-table-column prop="changes" label="变更详情" min-width="260" show-overflow-tooltip />
    </el-table>

    <div class="pagination-bar" v-if="pagedLogs.totalCount > 0">
      <el-pagination
        v-model:current-page="queryParams.pageIndex"
        v-model:page-size="queryParams.pageSize"
        :total="pagedLogs.totalCount"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { auditApi } from '@/api/audit'
import type { AuditLogItem, AuditLogQuery, PagedResult } from '@/types/rbac'

const pagedLogs = ref<PagedResult<AuditLogItem>>({ items: [], pageIndex: 1, pageSize: 20, totalCount: 0, totalPages: 0 })
const loading = ref(false)
const timeRange = ref<[string, string] | null>(null)

const queryParams = reactive<AuditLogQuery>({
  entityType: '',
  action: '',
  startTime: undefined,
  endTime: undefined,
  pageIndex: 1,
  pageSize: 20,
})

watch(timeRange, (val) => {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }
})

onMounted(loadLogs)

async function loadLogs() {
  loading.value = true
  try {
    pagedLogs.value = await auditApi.list(queryParams)
  } finally {
    loading.value = false
  }
}
</script>
