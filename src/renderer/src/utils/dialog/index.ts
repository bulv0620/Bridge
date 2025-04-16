import { DialogOptions, DialogReactive } from 'naive-ui'

export function dialogPromise(
  dialog: (options: DialogOptions) => DialogReactive,
  options: DialogOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    dialog({
      ...options,
      onPositiveClick: () => {
        resolve()
      },
      onNegativeClick: () => {
        reject()
      },
    })
  })
}
