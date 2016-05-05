
// Define new class
function Scraper()
{
	this.spiders = [];
	this.running = [];
	this.status = "stopped";
}

// Define class methods

// to be implemented if neccesary
Scraper.prototype.createSpider = function(name)
{
	//var s = new name();
};
	
Scraper.prototype.addSpiderObject = function(spider)
{
	spider.initialize();
	spider.setScraper(this);
	this.spiders.push(spider)
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
		phantom.exit();
	}
}

Scraper.prototype.test = function()
{
	util.log("This is the scraper!");
};

// Define module exports
module.exports = Scraper;