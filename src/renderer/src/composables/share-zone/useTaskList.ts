import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { i18n } from '@renderer/locales'
import { computed, ref } from 'vue'

const { t } = i18n.global

const activeTab = ref(0)

const sendingList = ref<any[]>([])
const receivingList = useRemoteRef('receiving-list', [])
const receivedList = useRemoteRef('received-list', [])

const tabs = computed(() => {
  return [
    {
      id: 0,
      name: t('views.sharedZone.sending'),
      num: sendingList.value.length,
    },
    {
      id: 1,
      name: t('views.sharedZone.receiving'),
      num: receivingList.value.length,
    },
    {
      id: 2,
      name: t('views.sharedZone.received'),
      num: receivedList.value.length,
    },
  ]
})

export function useTaskList() {
  return {
    activeTab,
    tabs,
    sendingList,
    receivingList,
    receivedList,
  }
}
