sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", 'sap/m/SearchField'
], function (Controller, MessageToast, JSONModel, SearchField) {
	"use strict";
	var oTable;
	var oModel = new sap.ui.model.json.JSONModel({});

	return Controller.extend("smartTable.SmartTable.controller.View1", {

		onInit: function () {
			oTable = this.getView();
			this._smartFilterBar = this.getView().byId("smartFilterBar");

			if (this._smartFilterBar) {
				this._smartFilterBar.attachFilterChange(function (oEvent) {});

				var oBasicSearchField = new SearchField();
				oBasicSearchField.attachLiveChange(function (oEvent) {
					this.getView().byId("smartFilterBar").fireFilterChange(oEvent);
				}.bind(this));

				this._smartFilterBar.setBasicSearch(oBasicSearchField);
			}
// this function is to uploade csv files where the separation is done by the ';'
		handleUploadPress: function () {

			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
			if (!oFileUploader.getValue()) {
				MessageToast.show("choose a file first");
				return;

			} else {
				// here we get the file from the dom and we read data 
				var file = oFileUploader.getFocusDomRef().files[0];
				if (file && window.FileReader) {
					var reader = new FileReader();
					reader.onload = function (e) {
						var strCSV = e.target.result;

						var arrCSV = strCSV.match(/[\w .]+(?=;?)/g);
						var noOfCols = 12;
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
						//here we bind data to the json modet that we created 
						oModel.setData(data);

						debugger;
						// here we bind data of th json model to the view 
						oTable.setModel(oModel);
					};

					reader.readAsBinaryString(file);

				}

			}
		}

	});
});