/**
 * @name UrbanDict
 * @author vfosnar
 * @authorId
 * @version 1.0.1
 * @description Allows you to search term on Urban Dictionary
 * @website https://www.fosny.eu/
 * @source https://github.com/vfosnar/BetterDiscordUrbanSearch
 * @updateUrl https://raw.githubusercontent.com/vfosnar/BetterDiscordUrbanSearch/main/UrbanDict.plugin.js
 */

module.exports = (_ => {
	const config = {
		"info": {
			"name": "UrbanDict",
			"author": "vfosnar",
			"version": "1.0.1",
			"description": "Allows you to search term on Urban Dictionary"
		}
	};

	return (window.Lightcord || window.LightCord) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return config.info.description;}
		load () {}
		start() {}
		stop() {}
	} : !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		return class SearchUrbanDict extends Plugin {
			onLoad () {}
			
			onStart () {}
			
			onStop () {}

			onMessageContextMenu (e) {
				if (e.instance.props.message) {
					// Parse message content
					let content = e.instance.props.message.content;
					let messageString = [e.instance.props.message.content, BDFDB.ArrayUtils.is(e.instance.props.message.attachments) && e.instance.props.message.attachments.map(n => n.url)].flat(10).filter(n => n).join("\n");
					let selectedText = document.getSelection().toString().trim();
					if (selectedText) messageString = BDFDB.StringUtils.extractSelection(messageString, selectedText);
					let embed = BDFDB.DOMUtils.getParent(BDFDB.dotCN.embedwrapper, e.instance.props.target);
					let embedData = e.instance.props.message.embeds[embed ? Array.from(embed.parentElement.querySelectorAll(BDFDB.dotCN.embedwrapper)).indexOf(embed) : -1];
					let embedString = embedData && [embedData.rawTitle, embedData.rawDescription, BDFDB.ArrayUtils.is(embedData.fields) && embedData.fields.map(n => [n.rawName, n.rawValue]), BDFDB.ObjectUtils.is(embedData.image) && embedData.image.url, BDFDB.ObjectUtils.is(embedData.footer) && embedData.footer.text].flat(10).filter(n => n).join("\n");
					if (selectedText) embedString = BDFDB.StringUtils.extractSelection(embedString, selectedText);
					let entries = [
						// Create context menu element
						messageString && BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
							label: "Search Urban Dictionary",
							id: BDFDB.ContextMenuUtils.createItemId(this.name, "search-urban"),
							hint: null,
							action: _ => {
								// Strip whitespaces from both sides
								let term = selectedText.trim();
								// Use whole message when term is empty
								if( term == "" )
									term = content.trim();
								
								// Push notification
								BDFDB.NotificationUtils.toast( `Searching for "${ term }"`, {
									position: "center"
								} );
								// Send GET request to the Urban Dictionary page
                                BDFDB.LibraryRequires.request( `https://www.urbandictionary.com/define.php?term=${ encodeURIComponent( term ) }`, ( error, response, body ) => {
                                    if( !error && body && response.statusCode == 200 ) {
										// Create element to parse received html
                                        let dummyHTML = document.createElement( "dummyHTML" );
										// Load received html
										dummyHTML.innerHTML = body;
										
										// Get list of elements with class 'word'
										let words = dummyHTML.getElementsByClassName("word");
										// Find meaning definition
										let meanings = dummyHTML.getElementsByClassName("meaning");
										
										// Display word with found meaning
                                        BdApi.alert( words[0].innerText, meanings[0].innerText );
                                    }
									else {
										// Display error message
										BDFDB.NotificationUtils.toast( "Nothing was found :(", {
											type: "danger",
											position: "center"
										} );
									}
                                } );
							}
						}),
					].filter(n => n);
					if (entries.length) {
						let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: "devmode-copy-id", group: true});
						children.splice(index > -1 ? index : children.length, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
							children: entries
						}));
					}
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();