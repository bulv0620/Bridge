import { ref } from 'vue'

const isSidebarCollapsed = ref(false)

export function useSidebarCollapse() {
  return {
    isSidebarCollapsed,
  }
}
