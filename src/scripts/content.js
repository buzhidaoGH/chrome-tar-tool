// 不支持Module,原始页面共享DOM，但是不共享JS,使用jQuery可以自行引入
let timerId // 定时器id
let textContent // 选中文本内容
let selectObj // 选择文本对象
let url = chrome.runtime.getURL("/display.html")
let backLogo = chrome.runtime.getURL("/assets/icons/tar_logo.png")

// 页面添加监听background或者其他发送到此tab的接收消息
chrome.runtime.onMessage.addListener(function (result, sender, sendResponse) {
  if (result.id === "requestTranslate") {
    handleHandlerResult(result.result)// 处理翻译结果
    handleShowPanel(selectObj) // 处理panelShow面板
  }
  sendResponse()
})

// 自定义的dom根元素
let $root_dom = $(`<div style="all: initial;"><div id="__tar_dom__" style="all: initial;"></div></div>`)
let $tar_dom = $root_dom.find("#__tar_dom__")
// 创建shadowRoot的DOM对象
let shadowRoot = $tar_dom[0].attachShadow({ mode: 'open' })
// 将外部html内容添加到shadowRoot中
$.ajax(url, {
  async: false,
  success(data) {
    shadowRoot.innerHTML = data.replace('/assets/icons/tar_logo.png', backLogo)
  },
  error(data) {
    console.error(data)
  }
})

// shadowRoot对象包装为jQuery对象
let $shadowRoot = $("#root", shadowRoot)
let $translateBtn = $shadowRoot.find("#translateBtn")
let $panelContent = $shadowRoot.find("#panelContent")
let nowScroll = $(window).scrollTop() // 监听当前页面的位置
let $panelToolClose = $panelContent.find("#panelTool>div")
let $sourceLanguage = $shadowRoot.find("#sourceLanguage") // 原文
let $alphabetic = $shadowRoot.find("#alphabetic") // 拼音
let $targetLanguage = $shadowRoot.find("#targetLanguage") // 译文
let $peripheralResults = $shadowRoot.find("#peripheralResults") // 联想
let $popLayer = $shadowRoot.find('#popLayer')
let $readAloud = $shadowRoot.find(".read-aloud")
let translateBtnPosition = { left: 0, top: 0 }
// 使用jQuery核心挂载自定义DOM元素到tabs页面内
$(() => {
  let $body = $("body")

  // 双击选择文字
  $body.dblclick((event) => {
    let mousePos = getMousePos(event)
    if (isSelectText()) {
      selectObj = window.getSelection().getRangeAt(0)
      translateHandler(mousePos)
    }
  })

  // 滑动选择文字
  $body.mousedown((event) => {
    let beforePos = getMousePos(event)
    $body.mouseup((event) => {
      $body.unbind("mouseup")
      let afterPos = getMousePos(event)
      if (beforePos.posX === afterPos.posX && beforePos.posY === afterPos.posY) return
      if (isSelectText()) {
        selectObj = window.getSelection().getRangeAt(0)
        translateHandler(afterPos)
      }
    })
  })

  // 取消选择文字和关闭页面;在范围外
  $body.bind('click', (event) => {
    let target = $(event.target)
    if (!isSelectText()) {
      if (target.closest("#translateBtn", shadowRoot).length === 0) {
        $translateBtn.removeClass('show')
        $translateBtn.removeAttr('style')
      }
      if (target.closest("#panelContent", shadowRoot).length === 0) {
        panelContentClose()
      }
    }
  })

  // body对象同级追加自定义dom元素
  $body.after($root_dom)

  // 监听页面滚动事件
  $(window).bind("scroll", function () {
    let oldScroll = nowScroll
    nowScroll = $(window).scrollTop()
    let top = parseFloat($panelContent.css('top'))
    top = top + (oldScroll - nowScroll)
    $panelContent.css('top', top)
    if (selectObj) revisePanelContent(selectObj.getBoundingClientRect())// 执行修正函数
  })

  // 注册 $translateBtn 的点击事件,发送消息给background
  $translateBtn.click((event) => {
    $translateBtn.removeClass('show')
    $translateBtn.removeAttr('style')
    chrome.runtime.sendMessage({ id: "requestTranslate", text: textContent })
    event.stopPropagation()
  })

  // 面板X关闭按钮点击
  $panelToolClose.click(() => {
    panelContentClose()
  })

  $readAloud.click(function () {
    let text = $(this).prev('span').text()
    chrome.runtime.sendMessage({ id: "readAloud", text: text })
  })

  // 原文点击事件
  $sourceLanguage.click(function () {
    selectMyText($sourceLanguage[0])
    document.execCommand("copy")//执行复制操作
    $popLayer.addClass('show')
    setTimeout(function () {
      $popLayer.removeClass('show')
    }, 1500)
  })
  // 译文点击事件
  $targetLanguage.click(function () {
    selectMyText($targetLanguage[0])
    document.execCommand("copy")//执行复制操作
    $popLayer.addClass('show')
    setTimeout(function () {
      $popLayer.removeClass('show')
    }, 1500)
  })
})

/**
 * 被复制文字范围
 */
function selectMyText(text) {
  let selection = window.getSelection()
  let range = document.createRange()
  range.selectNodeContents(text)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * $panelContent关闭函数
 */
function panelContentClose() {
  $panelContent.removeClass('show')
  $panelContent.removeAttr('style')
}

/**
 * $panelContent偏移修正函数
 */
function revisePanelContent(coordinate) {
  let position = $panelContent.position()
  // 解决偏移量导致position页面闪烁bug
  let splitElement = $panelContent.css("transform").replace(/[^0-9\-,]/g, '').split(',')[5]
  if (splitElement) {
    splitElement = parseFloat(splitElement)
  } else {
    splitElement = 0
  }
  if (position.top > (window.innerHeight / 2) + splitElement) {
    let offsetHeight = $panelContent.height() + coordinate.height + 5
    $panelContent.css("transform", "translate(0px,-" + offsetHeight + "px)")
  } else {
    $panelContent.css("transform", '')
  }
}

/**
 * 处理选中文本的对象,获取中点位置
 */
function handleShowPanel(selectTextObj) {
  let coordinate = selectTextObj.getBoundingClientRect()
  if (coordinate.left === 0 && coordinate.top === 0) {
    Object.defineProperty(coordinate, 'left', { value: translateBtnPosition.left })
    Object.defineProperty(coordinate, 'top', { value: translateBtnPosition.top })
  }
  console.log(coordinate)
  let width = $panelContent.width() / 2
  $panelContent.addClass('show')
  let left = coordinate.left + coordinate.width / 2 - width
  let top = coordinate.top + coordinate.height
  $panelContent.css({ left: left, top: top })
  revisePanelContent(coordinate) //修正函数
}

/**
 * 翻译处理操作函数
 */
function translateHandler(mousePos) {
  clearTimeout(timerId)
  $translateBtn.addClass('show')
  $translateBtn.css({ "left": mousePos.posX + 5, "top": mousePos.posY + 10 })
  translateBtnPosition.left = parseFloat($translateBtn.css("left"))
  translateBtnPosition.top = parseFloat($translateBtn.css("top"))
  timerId = setTimeout(function () {
    $translateBtn.removeClass('show')
    $translateBtn.removeAttr('style')
  }, 2000)
}

/**
 * 获取当前鼠标相对于窗口的位置
 */
function getMousePos(event) {
  return { "posX": event.pageX, "posY": event.pageY }
}

/**
 * 判断当前选中了文字
 */
function isSelectText() {
  let text = document.selection ? document.selection.createRange().text : window.getSelection().toString()
  textContent = text.replace(/\n/g, '')
  return !!text
}

/**
 * 处理翻译的结果,并渲染至页面
 */
function handleHandlerResult(result) {
  $sourceLanguage.html(result.source_language)
  if (result.src_language === "en") {
    $alphabetic.html(pinyinUtil.getPinyin(result.target_language))
  } else {
    $alphabetic.html(pinyinUtil.getPinyin(result.source_language))
  }
  $targetLanguage.html(result.target_language)
  if (result.peripheral_results.length > 1) {
    $peripheralResults.text(result.peripheral_results.slice(1))
  } else {
    $peripheralResults.text("无")
  }
}