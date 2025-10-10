import { ref, Ref, watch } from 'vue'

/**
 * Vue 端使用远程响应值（双向绑定）
 */
export function useRemoteRef<T>(channel: string, initialValue: T): Ref<T> {
  const remote = window.remoteRef.useRemoteRef(channel, initialValue)
  const state = ref(remote.value) as Ref<T>

  remote.onUpdate((v) => {
    state.value = v
  })

  watch(
    state,
    (v) => {
      window.remoteRef.updateRemoteRef(channel, v)
    },
    { deep: true },
  )

  return state
}
