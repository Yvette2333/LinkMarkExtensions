// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
function contextMennsClick(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
}

var port ;


chrome.runtime.onInstalled.addListener(function () {

  // chrome.storage.eContent.onPageChanged.removeRules(undefined, function () {
  //   chrome.declaratsync.set({ color: '#3aa757' }, function () {
  //   console.log('The color is green.');
  // });

  // chrome.declarativiveContent.onPageChanged.addRules([{
  //     // 设置展示扩展程序的条件
  //     conditions: [new chrome.declarativeContent.PageStateMatcher({
  //       // pageUrl: {hostEquals: 'developer.chrome.com'},
  //       pageUrl: { urlContains: 'www.baidu.com' },
  //     })],
  //     // actions: [new chrome.declarativeContent.ShowbrowserAction()]
  //   }]);
  // });



  chrome.contextMenus.create({
    id: "01",
    title: "收藏选中文字",
    type: 'normal',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: "02",
    title: "收藏页面链接到Link Mark",
    type: 'normal',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: "03",
    title: "收藏图片到Link Mark",
    type: 'normal',
    contexts: ['image'],
  });
  chrome.contextMenus.create({
    id: "04",
    title: "收藏媒体到Link Mark",
    type: 'normal',
    contexts: ['video', 'audio'],
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
    sendResponse('我收到了你的消息！');
    chrome.browserAction.setIcon({
      path:{
        '16':'icons/start16_16.png',
        '32':'icons/start32_32.png',
        '48':'icons/start48_48.png',
        '128':'icons/start128_128.png',
      }
    },function(){
      console.log('收藏成功！')
     
    })
});

// 图标点击事件
chrome.browserAction.onClicked.addListener(function(){
  console.log('click browserAction')
  chrome.browserAction.setIcon({
    path:{
      '16':'icons/start16_16.png',
      '32':'icons/start32_32.png',
      '48':'icons/start48_48.png',
      '128':'icons/start128_128.png',
    }
  },function(){
    console.log('收藏成功！')
   
    chrome.runtime.sendMessage({
      method: 'showAlert'
    }, function(response) {});

  })
})

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.browserAction.setPopup({
    tabId:tabs[0].id,
    popup:"view/popup.html"
  }, function(){
   console.log('popup setting success')
  })
}); 



//菜单点击事件
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
  const {selectionText} = info;
  const { title, url, favIconUrl } = tab;
  fetch("http://192.168.1.6:8088/linkmark/insertBookMark",{
    method:"POST",
    headers: new Headers({
    'Content-Type': 'application/json'
    }),
    // mode: 'no-cors',
    body:JSON.stringify({
      title, pageUrl:url, selectionText,favIconUrl
      // title:"yuwei2333", pageUrl:"yuwei2333", selectionText:"yuwei2333",favIconUrl:"yuwei2333"
    })
  }).then((res)=>res.json()).then((data)=>console.log(data))

}) 

// 新增Tab
chrome.tabs.onCreated.addListener((tab) => {
  console.log('create Tab:',tab)
})
// tab切换的时候
chrome.tabs.onActivated.addListener(function(activeInfo){
  console.log("change Tab:",activeInfo)
})