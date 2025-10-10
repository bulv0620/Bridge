import { ref, Ref, toRaw, watch } from 'vue'
import { v4 as uuid } from 'uuid'

/**
 * Vue 端使用远程响应值（双向绑定）
 */
export function useRemoteRef<T>(channel: string, initialValue: T): Ref<T> {
  const remote = window.remoteRef.useRemoteRef(channel, initialValue)
  const state = ref(remote.value) as Ref<T>

  const pending = new Set<string>()

  remote.onUpdate((payload) => {
    if (payload.txnId && pending.has(payload.txnId)) {
      pending.delete(payload.txnId)
    } else {
      state.value = payload.value
    }
  })

  watch(
    state,
    (val) => {
      const txnId = uuid()
      pending.add(txnId)
      window.remoteRef.updateRemoteRef(channel, {
        value: toRaw(val),
        txnId,
      })
    },
    { deep: true },
  )

  return state
}
