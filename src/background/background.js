import menuItemModule from '/module/menuItemModule.js'

let { translateItem, fetchMethod } = menuItemModule

chrome.contextMenus.removeAll()
chrome.contextMenus.create(translateItem)
chrome.contextMenus.onClicked.addListener(function (clickData, tab) {
  fetchMethod(clickData.selectionText, result => {
    chrome.tabs.sendMessage(tab.id, { id: "requestTranslate", result: result })
  })
})

// 监听 content_script 的消息发送请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.id === "requestTranslate") {
    fetchMethod(request.text, result => {
      chrome.tabs.sendMessage(sender.tab.id, { id: "requestTranslate", result: result })
    })
  }
  if (request.id === "readAloud") {
    chrome.tts.speak(request.text, {
      enqueue: false,
      gender: "female"
    })
  }
  sendResponse()
})