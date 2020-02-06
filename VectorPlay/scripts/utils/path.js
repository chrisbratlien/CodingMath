define(['require', 'utils/string'], function (require, stringUtil) {

	var exports = {};

	exports.getDirectory = function(filename)
	{
		var lastFSlash = filename.lastIndexOf("/");
		if (lastFSlash > -1)
		return filename.substring(0, lastFSlash);
		
		var lastBSlash = filename.lastIndexOf("\\");
		if (lastBSlash > -1)
		return filename.substring(0, lastBSlash);
		
		return filename;
	}
	
	exports.normalize = function (filename)
	{
		return stringUtil.replaceAll("\\", "/", filename);
	}
	
	return exports;

});