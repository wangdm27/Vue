import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const authStore = useAuthStore()

    if (!authStore.hasPermission(binding.value)) {
      el.parentElement?.removeChild(el)
    }
  },
}
