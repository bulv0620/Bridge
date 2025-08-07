<script setup lang="ts">
import { usePlanNameDialog } from '@renderer/composables/file-sync/usePlanNameDialog'
import { FormItemRule, NForm } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rules = {
  planName: [
    {
      required: true,
      validator(_: FormItemRule, value: string) {
        if (!value) {
          return new Error(t('views.fileSync.planNameRequired'))
        } else if (savedPlanNameList.value.includes(value)) {
          return new Error(t('views.fileSync.planNameDuplicate'))
        }
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
}

const { visible, form, formRef, savedPlanNameList, inputRef, confirmPlanName, closeDialog } =
  usePlanNameDialog()
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.fileSync.planName')"
    :on-after-leave="closeDialog"
  >
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item :show-label="false" path="planName">
        <n-input ref="inputRef" v-model:value="form.planName" />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" @click="confirmPlanName">
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">{{ t('common.cancel') }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
