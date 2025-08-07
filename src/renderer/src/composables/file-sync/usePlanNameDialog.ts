import { NForm } from 'naive-ui'
import { ref } from 'vue'

const visible = ref(false)

const form = ref({
  planName: '',
})
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const savedPlanNameList = ref<string[]>([])
const inputRef = ref<HTMLElement | null>(null)
const resolveRef = ref<((value: any) => void) | null>(null)

function openPlanNameDialog(defaultName: string, planNameList: string[]) {
  return new Promise<any>((resolve) => {
    form.value.planName = defaultName
    savedPlanNameList.value = planNameList
    visible.value = true
    resolveRef.value = resolve
  })
}

async function confirmPlanName() {
  if (!form.value.planName) {
    return
  }

  await formRef.value?.validate()

  if (resolveRef.value) {
    resolveRef.value(form.value.planName)
    resolveRef.value = null
  }
  visible.value = false
}

function closeDialog() {
  if (resolveRef.value) {
    resolveRef.value(null)
    resolveRef.value = null
  }
  visible.value = false
}

export function usePlanNameDialog() {
  return {
    visible,
    form,
    formRef,
    savedPlanNameList,
    inputRef,
    openPlanNameDialog,
    confirmPlanName,
    closeDialog,
  }
}
