/*
 * Sitecore Edit Assistant by Subramanian Ramanathan(Subbu)
 * sitemanager.js
 */

export { getCMUrl, getSiteName }; 

const getCMUrl = (cdUrl, siteInfo) => {
    var cmUrl = prompt('Enter the Authoring/CM Host URL for this site. \n(Eg: https://cm.domain.com)', siteInfo.cmUrl);
    siteInfo.cmUrl = cmUrl ?? siteInfo.cmUrl;
    chrome.storage.sync.set({[cdUrl]: siteInfo}, function() {
        console.log('Stored CM/CD mapping in Chrome Storage');
    });
    return siteInfo.cmUrl;
}

const getSiteName = (cdUrl, siteInfo) => {
    var siteName = prompt("Please specify the associated site's name as specified in your site config. If you do not have access to site config, you can preview a page item from Sitecore Content Editor and obtain the site name from the preview url's 'sc_site' querystring. \n(Only needed for multi-site implementations if the auto-siteresolving doesn't identify correct site for edit urls)", 
        siteInfo?.siteName ? siteInfo.siteName : '');
    siteInfo.siteName = siteName ?? siteInfo.siteName;
    chrome.storage.sync.set({[cdUrl]: siteInfo}, function() {
        console.log('Stored Site Name in Chrome Storage');
    });
}