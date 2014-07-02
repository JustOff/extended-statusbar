/**
 * XULExtendedStatusbarChrome namespace.
 */
if ("undefined" == typeof(XULExtendedStatusbarChrome)) {
  var XULExtendedStatusbarChrome = {};
}

/*          Vars         */
XULExtendedStatusbarChrome.started = false;    		// If True ESB is started
XULExtendedStatusbarChrome.esbHide;    				// If True ESB will hide
XULExtendedStatusbarChrome.esbWait;    				// How long to wait before hiding
XULExtendedStatusbarChrome.hideTimeOut;    			// Name says it all
XULExtendedStatusbarChrome.esbTimeOutSem = false;	// True only if the timeout is active
XULExtendedStatusbarChrome.esbHideToolbar;    		// True if we hide the whole toolbar
XULExtendedStatusbarChrome.showOnHover;    			// If True ESB will be displayed while hovering over the status bar
XULExtendedStatusbarChrome.hoverWait;  				// How long to hover before showing ESB
XULExtendedStatusbarChrome.hoverSem;   				// True only if hover is in progress
XULExtendedStatusbarChrome.hoverTimeOut;			// Name says it all
XULExtendedStatusbarChrome.hideForSites;   			// RegExp of sites on which to hide ESB
XULExtendedStatusbarChrome.hideForSitesSem = false; // Only true if the current site matches hideForSites
XULExtendedStatusbarChrome.esbLoading = false; 		// True while the page is loading
XULExtendedStatusbarChrome.esbSlimMode;
XULExtendedStatusbarChrome.esbHideCursor;
XULExtendedStatusbarChrome.esbHideProgress;
XULExtendedStatusbarChrome.esbIWebProgressListener = Components.interfaces.nsIWebProgressListener;  //this has to have a unique name because a lot of oxtensions are using it

// The following variables are needed in order to backup/restore style defined width when we switch slim mode on/off
XULExtendedStatusbarChrome.status_bar_width;
XULExtendedStatusbarChrome.percent_box_width;
XULExtendedStatusbarChrome.images_box_width;
XULExtendedStatusbarChrome.loaded_box_width;
XULExtendedStatusbarChrome.speed_box_width;
XULExtendedStatusbarChrome.time_box_width;
XULExtendedStatusbarChrome.percent_progressbar_width;
XULExtendedStatusbarChrome.loaded_working_progressbar_width;
XULExtendedStatusbarChrome.loaded_finished_progressbar_width;

XULExtendedStatusbarChrome.init = function ()
{
	var toolbaritem = document.getElementById("ESB_toolbaritem");
	if(toolbaritem)
	{
		if(!XULExtendedStatusbarChrome.started && CustomizableUI.getPlaceForItem(toolbaritem) == "toolbar")
		{
			XULExtendedStatusbarChrome.esbXUL.init();
			XULExtendedStatusbarChrome.ESB_PrefObserver.startup();
			XULExtendedStatusbarChrome.esbListener.init();
			window.getBrowser().addTabsProgressListener(XULExtendedStatusbarChrome.esbListener);
			XULExtendedStatusbarChrome.started = true;
			XULExtendedStatusbarChrome.addContextMenuItem();
			console.log("ExtendedStatusbar started");
		}
		else if(XULExtendedStatusbarChrome.started && (CustomizableUI.getPlaceForItem(toolbaritem) == "palette" || CustomizableUI.getPlaceForItem(toolbaritem) == "panel"))
		{
			XULExtendedStatusbarChrome.uninit();
			XULExtendedStatusbarChrome.started = false;
			XULExtendedStatusbarChrome.removeContextMenuItem();
			console.log("ExtendedStatusbar stopped");
		}
	}
}

XULExtendedStatusbarChrome.uninit = function ()
{
	XULExtendedStatusbarChrome.ESB_PrefObserver.shutdown();
	XULExtendedStatusbarChrome.esbXUL.destroy();
	XULExtendedStatusbarChrome.esbListener.destroy();
	window.getBrowser().removeTabsProgressListener(XULExtendedStatusbarChrome.esbListener);
}

XULExtendedStatusbarChrome.addContextMenuItem = function ()
{
    if (document.getElementById("ESB_options_context_item")) return;
    var menu = document.getElementById("toolbar-context-menu");
	if(!menu) return;
	
	var menuseparator = document.createElement("menuseparator");
    menuseparator.setAttribute("id", "ESB_context_separator");
    menu.insertBefore(menuseparator, menu.firstChild);
	
    var itemTime = document.createElement("menuitem");
    itemTime.setAttribute("id", "ESB_time_context_item");
    itemTime.setAttribute("type", "checkbox");
    itemTime.setAttribute("checked", !XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.getBoolPref("hidetime"));
    itemTime.setAttribute("label", "Show time");
    itemTime.setAttribute("accesskey", "t");
    itemTime.addEventListener("click", 
		function(e)
		{
			XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.setBoolPref("hidetime", document.getElementById("ESB_time_context_item").getAttribute("checked"));
			e.preventDefault();
			return true;
		}
	);
    menu.insertBefore(itemTime, menu.firstChild);
	
    var itemSpeed = document.createElement("menuitem");
    itemSpeed.setAttribute("id", "ESB_speed_context_item");
    itemSpeed.setAttribute("type", "checkbox");
    itemSpeed.setAttribute("checked", !XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.getBoolPref("hidespeed"));
    itemSpeed.setAttribute("label", "Show speed");
    itemSpeed.setAttribute("accesskey", "s");
    itemSpeed.addEventListener("click", 
		function(e)
		{
			XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.setBoolPref("hidespeed", document.getElementById("ESB_speed_context_item").getAttribute("checked"));
			e.preventDefault();
			return true;
		}
	);
    menu.insertBefore(itemSpeed, menu.firstChild);
	
    var itemLoaded = document.createElement("menuitem");
    itemLoaded.setAttribute("id", "ESB_loaded_context_item");
    itemLoaded.setAttribute("type", "checkbox");
    itemLoaded.setAttribute("checked", !XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.getBoolPref("hideloaded"));
    itemLoaded.setAttribute("label", "Show images");
    itemLoaded.setAttribute("accesskey", "i");
    itemLoaded.addEventListener("click", 
		function(e)
		{
			XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.setBoolPref("hideloaded", document.getElementById("ESB_loaded_context_item").getAttribute("checked"));
			e.preventDefault();
			return true;
		}
	);
    menu.insertBefore(itemLoaded, menu.firstChild);
	
    var itemImages = document.createElement("menuitem");
    itemImages.setAttribute("id", "ESB_images_context_item");
    itemImages.setAttribute("type", "checkbox");
    itemImages.setAttribute("checked", !XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.getBoolPref("hideimages"));
    itemImages.setAttribute("label", "Show loaded");
    itemImages.setAttribute("accesskey", "l");
    itemImages.addEventListener("click", 
		function(e)
		{
			XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.setBoolPref("hideimages", document.getElementById("ESB_images_context_item").getAttribute("checked"));
			e.preventDefault();
			return true;
		}
	);
    menu.insertBefore(itemImages, menu.firstChild);
	
    var itemPercent = document.createElement("menuitem");
    itemPercent.setAttribute("id", "ESB_percent_context_item");
    itemPercent.setAttribute("type", "checkbox");
    itemPercent.setAttribute("checked", !XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.getBoolPref("hidepercent"));
    itemPercent.setAttribute("label", "Show percent");
    itemPercent.setAttribute("accesskey", "p");
    itemPercent.addEventListener("click", 
		function(e)
		{
			XULExtendedStatusbarChrome.ESB_PrefObserver.prefs.setBoolPref("hidepercent", document.getElementById("ESB_percent_context_item").getAttribute("checked"));
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return true;
		}
	);
    menu.insertBefore(itemPercent, menu.firstChild);
	
    var itemOptions = document.createElement("menuitem");
    itemOptions.setAttribute("id", "ESB_options_context_item");
    itemOptions.setAttribute("label", "Options Menu");
    itemOptions.setAttribute("accesskey", "O");
    itemOptions.addEventListener("command", XULExtendedStatusbarChrome.openESBOptions);
    menu.insertBefore(itemOptions, menu.firstChild);
	
    menu.addEventListener("popupshowing", XULExtendedStatusbarChrome.onContextMenuPopupShowing);
}
	
XULExtendedStatusbarChrome.removeContextMenuItem = function ()
{
	var menu = document.getElementById("toolbar-context-menu");
	menu.removeEventListener("popupshowing", XULExtendedStatusbarChrome.onContextMenuPopupShowing);
	menu.removeChild(document.getElementById("ESB_context_separator"));
	menu.removeChild(document.getElementById("ESB_time_context_item"));
	menu.removeChild(document.getElementById("ESB_speed_context_item"));
	menu.removeChild(document.getElementById("ESB_images_context_item"));
	menu.removeChild(document.getElementById("ESB_loaded_context_item"));
	menu.removeChild(document.getElementById("ESB_percent_context_item"));
	menu.removeChild(document.getElementById("ESB_options_context_item"));
}

XULExtendedStatusbarChrome.onContextMenuPopupShowing = function (event)
{
	var hiding = !document.getElementById("ESB_toolbaritem").contains(document.popupNode);
	document.getElementById("ESB_context_separator").hidden = hiding;
	document.getElementById("ESB_time_context_item").hidden = hiding;
	document.getElementById("ESB_speed_context_item").hidden = hiding;
	document.getElementById("ESB_images_context_item").hidden = hiding;
	document.getElementById("ESB_loaded_context_item").hidden = hiding;
	document.getElementById("ESB_percent_context_item").hidden = hiding;
	document.getElementById("ESB_options_context_item").hidden = hiding;
}

XULExtendedStatusbarChrome.hideESB = function ()
{
	if (XULExtendedStatusbarChrome.esbTimeOutSem)
	{
		if (XULExtendedStatusbarChrome.esbHideToolbar)
		{
			XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = true;
		}
		else
		{
			XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = true;
		}
		XULExtendedStatusbarChrome.esbTimeOutSem = false;
	}
}

XULExtendedStatusbarChrome.cancelTimeOut = function (TimeOut)
{
	if (XULExtendedStatusbarChrome.esbTimeOutSem)
	{
		window.clearTimeout(TimeOut);
		XULExtendedStatusbarChrome.esbTimeOutSem = false;
	}
}

XULExtendedStatusbarChrome.cancelHover = function (Hover)
{
	if (XULExtendedStatusbarChrome.hoverSem)
	{
		window.clearTimeout(Hover);
		XULExtendedStatusbarChrome.hoverSem = false;
	}
}

XULExtendedStatusbarChrome.showESBOnHover = function ()
{
	if (XULExtendedStatusbarChrome.esbHide && XULExtendedStatusbarChrome.showOnHover && !XULExtendedStatusbarChrome.esbLoading)
	{
		XULExtendedStatusbarChrome.hoverSem = true;
		XULExtendedStatusbarChrome.hoverTimeOut = window.setTimeout(function()
		{
			XULExtendedStatusbarChrome.hoverSem = false;
			XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
			XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = false;
		}, XULExtendedStatusbarChrome.hoverWait);
	}
}

XULExtendedStatusbarChrome.hideESBOnHover = function ()
{
	if (XULExtendedStatusbarChrome.esbHide && XULExtendedStatusbarChrome.showOnHover && !XULExtendedStatusbarChrome.esbLoading)
	{
		XULExtendedStatusbarChrome.cancelHover(XULExtendedStatusbarChrome.hoverTimeOut);
		if (!XULExtendedStatusbarChrome.esbXUL.status_bar.hidden)
		{
			XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
			XULExtendedStatusbarChrome.esbTimeOutSem = true;
			XULExtendedStatusbarChrome.hideTimeOut = window.setTimeout("XULExtendedStatusbarChrome.hideESB()", XULExtendedStatusbarChrome.esbWait*1000);
		}
	}
}

//Let the toolbar be customizable and element placement correctly saved
CustomizableUI.registerArea("ESB_toolbar",{
	type: CustomizableUI.TYPE_TOOLBAR,
	defaultPlacements: ["ESB_toolbaritem","ESB_toolbarspacer"]});

//Load progress listeners at window load
window.addEventListener("load", XULExtendedStatusbarChrome.init, false);
window.addEventListener("unload", XULExtendedStatusbarChrome.uninit, false);
window.addEventListener("customizationchange", XULExtendedStatusbarChrome.init, false);

XULExtendedStatusbarChrome.esbXUL =
{
	esbstrings: null,
	esb_gBundle: null,

	get esb_toolbar() {return document.getElementById("ESB_toolbar");},
	get status_bar() {return document.getElementById("ESB_status_bar");},
	get images_box() {return document.getElementById("ESB_images_box");},
	get images_label() {return document.getElementById("ESB_images_label");},
	get speed_box() {return document.getElementById("ESB_speed_box");},
	get speed_label() {return document.getElementById("ESB_speed_label");},
	get time_box() {return document.getElementById("ESB_time_box");},
	get time_label() {return document.getElementById("ESB_time_label");},
	get percent_box() {return document.getElementById("ESB_percent_box");},
	get percent_label() {return document.getElementById("ESB_percent_label");},
	get percent_progressbar() {return document.getElementById("ESB_percent_progressbar");},
	get loaded_box() {return document.getElementById("ESB_loaded_box");},
	get loaded_label() {return document.getElementById("ESB_loaded_label");},
	get loaded_working_progressbar() {return document.getElementById("ESB_loaded_working_progressbar");},
	get loaded_finished_progressbar() {return document.getElementById("ESB_loaded_finished_progressbar");},
	
	init: function()
	{
		this.esb_gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		this.esbstrings = this.esb_gBundle.createBundle("chrome://extendedstatusbar/locale/extendedstatusbar.properties");
		
		// Display ESB before other items in the addon-bar
		// var addonBar = document.getElementById("addon-bar");
		// if (addonBar) {
			// var extbar = addonBar.removeChild(document.getElementById("extended-statusbar"));
			// addonBar.insertBefore(extbar, addonBar.firstChild);
			// addonBar.collapsed = false;
			
			// Remove Addonbar Close Button
			// var addonBarCloseButton = document.getElementById("addonbar-closebutton");
			// if (addonBarCloseButton) {
				// addonBar.removeChild(addonBarCloseButton);
			// }
		// }
	},

	destroy: function()
	{
		this.esb_gBundle = null;
		this.esbstrings = null;
	},
}

XULExtendedStatusbarChrome.esbListener =
{
	updateTimeInterval: "",

	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
			aIID.equals(Components.interfaces.nsIWebProgressListener2) ||
			aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
			aIID.equals(Components.interfaces.nsIXULBrowserWindow) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE;
	},

	init: function()
	{
		gBrowser.tabContainer.addEventListener("TabSelect", this.onTabSelect, false);
	},

	destroy: function()
	{
		gBrowser.tabContainer.removeEventListener("TabSelect", this.onTabSelect, false);
	},
	
	onTabSelect : function(aEvent) 
	{
		if (XULExtendedStatusbarChrome.hideForSites && 
			aEvent.target.linkedBrowser.contentDocument.location.href.match(XULExtendedStatusbarChrome.hideForSites))
		{
			XULExtendedStatusbarChrome.hideForSitesSem = true;
			XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = true;
			XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = true;
		}
		else if(XULExtendedStatusbarChrome.esbLoading || !XULExtendedStatusbarChrome.esbHide)
		{
			XULExtendedStatusbarChrome.hideForSitesSem = false;
			XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
			XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = false;
			XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = false;
		}
		XULExtendedStatusbarChrome.esbListener.displayCurrentValuesForBrowser(aEvent.target.linkedBrowser);
	},

	initObjectValuesForBrowser : function(aBrowser)
	{
		aBrowser.esbValues = { images: "0/0", 
								loaded: "0", 
								speed: "0", 
								time: "0" + XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.dot") + "000", 
								percent: "0", 
								stateFlags: 0,
								startProg: new Date(),
								updateTimeInterval: "" };
	},
	
	displayCurrentValuesForBrowser : function(aBrowser) 
	{
		if(!aBrowser.esbValues) return;
		
		var percentageString = aBrowser.esbValues.percent + "%";
		while (percentageString.length < 4)
		{
			percentageString = " " + percentageString;
		}
		var compdocsize = aBrowser.esbValues.loaded;
		for (var sizeinval = 0; Math.floor(compdocsize / 1024) > 0; sizeinval++)
		{
			compdocsize /= 1024;
		}
		switch (sizeinval)
		{
			case 0: sizeinval = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.kb");
					compdocsize = Math.floor(compdocsize * 100)/100;
					break;
			case 1: sizeinval = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.mb");
					compdocsize = Math.floor(compdocsize * 100)/100;
					break;
			case 2: sizeinval = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.gb");
					compdocsize = Math.floor(compdocsize * 100)/100;
					break;
			default: sizeinval = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.nosize");
					break;
		}
			
		if (XULExtendedStatusbarChrome.esbSlimMode)
		{
			XULExtendedStatusbarChrome.esbXUL.images_label.value = aBrowser.esbValues.images;
			XULExtendedStatusbarChrome.esbXUL.loaded_label.value = compdocsize + " " + sizeinval;
			XULExtendedStatusbarChrome.esbXUL.speed_label.value = aBrowser.esbValues.speed + " " + XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.kbps");
			XULExtendedStatusbarChrome.esbXUL.time_label.value = aBrowser.esbValues.time;
			XULExtendedStatusbarChrome.esbXUL.percent_label.value = percentageString;
		}
		else
		{
			XULExtendedStatusbarChrome.esbXUL.images_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.images") + " " + aBrowser.esbValues.images;
			XULExtendedStatusbarChrome.esbXUL.loaded_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.loaded") + " " + compdocsize + " " + sizeinval;
			XULExtendedStatusbarChrome.esbXUL.speed_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.speed") + " " + aBrowser.esbValues.speed + " " + XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.kbps");
			XULExtendedStatusbarChrome.esbXUL.time_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time") + " " + aBrowser.esbValues.time;
			XULExtendedStatusbarChrome.esbXUL.percent_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.document") + " " + percentageString;
		}
		
		if (aBrowser.esbValues.stateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_START &&     //Start only if network activity,
			aBrowser.esbValues.stateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_IS_NETWORK)  //so that ESB doesn't fire up on blank tabs/windows
		{
			if (!XULExtendedStatusbarChrome.hideForSitesSem)
			{
				XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
				XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = false;
				XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = false;
			}
			
			if(XULExtendedStatusbarChrome.esbHideProgress) 
			{
				XULExtendedStatusbarChrome.esbXUL.percent_progressbar.hidden = true;
			}
			var progressBorderWidth = parseInt(XULExtendedStatusbarChrome.esbXUL.percent_box.style.borderRight);
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = Math.round(aBrowser.esbValues.percent * (XULExtendedStatusbarChrome.esbXUL.percent_box.boxObject.width - (isNaN(progressBorderWidth) ? 1 : progressBorderWidth) - 2) / 100);
			
			XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.width = compdocsize*4 % XULExtendedStatusbarChrome.esbXUL.loaded_box.boxObject.width;
			
			if(XULExtendedStatusbarChrome.esbHideCursor) 
			{
				XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.hidden = true;
			}
			else
			{
				XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.hidden = false;
			}
		}
		else if (aBrowser.esbValues.stateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_STOP &&
				 aBrowser.esbValues.stateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_IS_NETWORK)
		{
			XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.hidden = true;
			var progressBorderWidth = parseInt(XULExtendedStatusbarChrome.esbXUL.percent_box.style.borderRight);
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = XULExtendedStatusbarChrome.esbXUL.percent_box.boxObject.width - (isNaN(progressBorderWidth) ? 1 : progressBorderWidth);
			
			// Set size of panels to fit content, so the ESB elements don't always move left-right because the labels resize automatically
			if (XULExtendedStatusbarChrome.esbXUL.percent_box.width < XULExtendedStatusbarChrome.esbXUL.percent_box.boxObject.width)
				XULExtendedStatusbarChrome.esbXUL.percent_box.width = XULExtendedStatusbarChrome.esbXUL.percent_box.boxObject.width;
			if (XULExtendedStatusbarChrome.esbXUL.images_box.width < XULExtendedStatusbarChrome.esbXUL.images_box.boxObject.width)
			  XULExtendedStatusbarChrome.esbXUL.images_box.width = XULExtendedStatusbarChrome.esbXUL.images_box.boxObject.width;
			if (XULExtendedStatusbarChrome.esbXUL.loaded_box.width < XULExtendedStatusbarChrome.esbXUL.loaded_box.boxObject.width)
			  XULExtendedStatusbarChrome.esbXUL.loaded_box.width = XULExtendedStatusbarChrome.esbXUL.loaded_box.boxObject.width;
			if (XULExtendedStatusbarChrome.esbXUL.speed_box.width < XULExtendedStatusbarChrome.esbXUL.speed_box.boxObject.width)
			  XULExtendedStatusbarChrome.esbXUL.speed_box.width = XULExtendedStatusbarChrome.esbXUL.speed_box.boxObject.width;
			if (XULExtendedStatusbarChrome.esbXUL.time_box.width < XULExtendedStatusbarChrome.esbXUL.time_box.boxObject.width)
			  XULExtendedStatusbarChrome.esbXUL.time_box.width = XULExtendedStatusbarChrome.esbXUL.time_box.boxObject.width;

			// Set hide timeout
			if(XULExtendedStatusbarChrome.esbHide && !XULExtendedStatusbarChrome.esbTimeOutSem)
			{
				XULExtendedStatusbarChrome.esbTimeOutSem = true;
				XULExtendedStatusbarChrome.hideTimeOut = window.setTimeout("XULExtendedStatusbarChrome.hideESB()", XULExtendedStatusbarChrome.esbWait*1000);
			}
		}
	},
	
	onStateChange: function(aBrowser, aWebProgress, aRequest, aStateFlags, aStatus)
	{		
		if (aStateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_START &&     //Start only if network activity,
			aStateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_IS_NETWORK)  //so that ESB doesn't fire up on blank tabs/windows
		{
			this.initObjectValuesForBrowser(aBrowser);
			aBrowser.esbValues.stateFlags = aStateFlags;
			this.startTimer(aBrowser);
			
			if(aBrowser == gBrowser.selectedBrowser)
			{
				XULExtendedStatusbarChrome.esbLoading = true;
				this.displayCurrentValuesForBrowser(aBrowser);
			}
		}
		else if (aStateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_STOP &&
				 aStateFlags & XULExtendedStatusbarChrome.esbIWebProgressListener.STATE_IS_NETWORK)
		{
			if(!aBrowser.esbValues)
			{
				this.initObjectValuesForBrowser(aBrowser);
			}
			aBrowser.esbValues.stateFlags = aStateFlags;
			aBrowser.esbValues.percent = "100";
			this.stopTimer(aBrowser);
			
			this.updateTime(aBrowser);
			if(aBrowser == gBrowser.selectedBrowser)
			{
				XULExtendedStatusbarChrome.esbLoading = false;
				this.displayCurrentValuesForBrowser(aBrowser);
			}
		}
	},
	
	// aWebProgress might be null https://bugzilla.mozilla.org/show_bug.cgi?id=693970
	onProgressChange: function (aBrowser, aWebProgress, aRequest,
								 aCurSelfProgress, aMaxSelfProgress,
								 aCurTotalProgress, aMaxTotalProgress)
	{
		if (aMaxTotalProgress > 0)
		{
			if(!aBrowser.esbValues)
			{
				this.initObjectValuesForBrowser(aBrowser);
			}
			var percentage = Math.round((aCurTotalProgress * 100) / aMaxTotalProgress);	
			var docimgs = aBrowser.contentDocument.images;
			var imglcount = 0;
			var allimgsc = 0;
			if (docimgs != null)
			{
				allimgsc = docimgs.length;
				for (var i = 0; i < docimgs.length; i++)
				{
					if (docimgs[i].complete) imglcount++;
				}
				for (var i = 0; i < aBrowser.contentWindow.frames.length; i++)
				{
					docimgs = aBrowser.contentWindow.frames[i].document.images;
					allimgsc += docimgs.length;
					for (var j = 0; j < docimgs.length; j++)
					{
						if (docimgs[j].complete) imglcount++;
					}
				}
			}			
			var now = new Date();
			now = now.getTime() - aBrowser.esbValues.startProg.getTime();
			if (XULExtendedStatusbarChrome.esbLoading) this.startTimer(aBrowser); //This is a workaround for the first run, esbLoading is false on FF first start,
											   //so time wont be started. This is a problem
											   //if FF starts with about:blank State_Stop is not called
											   //so the time doesn't stop for the first page
			if (now > 0)
			{
				var speed = aCurTotalProgress / now * 1000;
				speed = Math.round ( speed * 100) / 100;
				speed = speed.toFixed(2);
				speed = speed.toString().replace(/\./, XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.dot")); //Replace '.' with a symbol from the active local
			}
			aBrowser.esbValues.percent = percentage;
			aBrowser.esbValues.images = imglcount + "/" + allimgsc;
			aBrowser.esbValues.loaded = aCurTotalProgress;
			aBrowser.esbValues.speed = speed;
			
			this.updateTime(aBrowser);
			if(aBrowser == gBrowser.selectedBrowser)
			{
				this.displayCurrentValuesForBrowser(aBrowser);
			}
		}
	},

	onProgressChange64: function (aBrowser, aWebProgress, aRequest,
				 aCurSelfProgress, aMaxSelfProgress,
				 aCurTotalProgress, aMaxTotalProgress)
	{
		return this.onProgressChange(aBrowser, aWebProgress, aRequest,
									 aCurSelfProgress, aMaxSelfProgress,
									 aCurTotalProgress, aMaxTotalProgress);
	},

	onLocationChange: function (aBrowser, aWebProgress , aRequest , aLocation, aFlags)
	{
		if(aLocation)
		{
			if (XULExtendedStatusbarChrome.hideForSites && aLocation.spec.match(XULExtendedStatusbarChrome.hideForSites))
			{
				XULExtendedStatusbarChrome.hideForSitesSem = true;
				XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = true;
				XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = true;
			}
			else
			{
				XULExtendedStatusbarChrome.hideForSitesSem = false;
				XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
				XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = false;
				XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = false;
			}
		}
		else
		{
			XULExtendedStatusbarChrome.hideForSitesSem = false;
		}
	},
	
	onStatusChange: function(a,b,c,d){},
	
	onSecurityChange: function(a,b,c){},

	updateTime: function (aBrowser)
	{
		var now = new Date();
		now = now.getTime() - aBrowser.esbValues.startProg.getTime();
		var hours = Math.floor((now / 3600000) % 24);
		var mins = Math.floor((now / 60000) % 60);
		var secs = Math.floor((now / 1000) % 60);
		var msecs = now - hours*36000 - mins*60000 - secs*1000;
		secs = secs.toString();
		msecs = msecs.toString();
		if (msecs.length == 1) msecs = "00" + msecs;
		else if (msecs.length == 2) msecs = "0" + msecs;
		var dot = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.dot");
		var colon = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.colon");
		var slimTimeString;
		var timeString;
		if (hours > 0)
		{
			mins = mins.toString();
			if (mins.length == 1) mins = "0" + mins;
			timeString = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time") + " " + hours + colon + mins + colon + secs + dot + msecs;
			slimTimeString = hours + colon + mins + colon + secs + dot + msecs;
		}
		else
		{
			if (mins > 0)
			{
				if (secs.length == 1) secs = "0" + secs;
				mins = mins.toString();
				timeString = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time") + " " + mins + colon + secs + dot + msecs;
				slimTimeString = mins + colon + secs + dot + msecs;
			}
			else
			{
				timeString = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time") + " " + secs + dot + msecs;
				slimTimeString = secs + dot + msecs;
			}
		}
		aBrowser.esbValues.time = slimTimeString;
		if(gBrowser.selectedBrowser == aBrowser)
		{
			if (XULExtendedStatusbarChrome.esbSlimMode)
			{
				XULExtendedStatusbarChrome.esbXUL.time_label.value = slimTimeString;
			}
			else
			{
				XULExtendedStatusbarChrome.esbXUL.time_label.value = timeString;
			}
		}
	},

	startTimer: function(aBrowser)
	{
		if (aBrowser.esbValues.updateTimeInterval != "")
		{
			clearInterval(aBrowser.esbValues.updateTimeInterval);
		}
		aBrowser.esbValues.updateTimeInterval = setInterval(XULExtendedStatusbarChrome.esbListener.updateTime(aBrowser), 768);
	},

	stopTimer: function(aBrowser)
	{
		if (aBrowser.esbValues.updateTimeInterval != "")
		{
			clearInterval(aBrowser.esbValues.updateTimeInterval);
			aBrowser.esbValues.updateTimeInterval = "";
		}
	}
}

// Settings observer
XULExtendedStatusbarChrome.ESB_PrefObserver = {
	prefs: null,

	// Initialize the extension
	startup: function()
	{
		// Register to receive notifications of preference changes
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
					 .getService(Components.interfaces.nsIPrefService)
					 .getBranch("extensions.extendedstatusbar.");
		//this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);      //this is for Gecko 1.8 only (FF3)
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		this.prefs.addObserver("", this, false);

		XULExtendedStatusbarChrome.esbHide = this.prefs.getBoolPref("hide");
		XULExtendedStatusbarChrome.esbHideToolbar = this.prefs.getBoolPref("hidetoolbar");
		XULExtendedStatusbarChrome.esbWait = this.prefs.getIntPref("hidetimeout");
		XULExtendedStatusbarChrome.showOnHover = this.prefs.getBoolPref("showonhover");
		XULExtendedStatusbarChrome.hoverWait = this.prefs.getIntPref("hovertimeout");
		//XULExtendedStatusbarChrome.hideForSites = this.prefs.getCharPref("hideonsites");
		if (this.prefs.getCharPref("hideonsites") != "")
		{
			XULExtendedStatusbarChrome.hideForSites = new RegExp(this.prefs.getCharPref("hideonsites")
							.replace(/\|$/, "")					//Remove last '|'
							.replace(/(\W)/g, "\\$1")			//Escape all special characters
							.replace(/\\\|/g, "|")				//Unescape from '|'
							.replace(/\\\*/g, ".*")				//Replace '\*' with '.*'
							.replace(/(^\.\*)|(\.\*$)/g, "")	//Remove '.*' on start and end
							.replace(/(\.\*\|)/g,"|")			//Remove '.*' left of'|'
							.replace(/(\|\.\*)/g, "|"));		//Remove '.*' right of'|'
		}
		else
		{
			XULExtendedStatusbarChrome.hideForSites = null;
		}

		if (this.prefs.getBoolPref("slimmode")) XULExtendedStatusbarChrome.esbSlimMode = true;
		else XULExtendedStatusbarChrome.esbSlimMode = false;
		
		// Set style
		XULExtendedStatusbarChrome.status_bar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.status_bar).getPropertyValue('width'));
		XULExtendedStatusbarChrome.percent_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_box).getPropertyValue('width'));
		XULExtendedStatusbarChrome.images_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.images_box).getPropertyValue('width'));
		XULExtendedStatusbarChrome.loaded_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_box).getPropertyValue('width'));
		XULExtendedStatusbarChrome.speed_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.speed_box).getPropertyValue('width'));
		XULExtendedStatusbarChrome.time_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.time_box).getPropertyValue('width'));
		XULExtendedStatusbarChrome.percent_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_progressbar).getPropertyValue('width'));
		XULExtendedStatusbarChrome.loaded_working_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar).getPropertyValue('width'));
		XULExtendedStatusbarChrome.loaded_finished_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar).getPropertyValue('width'));
		this.applyStyle();
		
		if (this.prefs.getBoolPref("hidecursor"))
		{
			XULExtendedStatusbarChrome.esbHideCursor = true;
			XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.hidden = true;
		}
		else
		{
			XULExtendedStatusbarChrome.esbHideCursor = false;
			XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.hidden = false;
		}
		
		if (this.prefs.getBoolPref("hideprogress"))
		{
			XULExtendedStatusbarChrome.esbHideProgress = true;
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.hidden = true;
		}
		else
		{
			XULExtendedStatusbarChrome.esbHideProgress = false;
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.hidden = false;
		}

		if (this.prefs.getBoolPref("hideimages")) XULExtendedStatusbarChrome.esbXUL.images_box.hidden = true;
		if (this.prefs.getBoolPref("hideloaded")) XULExtendedStatusbarChrome.esbXUL.loaded_box.hidden = true;
		if (this.prefs.getBoolPref("hidespeed")) XULExtendedStatusbarChrome.esbXUL.speed_box.hidden = true;
		if (this.prefs.getBoolPref("hidetime")) XULExtendedStatusbarChrome.esbXUL.time_box.hidden = true;
		if (this.prefs.getBoolPref("hidepercent")) XULExtendedStatusbarChrome.esbXUL.percent_box.hidden = true;
	},

	// Clean up after ourselves and save the prefs
	shutdown: function()
	{
		this.prefs.removeObserver("", this);
	},

	// Called when events occur on the preferences
	observe: function(subject, topic, data)
	{
		if (topic != "nsPref:changed") return;
		
		switch(data)
		{
			case "hide":
				XULExtendedStatusbarChrome.esbHide = this.prefs.getBoolPref("hide");
				if (!XULExtendedStatusbarChrome.esbHide)
				{
					XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = false;
					XULExtendedStatusbarChrome.esbXUL.status_bar.hidden = false;
				}
				else if (!XULExtendedStatusbarChrome.esbLoading)
				{
					XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
					XULExtendedStatusbarChrome.esbTimeOutSem = true;
					XULExtendedStatusbarChrome.hideTimeOut = window.setTimeout("XULExtendedStatusbarChrome.hideESB()", XULExtendedStatusbarChrome.esbWait*1000);
				}
				break;
			case "hidetoolbar":
				XULExtendedStatusbarChrome.esbHideToolbar = this.prefs.getBoolPref("hidetoolbar");
				if (!XULExtendedStatusbarChrome.esbHideToolbar)
				{
					XULExtendedStatusbarChrome.esbXUL.esb_toolbar.hidden = false;
				}
				if (XULExtendedStatusbarChrome.esbHide && !XULExtendedStatusbarChrome.esbLoading)
				{
					XULExtendedStatusbarChrome.cancelTimeOut(XULExtendedStatusbarChrome.hideTimeOut);
					XULExtendedStatusbarChrome.esbTimeOutSem = true;
					XULExtendedStatusbarChrome.hideTimeOut = window.setTimeout("XULExtendedStatusbarChrome.hideESB()", XULExtendedStatusbarChrome.esbWait*1000);
				}
				break;
			case "hidetimeout":
				XULExtendedStatusbarChrome.esbWait = this.prefs.getIntPref("hidetimeout");
				break;
			case "showonhover":
				XULExtendedStatusbarChrome.showOnHover = this.prefs.getBoolPref("showonhover");
				break;
			case "hovertimeout":
				XULExtendedStatusbarChrome.hoverWait = this.prefs.getIntPref("hovertimeout");
				break;
			case "backgroundcolor":
				this.clearStyle(["ESB_status_bar"]);
				this.appendStyleAtribute("ESB_status_bar", "background-color", this.prefs.getCharPref("backgroundcolor"));
				this.appendStyleAtribute("ESB_status_bar", "color", this.prefs.getCharPref("textcolor"));
				break;
			case "progresscolor":
				this.appendStyleAtribute("ESB_percent_progressbar", "background-color", this.prefs.getCharPref("progresscolor"));
				this.appendStyleAtribute("ESB_loaded_finished_progressbar", "background-color", this.prefs.getCharPref("progresscolor"));
				break;
			case "cursorcolor":
				this.appendStyleAtribute("ESB_loaded_working_progressbar", "border-right", "10px solid " + this.prefs.getCharPref("cursorcolor"));
				break;
			case "textcolor":
				this.appendStyleAtribute("ESB_status_bar", "color", this.prefs.getCharPref("textcolor"));
				break;
			case "usecustomcolor":
				this.applyStyle();
				break;
			case "hideonsites":
				if (this.prefs.getCharPref("hideonsites") != "")
				{
					XULExtendedStatusbarChrome.hideForSites = new RegExp(this.prefs.getCharPref("hideonsites")
									.replace(/\|$/, "")					//Remove last '|'
									.replace(/(\W)/g, "\\$1")			//Escape all special characters
									.replace(/\\\|/g, "|")				//Unescape from '|'
									.replace(/\\\*/g, ".*")				//Replace '\*' with '.*'
									.replace(/(^\.\*)|(\.\*$)/g, "")	//Remove '.*' on start and end
									.replace(/(\.\*\|)/g,"|")			//Remove '.*' left of'|'
									.replace(/(\|\.\*)/g, "|"));		//Remove '.*' right of'|'
				}
				else
				{
					XULExtendedStatusbarChrome.hideForSites = null;
				}
				break;
			case "hideimages":
				if (this.prefs.getBoolPref("hideimages")) XULExtendedStatusbarChrome.esbXUL.images_box.hidden = true;
				else XULExtendedStatusbarChrome.esbXUL.images_box.hidden = false;
				break;
			case "hideloaded":
				if (this.prefs.getBoolPref("hideloaded")) XULExtendedStatusbarChrome.esbXUL.loaded_box.hidden = true;
				else XULExtendedStatusbarChrome.esbXUL.loaded_box.hidden = false;
				break;
			case "hidespeed":
				if (this.prefs.getBoolPref("hidespeed")) XULExtendedStatusbarChrome.esbXUL.speed_box.hidden = true;
				else XULExtendedStatusbarChrome.esbXUL.speed_box.hidden = false;
				break;
			case "hidetime":
				if (this.prefs.getBoolPref("hidetime")) XULExtendedStatusbarChrome.esbXUL.time_box.hidden = true;
				else XULExtendedStatusbarChrome.esbXUL.time_box.hidden = false;
				break;
			case "hidepercent":
				if (this.prefs.getBoolPref("hidepercent")) XULExtendedStatusbarChrome.esbXUL.percent_box.hidden = true;
				else XULExtendedStatusbarChrome.esbXUL.percent_box.hidden = false;
				break;
			case "esbstyle":
				this.applyStyle();
				// Set hide timeout
				if(XULExtendedStatusbarChrome.esbHide && !XULExtendedStatusbarChrome.esbTimeOutSem)
				{
					XULExtendedStatusbarChrome.esbTimeOutSem = true;
					XULExtendedStatusbarChrome.hideTimeOut = window.setTimeout("XULExtendedStatusbarChrome.hideESB()", XULExtendedStatusbarChrome.esbWait*1000);
				}
				break;
			case "toolbarstyle":
					XULExtendedStatusbarChrome.esbXUL.esb_toolbar.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.esb_toolbar.style.cssText = this.prefs.getCharPref("toolbarstyle");
				break;
			case "widgetstyle":
					XULExtendedStatusbarChrome.esbXUL.status_bar.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.status_bar.style.cssText = this.prefs.getCharPref("widgetstyle");
				break;
			case "percentstyle":
					XULExtendedStatusbarChrome.esbXUL.percent_box.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.percent_box.style.cssText = this.prefs.getCharPref("percentstyle");
					XULExtendedStatusbarChrome.esbXUL.percent_box.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_box).getPropertyValue('width'));
				break;
			case "imagesstyle":
					XULExtendedStatusbarChrome.esbXUL.images_box.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.images_box.style.cssText = this.prefs.getCharPref("imagesstyle");
					XULExtendedStatusbarChrome.esbXUL.images_box.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.images_box).getPropertyValue('width'));
				break;
			case "loadedstyle":
					XULExtendedStatusbarChrome.esbXUL.loaded_box.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.loaded_box.style.cssText = this.prefs.getCharPref("loadedstyle");
					XULExtendedStatusbarChrome.esbXUL.loaded_box.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_box).getPropertyValue('width'));
				break;
			case "speedstyle":
					XULExtendedStatusbarChrome.esbXUL.speed_box.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.speed_box.style.cssText = this.prefs.getCharPref("speedstyle");
					XULExtendedStatusbarChrome.esbXUL.speed_box.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.speed_box).getPropertyValue('width'));
				break;
			case "timestyle":
					XULExtendedStatusbarChrome.esbXUL.time_box.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.time_box.style.cssText = this.prefs.getCharPref("timestyle");
					XULExtendedStatusbarChrome.esbXUL.time_box.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.time_box).getPropertyValue('width'));
				break;
			case "progressstyle":
					XULExtendedStatusbarChrome.esbXUL.percent_progressbar.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.percent_progressbar.style.cssText = this.prefs.getCharPref("progressstyle");
					XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_progressbar).getPropertyValue('width'));
				break;
			case "cursorstyle":
					XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.cssText = this.prefs.getCharPref("cursorstyle");
					XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.width =parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar).getPropertyValue('width'));
				break;
			case "cursorbackgroundstyle":
					XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.removeAttribute("style");
					XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.style.cssText = this.prefs.getCharPref("cursorbackgroundstyle");
					XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar).getPropertyValue('width'));
				break;
			case "slimmode":
				if (this.prefs.getBoolPref("slimmode"))
				{
					XULExtendedStatusbarChrome.esbSlimMode = true;
					
					XULExtendedStatusbarChrome.status_bar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.status_bar).getPropertyValue('width'));
					XULExtendedStatusbarChrome.percent_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_box).getPropertyValue('width'));
					XULExtendedStatusbarChrome.images_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.images_box).getPropertyValue('width'));
					XULExtendedStatusbarChrome.loaded_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_box).getPropertyValue('width'));
					XULExtendedStatusbarChrome.speed_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.speed_box).getPropertyValue('width'));
					XULExtendedStatusbarChrome.time_box_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.time_box).getPropertyValue('width'));
					XULExtendedStatusbarChrome.percent_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.percent_progressbar).getPropertyValue('width'));
					XULExtendedStatusbarChrome.loaded_working_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar).getPropertyValue('width'));
					XULExtendedStatusbarChrome.loaded_finished_progressbar_width = parseInt(window.getComputedStyle(XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar).getPropertyValue('width'));
					
					XULExtendedStatusbarChrome.esbXUL.images_label.value = XULExtendedStatusbarChrome.esbXUL.images_label.value.substring(XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.images").length + 1);
					XULExtendedStatusbarChrome.esbXUL.loaded_label.value = XULExtendedStatusbarChrome.esbXUL.loaded_label.value.substring(XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.loaded").length + 1);
					XULExtendedStatusbarChrome.esbXUL.speed_label.value = XULExtendedStatusbarChrome.esbXUL.speed_label.value.substring(XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.speed").length + 1);
					XULExtendedStatusbarChrome.esbXUL.time_label.value = XULExtendedStatusbarChrome.esbXUL.time_label.value.substring(XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time").length + 1);
					XULExtendedStatusbarChrome.esbXUL.percent_label.value = XULExtendedStatusbarChrome.esbXUL.percent_label.value.substring(XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.document").length + 1);
				}
				else
				{
					XULExtendedStatusbarChrome.esbSlimMode = false;
					
					this.appendStyleAtribute("ESB_status_bar", "width", XULExtendedStatusbarChrome.status_bar_width + "px");
					this.appendStyleAtribute("ESB_percent_box", "width", XULExtendedStatusbarChrome.percent_box_width + "px");
					this.appendStyleAtribute("ESB_images_box", "width", XULExtendedStatusbarChrome.images_box_width + "px");
					this.appendStyleAtribute("ESB_loaded_box", "width", XULExtendedStatusbarChrome.loaded_box_width + "px");
					this.appendStyleAtribute("ESB_speed_box", "width", XULExtendedStatusbarChrome.speed_box_width + "px");
					this.appendStyleAtribute("ESB_time_box", "width", XULExtendedStatusbarChrome.time_box_width + "px");
					this.appendStyleAtribute("ESB_percent_progressbar", "width", XULExtendedStatusbarChrome.percent_progressbar_width + "px");
					this.appendStyleAtribute("ESB_loaded_working_progressbar", "width", XULExtendedStatusbarChrome.loaded_working_progressbar_width + "px");
					this.appendStyleAtribute("ESB_loaded_finished_progressbar", "width", XULExtendedStatusbarChrome.loaded_finished_progressbar_width + "px");
		
					XULExtendedStatusbarChrome.esbXUL.images_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.images") + " " + XULExtendedStatusbarChrome.esbXUL.images_label.value;
					XULExtendedStatusbarChrome.esbXUL.loaded_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.loaded") + " " + XULExtendedStatusbarChrome.esbXUL.loaded_label.value;
					XULExtendedStatusbarChrome.esbXUL.speed_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.speed") + " " + XULExtendedStatusbarChrome.esbXUL.speed_label.value;
					XULExtendedStatusbarChrome.esbXUL.time_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.time") + " " + XULExtendedStatusbarChrome.esbXUL.time_label.value;
					XULExtendedStatusbarChrome.esbXUL.percent_label.value = XULExtendedStatusbarChrome.esbXUL.esbstrings.GetStringFromName("esb.document") + " " + XULExtendedStatusbarChrome.esbXUL.percent_label.value;
				}
				this.applyStyle();				
				break;
			case "hideprogress":
				if (this.prefs.getBoolPref("hideprogress"))
				{
					XULExtendedStatusbarChrome.esbHideProgress = true;
					XULExtendedStatusbarChrome.esbXUL.percent_progressbar.hidden = true;
				}
				else 
				{
					XULExtendedStatusbarChrome.esbHideProgress = false;
					XULExtendedStatusbarChrome.esbXUL.percent_progressbar.hidden = false;
				}
				break;
			case "hidecursor":
				if (this.prefs.getBoolPref("hidecursor"))
				{
					XULExtendedStatusbarChrome.esbHideCursor = true;
					XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.hidden = true;
					if(XULExtendedStatusbarChrome.esbXUL.esbLoading)
					{
						XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.hidden = true;
					}
				}
				else 
				{
					XULExtendedStatusbarChrome.esbHideCursor = false;
					XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.hidden = false;
					XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.hidden = false;
				}
				break;
		}
	},

	appendStyleAtribute: function (elem, attrib, value)
	{
		var style = document.getElementById(elem).getAttribute("style");
		var myregexp1 = new RegExp("^" + attrib + ":[\\s]?[^:]+;");
		if (style.match(myregexp1) != null)
		{
			document.getElementById(elem).setAttribute("style", style.replace(myregexp1, attrib + ": " + value + ";"));
			return;
		}
		else
		{
			var myregexp2 = new RegExp("(;\\s+|;)" + attrib + ":[\\s]?[^:]+;");
			if (style.match(myregexp2) != null)
			{
				document.getElementById(elem).setAttribute("style", style.replace(myregexp2, ";" + attrib + ": " + value + ";"));
				return;
			}
			document.getElementById(elem).setAttribute("style", style.concat(style, attrib + ": " + value + ";"));
		}
	},

	clearStyle: function(elems)
	{
		for (var i=0; i<elems.length; i++)
		{
			document.getElementById(elems[i]).removeAttribute("style");
		}
	},
	
	applyStyle: function()
	{
		XULExtendedStatusbarChrome.esbXUL.status_bar.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.percent_box.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.images_box.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.loaded_box.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.speed_box.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.time_box.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.percent_progressbar.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.classList.remove('newstyle');
		XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.classList.remove('newstyle');
		
		XULExtendedStatusbarChrome.esbXUL.esb_toolbar.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.status_bar.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.percent_box.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.images_box.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.loaded_box.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.speed_box.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.time_box.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.percent_progressbar.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.removeAttribute("style");
		XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.removeAttribute("style");
		
		switch(this.prefs.getIntPref("esbstyle"))
		{
			case 0:
				XULExtendedStatusbarChrome.esbXUL.status_bar.width = 0;
				XULExtendedStatusbarChrome.esbXUL.percent_box.width = 0;
				XULExtendedStatusbarChrome.esbXUL.images_box.width = 0;
				XULExtendedStatusbarChrome.esbXUL.loaded_box.width = 0;
				XULExtendedStatusbarChrome.esbXUL.speed_box.width = 0;
				XULExtendedStatusbarChrome.esbXUL.time_box.width = 0;
				XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = 0;
				XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.width = 0;
				XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.width = 0;
				break
			case 1:
				XULExtendedStatusbarChrome.esbXUL.status_bar.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.percent_box.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.images_box.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.loaded_box.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.speed_box.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.time_box.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.percent_progressbar.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.classList.add('newstyle');
				XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.classList.add('newstyle');
				break;
			case 2:				
				XULExtendedStatusbarChrome.esbXUL.esb_toolbar.style.cssText = this.prefs.getCharPref("toolbarstyle");
				XULExtendedStatusbarChrome.esbXUL.status_bar.style.cssText = this.prefs.getCharPref("widgetstyle");
				XULExtendedStatusbarChrome.esbXUL.percent_box.style.cssText = this.prefs.getCharPref("percentstyle");
				XULExtendedStatusbarChrome.esbXUL.images_box.style.cssText = this.prefs.getCharPref("imagesstyle");
				XULExtendedStatusbarChrome.esbXUL.loaded_box.style.cssText = this.prefs.getCharPref("loadedstyle");
				XULExtendedStatusbarChrome.esbXUL.speed_box.style.cssText = this.prefs.getCharPref("speedstyle");
				XULExtendedStatusbarChrome.esbXUL.time_box.style.cssText = this.prefs.getCharPref("timestyle");
				XULExtendedStatusbarChrome.esbXUL.percent_progressbar.style.cssText = this.prefs.getCharPref("progressstyle");
				XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.cssText = this.prefs.getCharPref("cursorstyle");
				XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.style.cssText = this.prefs.getCharPref("cursorbackgroundstyle");
				break;
		}
		if (XULExtendedStatusbarChrome.esbSlimMode)
		{			
			XULExtendedStatusbarChrome.esbXUL.status_bar.width = 0;
			XULExtendedStatusbarChrome.esbXUL.percent_box.width = 0;
			XULExtendedStatusbarChrome.esbXUL.images_box.width = 0;
			XULExtendedStatusbarChrome.esbXUL.loaded_box.width = 0;
			XULExtendedStatusbarChrome.esbXUL.speed_box.width = 0;
			XULExtendedStatusbarChrome.esbXUL.time_box.width = 0;
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = 0;
			XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.width = 0;
			XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.width = 0;
		}
		else
		{
			XULExtendedStatusbarChrome.esbXUL.status_bar.width = XULExtendedStatusbarChrome.esbXUL.status_bar.style.width;
			XULExtendedStatusbarChrome.esbXUL.percent_box.width = XULExtendedStatusbarChrome.esbXUL.percent_box.style.width;
			XULExtendedStatusbarChrome.esbXUL.images_box.width = XULExtendedStatusbarChrome.esbXUL.images_box.style.width;
			XULExtendedStatusbarChrome.esbXUL.loaded_box.width = XULExtendedStatusbarChrome.esbXUL.loaded_box.style.width;
			XULExtendedStatusbarChrome.esbXUL.speed_box.width = XULExtendedStatusbarChrome.esbXUL.speed_box.style.width;
			XULExtendedStatusbarChrome.esbXUL.time_box.width = XULExtendedStatusbarChrome.esbXUL.time_box.style.width;
			XULExtendedStatusbarChrome.esbXUL.percent_progressbar.width = XULExtendedStatusbarChrome.esbXUL.percent_progressbar.style.width;
			XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.width = XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.width ;
			XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.width = XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.style.width;
		}
		if (this.prefs.getBoolPref("usecustomcolor"))
		{
			if(XULExtendedStatusbarChrome.esbXUL.status_bar.style.backgroundColor) XULExtendedStatusbarChrome.esbXUL.status_bar.style.backgroundColor = this.prefs.getCharPref("backgroundcolor");
			else this.appendStyleAtribute("ESB_status_bar", "background-color", this.prefs.getCharPref("backgroundcolor"));
			
			if(XULExtendedStatusbarChrome.esbXUL.status_bar.style.color) XULExtendedStatusbarChrome.esbXUL.status_bar.style.color = this.prefs.getCharPref("textcolor");
			else this.appendStyleAtribute("ESB_status_bar", "color", this.prefs.getCharPref("textcolor"));
			
			if(XULExtendedStatusbarChrome.esbXUL.percent_progressbar.style.backgroundColor) XULExtendedStatusbarChrome.esbXUL.percent_progressbar.style.backgroundColor = this.prefs.getCharPref("progresscolor");
			else this.appendStyleAtribute("ESB_percent_progressbar", "background-color", this.prefs.getCharPref("progresscolor"));
			
			if(XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.style.backgroundColor) XULExtendedStatusbarChrome.esbXUL.loaded_finished_progressbar.style.backgroundColor = this.prefs.getCharPref("progresscolor");
			else this.appendStyleAtribute("ESB_loaded_finished_progressbar", "background-color", this.prefs.getCharPref("progresscolor"));
			
			if(XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.backgroundColor) XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.backgroundColor = this.prefs.getCharPref("progresscolor");
			else this.appendStyleAtribute("ESB_loaded_working_progressbar", "background-color", this.prefs.getCharPref("progresscolor"));
			
			if(XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.borderRight) XULExtendedStatusbarChrome.esbXUL.loaded_working_progressbar.style.borderRight = "10px solid " + this.prefs.getCharPref("cursorcolor");
			else this.appendStyleAtribute("ESB_loaded_working_progressbar", "border-right", "10px solid " + this.prefs.getCharPref("cursorcolor"));
		}
	}
}

XULExtendedStatusbarChrome.openESBOptions = function (event)
{
	window.open("chrome://extendedstatusbar/content/extendedstatusbaroptionsFF29.xul", "", "chrome");
}

