Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

var isPostAustralis = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator)
	.compare(Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).version, "29.0") >= 0;
	
if (isPostAustralis) Components.utils.import("resource:///modules/CustomizableUI.jsm");

function startup(data,reason)
{
	if (isPostAustralis)
	{
		//Define the widget once for all windows
		CustomizableUI.createWidget({
			id: "ESB_toolbaritem",
			type: "custom",
			onBuild: buildESB
		});
	}
	
	//Services.console.logStringMessage();
	Services.scriptloader.loadSubScript("chrome://extendedstatusbar/content/esbpref.js", {pref:setDefaultPref} );
    forEachOpenWindow(loadIntoWindow);
    Services.wm.addListener(WindowListener);
	
	//skin
	let styleService = Components.classes["@mozilla.org/content/style-sheet-service;1"]
					   .getService(Components.interfaces.nsIStyleSheetService);
	let uri = NetUtil.newURI("chrome://extendedstatusbar/skin/extendedstatusbar.css");
	styleService.loadAndRegisterSheet(uri, styleService.AUTHOR_SHEET);
	uri = NetUtil.newURI("chrome://extendedstatusbar/skin/extendedstatusbaroptions.css");
	styleService.loadAndRegisterSheet(uri, styleService.AUTHOR_SHEET);
}
function install(data, reason)
{
	if (!isPostAustralis)
	{
		var unCollapseAddonBar = function (window) {
			addonBar = window.document.getElementById("addon-bar");
			if (addonBar) 
			{
				window.setToolbarVisibility(addonBar, true, true);
			}
		};
		forEachOpenWindow(unCollapseAddonBar);
	}
}
function uninstall(data, reason)
{}
function shutdown(data, reason)
{
    if (reason == APP_SHUTDOWN)
        return;

	if (isPostAustralis)
	{
		CustomizableUI.unregisterArea("ESB_toolbar");
		CustomizableUI.destroyWidget("ESB_toolbaritem");
	}
	
    forEachOpenWindow(unloadFromWindow);
    Services.wm.removeListener(WindowListener);
	
	//skin
	let styleService = Components.classes["@mozilla.org/content/style-sheet-service;1"]
					   .getService(Components.interfaces.nsIStyleSheetService);
	let uri = NetUtil.newURI("chrome://extendedstatusbar/skin/extendedstatusbar.css");
	styleService.unregisterSheet(uri, styleService.AUTHOR_SHEET);
	uri = NetUtil.newURI("chrome://extendedstatusbar/skin/extendedstatusbaroptions.css");
	styleService.unregisterSheet(uri, styleService.AUTHOR_SHEET);
	
	//cache clearing 
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}

// loader

function buildESB(document)
{
	//ESB_percent_box
	var percentLabel = document.createElement("label");
	percentLabel.setAttribute("id", "ESB_percent_label");
	var percentLabelHbox =  document.createElement("hbox");
	percentLabelHbox.setAttribute("pack", "end");
	percentLabelHbox.setAttribute("align", "center");
	percentLabelHbox.appendChild(percentLabel);
	
	var percentProgressbar =  document.createElement("hbox");
	percentProgressbar.setAttribute("id", "ESB_percent_progressbar");
	var percentProgressbarHbox =  document.createElement("hbox");
	percentProgressbarHbox.appendChild(percentProgressbar);
	
	var percentBox =  document.createElement("stack");
	percentBox.setAttribute("id", "ESB_percent_box");
	percentBox.appendChild(percentProgressbarHbox);
	percentBox.appendChild(percentLabelHbox);
	
	//ESB_images_box
	var imagesLabel = document.createElement("label");
	imagesLabel.setAttribute("id", "ESB_images_label");
	var imagesBox =  document.createElement("hbox");
	imagesBox.setAttribute("id", "ESB_images_box");
	imagesBox.setAttribute("pack", "center");
	imagesBox.setAttribute("align", "center");
	imagesBox.appendChild(imagesLabel);
	
	//ESB_loaded_box
	var loadedLabel = document.createElement("label");
	loadedLabel.setAttribute("id", "ESB_loaded_label");
	var loadedLabelHbox =  document.createElement("hbox");
	loadedLabelHbox.setAttribute("pack", "center");
	loadedLabelHbox.setAttribute("align", "center");
	loadedLabelHbox.appendChild(loadedLabel);
	
	var loadedWorkingProgressbar =  document.createElement("hbox");
	loadedWorkingProgressbar.setAttribute("id", "ESB_loaded_working_progressbar");
	loadedWorkingProgressbar.setAttribute("hidden", "true");
	var loadedWorkingProgressbarHbox =  document.createElement("hbox");
	loadedWorkingProgressbarHbox.appendChild(loadedWorkingProgressbar);
	
	var loadedFinishedProgressbar =  document.createElement("hbox");
	loadedFinishedProgressbar.setAttribute("id", "ESB_loaded_finished_progressbar");
	loadedFinishedProgressbar.setAttribute("flex", "1");
	loadedFinishedProgressbar.setAttribute("hidden", "true");
	var loadedFinishedProgressbarHbox =  document.createElement("hbox");
	loadedFinishedProgressbarHbox.appendChild(loadedFinishedProgressbar);
	
	var loadedBox =  document.createElement("stack");
	loadedBox.setAttribute("id", "ESB_loaded_box");
	loadedBox.appendChild(loadedFinishedProgressbarHbox);
	loadedBox.appendChild(loadedWorkingProgressbarHbox);
	loadedBox.appendChild(loadedLabelHbox);
	
	//ESB_speed_box
	var speedLabel = document.createElement("label");
	speedLabel.setAttribute("id", "ESB_speed_label");
	var speedBox =  document.createElement("hbox");
	speedBox.setAttribute("id", "ESB_speed_box");
	speedBox.setAttribute("pack", "end");
	speedBox.setAttribute("align", "center");
	speedBox.appendChild(speedLabel);
	
	//ESB_time_box
	var timeLabel = document.createElement("label");
	timeLabel.setAttribute("id", "ESB_time_label");
	var timeBox =  document.createElement("hbox");
	timeBox.setAttribute("id", "ESB_time_box");
	timeBox.setAttribute("pack", "end");
	timeBox.setAttribute("align", "center");
	timeBox.appendChild(timeLabel);
	
	//ESB_status_bar
	var esbStatusBar = document.createElement("hbox");
	esbStatusBar.setAttribute("id", "ESB_status_bar");
	esbStatusBar.appendChild(percentBox);
	esbStatusBar.appendChild(imagesBox);
	esbStatusBar.appendChild(loadedBox);
	esbStatusBar.appendChild(speedBox);
	esbStatusBar.appendChild(timeBox);
	let esbToolbaritem = document.createElement("toolbaritem");
	esbToolbaritem.id = "ESB_toolbaritem";
	esbToolbaritem.setAttribute("removable", "true");
	esbToolbaritem.setAttribute("title", "Extended Statusbar");
	esbToolbaritem.appendChild(esbStatusBar);
	return esbToolbaritem;
}
function loadIntoWindow(window) 
{
	var document = window.document;
	
	//ESB_toolbaritem
	if(isPostAustralis)
	{		
		//ESB_toolbarspacer
		var esbToolbarspacer = document.createElement("toolbarspacer");
		esbToolbarspacer.setAttribute("id", "ESB_toolbarspacer");
		esbToolbarspacer.setAttribute("flex", "1");
		
		//ESB_toolbar
		var esbToolbar = document.createElement("toolbar");
		esbToolbar.setAttribute("id", "ESB_toolbar");
		esbToolbar.setAttribute("toolbarname", "Extended Statusbar");
		esbToolbar.setAttribute("toolboxid", "navigator-toolbox");
		esbToolbar.setAttribute("accesskey", "E");
		esbToolbar.setAttribute("class", "toolbar-primary chromeclass-toolbar");
		esbToolbar.setAttribute("customizable", "true");
		esbToolbar.setAttribute("context", "toolbar-context-menu");
		esbToolbar.setAttribute("hidden", "false");
		esbToolbar.setAttribute("collapsed", window.Application.prefs.getValue("extensions.extendedstatusbar.collapsed", false));
		window.addEventListener("unload", function(e){
			window.Application.prefs.setValue("extensions.extendedstatusbar.collapsed", document.getElementById("ESB_toolbar").collapsed);
		}, false);
		esbToolbar.setAttribute("persist", "hidden");
		esbToolbar.setAttribute("mode", "icons");
		esbToolbar.setAttribute("iconsize", "small");
		esbToolbar.setAttribute("onmouseover", "XULExtendedStatusbarChrome.showESBOnHover();");
		esbToolbar.setAttribute("onmouseout", "XULExtendedStatusbarChrome.hideESBOnHover();");
		esbToolbar.appendChild(esbToolbarspacer);
		
		document.getElementById("browser-bottombox").appendChild(esbToolbar);
	
		//Let the toolbar be customizable and element placement correctly saved
		CustomizableUI.registerArea("ESB_toolbar",{
			type: CustomizableUI.TYPE_TOOLBAR,
			defaultPlacements: ["ESB_toolbaritem","ESB_toolbarspacer"]});
	}
	else
	{	
		var esbToolbaritem = buildESB(document);
		
		var addonBar = document.getElementById("addon-bar");
		if (addonBar) 
		{
			addonBar.insertBefore(esbToolbaritem, addonBar.firstChild);
		}
		var addonBarCloseButton = document.getElementById("addonbar-closebutton");
		if (addonBarCloseButton) 
		{
			addonBar.removeChild(addonBarCloseButton);
		}
	}
		
/*	<toolbarpalette id="BrowserToolbarPalette">
		<toolbaritem id="ESB_toolbaritem" title="Extended Statusbar" removable="true">
			<hbox id="ESB_status_bar">
				<stack id="ESB_percent_box" tooltiptext="&esb.percentage;">
					<hbox>
						<hbox id="ESB_percent_progressbar"/>
					</hbox>
					<hbox pack="end" align="center">
						<label id="ESB_percent_label"/>
					</hbox>
				</stack>
				<hbox id="ESB_images_box" tooltiptext="&esb.loadedimages;" pack="center" align="center">
					<label id="ESB_images_label"/>
				</hbox>
				<stack id="ESB_loaded_box" tooltiptext="&esb.dataloaded;">
					<hbox>
						<hbox id="ESB_loaded_finished_progressbar" flex="1" hidden="true"/>
					</hbox>
					<hbox>
						<hbox id="ESB_loaded_working_progressbar" hidden="true"/>
					</hbox>
					<hbox pack="center" align="center">
						<label id="ESB_loaded_label"/>
					</hbox>
				</stack>
				<hbox id="ESB_speed_box" tooltiptext="&esb.avgspeed;" pack="end" align="center">
					<label id="ESB_speed_label"/>
				</hbox>
				<hbox id="ESB_time_box" tooltiptext="&esb.time;" pack="end" align="center">
					<label id="ESB_time_label"/>
				</hbox>
			</hbox>
		</toolbaritem>
	</toolbarpalette>
	
	<vbox id="browser-bottombox">
		<toolbar id="ESB_toolbar" toolbarname="Extended Statusbar" toolboxid="navigator-toolbox" accesskey="E" class="toolbar-primary chromeclass-toolbar" customizable="true" context="toolbar-context-menu" hidden="false" persist="hidden" mode="icons" iconsize="small" onmouseover="XULExtendedStatusbarChrome.showESBOnHover();" onmouseout="XULExtendedStatusbarChrome.hideESBOnHover();">
			<toolbarspacer id="ESB_toolbarspacer" flex="1"/>
		</toolbar>
	</vbox> */
	
	XPCOMUtils.defineLazyGetter(this, "XULExtendedStatusbarChrome", function() {
		Services.scriptloader.loadSubScript("chrome://extendedstatusbar/content/extendedstatusbar.js", window);
		return window.XULExtendedStatusbarChrome;
	});
		
	XULExtendedStatusbarChrome.init();
}
function unloadFromWindow(window) 
{
	var document = window.document;
	
	if (isPostAustralis)
	{
		var esbToolbar = document.getElementById("ESB_toolbar");
		if(esbToolbar)
		{
			document.getElementById("browser-bottombox").removeChild(esbToolbar);
			var externalToolbars = window.gNavToolbox.externalToolbars;
			externalToolbars.splice(externalToolbars.indexOf(esbToolbar), 1);
		}
	}
	else
	{
		var addonBar = document.getElementById("addon-bar");
		if (addonBar) 
		{
			var esbToolbarItem = document.getElementById("ESB_toolbaritem");
			if(esbToolbarItem)
			{
				addonBar.removeChild(esbToolbarItem);
			}
		}
	}
	
	XULExtendedStatusbarChrome.uninit();
}
function forEachOpenWindow(todo)  // Apply a function to all open browser windows
{
    var windows = Services.wm.getEnumerator("navigator:browser");
    while (windows.hasMoreElements())
        todo(windows.getNext().QueryInterface(Components.interfaces.nsIDOMWindow));
}
var WindowListener =
{
    onOpenWindow: function(xulWindow)
    {
        var window = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                              .getInterface(Components.interfaces.nsIDOMWindow);
        function onWindowLoad()
        {
            window.removeEventListener("load",onWindowLoad);
            if (window.document.documentElement.getAttribute("windowtype") == "navigator:browser")
                loadIntoWindow(window);
        }
        window.addEventListener("load",onWindowLoad);
    },
    onCloseWindow: function(xulWindow) { },
    onWindowTitleChange: function(xulWindow, newTitle) { }
};

// default pref handler

function getGenericPref(branch,prefName)
{
    switch (branch.getPrefType(prefName))
    {
        default:
        case 0:   return undefined;                      // PREF_INVALID
        case 32:  return getUCharPref(prefName,branch);  // PREF_STRING
        case 64:  return branch.getIntPref(prefName);    // PREF_INT
        case 128: return branch.getBoolPref(prefName);   // PREF_BOOL
    }
}
function setGenericPref(branch,prefName,prefValue)
{
    switch (typeof prefValue)
    {
      case "string":
          setUCharPref(prefName,prefValue,branch);
          return;
      case "number":
          branch.setIntPref(prefName,prefValue);
          return;
      case "boolean":
          branch.setBoolPref(prefName,prefValue);
          return;
    }
}
function setDefaultPref(prefName,prefValue)
{
    var defaultBranch = Services.prefs.getDefaultBranch(null);
    setGenericPref(defaultBranch,prefName,prefValue);
}
function getUCharPref(prefName,branch)  // Unicode getCharPref
{
    branch = branch ? branch : Services.prefs;
    return branch.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
}
function setUCharPref(prefName,text,branch)  // Unicode setCharPref
{
    var string = Components.classes["@mozilla.org/supports-string;1"]
                           .createInstance(Components.interfaces.nsISupportsString);
    string.data = text;
    branch = branch ? branch : Services.prefs;
    branch.setComplexValue(prefName, Components.interfaces.nsISupportsString, string);
}