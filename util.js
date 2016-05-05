/*
require('rsc/jquery-2.1.0/jquery-2.1.0.min.js');
require('rsc/jquery.csv-0.71/jquery.csv-0.71.js');
*/

print_level = 1;

exports.merge_objects = function(obj1, obj2)
{
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
};

exports.obj2csv = function(obj, separator)
{
	// default vars
	//var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var separator = typeof separator !== 'undefined' ? separator : ';';
	// prepare output
	var line = '';
	for (var index in obj)
	{
		if (line != '') line += separator;
		var v = obj[index];
		if (typeof v === "string")
			v = v.replace(/"/g, '""');
		if (typeof v === "string")
			line += '"';
		line += v;
		if (typeof v === "string")
			line += '"';
	}
	return line;
}

exports.arr2csv = function(a, separator, headers)
{
	// default vars
	var a = typeof a != 'object' ? JSON.parse(a) : a;
	var separator = typeof separator !== 'undefined' ? separator : ';';
	// add headers
	var str = '';
	var keys = Object.keys(a);
	if (headers && keys.length > 0)
	{
		var sample = a[keys[0]];
		for (var field in sample)
		{
			if (str != '') str += separator;
			str += field;
		}
		str += '\r\n';
	}
	// add data lines
	keys.forEach(function(element, index, array)
	{
		str += exports.obj2csv(a[element], separator) + '\r\n';
	});
	return str;
}

exports.print_object = function(o, show_functions/*, f*/)
{
	//var f = typeof f !== 'undefined' ? f : console.log;
	var show_functions = typeof show_functions !== 'undefined' ? show_functions : false;
	
	p = JSON.stringify(o, function(k, v)
	{
		if (typeof v === 'function')
		{
			if (show_functions)
			{
				//return v + '';
				return "function()";
			}
		}
		return v;
	}, 4);
	
	console.log(p);
	//f(p);
};

exports.log = function(text, z)
{
	// default vars
	var z = typeof z !== 'undefined' ? z : 1;
	var ts = "[" + exports.getDatetime() + "]"
	// print
	if (z <= print_level)
	{
		console.log(ts + " " + text);
	}
};

exports.getDatetime = function(format)
{
	var now = new Date();
	var ss = now.getSeconds();
	if (ss < 10) ss='0'+ss;
	var mn = now.getMinutes();
	if (mn < 10) mn='0'+mn;
	var hh = now.getHours();
	if (hh < 10) hh='0'+hh;
	var dd = now.getDate();
	if (dd < 10) dd='0'+dd;
	var mm = now.getMonth() + 1; //January is 0!
	if (mm < 10) mm='0'+mm;
	var yyyy = now.getFullYear();
	return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mn + ":" + ss;
}

// improve to specify format
exports.getDate = function(format)
{
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1; //January is 0!
	var yyyy = today.getFullYear();
	if (dd < 10) {dd='0'+dd}
	if (mm < 10){mm='0'+mm}
	today = yyyy + "-" + mm + "-" + dd;
	return today;
}

// to be implemented - the idea is to have a synchronous method to wait for asynchronous methods
exports.waitFor = function(methodContinue, methodAsync, variable)
{
	
}

/*
exports.getElementsByXPath = function(xPath)
{
	page.evaluate(function()
	{
		document.evaluate(
		'//div',
		document,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null);
	});
};
*/

exports.parseMoney = function(str)
{
	result = str;
	result = result.trim();
	result = result.replace(" €", "").replace("€", "");
	result = result.replace(" $", "").replace("$", "");
	result = result.replace(",", ".");
	result = parseFloat(result);
	return result;
}

exports.removeMultipleSpaces = function(str)
{
	return str.replace( /\s\s+/g, ' ');
}