import { FormItemRule, NForm, NInput } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const inputRef = ref<InstanceType<typeof NInput> | null>(null)
const formRef = ref<InstanceType<typeof NForm> | null>(null)

const loading = ref(false)
const visible = ref(false)
const resolveRef = ref<((value: string) => void) | null>(null)
const form = ref({
  nameText: '',
})

export function useFolderNameDialog() {
  const { t } = useI18n()

  const rules = computed(() => ({
    nameText: [
      {
        required: true,
        validator(_: FormItemRule, value: string) {
          if (!value) {
            return new Error(t('views.ftpClient.folderNameRequired'))
          }
          return true
        },
        trigger: ['input', 'blur'],
      },
    ],
  }))

  function openFolderNameDialog() {
    visible.value = true
    form.value.nameText = ''

    nextTick(() => {
      inputRef.value?.focus()
    })

    return new Promise<string>((resolve) => {
      resolveRef.value = resolve
    })
  }

  async function confirmFolderName() {
    if (!form.value.nameText) {
      return
    }

    await formRef.value?.validate()

    resolveRef.value?.(form.value.nameText)
    visible.value = false
  }

  function closeDialog() {
    visible.value = false
    resolveRef.value?.('')
  }

  return {
    inputRef,
    formRef,
    loading,
    visible,
    resolveRef,
    form,
    rules,
    openFolderNameDialog,
    confirmFolderName,
    closeDialog,
  }
}
