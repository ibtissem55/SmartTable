sap.ui.define([], function () {
	"use strict";
	return {
	
	reformatText:function(ovalue){

		if(ovalue!==null){
			ovalue.replace("&nbsp;", '');
		return ovalue.replace(/<(.|\n)*?>/g, '');
	}},
	deleteAdditionaltext:function(ovalue){
		
			if(ovalue!==null){
		 return ovalue.replace("&nbsp;", '');
	}
	}
	// ,reformatInt:function(oValue){
	// 	if(oValue!==null){
	// 		return oValue.parseInt();
	// 	}
	// },
	// reformatString:function(oValue){
	// 	if(oValue!==null){
		
	// 		return oValue.toString();
	// 	}	
	// }
	
	};
});