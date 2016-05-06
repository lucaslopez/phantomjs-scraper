# phantomjs-scraper
PhantomJS module for web scraping. Documentation to be completed. Eventually.

## Usage
When you require the module it returns an object with three keys:
* Scraper: the Scraper class, ready to be instantiated
* Spider: the Spider class, to be extended by the user (here you implement your code)
* util: misc utility functions

So basically, the process is as following:
1. Require the module and point to its content
```javascript
var phantomScraper = require('phantomjs-scraper');
var Scraper = phantomScraper.Scraper;
var Spider = phantomScraper.Spider;
```
2. Create a configuration object
```javascript
var config = 
{
	dir_root: fs.workingDirectory,
	dir_data:  exports.dir_root + "/data",
	dir_rsc: exports.dir_root + "/bower_components",
	dir_logs: exports.dir_root + "/logs",
	dir_spiders: exports.dir_root + "/spiders"
};
```
3. Instantiate a Scraper object
```javascript
var sc = new Scraper(settings);
```
4. Create a subclass of Spider and implement your code there in the spiders directory specified before
5. Indicate your scraper to instantiate a new spider object of your custom type:
```javascript
sc.createSpider('myCustomSpider');
```
6. Fire the scraper - scraper.start()
```javascript
sc.start();
```