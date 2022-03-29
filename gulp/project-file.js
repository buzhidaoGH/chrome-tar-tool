const fs = require('fs')
const join = require('path').join
const extname = require('path').extname
const dirname = require('path').dirname

const minimist = require('minimist')
let argv = minimist(process.argv.slice(2), {
  string: ['root', 'env', 'dist'],
  default: {
    root: 'src',
    env: 'dev',
    dist: 'dist',
  },
})
// const resolve = require('path').resolve;
// let workPath = resolve('src') // 工作绝对目录,下的src;
// 默认相对目录都是相对于工作根目录
function getJsonFiles(jsonPath) {
  let jsonFiles = {
    // 存储文件
    js: [],
    css: [],
    html: [],
    other: [],
    env: argv.env,
    root: argv.root,
    dist: argv.dist,
  }

  function findJsonFile(path) {
    let files
    try {
      files = fs.readdirSync(path)
    } catch (e) {
      console.log(e.message)
      return
    }
    files.forEach(function (item, index) {
      let fPath = join(path, item)
      let stat = fs.statSync(fPath)
      if (stat.isDirectory() === true) {
        findJsonFile(fPath)
      }
      if (stat.isFile() === true) {
        let pathObj = {
          path: fPath.replace(/\\/g, '/'),
          dir: dirname(fPath).replace(argv.root,argv.dist).replace(/\\/g, '/'),
        }
        switch (extname(fPath)) {
          case '.html':
            jsonFiles.html.push(pathObj)
            break
          case '.css':
            jsonFiles.css.push(pathObj)
            break
          case '.js':
            jsonFiles.js.push(pathObj)
            break
          default:
            jsonFiles.other.push(pathObj)
            break
        }
      }
    })
  }
  findJsonFile(jsonPath)
  return jsonFiles
}
module.exports = getJsonFiles(join('../', argv.root))
