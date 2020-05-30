sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModels = new JSONModel(Device);
			oModels.setDefaultBindingMode("OneWay");
			return oModels;
		}

	};
});