import { VxeUI, VxeLoading, VxeIcon } from 'vxe-pc-ui'
import { VxeTable, VxeColumn, VxeColgroup, VxeGrid, VxeToolbar } from 'vxe-table'

import 'vxe-pc-ui/styles/cssvar.scss'
import 'vxe-table/styles/cssvar.scss'

import zhCN from 'vxe-pc-ui/lib/language/zh-CN'
import enUs from 'vxe-pc-ui/lib/language/en-US'

VxeUI.component(VxeLoading)
VxeUI.component(VxeIcon)

VxeUI.component(VxeTable)
VxeUI.component(VxeColumn)
VxeUI.component(VxeColgroup)
VxeUI.component(VxeGrid)
VxeUI.component(VxeToolbar)

VxeUI.setI18n('zh-CN', zhCN)
VxeUI.setI18n('en-US', enUs)

VxeUI.setLanguage('en-US')
