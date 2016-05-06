var webpage = require('webpage');
var url = require('url');
var util = require('./util.js');

// Define the new class
function Spider()
{
	// maxConcurrentConnections?
	this.maxTries = 3;
	this.maxQueries = 0;
	this.curQueries = 0;
	this.maxConnections = 2;
	this.curConnections = 0;
	this.lastQueryTime = 0;
	this.timeBetweenQueries = 500;
	this.cProcess = {};
	this.cProcess.startTime = 0;
	this.countdown = {};
	this.countdown.active = false;
	this.countdown.interval = 60000;
	this.countdown.startTime = 0;
	this.locked = false;
	this.targets = [];
	this.processed = [];
	this.fails = {};
	this.data = {};
	this.name = "spider";
	this.loopInterval = 500;
	this.loopIntervalID = -1;
	this.dynamicallySaveData = true;
	this.debugMode = false;
	this.scraper = null;
	this.unkownURLs = [];
}

// Define class methods

Spider.prototype.setName = function(name)
{
	this.name = name;
};

Spider.prototype.getDataPath = function()
{
	var d = new Date(this.cProcess.startTime);
	var mn = d.getMinutes();
	if (mn < 10) mn='0'+mn;
	var hh = d.getHours();
	if (hh < 10) hh='0'+hh;
	var dd = d.getDate();
	if (dd < 10) dd='0'+dd;
	var mm = d.getMonth() + 1; //January is 0!
	if (mm < 10) mm='0'+mm;
	var yyyy = d.getFullYear();
	var prev = yyyy + "-" + mm + "-" + dd + "-" + hh + "-" + mn;
	return this.scraper.settings.dir_data + "/" + this.name + "/" + prev + "-" + this.cProcess.startTime + "/";
};

Spider.prototype.lock = function()
{
	this.wait();
	this.locked = true;
};

Spider.prototype.unlock = function()
{
	this.locked = false;
};

Spider.prototype.wait = function()
{
	while(this.locked) {}
};

Spider.prototype.setMaxConnections = function(n)
{
	this.maxConnections = n;
};

Spider.prototype.setTimeBetweenQueries = function(t)
{
	this.timeBetweenQueries = t;
};

Spider.prototype.setScraper = function(s)
{
	this.scraper = s;
};

Spider.prototype.addUnkown = function(page)
{
	this.unkownURLs.push(page.url);
	//this.takeSS(url);
};

Spider.prototype.addTarget = function(url, force, clean)
{
	var clean = (typeof clean !== 'undefined') ? clean : true;
	if (clean)
	{
		// remove everything after anchor link #
		url = url.split('#')[0];
	}
	if (force)
		this.targets.push(url);
	else if (this.targets.indexOf(url) == -1 && this.processed.indexOf(url) == -1)
		this.targets.push(url);
	/*
	else
		util.log("Repetido!");
	*/
};

Spider.prototype.addData = function(obj, type)
{
	if (this.data[type] === undefined)
	{
		this.data[type] = {};
		//util.log("No existia " + type + " y lo agrego")
	}
	if (this.data[type][obj.id] !== undefined)
		this.data[type][obj.id] = util.merge_objects(this.data[type][obj.id], obj);
	else
		this.data[type][obj.id] = obj;
	if (this.dynamicallySaveData)
	{
		str = util.obj2csv(obj) + '\r\n';
		fs.write(this.getDataPath() + this.name + "_" + type + "_" + "temp" + '.csv', str, 'a');
	}
	//util.print_object(this.data);
	//this.data.push(data)
};

Spider.prototype.initialize = function()
{
	
};

Spider.prototype.startCountdown = function()
{
	//var interval = typeof interval !== 'undefined' ? interval : this.countdown.interval;
	this.countdown.active = true;
	this.countdown.startTime = new Date().getTime();
}

Spider.prototype.resetCountdown = function()
{
	this.countdown.startTime = new Date().getTime();
}

Spider.prototype.stopCountdown = function()
{
	this.countdown.active = false;
	this.countdown.startTime = 0;
}

Spider.prototype.checkCountdown = function()
{
	if (this.countdown.active)
	{
		var now = new Date().getTime();
		var delta = now - this.countdown.startTime;
		if (delta >= this.countdown.interval)
		{
			this.onCountdown();
		}
		return delta;
	}
	else return -1;
}

Spider.prototype.onCountdown = function()
{
	util.log("Countdown finished! Restablishing status...");
	this.curConnections = 0;
}

Spider.prototype.start = function(interval)
{
	var interval = typeof interval !== 'undefined' ? interval : this.loopInterval;
	var self = this;
	this.cProcess.startTime = new Date().getTime();
	//this.sendEmail("start");
	this.startCountdown();
	this.loopIntervalID = setInterval(function()
	{
		self.loop();
	}, interval);
	//this.loop();
};

Spider.prototype.stop = function()
{
	clearInterval(this.loopIntervalID);
};

Spider.prototype.loop = function()
{
	var self = this;
	var now = new Date().getTime();
	//console.log(this.nConnections);
	//console.log(this.maxConnections);
	if (!this.locked)
	{
		var cd = this.checkCountdown();
		if ((this.maxQueries == 0 || this.curQueries < this.maxQueries) && this.targets.length > 0)
		{
			if (this.curConnections < this.maxConnections && now - this.lastQueryTime >= this.timeBetweenQueries)
			{
				this.resetCountdown();
				var n_processed = this.processed.length;
				var n_total = this.targets.length + n_processed;
				util.log("Processed " + n_processed + " out of " + n_total + " links (" + this.curQueries + "/" + this.maxQueries + " queries in total)");
				var t = this.targets[0];
				this.processed.push(t);
				this.targets.shift();
				this.lastQueryTime = now;
				var p = this.loadPage(t);
			}
		}
		else if ((this.targets.length == 0 || this.curQueries == this.maxQueries) && this.curConnections > 0)
		{
			if (this.debugMode)
			{
				util.log("--------------------------------------------------------------------------------------");
				util.log(" Spider Status");
				util.log("--------------------------------------------------------------------------------------");
				util.log(" LOCKED: " + this.locked);
				util.log(" CONNECTIONS: " + this.curConnections + "/" + this.maxConnections);
				util.log(" QUERIES: " + this.curQueries + "/" + this.maxQueries);
				util.log(" TARGETS: " + this.targets.length);
				util.log(" PROCESSED: " + this.processed.length);
				util.log(" COUNTDOWN: " + cd + "/" + this.countdown.interval);
				util.log("                                         Waiting...");
			}
			/*
			this.stop();
			setTimeout(function()
			{
				self.loop();
			}, 3000);
			*/
		}
		else if ((this.targets.length == 0 || this.curQueries == this.maxQueries) && this.curConnections == 0)
		{
			util.log("Finished scraping site!");
			this.finish();
		}
	}
};

Spider.prototype.finish = function()
{
	this.stop();
	this.stopCountdown();
	//this.sendEmail("finish");
	this.dumpData("csv");
	this.clean();
	this.cProcess.startTime = -1;
	setTimeout(this.scraper.finish(this.name), 10000);
}

Spider.prototype.startConnection = function()
{
	this.curConnections++;
	this.curQueries++;
}

Spider.prototype.finishConnection = function()
{
	this.curConnections--;
}

Spider.prototype.preparePageBeforeLoad = function(page)
{
	page.onError = function(msg, trace)
	{
		util.log('Page has an internal error: ' + msg);
		util.print_object(trace);
	};
	
	page.resourceTimeout = 5000;
	page.onResourceTimeout = function(e)
	{
		console.log(e.errorCode);   // it'll probably be 408 
		console.log(e.errorString); // it'll probably be 'Network timeout on resource'
		console.log(e.url);         // the url whose request timed out
		phantom.exit(1);
	};
};

Spider.prototype.preparePage = function(page)
{
	util.log("Preparing page...");
	
	page.onConsoleMessage = function (msg)
	{
		util.log('[Page message] ' + msg);
	};
}

Spider.prototype.process = function(page)
{
	util.log("Processing page...");
};

Spider.prototype.loadPage = function(url)
{
	var self = this;
	this.startConnection();
	util.log("--------------------------------------------------------------------------------------");
	util.log("Loading page " + url + " [" + this.curConnections + "/" + this.maxConnections + "]");
	var page = webpage.create();
	this.preparePageBeforeLoad(page);
	// open the page
	page.open(url, function(status)
	{
		if (status !== 'success')
		{
			self.closePage(page);
			self.fails[url] = self.fails[url] === undefined ? 1 : self.fails[url] + 1;
			util.log('FAILED TO LOAD URL [' + self.fails[url] + '] ' + url + '');
			if (self.fails[url] < self.maxTries)
			{
				self.addTarget(url, true);
				util.log('No more tries will be given');
			}
		}
		else
		{
			self.process(page);
		}
	});
}

Spider.prototype.closePage = function(page)
{
	page.close();
	this.finishConnection();
}

Spider.prototype.clean = function()
{
	for (var type in this.data)
		fs.remove(this.getDataPath() + this.name + "_" + type + "_" + "temp" + '.csv');
}

Spider.prototype.inject = function(what, page)
{
	if (what == "ll_img_tools")
	{
		page.evaluate(function()
		{
			getImgDimensions = function(i)
			{
				var dim = 	{
								'top' : i.offset().top,
								'left' : i.offset().left,
								'width' : i.width(),
								'height' : i.height()
							};
				return dim;
			};
		});
	}
	else if (what == "jquery")
	{
		util.log("Inserting jquery...");
		page.injectJs(this.scraper.settings.dir_rsc + '/jquery/dist/jquery.min.js');
		page.evaluate(function()
		{
			$$ = $.noConflict(true);
		});
	}
};

Spider.prototype.takeSS = function(page)
{
	var t = Date.now();
	//util.log("Taking screenshot...");
	page.render(this.getDataPath() + this.name + "_ss_" + t.toString() + '.png');
};

Spider.prototype.saveHTML = function(page)
{
	var t = Date.now();
	//util.log("Saving processed HTML...");
	fs.write(this.getDataPath() + this.name + "_html_" + t.toString() + '.html', page.content, 'w');
};

Spider.prototype.dumpData = function(format, params)
{
	//util.print_object(this.data);
	var format = typeof format !== 'undefined' ? format : "csv";
	//var t = Date.now();
	if (format == "CSV" || format == "csv")
	{
		// dump captured data
		var params_default = {headers: true, separator: ";"};
		var params = typeof params !== 'undefined' ? this.merge_objects(params_default, params) : params_default;
		for (var type in this.data)
		{
			var str = util.arr2csv(this.data[type], params.separator, params.headers);
			fs.write(this.getDataPath() + this.name + "_" + type + '.csv', str, 'w');
		}
		// dump unkown urls
		for (var unkown in this.unkownURLs)
		{
			fs.write(this.getDataPath() + this.name + "_" + "unkown" + '.csv', this.unkownURLs[unkown] + '\r\n', 'a');
		}
		// dump processed urls
		for (var p in this.processed)
		{
			fs.write(this.getDataPath() + this.name + "_" + "processed" + '.csv', this.processed[p] + '\r\n', 'a');
		}
	}
	// copy all data to the "last" directory
	var dir_last = this.scraper.settings.dir_data + "/" + this.name + "/" + "last";
	fs.removeTree(this.scraper.settings.dir_data + "/" + this.name + "/" + "last");
	fs.copyTree(this.getDataPath(), this.scraper.settings.dir_data + "/" + this.name + "/" + "last");
}

Spider.prototype.extractLinks = function(page, selector, complete_urls, admited_protocols, banned_protocols, add)
{
	// define default variables
	var selector = typeof selector !== 'undefined' ? selector : "a";										// selector to use for the links
	var complete_urls = typeof complete_urls !== 'undefined' ? complete_urls : true;						// complete the urls in the form of "next.php" to "www.example.com/next.php"?
	var admited_protocols = typeof admited_protocols !== 'undefined' ? admited_protocols : ['http:'];		// protocols admited
	var banned_protocols = typeof banned_protocols !== 'undefined' ? banned_protocols : [];					// banned protocols (it will ignore the link if the protocol is here, even if it is in admited too)
	var add = typeof add !== 'undefined' ? add : true;														// add the links to the spider or simply return the array of the links?
	var self = this;
	// obtain the links from the page
	var links = page.evaluate(function(selector)
	{
		var r = [];
		$$(selector).each(function()
		{
			var val = $$(this).attr("href");
			if (typeof val !== 'undefined')
				r.push(val.toString());
		});
		return r;
	}, selector);
	// filter links, complete them, and add them to the spider
	result = [];
	base_url = url.parse(page.url);
	links.forEach(function(element, index, array)
	{
		var link = "";
		var a = url.parse(element);
		var filter_ok = true;
		if (typeof a.protocol !== "undefined" && a.protocol != null && (admited_protocols.indexOf(a.protocol) == -1 || banned_protocols.indexOf(a.protocol) == 1))
		{
			filter_ok = false;
		}
		if (filter_ok)
		{
			if (complete_urls)
				link = url.resolve(page.url, element);
				//link = encodeURI(link);
			if (add)
				self.addTarget(link);
			result.push(link);
			//util.log(link);
		}
	});
	//util.print_object(this.targets);
	//util.print_object(this.processed);
	return result;
};

Spider.prototype.saveImages = function(page, selector, name)
{
	// define default variables
	var selector = typeof selector !== 'undefined' ? selector : "img";										// selector to use for the images
	var self = this;
	// obtain the links from the page
	var images = page.evaluate(function(selector)
	{
		var target_imgs = [];
		$$(selector).each(function()
		{
			var target_img = getImgDimensions($$(this));
			target_imgs.push(target_img);
		});
		return target_imgs;
	}, selector);
	images.forEach(function(imageObj, index, array)
	{
		page.clipRect = imageObj;
		page.render(self.getDataPath() + self.name + '_' + name + '-' + index + '.png');
	});
	return images.length;
};

/*
Scraper.prototype.getEmail = function(what)
{
	var data = {};
	if (what == "start")
	{
		data = 	{
					from: "Sexybay Scraper <sexybay.xxx@gmail.com",
					to: "Sexybay <sexybay.xxx@gmail.com",
					subject: "Scraper '" + this.name + "' started",
					text: "Scraper '" + this.name + "' started"
				};
	}
	else if (what == "finish")
	{
		data = 	{
			from: "Sexybay Scraper <sexybay.xxx@gmail.com",
			to: "Sexybay <sexybay.xxx@gmail.com",
			subject: "Scraper '" + this.name + "' started",
			text: "Scraper '" + this.name + "' finished"
		};
	}
	else if (what == "error")
	{
		data = 	{
			from: "Sexybay Scraper <sexybay.xxx@gmail.com",
			to: "Sexybay <sexybay.xxx@gmail.com",
			subject: "Scraper '" + this.name + "' error",
			text: "Scraper '" + this.name + "' error"
		};
	}
	return data;
};

Scraper.prototype.sendEmail = function(what)
{
	data = this.getEmail(what);
	emailer.sendMail(	data,
						function (error, response)
						{
							if(error)
							{
								console.log(error);
							}
							else
							{
								console.log("Message sent: " + response.message);
							}
						}
					);
};
*/

// Define the module exports
module.exports = Spider;