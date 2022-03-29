let element = document.querySelector("#reload")
element.addEventListener('click',()=>{
  chrome.runtime.reload()
})