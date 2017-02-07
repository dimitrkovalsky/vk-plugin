var _ls = _ls || [];

_ls = {
    bitrate:'',
    theme:''
};
chrome.storage.sync.get('bitrate', function(data) {
    if(data.bitrate == null){
        chrome.storage.sync.set({'bitrate': 0});
    } else {
        _ls.bitrate = data.bitrate;
        chrome.storage.sync.set({'bitrate': data.bitrate});
    }
});

chrome.storage.sync.get('theme', function(data) {
    if(data.theme == null){
        chrome.storage.sync.set({'theme': 0});
    }else {
        _ls.theme = data.theme;
        chrome.storage.sync.set({'theme': data.theme});
    }
});
