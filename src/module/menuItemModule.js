let menuTranslateItem = {
  id: 'translate', // 唯一标识符
  title: '使用谷歌翻译', // 菜单项文字
  contexts: ['selection'] // 监听类型,选中
}

/**
 * 包含中文
 * @returns {boolean}
 */
function isIncludeChn(str) {
  let reg = /.*[\u4e00-\u9fa5]+.*$/
  return reg.test(str)
}

// 发送fetch请求获取结果
function fetchTranslateRequest(
    params,
    callback = function (result) {
      console.log(result)
    }, sl = 'zh-CN', tl = 'en') {
  if (!isIncludeChn(params)) {
    sl = 'en'
    tl = 'zh-CN'
  }
  let urlStr = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${ sl }&tl=${ tl }&dj=1&dt=t&dt=at&q=${ params }`
  // 发起请求,并通过callback回调数据获取
  fetch(urlStr)
      .then((response) => response.text())
      .then((text) => JSON.parse(text))
      .then((translateResult) => {
        let source_language
        let target_language
        let peripheral_results
        if (translateResult.sentences.length > 1) {
          let tempSource = ''
          let tempTarget = ''
          for (let i = 0; i < translateResult.sentences.length; i++) {
            tempSource += (translateResult.sentences[i].orig + '<br/>')
            tempTarget += (translateResult.sentences[i].trans + '<br/>')
          }
          source_language = tempSource.replace(/(.*)<br\/>/,'$1');
          target_language = tempTarget.replace(/(.*)<br\/>/,'$1');
          peripheral_results = ['无']
        } else {
          source_language = translateResult.sentences[0].orig
          target_language = translateResult.sentences[0].trans
          peripheral_results = translateResult.alternative_translations[0].alternative.map(item => {
            return item.word_postproc
          })
        }
        callback({
          src_language: translateResult.src,
          source_language: source_language,
          target_language: target_language,
          peripheral_results: peripheral_results
        })
      })
}

export default {
  translateItem: menuTranslateItem,
  fetchMethod: fetchTranslateRequest
}
