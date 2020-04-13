// const API = 'http://47.75.5.189/api/'
const API = 'https://withpinbox.com/api/'

// const homeUrl = 'http://47.75.5.189'
const homeUrl = 'https://withpinbox.com'

var activeTabId
var port
var alpha_info
var websiteInfo
var tabObj
var tipMsg
var preUrl = {}
var shortcut = null
var newtabState = false
var linkSeach = true
var contextMenusState = true

var objectPage = {
    type: 'normal',
    title: "收藏该网页到 Pinbox",
    checked: false,
    contexts: ["page"],
    onclick: (data, tab) => {
        addUrl(tab, tab.url, 'website')
    }
}

var objectImage = {
    type: 'normal',
    title: "收藏该图片到 Pinbox",
    checked: false,
    contexts: ["image"],
    onclick: (data, tab) => {
        addUrl(tab, data.srcUrl, 'img')
    }
}

var objectSelect = {
    type: 'normal',
    title: "收藏选中文字到 Pinbox",
    checked: false,
    contexts: ["selection"],
    onclick: (data, tab) => {
        addUrl(tab, data, 'text')
    }
}

var updateShortcut = {
    type: 'normal',
    title: "同步快捷键",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        getShortcut(true)
    }
}

var explore = {
    type: 'normal',
    title: "发现",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        chrome.tabs.create({
            url: homeUrl + '/explore'
        })
    }
}

var pinboxItem = {
    type: 'normal',
    title: "我的收藏",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        chrome.tabs.create({
            url: homeUrl + '/items'
        })
    }
}


var callback = () => {
    console.log('success')
}
var page = chrome.contextMenus.create(objectPage, callback)
var image = chrome.contextMenus.create(objectImage, callback)
var select = chrome.contextMenus.create(objectSelect, callback)
chrome.contextMenus.create(pinboxItem, callback)
chrome.contextMenus.create(explore, callback)
chrome.contextMenus.create(updateShortcut, callback)

var tool = {
    type: 'normal',
    title: "工具",
    checked: false,
    contexts: ["browser_action"],
}

var toolId = chrome.contextMenus.create(tool, callback)

var qr = {
    type: 'normal',
    title: "二维码生成",
    checked: false,
    contexts: ["browser_action"],
    parentId: toolId,
    onclick: () => {
        chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
            if (!res) {
                chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                    setTimeout(() => {
                        chrome.tabs.get(activeTabId, (tab) => {
                            port.postMessage({
                                type: 'qrcode',
                                data: tab.url
                            })
                        })
                    }, 100)
                })
            } else {
                chrome.tabs.get(activeTabId, (tab) => {
                    port.postMessage({
                        type: 'qrcode',
                        data: tab.url
                    })
                })
            }
        })
    }
}

var toolId = chrome.contextMenus.create(qr, callback)

var details = {
    url: homeUrl,
    name: 'alpha_info'
}

// 获取整个书签树
// chrome.bookmarks.getTree((results) => {
//     console.log(JSON.stringify(results));
// })

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

chrome.runtime.onMessage.addListener((request, sender,sendResponse) => {
    chrome.tabs.sendMessage(activeTabId, request)
})

// 安装时获取快捷键
getShortcut()


chrome.browserAction.onClicked.addListener((tab) => {
    addUrl(tab, tab.url, 'website')
})

chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url.match(/withpinbox.com/)) {
        chrome.tabs.move(tab.id, {
            index: 1000
        }, (t) => {
            console.log(t)
        })
    }
    if (newtabState) {
        if (tab.url.match(/^chrome:\/\/newtab/)) {
            chrome.tabs.update({
                url: 'newtab/index.html'
            })
        }
    }
})


chrome.runtime.onConnect.addListener(function(port) {
    port = port
    window.port = port
    port.onDisconnect.addListener(function() {
        port = null
        window.port = null
    })
    port.onMessage.addListener(function(msg) {
        if (msg.type === 'getcollect') {
            axios.get(API + 'user/' + alpha_info.uid + '/collection?token=' + alpha_info.token + '&order=name&sort=asc')
            .then(res => {
                chrome.storage.sync.get('recentList', (result) => {
                    port.postMessage({
                        type: 'collect',
                        data: res.data,
                        recentList: result.recentList
                    })
                })
            })
        } else if (msg.type === 'movecollect') {
            axios.put(API + 'user/' + alpha_info.uid + '/store/' + websiteInfo.id, {collectionId: msg.id}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                port.postMessage({
                    type: 'showMsg',
                    name: msg.name,
                    id: msg.id,
                })
            })
        } else if (msg.type == 'addcollect') {
            axios.post(API + 'user/' + alpha_info.uid + '/collection', {name: msg.name}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                axios.put(API + 'user/' + alpha_info.uid + '/store/' + websiteInfo.id, {collectionId: res.data.id}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                .then(data => {
                    port.postMessage({
                        type: 'showMsg',
                        name: res.data.name,
                        id: res.data.id,
                    })
                })
            })
            .catch(err => {
                if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
                    if (err.response.data.feature == 'Number of collections.') {
                        port.postMessage({
                            type: 'vipLimit',
                            data: '您的收藏集个数已达上限，创建更多需要升级成为专业版'
                        })
                    }
                } 
            })
        } else if (msg.type === 'delcollect') {
            let query = '?storeIds[]=' + [websiteInfo.id]
            axios.delete(API + `user/${alpha_info.uid}/store${query}`, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                port.postMessage({
                    type: 'tips',
                    data: '已删除'
                })
            })

        } else if (msg.type === 'editTitle') {
            axios.put(API + `user/${alpha_info.uid}/store/${websiteInfo.id}`, {brief: msg.title}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {

            })
        } else if (msg.type === 'editDes') {
            axios.put(API + `user/${alpha_info.uid}/store/${websiteInfo.id}`, {note: msg.des}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {

            })
        } else if (msg.type === 'fresh') {
            port.postMessage({
                type: 'getShortcut',
                data: shortcut
            })
            chrome.browserAction.setIcon({
                path: './img/logo.png'
            })
            let url
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs && tabs[0]) {
                    url = tabs[0].url
                    if (preUrl[url]) {
                        delete preUrl[url]
                    }
                }
            })
        } else if (msg.type === 'getTabObj') {
            port.postMessage({
                type: 'tabObj',
                data: tabObj
            })
        } else if (msg.type === 'getTipMsg') {
            port.postMessage({
                type: 'tipMsg',
                data: tipMsg
            })
        } else if (msg.type === 'collect') {
            chrome.tabs.query({
                active: true
            }, (tab) => {
                addUrl(tab[0], tab[0].url, 'website')
            })
        } else if (msg.type === 'getShortcut') {
            port.postMessage({
                type: 'getShortcut',
                data: shortcut
            })
        } else if (msg.type === 'requestShortcut') {
            getShortcut()
        } else if (msg.type === 'creatTab') {
            if (msg.item && msg.item.type == 'toPricing') {
                chrome.tabs.create({
                    url: homeUrl + '/pricing'
                })
            } else if (msg.item && msg.item.type == 'toItems') {
                chrome.tabs.create({
                    url: homeUrl + msg.item.path
                })
            } else {
                chrome.tabs.create({
                    url: msg.item.link || msg.item.url
                })
                if (msg.item.id != undefined) {
                    addView(msg.item.id)
                }
            }
        } else if (msg.type === 'setNewtab') {
            newtabState = msg.newtabState
        } else if (msg.type === 'setContextMenus') {
            contextMenusState = msg.contextMenusState
            if (msg.contextMenusState) {
                page = chrome.contextMenus.create(objectPage, callback)
                image = chrome.contextMenus.create(objectImage, callback)
                select = chrome.contextMenus.create(objectSelect, callback)
            } else {
                chrome.contextMenus.remove(page)
                chrome.contextMenus.remove(image)
                chrome.contextMenus.remove(select)
            }
        } else if (msg.type === 'setLinkSeach') {
            linkSeach = msg.linkSeach
            port.postMessage({
                type: 'linkSeachChanged',
                data: linkSeach
            })
        } else if (msg.type === 'getLinkSearch') {
            port.postMessage({
                type: 'getLinkSearchRes',
                data: linkSeach,
                contextMenusState: contextMenusState
            })
        } else if (msg.type == 'setRecent') {
            chrome.storage.sync.set({'recentList': msg.value})
        } else if (msg.type == 'search') {
            search(msg)
        }
    })
})

//当窗口选中的标签改变时，此事件触发
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.sendMessage(activeInfo.tabId, {
        type: "getShortcut",
        data: window.shortcut
    })

    if (activeTabId != undefined) {
        chrome.tabs.sendMessage(activeTabId, {
            type: "unloadIframe",
        })
    }
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (tab.url === preUrl[tab.url]) {
            chrome.browserAction.setIcon({
                path: './img/logoed.png'
            })
        } else {
            chrome.browserAction.setIcon({
                path: './img/logo.png'
            })
        }
    })
    activeTabId = activeInfo.tabId
})
 
function search (msg) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            if (checkToken() && msg.value && linkSeach) {
                axios.get(API + 'user/' + alpha_info.uid + '/search/store?count=6&keyword=' + msg.value, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                .then(res => {
                    port.postMessage({
                        type: 'search',
                        data: res.data,
                        key: msg.key
                    })
                })
            }
        }
    })
}

function checkToken () {
    let token = alpha_info.token
    if (token) {
        let exp = JSON.parse(window.atob(token.split('.')[1])).exp
        let timestamp=new Date().getTime()
        if (exp * 1000 < timestamp) {
            return false
        } else {
            return true
        }
    } else {
        return false
    }
}

// 获取快捷键
function getShortcut(sync) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            if (sync) {
                chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
                    if (!res) {
                        chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                            setTimeout(() => {
                                port.postMessage({
                                    type: 'tips',
                                    data: '正在同步中...'
                                })
                            }, 100)
                        })
                    } else {
                        port.postMessage({
                            type: 'tips',
                            data: '正在同步中...'
                        })
                    }
                })
            }
            axios.get(API + 'user/' + alpha_info.uid + '/shortcut', {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                shortcut = {}
                res.data.data.forEach(item => {
                    if (shortcut[item.shortcut_key]) {
                        shortcut[item.shortcut_key].push(item)
                    } else {
                        shortcut[item.shortcut_key] = [item]
                    }
                })
                window.shortcut = shortcut
                chrome.storage.sync.set({'shortcut': JSON.stringify(shortcut)})
                if (activeTabId != undefined) {
                    chrome.tabs.sendMessage(activeTabId, {
                        type: "getShortcut",
                        data: shortcut
                    })
                }
                if (sync) {
                    setTimeout(() => {
                        port.postMessage({
                            type: 'tips',
                            data: '同步已完成'
                        })
                    }, 600)
                    
                }
            })
            .catch(err => {
                if (sync) {
                    setTimeout(() => {
                        port.postMessage({
                            type: 'tips',
                            data: '同步已完成'
                        })
                    }, 600)
                }
                window.shortcut = null
                chrome.storage.sync.get('shortcut', (result) => {
                    if (result.shortcut) {
                        window.shortcut = JSON.parse(result.shortcut)
                    }
                    if (activeTabId != undefined) {
                        chrome.tabs.sendMessage(activeTabId, {
                            type: "getShortcut",
                            data: null
                        })
                    }
                })
            })
        } else {
            if (sync) {
                setTimeout(() => {
                    port.postMessage({
                        type: 'saveFail',
                        data: '同步快捷键失败，账号未登录'
                    })
                }, 600)
            }
            window.shortcut = null
            if (activeTabId != undefined) {
                chrome.tabs.sendMessage(activeTabId, {
                    type: "getShortcut",
                    data: null
                })
            }
        }
    })
}

// 增加浏览量
function addView(id) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            axios.post(API + 'user/' + alpha_info.uid + '/store/' + id + '/view', {}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {})
            .catch(err => {})
        }
    })
}

function addWebsite(tab, url, type) {
    tabObj = {title: '网站标题', content: tab.title}
    var data = {url}
    if (tab.title) {
        data.title = tab.title
    }
    axios.post(API + 'user/' + alpha_info.uid + '/website', data, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        tabObj['des'] = res.data.note || res.data.description
        chrome.browserAction.setIcon({
            path: './img/logoed.png'
        })
        preUrl[url] = url
        preUrl.type = type
        port.postMessage({
            type: 'saved'
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，网站地址过长'
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addText(tab, url, type) {
    tabObj = {
        title: '文字内容',
        content: url.selectionText
    }
    axios.post(API + 'user/' + alpha_info.uid + '/text', {content: url.selectionText, url: tab.url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        preUrl[url] = tab.url
        preUrl.type = type
        port.postMessage({
            type: 'saved'
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，文本来源网站地址过长'
                    })
                } else if (data.errors.content && data.errors.content[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，文本内容过长，建议收藏网站'
                    })
                } else {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，请重试, 错误码: ' + err.response.status
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addIamge(tab, url, type) {
    tabObj = {
        title: '图片链接',
        content: url
    }
    axios.post(API + 'user/' + alpha_info.uid + '/image', {imageUrl: url, url: tab.url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        preUrl[url] = tab.url
        preUrl.type = type
        port.postMessage({
            type: 'saved'
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，图片来源网站地址过长'
                    })
                } else if (data.errors.imageUrl && data.errors.imageUrl[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，图片地址过长，建议收藏网站'
                    })
                } else {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，请重试, 错误码: ' + err.response.status
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addUrl(tab, url, type) {
    chrome.cookies.get(details, (cookies) => {
        if (!cookies) {
            // 未登录状态跳转到注册页面
            chrome.tabs.create({
                url: homeUrl + '/signup'
            })
        } else {
            if (type === 'website') {
                if (url === preUrl[url]) return
            }
            // 相同网页不刷新情况下只能收藏一次
            alpha_info = JSON.parse(cookies.value)
            // 检测是否解析出 alpha_info
            if (alpha_info) {
                // 判断是否存在 uid
                if (alpha_info.uid) {
                    var token = alpha_info.token
                    // 判断是否存在 token
                    if (token) {
                        var exp = JSON.parse(window.atob(token.split('.')[1])).exp
                        var timestamp = new Date().getTime()
                        // 判断 token 是否过期
                        if (exp * 1000 < timestamp) {
                            chrome.tabs.create({
                                url: homeUrl + '/login'
                            })
                            return
                        }
                    } else {
                        chrome.tabs.create({
                            url: homeUrl + '/login'
                        })
                        return
                    }
                } else {
                    chrome.tabs.create({
                        url: homeUrl + '/login'
                    })
                    return
                }
            } else {
                chrome.tabs.create({
                    url: homeUrl + '/login'
                })
                return
            }
            chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
                if (!res) {
                    chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                        let portTimer = setInterval(() => {
                            if (port) {
                                clearInterval(portTimer)
                                port.postMessage({
                                    type: 'saving'
                                })
                                if (type === 'website') {
                                    addWebsite(tab, url, type)
                                } else if (type === 'text') {
                                    addText(tab, url, type)
                                } else if (type === 'img') {
                                    addIamge(tab, url, type)
                                }
                            }
                            
                        }, 100)
                    })
                } else {
                    port.postMessage({
                        type: 'saving'
                    })
                    if (type === 'website') {
                        addWebsite(tab, url, type)
                    } else if (type === 'text') {
                        addText(tab, url, type)
                    } else if (type === 'img') {
                        addIamge(tab, url, type)
                    }
                }
            })
        }
    })
}
