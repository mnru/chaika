/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is chaika.
 *
 * The Initial Developer of the Original Code is
 * chaika.xrea.jp
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *    flyson <flyson.moz at gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://chaika-modules/ChaikaCore.js");
Components.utils.import("resource://chaika-modules/ChaikaBoard.js");
Components.utils.import("resource://chaika-modules/ChaikaDownloader.js");


const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

const MODE_BBSMENU = 0;
const MODE_BBSMENU_FILTER = 1;
const MODE_FIND2CH = 2;


var Page = {

	startup: function Page_startup(){
		PrefObserver.start();
		var tree = document.getElementById("bookmarks-view");
		tree.collapsed = true;
		tree.setAttribute("treesize", ChaikaCore.pref.getChar("bbsmenu.tree_size"));

		this.showViewFoxAge2chMenu();
		SearchBox.init();

		setTimeout(function(){ Page.delayStartup(); }, 0);
	},

	delayStartup: function Page_delayStartup(){
		var tree = document.getElementById("bookmarks-view");
		tree.collapsed = false;

		if(Bbsmenu.getItemCount() == 0){
			BbsmenuUpdater.update();
		}else{
			Bbsmenu.initTree();
		}
	},

	shutdown: function Page_shutdown(){
		PrefObserver.stop();
		Tree.saveOpenedCategories();
	},


	showViewFoxAge2chMenu: function Page_showViewFoxAge2chMenu(){
		var browser = ChaikaCore.browser.getBrowserWindow();
		if(browser && browser.document.getElementById("viewFoxAge2chSidebar")){
			document.getElementById("viewFoxAge2chMenu").hidden = false;
		}
	},


	openLogManager: function Page_openLogManager(){
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var logManagerURL = ioService.newURI("chaika://log-manager/", null, null);

		ChaikaCore.browser.openURL(logManagerURL, true);
	},


	openDataFolder: function Page_openDataFolder(){
		var logDir = ChaikaCore.getDataDir();
		ChaikaCore.io.revealDir(logDir);
	},


	openSupport: function Page_openSupport(){
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var supportURL = ioService.newURI("chaika://support/", null, null);

		ChaikaCore.browser.openURL(supportURL, true);
	},


	openReleaseNotes: function Page_openReleaseNotes(){
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var releasenotesURL = ioService.newURI("chaika://releasenotes/", null, null);

		ChaikaCore.browser.openURL(releasenotesURL, true);
	},


	openSettings: function Page_openSettings(){
		var winMediator = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator);
		var settingdWin = winMediator.getMostRecentWindow("chaika:settings");
		if(settingdWin){
			settingdWin.focus();
			return;
		}

		var settingDialogURL = "chrome://chaika/content/settings/settings.xul";
		var features = "";
		try{
			var pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
			var instantApply = pref.getBoolPref("browser.preferences.instantApply");
			features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");
		}catch(ex){
			features = "chrome,titlebar,toolbar,centerscreen,modal";
		}
		window.openDialog(settingDialogURL, "", features);
	},


	viewFoxAge2ch: function Page_viewFoxAge2ch(){
		var browser = ChaikaCore.browser.getBrowserWindow();
		if(browser && browser.document.getElementById("viewFoxAge2chSidebar")){
			browser.document.getElementById("viewFoxAge2chSidebar").doCommand();
		}
	}

};




var PrefObserver = {

	PREF_BRANCH: "extensions.chaika.bbsmenu.",

	start: function PrefObserver_start(){
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		this._branch = prefService.getBranch(this.PREF_BRANCH).QueryInterface(Ci.nsIPrefBranch);
		this._branch.addObserver("", this, false);
	},


	stop: function PrefObserver_stop(){
		this._branch.removeObserver("", this);
	},


	observe: function PrefObserver_observe(aSubject, aTopic, aData){
		if(aTopic != "nsPref:changed") return;

		if(aData == "tree_size"){
			Tree.changeTreeSize();
		}

	}

};




var Notification = {

	info: function Notification_info(aLabel, aTimeout){
		var notification = document.getElementById("notification");
		var newNode = notification.appendNotification(aLabel, null, null,
				notification.PRIORITY_INFO_MEDIUM, null);

		if(aTimeout){
			setTimeout(function(){ Notification.remove(newNode); }, aTimeout);
		}

		return newNode;
	},


	warning: function Notification_warning(aLabel, aTimeout){
		var notification = document.getElementById("notification");
		var newNode = notification.appendNotification(aLabel, null, null,
				notification.PRIORITY_WARNING_MEDIUM, null);

		if(aTimeout){
			setTimeout(function(){ Notification.remove(newNode); }, aTimeout);
		}
		return newNode;
	},


	critical: function Notification_critical(aLabel, aTimeout){
		var notification = document.getElementById("notification");
		var newNode = notification.appendNotification(aLabel, null, null,
				notification.PRIORITY_CRITICAL_MEDIUM, null);

		if(aTimeout){
			setTimeout(function(){ Notification.remove(newNode); }, aTimeout);
		}
		return newNode;
	},


	removeAll: function Notification_removeAll(){
		var notification = document.getElementById("notification");
		notification.removeAllNotifications(false);
	},


	remove: function Notification_remove(aNode){
		var notification = document.getElementById("notification");
		notification.removeNotification(aNode);
	}

};




var SearchBox = {

	init: function SearchBox_init(){
		if(!this._textbox) this._textbox = document.getElementById("searchBox");

		switch(this.getSearchMode()){
			case "find2ch":
				this._textbox.emptyText = "2ch 検索";
				break;
			case "boardFilter":
				this._textbox.emptyText = "フィルタ";
				break;
		}
	},


	search: function SearchBox_search(aSearchStr){
		if(!aSearchStr){
			Bbsmenu.initTree();
			return;
		}

		switch(this.getSearchMode()){
			case "find2ch":
				Find2ch.search(aSearchStr);
				break;
			case "boardFilter":
				Bbsmenu.filter(aSearchStr);
				break;
		}
	},


	getSearchMode: function SearchBox_getSearchMode(){
		return this._textbox.getAttribute("searchmode");
	},


	setSearchMode: function SearchBox_setSearchMode(aValue){
		this._textbox.setAttribute("searchmode", aValue);
		this.init();
		return aValue;
	},


	searchModeMenuShowing: function SearchBox_searchModeMenuShowing(aEvent){
		var target = aEvent.target;
		var element = target.getElementsByAttribute("value", SearchBox.getSearchMode())[0]
		element.setAttribute("checked", "true");
	}

};




var BbsmenuUpdater = {

	_downloader: null,
	_infoNode: null,


	update: function BbsmenuUpdater_update(){
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var bbsmenuHtmlURLSpec = ChaikaCore.pref.getChar("bbsmenu.bbsmenu_html_url");
		var bbsmenuHtmlURL = ioService.newURI(bbsmenuHtmlURLSpec, null, null);
		var bbsmenuHtmlCharset = ChaikaCore.pref.getChar("bbsmenu.bbsmenu_html_charset");

		this._downloader = new ChaikaSimpleDownloader();
		this._downloader.download(bbsmenuHtmlURL, bbsmenuHtmlCharset, this);
		Notification.removeAll();
		this._infoNode = Notification.info("BBSMENU 更新中");
	},


	onStop: function BbsmenuUpdater_onStop(aDownloader, aResponse, aHttpStatus){
		if(aResponse && aResponse.indexOf(".2ch.net/") != -1){
			Bbsmenu.update(aResponse);
			Bbsmenu.initTree()
			Notification.info("更新しました", 1200);
		}else{
			Notification.critical("更新に失敗しました", 2500);
		}
		Notification.remove(this._infoNode);
		this._downloader = null;
		this._infoNode = null;
	},


	onError: function BbsmenuUpdater_onError(aDownloader, aErrorCode){
		Notification.critical("更新に失敗しました", 2500);
		Notification.remove(this._infoNode);
		this._downloader = null;
		this._infoNode = null;
	}

};




var Bbsmenu = {

	initTree: function Bbsmenu_initTree(){
		var doc = this.getBbsmenuDoc();
		Tree.initTree(doc, MODE_BBSMENU);
	},


	filter: function Bbsmenu_filter(aFilterStr){
		var doc = this.getFilterDoc(aFilterStr);
		Tree.initTree(doc, MODE_BBSMENU_FILTER);
	},


	update: function Bbsmenu_update(aHtmlSource){
		var parserUtils = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);
		var domParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

		var bbsmenuDoc = domParser.parseFromString("<root xmlns:html='http://www.w3.org/1999/xhtml'/>", "text/xml");
		var fragment = parserUtils.parseFragment(aHtmlSource, 0, false, null, bbsmenuDoc.documentElement);
		bbsmenuDoc.documentElement.appendChild(fragment);


		var storage = ChaikaCore.storage;
		var categoryInsertStatement = storage.createStatement(
				"INSERT INTO bbsmenu(title, title_n, path, is_category) VALUES(?1, '', ?2, 1);");
		var bosrdInsertStatement = storage.createStatement(
				"INSERT INTO bbsmenu(title, title_n, url, path, board_type, board_id, is_category) " +
				"VALUES(?1, '', ?2, ?3, ?4, ?5, 0);");
		var node = null;
		var currentCategoryPath = "";


		storage.beginTransaction();
		try{
			storage.executeSimpleSQL("DELETE FROM bbsmenu");
			storage.executeSimpleSQL("INSERT INTO bbsmenu(title, title_n, path, is_category) " +
					"VALUES('2ch', '', '/2ch/', 1);");

			var xpath = "root/html:font/html:b/text() | root/html:font/html:a[@href]" +
							" | root/font/b/text() | root/font/a[@href]";
			function resolver(){
				return "http://www.w3.org/1999/xhtml";
			}
			var xpathResult = bbsmenuDoc.evaluate(xpath, bbsmenuDoc, resolver,
					Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			while(node = xpathResult.iterateNext()){
				if(node.nodeType == Ci.nsIDOMNode.TEXT_NODE){
					var title = node.nodeValue;
					currentCategoryPath = "/2ch/" + title.replace("/", "_", "g") + "/";
					categoryInsertStatement.bindStringParameter(0, title);
					categoryInsertStatement.bindStringParameter(1, currentCategoryPath);
					categoryInsertStatement.execute();
				}else if(currentCategoryPath){
					var title = node.firstChild.nodeValue;
					var urlSpec = node.getAttribute("href");
					var type = ChaikaBoard.BOARD_TYPE_PAGE;
					var boardID = "";
					try{
						var url = ioService.newURI(urlSpec, null, null);
						type = ChaikaBoard.getBoardType(url);
						if(type != ChaikaBoard.BOARD_TYPE_PAGE){
							boardID = ChaikaBoard.getBoardID(url);
						}
					}catch(ex){
						ChaikaCore.logger.error(urlSpec +" : "+ ex);
					}

					var path = currentCategoryPath + title.replace("/", "_", "g") + "/";
					bosrdInsertStatement.bindStringParameter(0, title);
					bosrdInsertStatement.bindStringParameter(1, urlSpec);
					bosrdInsertStatement.bindStringParameter(2, path);
					bosrdInsertStatement.bindInt32Parameter(3, type);
					bosrdInsertStatement.bindStringParameter(4, boardID);
					bosrdInsertStatement.execute();
				}
			}
		}catch(ex){
			ChaikaCore.logger.error(ex);
		}finally{
			categoryInsertStatement.reset();
			bosrdInsertStatement.reset();
			categoryInsertStatement.finalize();
			bosrdInsertStatement.finalize();
			storage.commitTransaction();
		}

	},


	getItemCount: function Bbsmenu_getItemCount(){
		var result = 0;

		var storage = ChaikaCore.storage;
		var countStatement = storage.createStatement("SELECT count(rowid) FROM bbsmenu;");

		storage.beginTransaction();
		try{
			countStatement.step();
			result = countStatement.getInt32(0);
		}catch(ex){
			ChaikaCore.logger.error(ex);
		}finally{
			countStatement.reset();
			countStatement.finalize();
			storage.commitTransaction();
		}
		return result;
	},


	getFilterDoc: function Bbsmenu_getFilterDoc(aFilterStr){
		var bbsmenuDoc = (new DOMParser()).parseFromString("<bbsmenu/>", "text/xml");


		var storage = ChaikaCore.storage;
		var sql = [
			"SELECT title, url, path, board_type FROM bbsmenu",
			"WHERE is_category=0 AND x_normalize(title) LIKE x_normalize(?1)"
		].join("\n");
		var statement = storage.createStatement(sql);
		storage.beginTransaction();
		try{
			statement.bindStringParameter(0, "%" + aFilterStr + "%");
			while(statement.executeStep()){
				var title      = statement.getString(0);
				var url        = statement.getString(1);
				var path       = statement.getString(2);
				var boardType  = statement.getInt32(3);
				var item = bbsmenuDoc.createElement("board");
				item.setAttribute("title", title);
				item.setAttribute("url", url);
				item.setAttribute("type",  boardType);
				bbsmenuDoc.documentElement.appendChild(item);
			}
		}catch(ex){
			ChaikaCore.logger.error(ex);
		}finally{
			statement.reset();
			statement.finalize();
			storage.commitTransaction();
		}
		return bbsmenuDoc;
	},


	getBbsmenuDoc: function Bbsmenu_getBbsmenuDoc(){
		var bbsmenuDoc = (new DOMParser()).parseFromString("<bbsmenu/>", "text/xml");
		var outsideDoc = this.getOutsideDoc();

		var nodes = outsideDoc.documentElement.childNodes;
		for(var i=0; i<nodes.length; i++){
			var node = nodes[i];
			var newNode = bbsmenuDoc.importNode(node, true);
			bbsmenuDoc.documentElement.appendChild(newNode);
		}

		var storage = ChaikaCore.storage;
		var sql = "SELECT title, url, path, board_type, is_category FROM bbsmenu;";
		var statement = storage.createStatement(sql);
		storage.beginTransaction();
		try{
			var currentCategory = null;
			while(statement.executeStep()){
				var title      = statement.getString(0);
				var url        = statement.getString(1);
				var path       = statement.getString(2);
				var boardType  = statement.getInt32(3);
				var isCategory = (statement.getInt32(4) == 1);

				if(path == "/2ch/") continue;

				if(isCategory){
					currentCategory = bbsmenuDoc.createElement("category");
					currentCategory.setAttribute("isContainer", "true");
					currentCategory.setAttribute("title", title);
					currentCategory.setAttribute("isOpen", "false");
					bbsmenuDoc.documentElement.appendChild(currentCategory);
				}else if(currentCategory){
					var item = bbsmenuDoc.createElement("board");
					item.setAttribute("title", title);
					item.setAttribute("url", url);
					item.setAttribute("type",  boardType);
					currentCategory.appendChild(item);
				}
			}
		}catch(ex){
			ChaikaCore.logger.error(ex);
		}finally{
			statement.reset();
			statement.finalize();
			storage.commitTransaction();
		}

		return bbsmenuDoc;
	},


	getOutsideDoc: function Bbsmenu_getOutsideDoc(){
		var	outsidexmlFile = ChaikaCore.getDataDir();
		outsidexmlFile.appendRelativePath("outside.xml");

		if(!outsidexmlFile.exists()){
			var defaultOutsideFile = ChaikaCore.getDefaultsDir();
			defaultOutsideFile.appendRelativePath("outside.xml");
			defaultOutsideFile.copyTo(outsidexmlFile.parent, null);

			outsidexmlFile = outsidexmlFile.clone();
		}

		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

		var outsideXMLURL = ioService.newFileURI(outsidexmlFile);
		var httpReq = new XMLHttpRequest();
		httpReq.open("GET", outsideXMLURL.spec, false);
		httpReq.send(null);
		var outsideDoc = httpReq.responseXML;

		var categoryNodes = outsideDoc.getElementsByTagName("category");
		for(var i=0; i<categoryNodes.length; i++){
			var node = categoryNodes[i];
			node.setAttribute("isContainer", "true");
			node.setAttribute("isOpen", "false");
		}

		return outsideDoc;
	}

};




var Find2ch = {

	_downloader: null,
	_infoNode: null,

	get isHTMLMode(){
		return !ChaikaCore.pref.getBool('bbsmenu.find2ch.use_rss');
	},

	search: function Find2ch_search(aSearchStr){
		const isHTML = this.isHTMLMode;
		const QUERY_URL = isHTML ? "http://find.2ch.net/?COUNT=50&BBS=ALL&TYPE=TITLE&STR=" : 'http://find.2ch.net/rss.php/';
		const ENCODE = isHTML ? 'euc-jp' : 'utf-8';
		const QUERY = isHTML ? escape(this._convertEncode(aSearchStr, ENCODE)) :
								encodeURIComponent(ChaikaCore.io.escapeHTML(aSearchStr));

		this._downloader = new XMLHttpRequest();
		this._downloader.onerror = this.onError;
		this._downloader.onreadystatechange = this.onReadyStateChange;
		this._downloader.open("GET", QUERY_URL + QUERY, true);
		this._downloader.overrideMimeType('text/plain; charset=' + ENCODE);
		this._downloader.send(null);

		Notification.removeAll();
		this._infoNode = Notification.info("検索中");
	},


	onReadyStateChange: function Find2ch_onReadyStateChange(aEvent){
		if(aEvent.target.readyState === 4 && aEvent.target.status === 200){
			Find2ch.onStop(aEvent.target.responseText);
		}
	},

	onStop: function Find2ch_onStop(aResponse){
		if(aResponse){
			if( (this.isHTMLMode && aResponse.indexOf('<html') !== -1) ||
			   aResponse.indexOf('<rdf:RDF') !== -1){
				this.initTree(aResponse);
			}
		}

		Notification.remove(this._infoNode);
		this._downloader = null;
		this._infoNode = null;
	},


	onError: function Find2ch_onError(aEvent){
		Notification.critical("検索に失敗しました", 2500);
		Notification.remove(this._infoNode);
		this._downloader = null;
		this._infoNode = null;
	},


	initTree: function Find2ch_initTree(aResponse){
		var resultDoc = this.isHTMLMode ? this._convertDocFromHTML(aResponse) :
										  this._convertDocFromRSS(aResponse);
		Tree.initTree(resultDoc, MODE_FIND2CH);
	},

	_convertDocFromRSS: function(aResponseStr){
		var httpReq = new XMLHttpRequest();
		httpReq.open("GET", "chrome://chaika/content/bbsmenu/find2ch.xsl", false);
		httpReq.send(null);

		var domParser = Cc["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Ci.nsIDOMParser);
		var xsltDoc = domParser.parseFromString(httpReq.responseText, "text/xml");
		var findDoc = domParser.parseFromString(aResponseStr, "text/xml");

		var xslt = new XSLTProcessor();
		xslt.importStylesheet(xsltDoc);

		return xslt.transformToDocument(findDoc);
	},

	_convertDocFromHTML: function(aResponseStr){
		var domParser = Cc["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Ci.nsIDOMParser);
		var findDoc = domParser.parseFromString(aResponseStr, "text/html");

		var resultDoc = document.implementation.createDocument(null, '', null);
		var root = document.createElement('category');

		var resultObj = {};  //key: board name, value: an array of threads

		//最後のdtは広告
		Array.slice(findDoc.querySelectorAll('.content_pane dt:not(:last-child)')).forEach(function(item){
			var links = item.getElementsByTagName('a');

			var thread = links[0];
			var threadURI = thread.getAttribute('href').replace(/\d+-\d+$/, '');
			var threadTitle = ChaikaCore.io.unescapeHTML(thread.textContent);

			var post = thread.nextSibling.nodeValue.replace(/\D/g, '') || '0';
			var boardTitle = links[1].textContent;

			var threadItem = document.createElement('thread');
			threadItem.setAttribute('url', threadURI);
			threadItem.setAttribute('title', threadTitle + ' [' + post + ']');
			threadItem.setAttribute('boardName', boardTitle);

			if(!resultObj[boardTitle]){
				resultObj[boardTitle] = [];
			}
			resultObj[boardTitle].push(threadItem);
		});

		for(let boardTitle in resultObj){
			var boardItem = document.createElement('board');
			boardItem.setAttribute('title', boardTitle);
			boardItem.setAttribute('isContainer', 'true');
			boardItem.setAttribute('isOpen', 'true');

			resultObj[boardTitle].forEach(function(threadItem){
				boardItem.appendChild(threadItem);
			});

			root.appendChild(boardItem);
		}

		resultDoc.appendChild(root);

		return resultDoc;
	},

	_convertEncode: function(aStr, aEncode){
		var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].getService(Ci.nsIScriptableUnicodeConverter);

		try{
			converter.charset = aEncode;
			return converter.ConvertFromUnicode(aStr);
		}catch(e){
			return aStr;
		}
	}

};




var Tree = {

	initTree: function Tree_initTree(aTreeDoc, aMode){
		if(!this._tree){
			this._treeBoxObject = null;
			this._tree = document.getElementById("bookmarks-view");
			this._tree.view = this;
			this._atomService = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
		}

		if(this._doc && this._mode == MODE_BBSMENU){
			this.saveOpenedCategories();
		}

		this._mode = aMode;
		var lastRowCount = this.rowCount;
		this._doc = aTreeDoc;
		this.loadOpenedCategories();
		this.setVisivleData();
		this._treeBoxObject.rowCountChanged(1, this.rowCount - lastRowCount);
		this._treeBoxObject.invalidate();
	},


	setVisivleData: function Tree_setVisivleData(){
		var xpath = "descendant::*[not(ancestor::*[@isContainer='true']/@isOpen='false')]";
		this._visibleNodes = this._xpathEvaluate(xpath);

		for each(var node in this._visibleNodes){
			node._title = node.getAttribute("title");

			node._isContainer = (node.getAttribute("isContainer") == "true");
			if(node._isContainer){
				node._isContainerOpen = (node.getAttribute("isOpen") == "true");
			}

			node._level = this._doc.evaluate("ancestor::*[@isContainer='true']", node, null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;

			node._parentIndex = this._visibleNodes.indexOf(node.parentNode);
		}
		this.rowCount = this._visibleNodes.length;
	},


	_xpathEvaluate: function Tree__xpathEvaluate(aXpath, aContextNode){
		var contextNode = aContextNode || this._doc.documentElement;

		var xpathResult = this._doc.evaluate(aXpath, contextNode, null,
			XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

		var result = [];
		var node;
		while(node = xpathResult.iterateNext()){
			result.push(node);
		}
		return result;
	},


	loadOpenedCategories: function Tree_loadOpenedCategories(){
		if(this._mode != MODE_BBSMENU) return;

		var titles = decodeURIComponent(this._tree.getAttribute("openedCategories")).split(",");
		var closedContainers = this._xpathEvaluate("descendant::*[@isContainer='true'][@isOpen='false']");
		closedContainers.forEach(function(aElement){
			var title = aElement.getAttribute("title");
			if(titles.indexOf(title) != -1){
				aElement.setAttribute("isOpen", "true");
			}
		});
	},


	saveOpenedCategories: function Tree_saveOpenedCategories(){
		if(this._mode != MODE_BBSMENU) return;
		var opendContainers = this._xpathEvaluate("descendant::*[@isContainer='true'][@isOpen='true']");
		var titles = opendContainers.map(function(aElement){
			return encodeURIComponent(aElement.getAttribute("title"));
		});

		if(titles.length > 0){
			this._tree.setAttribute("openedCategories", titles.join(","));
		}else{
			this._tree.setAttribute("openedCategories", "");
		}
	},


	changeTreeSize: function Tree_changeTreeSize(){
		this._tree.collapsed = true;
		this._tree.setAttribute("treesize", ChaikaCore.pref.getChar("bbsmenu.tree_size"));
		setTimeout(function(){ Tree._tree.collapsed = false }, 0);
	},


	click: function Tree_click(aEvent){
		if(aEvent.originalTarget.localName != "treechildren") return;

		var row = {}
		var subElement = {};
		this._treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, {}, subElement);
		if(row.value == -1) return;	// ツリーのアイテム以外をクリック
		if(subElement.value=="twisty") return;
		if(aEvent.button > 1) return;

		var singleClicked = aEvent.type == "click";

		if(this.isContainer(row.value)){
			if(singleClicked && aEvent.button == 0){
				this.toggleOpenState(row.value);
			}
			return;
		}

		var openSingleClick = ChaikaCore.pref.getBool("bbsmenu.open_single_click");
		var openNewTab = ChaikaCore.pref.getBool("bbsmenu.open_new_tab");
		var item = this.getURLItem(row.value);

		if(aEvent.button==1 && singleClicked){
			item.open(!openNewTab);
		}else if(openSingleClick && singleClicked){
			item.open(openNewTab);
		}else if(!openSingleClick && !singleClicked){
			item.open(openNewTab);
		}
	},


	showContext: function Tree_showContext(aEvent){
		var row = {}
		var subElement = {};
		this._treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, {}, subElement);
		if(row.value == -1) return false;	// ツリーのアイテム以外をクリック

		if(this.isContainer(row.value)) return false;

		var item = this.getURLItem(row.value)
		var treeContextMenu = document.getElementById("treeContextMenu");
		treeContextMenu.items = [this.getURLItem(row.value)];
		return true
	},


	getURLItem: function Tree_getURLItem(aRowIndex){
		var node = this._visibleNodes[aRowIndex];

		var title = node.getAttribute("title");
		var urlSpec = node.getAttribute("url");
		var boardType = parseInt(node.getAttribute("type"));
		var itemType = "page";
		if(boardType == ChaikaBoard.BOARD_TYPE_PAGE){
			itemType = "page";
		}else if(node.localName == "board"){
			itemType = "board";
		}else{
			itemType = "thread";
		}
		return new ChaikaCore.ChaikaURLItem(title, urlSpec, itemType, boardType);
	},


	rowCount: 0,
	selection: null,

	getRowProperties: function(aIndex, aProperties){},
	getCellProperties: function(aRow, aCol, aProperties){
		if (aCol.index == 0){
			var type = "type-" + this._visibleNodes[aRow].getAttribute("type");

			if(aProperties){
				// Firefox 21-
				aProperties.AppendElement(this._atomService.getAtom("title"));
				aProperties.AppendElement(this._atomService.getAtom(type));
			}else{
				// Firefox 22+
				return ['title', type].join(' ');
			}
		}
	},
	getColumnProperties: function(aCol, aProperties){},
	isContainer: function(aIndex){
		return this._visibleNodes[aIndex]._isContainer;
	},
	isContainerOpen: function(aIndex){
		return this._visibleNodes[aIndex]._isContainerOpen;
	},
	isContainerEmpty: function(aIndex){ return false; },
	isSeparator: function(aIndex){ return false; },
	isSorted: function(){ return false; },
	canDrop: function(targetIndex, aOrientation){ return false; },
	drop: function(targetIndex, aOrientation){},
	getParentIndex: function(aRowIndex){
		return this._visibleNodes[aRowIndex]._parentIndex;
	},
	hasNextSibling: function(aRowIndex, aAfterIndex){
		if(aRowIndex == aAfterIndex){
			var l1 = this._visibleNodes[aRowIndex]._level;
			var l2 = this._visibleNodes[aRowIndex+1]._level;
			return l1 == l2;
		}
		return true;
	},
	getLevel: function(aRowIndex){
		return this._visibleNodes[aRowIndex]._level;
	},
	getImageSrc: function(aRow, aCol){},
	getProgressMode: function(aRow, aCol){},
	getCellValue: function(aRow, aCol){},
	getCellText: function(aRow, aCol){
		return this._visibleNodes[aRow]._title;
	},
	setTree: function(aTree){
		this._treeBoxObject = aTree;
	},
	toggleOpenState: function(aIndex){
		var node =	this._visibleNodes[aIndex];

		var lastRowCount = this.rowCount;

		var opened = (node.getAttribute("isOpen") == "true");
		if(opened){
			node.setAttribute("isOpen", "false");
		}else{
			if(this._mode == MODE_BBSMENU && ChaikaCore.pref.getBool("bbsmenu.toggle_open_container")){
				var cNodeName = this._containerNodeName;
				var containers = this._xpathEvaluate("descendant::*[@isContainer='true']");
				for each(var container in containers){
					container.setAttribute("isOpen", "false");
				}
				var ancestors = this._xpathEvaluate("ancestor::*[@isContainer='true']", node);
				for each(var ancestor in ancestors){
					ancestor.setAttribute("isOpen", "true");
				}
			}
			node.setAttribute("isOpen", "true");
		}
		this.setVisivleData();

		this._treeBoxObject.rowCountChanged(1, this.rowCount - lastRowCount);
		this._treeBoxObject.invalidate();

		var newIndex = this._visibleNodes.indexOf(node);
		this._treeBoxObject.ensureRowIsVisible(newIndex)
		this.selection.select(newIndex);
	},
	cycleHeader: function(aCol){},
	selectionChanged: function(){},
	cycleCell: function(aRow, aCol){},
	isEditable: function(aRow, aCol){},
	isSelectable: function(aRow, aCol){},
	setCellValue: function(aRow, aCol, aValue){},
	setCellText: function(aRow, aCol, aValue){},
	performAction: function(aAction){},
	performActionOnRow: function(aAction, aRow){},
	performActionOnCell: function(aAction, aRow, aCol){},

};
