define(['require'], function (require) {

	var exports = {};

	exports.removePrefix = function removePrefix(prefix, str)
	{
		if (str.indexOf(prefix) == 0)
		{
			return str.substring(prefix.length);
		}
		
		return str;
	};

	exports.replaceAll = function(find, replace, str)
	{
		if (replace.indexOf(find) > -1)
		return str;
		
		while(str.indexOf(find) > -1)
		{
			str = str.replace(find, replace);
		}
		
		return str;
	};

	exports.trim = function(str)
	{
		return str.replace(/^\s+|\s+$/gm,'');
	};
	
	exports.toFixed = function(value, precision)
	{
		var precision = precision || 0,
		power = Math.pow(10, precision),
		absValue = Math.abs(Math.round(value * power)),
		result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

		if (precision > 0)
		{
			var fraction = String(absValue % power),
			padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
			result += '.' + padding + fraction;
		}
		return result;
	}

	return exports;

});