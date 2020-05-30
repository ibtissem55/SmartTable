sap.ui.define([
		"sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", 'sap/ui/Device', 'sap/m/SearchField'
], function (Controller, MessageToast, JSONModel, Device, SearchField) {
	"use strict";
	var oTable, oFilter;
	var oModel;
	return Controller.extend("smartTable.SmartTable.controller.Firstview", {
		onInit: function () {
			oModel = new sap.ui.model.json.JSONModel();
			oTable = this.getView().byId("smartTable");
			oFilter = this.getView().byId("smartFilterBar");
		},
		/**
		 * Event handler when the add button gets pressed
		 * @public
		 */
		onOpenFormDialog: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("add");
		},
		handleUploadPress: function () {
			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
			if (!oFileUploader.getValue()) {
				MessageToast.show("choose a file first");
				return;
			} else {
				var file = oFileUploader.getFocusDomRef().files[0];
				if (file && window.FileReader) {
					var reader = new FileReader();
					reader.onload = function (e) {
						var strCSV = e.target.result;

						var arrCSV = strCSV.match(/[\w .]+(?=;?)/g);
						var noOfCols = 11;
						var hdrRow = arrCSV.splice(0, noOfCols);
						var data = [];
						while (arrCSV.length > 0) {
							var obj = {};
							var row = arrCSV.splice(0, noOfCols);
							for (var i = 0; i < row.length; i++) {
								obj[hdrRow[i]] = row[i].trim();
							}
							data.push(obj);
						}
						oModel.setData(data);
						oTable.setModel(oModel);
						oFilter.setModel(oModel);
							};
					reader.readAsBinaryString(file);

				}

			}
		}

	});
});