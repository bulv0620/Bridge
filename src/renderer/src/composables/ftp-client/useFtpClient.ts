import { FtpFileSystem } from '@renderer/utils/file-system'
import { computed, ref } from 'vue'

// FTP 实例对象列表
const instanceList: FtpFileSystem[] = []

// 当前激活的实例名
const currentInstanceName = ref('')
// 所有实例名列表
const instanceNameList = ref<string[]>([])
// 实例名与浏览路径的映射表
const instancePathMap = ref(new Map())

// 当前激活的 FTP 实例对象
const currentInstance = computed(() => {
  return instanceList.find((instance) => instance.getName() === currentInstanceName.value)
})

// 当前激活实例的路径
const currentInstancePath = computed(() => {
  return instancePathMap.value.get(currentInstanceName.value)
})

function addFtpInstance(instance: FtpFileSystem) {
  instanceList.push(instance)
  instanceNameList.value.push(instance.getName())

  currentInstanceName.value = instance.getName()
  instancePathMap.value.set(instance.getName(), [''])
}

function removeFtpInstance(instanceName: string) {
  const instanceIndex = instanceList.findIndex((inst) => inst.getName() === instanceName)
  if (instanceIndex > -1) {
    const instance = instanceList[instanceIndex]

    instance.disconnect()
    instanceList.splice(instanceList.indexOf(instance), 1)
    instanceNameList.value.splice(instanceNameList.value.indexOf(instance.getName()), 1)

    // 如果当前实例被移除，则切换到下一个可用实例
    if (currentInstanceName.value === instanceName) {
      currentInstanceName.value =
        instanceNameList.value[Math.min(instanceIndex, instanceNameList.value.length - 1)] || ''
    }
  }
}

export const useFtpClient = () => {
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
