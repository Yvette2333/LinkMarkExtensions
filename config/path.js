const path = require('path')

const CURRENT_PATH = path.resolve(__dirname)
const ROOT_PATH = path.join(__dirname,'../')
// const MODULES_PATH = path.join(ROOT_PATH, '')
const BUILD_PATH = path.join(ROOT_PATH,'./build/src') // 打包路径 
const ENTRY_PATH = path.join(ROOT_PATH, './src/js') // webpack 入口文件
module.exports = {
    ROOT_PATH,
    BUILD_PATH,
    CURRENT_PATH,
    ENTRY_PATH
}