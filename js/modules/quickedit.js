/*
 * Sitecore Edit Assistant by Subramanian Ramanathan(Subbu)
 * quickedit.js
 */

export { showContextMenu, contextMenuClickHandler, launchEditUrl, getAssociatedItemInfo }; 

import { getCMUrl, getSiteName } from "./sitemanager.js";

/**
 * Menu on right click
 */
const showContextMenu = () => {
    createContextMenu('editInExperienceEditor', '✒️ Edit in Experience Editor');
    createContextMenu('editInContentEditor', '📑 Edit in Content Editor');
    createContextMenu('editInHorizon', '🚀 Edit in Horizon');
    createContextMenu('viewPageInsights', '🏁 View Page Insights');
    createContextMenu('previewInSimulator', '🖥️ Preview in Simulator');
    createContextMenu('openInPreview', '🗔  Open in Preview Mode');
    createContextMenu('settings', '⚙️ Configure Authoring Url');
    createContextMenu('additionalSettings', '🔧 Additional Settings');
}

const createContextMenu = (id, text) => {
    chrome.contextMenus.create(
        {
            title: text,
            contexts: ["page"],
            id: id,
        },
        () => chrome.runtime.lastError
    );
}

/**
 * Action on right-click
 */
const contextMenuClickHandler = async (info, tabInfo) => {
    await launchEditUrl(info.menuItemId, tabInfo);
}

const launchEditUrl = async (action, tabInfo) => {
    if (tabInfo) {
        var cdUrl = new URL(tabInfo.url);
        chrome.storage.sync.get([cdUrl.origin], async (storage) => {
            var siteInfo = Object.values(storage)[0];
            var cmUrlConfiguredInCurrentRequest = false;
            if(!siteInfo?.cmUrl){
                if(!siteInfo) siteInfo = {};
                siteInfo.cmUrl = getCMUrl(cdUrl.origin, siteInfo);
                cmUrlConfiguredInCurrentRequest = true;
            }
            if (siteInfo.cmUrl) {
                var associatedItem = await getAssociatedItemInfo(tabInfo.id, cdUrl.pathname, siteInfo);
                var editUrl = '';
                var horizonAppUrl = '';
                switch (action) {
                    case "editInExperienceEditor":
                        editUrl = getEditUrl(siteInfo.cmUrl, cdUrl.pathname, siteInfo.siteName);
                        break;
                    case "editInContentEditor":
                        if(associatedItem)
                            editUrl = `${siteInfo.cmUrl}/sitecore/shell/Applications/Content%20Editor.aspx?sc_bw=1&fo={${associatedItem.id}}&la=${associatedItem.language}`;
                        break;
                    case "editInHorizon":
                        horizonAppUrl = await getHorizonAppUrl(siteInfo.cmUrl);
                        if(horizonAppUrl && associatedItem) {
                            editUrl = `${horizonAppUrl}/editor?sc_itemid=${associatedItem.id}&sc_lang=${associatedItem.language}&sc_site=${associatedItem.site}`;
                        }
                        break;
                    case "viewPageInsights":
                        horizonAppUrl = await getHorizonAppUrl(siteInfo.cmUrl);
                        if(horizonAppUrl && associatedItem) {
                            editUrl = `${horizonAppUrl}/insights?sc_itemid=${associatedItem.id}&sc_lang=${associatedItem.language}&sc_site=${associatedItem.site}`;
                        }
                        break;
                    case "previewInSimulator":
                        horizonAppUrl = await getHorizonAppUrl(siteInfo.cmUrl);
                        if(horizonAppUrl && associatedItem) {
                            editUrl = `${new URL(horizonAppUrl).origin}/composer/simulator?sc_itemid=${associatedItem.id}&sc_lang=${associatedItem.language}&sc_site=${associatedItem.site}`;
                        }
                        break;
                    case "openInPreview":
                        editUrl = getPreviewUrl(siteInfo.cmUrl, cdUrl.pathname, siteInfo.siteName);
                        break;
                    case "settings":
                        if(!cmUrlConfiguredInCurrentRequest)
                            getCMUrl(cdUrl.origin, siteInfo);
                        break;
                    case "additionalSettings":
                        getSiteName(cdUrl.origin, siteInfo);
                        break;
                }
                if(editUrl != ''){
                    openInNewTab(editUrl);
                }
                else if(horizonAppUrl != undefined && action.toLowerCase().indexOf('settings') == -1){
                    launchSitecoreLoginUrl(siteInfo.cmUrl);
                }
            }
        });
    }
}

const getAssociatedItemInfo = async (tabid, path, siteInfo) => {
    try{
        var itemInfo = localStorage.getItem(tabid);
        if(itemInfo) return JSON.parse(itemInfo);

        var previewUrl = getPreviewUrl(siteInfo.cmUrl, path, siteInfo.siteName);
        var htmlDocument = await fetchHTML(previewUrl);
        if(htmlDocument){
            var itemInfo = {
                id: parseGuid(htmlDocument.getElementById("scItemID")?.value),
                language: htmlDocument.getElementById("scLanguage")?.value,
                site: htmlDocument.getElementById("scSite")?.value
            }
            localStorage.setItem(tabid, JSON.stringify(itemInfo));
            return itemInfo;
        }
    }
    catch(error){
        console.log(error);
    }
}

const fetchHTML = async (url) => {
    const response = await fetch(url, { redirect: 'manual'});
    if(response.status == 200){
        const responseText = await response.text(); 
        var parser = new DOMParser();
        return parser.parseFromString(responseText, 'text/html');
    }
}

const getHorizonAppUrl = async (cmOrigin) => {
    const launchPadUrl = `${cmOrigin}/sitecore/shell/sitecore/client/Applications/Launchpad`;
    var htmlDocument = await fetchHTML(launchPadUrl);
    if(htmlDocument){
        var horizonTile = htmlDocument.querySelectorAll('a[title="Horizon"]');
        if(horizonTile.length > 0)
            return horizonTile[0].href;
        else
            alert('Horizon not configured for this domain');
            return;
    }
    return '';
}

const getPreviewUrl = (cmOrigin, path, siteName) => {
    return `${cmOrigin}${path}?sc_mode=preview${siteName ? ("&sc_site=" + siteName) : ''}`;
}

const getEditUrl = (cmOrigin, path, siteName) => {
    return `${cmOrigin}${path}?sc_mode=edit${siteName ? ("&sc_site=" + siteName) : ''}`;
}

const launchSitecoreLoginUrl = async (url) => {
    openInNewTab(`${new URL(url).origin}/sitecore/login`);
}

const openInNewTab = (url) => {
    if (url) chrome.tabs.create({ url: url });
}

const parseGuid = (guid) => {
    return guid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,"$1-$2-$3-$4-$5");
}