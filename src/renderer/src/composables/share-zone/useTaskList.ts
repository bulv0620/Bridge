import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { computed, ref } from 'vue'

const activeTab = ref(0)

const uploadingList = ref<any[]>([])
const receivingList = useRemoteRef('receiving-list', [])
const receivedList = useRemoteRef('received-list', [])

const tabs = computed(() => {
  return [
    {
      id: 0,
      name: '发送中',
      num: uploadingList.value.length,
    },
    {
      id: 1,
      name: '接收中',
      num: receivingList.value.length,
    },
    {
      id: 2,
      name: '已完成',
      num: receivedList.value.length,
    },
  ]
})

export function useTaskList() {
  return {
    activeTab,
    tabs,
    uploadingList,
    receivingList,
    receivedList,
  }
}
