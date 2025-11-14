import { type Directive } from 'vue'

/** 可拖动dialog */
export const dialogDrag: Directive = {
  updated: (el: any) => {
    //获取弹框头部
    const dialogHeaderEl = el.querySelector('.el-dialog__header')
    if (!dialogHeaderEl) return
    //弹窗
    const dragDom = el.querySelector('.el-dialog')
    //给弹窗加上overflow auto；不然缩小时框内的标签可能超出dialog；
    dragDom.style.overflow = 'auto'
    //清除选择头部文字效果
    // dialogHeaderEl.onselectstart = new Function('return false')
    //头部加上可拖动cursor
    dialogHeaderEl.style.cursor = 'move'

    // 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
    const sty = dragDom.currentStyle || window.getComputedStyle(dragDom, null)

    const moveDown = (e: any) => {
      dragDom.style.transition = '0s'
      // 鼠标按下，计算当前元素距离可视区的距离
      const disX = e.clientX - dialogHeaderEl.offsetLeft
      const disY = e.clientY - dialogHeaderEl.offsetTop

      // 获取到的值带px 正则匹配替换
      let styL = 0
      let styT = 0

      // 注意在ie中 第一次获取到的值为组件自带50% 移动之后赋值为px
      styL = +sty.left.replace(/px/g, '')
      styT = +sty.top.replace(/px/g, '')
      const styMt = +sty.marginTop.replace(/px/g, '')

      document.onmousemove = function (e) {
        // 通过事件委托，计算移动的距离
        const l = e.clientX - disX
        const t = e.clientY - disY

        console.log()

        const offsetW = -Math.ceil((window.innerWidth - dragDom.offsetWidth) / 2)
        const offsetH = -Math.ceil(styMt)

        const maxWidth = window.innerWidth - dragDom.offsetWidth + offsetW // 窗口最大宽度
        const maxHeight = window.innerHeight - dragDom.offsetHeight + offsetH // 窗口最大高度

        // 边界限制
        let left = l + styL
        let top = t + styT

        // 防止窗口移出屏幕右侧或下方边界
        left = Math.min(maxWidth, left)
        top = Math.min(maxHeight, top)

        // 防止窗口移出屏幕左侧或上方边界
        left = Math.max(offsetW, left)
        top = Math.max(offsetH, top)

        dragDom.style.left = `${left}px`
        dragDom.style.top = `${top}px`
      }

      document.onmouseup = function () {
        document.onmousemove = null
        document.onmouseup = null

        dragDom.style.transition = '.1s'
      }
    }
    dialogHeaderEl.onmousedown = moveDown
  },
}
