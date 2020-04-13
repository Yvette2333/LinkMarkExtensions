// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeTitle = document.getElementById('changeTitle');

$(()=>{
  console.log('5555')
})
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
  })
})

  // chrome.storage.sync.get('color', function(data) {
  //   changeColor.style.backgroundColor = data.color;
  //   changeColor.setAttribute('value', data.color);
  // });

  // 更换颜色
  // changeColor.onclick = function(element) {
  //   let color = element.target.value;
  //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //     chrome.tabs.executeScript(
  //         tabs[0].id,
  //         {code: 'document.body.style.backgroundColor = "' + color + '";'});
  //   });
  // };

  // 改变manifest.json中的page_actioin -> defalut_title
  changeTitle.onclick = function(e) {
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.browserAction.setTitle({tabId: tabs[0].id, title: "You are on tab:" + tabs[0].id},()=>{
    //     console.log('listen...')
    //   });
    // });

    chrome.runtime.sendMessage({
      method: 'showAlert'
    }, function(response) {});
  }

  // 获取书签列表
  // getBookMark.onclick = function(e) {
    // chrome.bookmarks.getTree(function(bookmarkArray){
    //   console.log(bookmarkArray);
    // })
  // }
