import { FtpFileSystem } from '@renderer/utils/file-system'
import { computed, ref } from 'vue'

const instanceList: FtpFileSystem[] = []

const currentInstanceName = ref('')
const instanceNameList = ref<string[]>([])
const instancePathMap = ref(new Map())

const currentInstance = computed(() => {
  return instanceList.find((instance) => instance.getName() === currentInstanceName.value)
})

const currentInstancePath = computed(() => {
  return instancePathMap.value.get(currentInstanceName.value)
})

const addFtpInstance = (instance: FtpFileSystem) => {
  instanceList.push(instance)
  instanceNameList.value.push(instance.getName())

  currentInstanceName.value = instance.getName()
  instancePathMap.value.set(instance.getName(), [''])
}

const removeFtpInstance = (instanceName: string) => {
  const instanceIndex = instanceList.findIndex((inst) => inst.getName() === instanceName)
  if (instanceIndex > -1) {
    const instance = instanceList[instanceIndex]

    instance.disconnect()
    instanceList.splice(instanceList.indexOf(instance), 1)
    instanceNameList.value.splice(instanceNameList.value.indexOf(instance.getName()), 1)

    if (currentInstanceName.value === instanceName) {
      currentInstanceName.value =
        instanceNameList.value[Math.min(instanceIndex, instanceNameList.value.length - 1)] || ''
    }
  }
}

export const useFtp = () => {
  return {
    currentInstance,
    currentInstanceName,
    currentInstancePath,
    instanceNameList,
    instanceList,
    addFtpInstance,
    removeFtpInstance,
  }
}
