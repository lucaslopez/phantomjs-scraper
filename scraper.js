var util = require('./util.js');


// Define new class
function Scraper(settings)
{
	this.spiders = [];
	this.running = [];
	this.status = "stopped";
	this.settings = settings;
}

// Define class methods

// to be implemented if neccesary
Scraper.prototype.createSpider = function(name)
{
	//var s = new name();
};

Scraper.prototype.addSpiderObject = function(spider)
{
	if (spider)
	{
		this.spiders.push(spider);
		spider.setScraper(this);
		spider.initialize();
	}
};

Scraper.prototype.createSpider = function(spiderName)
{
	try
	{
		var TargetSpider = require(this.settings.dir_spiders + '/' + spiderName + '.js');
		var spider = new TargetSpider();
		this.addSpiderObject(spider);
	}
	catch (err)
	{
		throw(err);
	}
};

Scraper.prototype.initialize = function()
{
};
	
Scraper.prototype.start = function()
{
	var self = this;
	this.status = "running";
	this.spiders.forEach(function(element, index, array)
	{
		//util.log(element);
		self.running.push(element.name);
		element.start();
	});
};

Scraper.prototype.finish = function(name)
{
	var idx = this.running.indexOf(name);
	//util.print_object(this.running);
	//util.log(idx);
	if (idx >= 0)
	{
		this.running.splice(idx, 1);
	}
	this.checkStatus();
}

Scraper.prototype.checkStatus = function(name)
{
	//util.print_object(this.running);
	//util.log(this.status);
	if (this.status == "running" && this.running.length == 0)
	{
		util.log("Exiting...");
		//phantom.exit();
		// Because of a phantomjs bug
		// http://stackoverflow.com/questions/19144632/phantomjs-crashes-after-phantom-exit-on-linux
		setTimeout(function()
		{
			phantom.exit(0);
		}, 0);
	}
}

Scraper.prototype.test = function()
{
	util.log("This is the scraper!");
};

// Define module exports
module.exports = Scraper;