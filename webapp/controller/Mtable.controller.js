sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/Text", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter",
	"sap/ui/model/odata/v4/ODataModel", "sap/m/library",
	'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet', "sap/m/List", "sap/m/Dialog",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/m/Button"
], function (Controller, MessageToast, JSONModel, Device, SearchField, Spreadsheet, Table, Label, ODataModel, Fragment, Dialog, Filter,
	FilterOperator,
	FileUploader, Button, mobileLibrary, List, StandardListItem, Text) {
	"use strict";
	var that  ;
	return Controller.extend("smartTable.SmartTable.controller.Mtable", {

		onInit: function () {
			that = this ;
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageModel = oMessageManager.getMessageModel(),
				oMessageModelBinding = oMessageModel.bindList("/", undefined, [],
					new Filter("technical", FilterOperator.EQ, true)),
				oViewModel = new sap.ui.model.json.JSONModel({
					busy : false,
					hasUIChanges : false,
					usernameEmpty : true,
					order : 0
				});
			
			this.getView().setModel(oViewModel, "appView");
			this.getView().setModel(oMessageModel, "message");

			oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
			this._bTechnicalErrors = false;

		},
		/**
		 * Event handler when the add button gets pressed
		 * @public
		 */
		onOpenFormDialog: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("add");
		},
		// handlePopoverPress: function (oEvent) {
		// 	var oButton = oEvent.getSource();

		handleUploadPress: function () {
			debugger
			//upload excel file and get json 
			var fragmentId = this.getView().createId("fr1");

			var oSmartTab = this.getView().byId("smartTab");
			var oFileUploader = sap.ui.core.Fragment.byId(fragmentId, "fileUploader");
//			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
			if (!oFileUploader.getValue()) {
				MessageToast.show("choose a file first");
				return;
			} else {
				sap.ui.getCore().fileUploadArr = [];
				var file = oFileUploader.getFocusDomRef().files[0];
				if (file && window.FileReader) {
					var reader = new FileReader();
					reader.onload = function (e) {
						var strCSV = e.target.result;
						var bytes = new Uint8Array(strCSV);
						var data = "";
						for (var i = 0; i < bytes.byteLength; i++) {
							data += String.fromCharCode(bytes[i]);
						}
						var workbook = XLSX.read(data, {
							type: "binary"
						});
						var firstSheetName = workbook.SheetNames[0];
						var worksheet = workbook.Sheets[firstSheetName];
						var json = XLSX.utils.sheet_to_json(worksheet, {
							raw: true
						});
						//	json is our data that we have to set in the json model  
						var oModelMNA = new sap.ui.model.json.JSONModel();
						oModelMNA.setData(json);
						//now we have to bind data to our smart table 
						oSmartTab.setModel(oModelMNA, "oModelMNA");
						var oTable = oSmartTab.getTable();
						var aColumns = oTable.getColumns();
						for (var m = 0; m < aColumns.length; m++) {
							var sPath = "oModelMNA>" + aColumns[m].data("p13nData").columnKey;

							aColumns[m].getTemplate().getDisplay().bindText(sPath);
							aColumns[m].getTemplate().getEdit().bindValue(sPath);
						}
						oTable.bindRows("oModelMNA>/");
						oSmartTab.setTable(oTable);
					};
					reader.readAsArrayBuffer(file);
				}
			}
		},
		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("smartTable.SmartTable.view.Dialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		onOpenDialog: function () {
			this._getDialog().open();
		},
		onCloseDialog: function () {
			this._getDialog().close();
		},		onButtonPress: function(oEvent) {
			var oButton = oEvent.getSource();
			that.byId("actionSheet").openBy(oButton);
		}

	});
});