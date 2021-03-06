const fl = require("./firelink_lib");
const simpleStorage = require("sdk/simple-storage");
const storage = simpleStorage.storage;
var notify = require("./notify");
const tabs = require("sdk/tabs");
const clipboard = require("sdk/clipboard");
const SetupSettingItem = require('./setup_setting_item');
const Localize = require('./localize');
const SetupMenu = require('./setup_menu');
const Panel = require('sdk/panel');
const data = require('sdk/self').data;
const locale = require("./locale");
require("./console-p");

var disableDirectSelect = false;

var customizeLinkPanel = null;

exports.redoLink = function(label, linkdata) {
  fl.copyLinkAndNotify(label, fl.currentLinkform(), linkdata);
}

exports.setupCustomizeLink = function() {
  customizeLinkPanel = Panel.Panel({
    width: 480,
    height: 160,
    contentURL: data.url('customize-link.html'),
    contentScriptFile: [data.url('jquery-1.4.2.min.js'),
                        data.url('customize-link.js'),
                        data.url('dump.js')
                       ],
    contentScriptWhen: 'ready',
    onMessage: function(msg) {
      switch (msg.kind) {
       case 'ok':
        fl.changeCurrentIndex(msg.select_index);
        fl.copyLinkAndNotify(fl.currentLabel(), fl.currentLinkform(), msg.linkdata);
        this.hide();
        break;
       case 'close':
        this.hide();
        break;
       case 'show':
        this.show();
        break;
      }
    }
  });
}

exports.textFromClipboard = function(label, linkdata) {
  customizeLinkPanel.postMessage({
    kind:         "init",
    select_index: String(fl.currentIndex()),
    linkdata:     linkdata,
    linkformData: fl.linkformData()
  });
}

function allTabs(label, linkform, separateText) {
  // 切り替え
  fl.changeLinkform(linkform);

  // テキスト生成
  var text = "";

  for each (var tab in tabs) {
    if (!tab.isPinned) {
      var linkdata = {text: tab.title, title: tab.title, url: tab.url};
      text += fl.createText(linkform, linkdata) + separateText;
    }
  }

  fl.copyText(text);
  fl.notifyClipboard(label);
}

exports.allTabs = function(label, linkform) {
  allTabs(label, linkform, "\n");
}

exports.allTabsSpace = function(label, linkform) {
  allTabs(label, linkform, "\n\n");
}

exports.setLinkFormIndex = function(index) {
  if (!exports.getDisableDirectSelect() && 0 <= index && index < storage.linkformData.length) {
    storage.currentIndex = index;
    notify.n(fl.addPrefix(fl.currentLabel(), index));
  }
}

exports.importFromClipboard = function(panel) {
  fl.notifyClipboard(Localize.text.import_from_clipboard);
  panel.postMessage({kind: "import", data: fl.text2JSON(clipboard.get())});
}

exports.exportFromClipboard = function() {
  clipboard.set( fl.json2Text(storage.linkformData) );
  fl.notifyClipboard(Localize.text.export_from_clipboard);
}

exports.clearSetting = function(panel) {
  notify.n(Localize.text.clear_setting, Localize.text.remove_all_linkform);
  panel.postMessage({kind: "save"});
}

exports.restoreSetting = function(panel) {
  notify.n(Localize.text.restore_setting, Localize.text.restore_init_linkform);
  panel.postMessage({kind: "save"});
}

exports.tabOpen = function(url) {
  tabs.open(url);
  SetupSettingItem.hideSettingPanel();
}

exports.toggleDirectSelect = function() {
  disableDirectSelect ^= true;

  notify.n(disableDirectSelect ?
           Localize.text.notify_disable_direct_select :
           Localize.text.notify_enable_direct_select);

  SetupMenu.setupAll();
}

exports.getDisableDirectSelect = function() {
  return disableDirectSelect;
}
