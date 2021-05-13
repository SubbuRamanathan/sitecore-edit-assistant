/**
 * Sitecore Edit Assistant
 * A Google Chrome Extension
 * - created by Subramanian Ramanathan(Subbu) -
 * https://subbu.ca
 * sramanathan@subramanian.ca
 */

import { showContextMenu, contextMenuClickHandler, launchEditUrl, getAssociatedItemInfo } from "./modules/quickedit.js";

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if(changeInfo.status == 'loading')
    updateExtension(tab, changeInfo);
});

chrome.tabs.onActivated.addListener(function (tab) {
  chrome.tabs.getSelected(null, function (tab) {
    updateExtension(tab);
  });
});

const updateExtension = async (tab, changeInfo) => {
  if(tab.url){
    var tabUrl = new URL(tab.url);
    var isUrl = tabUrl.origin.startsWith("http");
    var isSitecore = tabUrl.pathname.includes("/sitecore/") || tabUrl.search.includes("sc_mode");

    chrome.browserAction.setBadgeBackgroundColor({ color: "#ffffff" });
    chrome.browserAction.setBadgeText({ text: "" });

    if (isUrl && !isSitecore) {
      showContextMenu();
      chrome.commands.onCommand.addListener(launchEditUrl);
      
      chrome.storage.sync.get([tabUrl.origin], (storage) => {
        var siteInfo = Object.values(storage)[0];
        if (siteInfo?.cmUrl) {
          chrome.browserAction.setBadgeBackgroundColor({ color: "#ee3524" });
          chrome.browserAction.setBadgeText({ text: "🗸" });
          var itemInfo = localStorage.getItem(tab.id);
          if(!itemInfo || changeInfo?.url){
            localStorage.removeItem(tab.id);
            getAssociatedItemInfo(tab.id, tabUrl.pathname, siteInfo);
          }
        }
      });
    }
  }
}

chrome.tabs.onRemoved.addListener(function(tabid) {
  localStorage.removeItem(tabid);
});

//Context menu
chrome.contextMenus.onClicked.addListener(contextMenuClickHandler);
  
// When the extension is installed or upgraded
chrome.runtime.onInstalled.addListener(function (details) {
  let currentVersion = chrome.runtime.getManifest().version;

  if (details.reason == "install") {
    sendNotification("Extension installed!", "Thank you for using this extension");
  } 
  else if (details.reason == "update") {
    if (currentVersion != details.previousVersion) {
      console.log("Updated from " + details.previousVersion + " to " + currentVersion);
      sendNotification(`Extension updated to version ${currentVersion}!`, "Thank you for using this extension");
    }
  }
});

const sendNotification = (title, body) => {
  new Notification(title, {
    body: body,
    icon: chrome.runtime.getURL("images/pencil-small.png"),
  });
}
