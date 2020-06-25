sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/Text", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter", "sap/m/library", 'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet',
	"sap/m/List", "sap/m/Dialog", "sap/m/MessageBox",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/m/Button"
], function (Controller, MessageToast, JSONModel, Device, SearchField, Spreadsheet, Table, Label, MessageBox, Fragment, Dialog, Filter,
	FilterOperator,
	FileUploader, Button, mobileLibrary, List, StandardListItem, Text) {
	"use strict";
	var that;
	return Controller.extend("smartTable.SmartTable.controller.Mtable", {

		onInit: function () {

			that = this;
			// var oVariantData = {
			// 	variant: [{
			// 		key: "2",
			// 		Name: "Work PAckage"
			// 	}, {
			// 		key: "3",
			// 		Name: "Work Item"
			// 	}]
			// };
			// var oJsonVariant = new sap.ui.model.json.JSONModel(oVariantData);
			// this.getView().setModel(oJsonVariant);
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageModel = oMessageManager.getMessageModel(),
				oMessageModelBinding = oMessageModel.bindList("/", undefined, [],
					new Filter("technical", FilterOperator.EQ, true)),
				oViewModel = new sap.ui.model.json.JSONModel({
					busy: false,
					hasUIChanges: false,
					usernameEmpty: true,
					order: 0
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
			var solution = sap.ui.getCore().byId("dialogBranch").getSelectedItem().getText();
			var solution = sap.ui.getCore().byId("dialogSolution").getSelectedItem().getText();
			//upload excel file and get json 
			var oSmartTab = this.getView().byId("smartTab");
			var oFileUploader = sap.ui.getCore().byId("fileUploader");
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
						for (var k = 0; k < json.length; ++k) {
							json[k]["Branch"] = "Design";
							json[k]["Solution"] = solution;
							json[k]["Status"] = "Draft";

						}
						oModelMNA.setData(json);

						//now we have to bind data to our smart table 
						oSmartTab.setModel(oModelMNA, "oModelMNA");
						var oTable = oSmartTab.getTable();
						var aColumns = oTable.getColumns();
						for (var m = 0; m < aColumns.length; m++) {
							var sPath = "oModelMNA>" + aColumns[m].data("p13nData").columnKey;
							sPath = sPath.replace("_", " ");

							aColumns[m].getTemplate().getDisplay().bindText(sPath);

							aColumns[m].getTemplate().getEdit().bindValue(sPath);

						}
						oTable.bindRows("oModelMNA>/");
						//	oSmartTab.setTable(oTable);
					};
					reader.readAsArrayBuffer(file);
					this._getDialog().close();
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
		},
		onButtonPress: function (oEvent) {
			var oButton = oEvent.getSource();
			that.byId("actionSheet").openBy(oButton);
		},
		onWorkPCackagePress: function (oEvent) {
			var oButton = oEvent.getSource();
			that.byId("actionWP").openBy(oButton);
		},
		solutionBranch: function (oEvent) {

			var solutionValue = oEvent.getSource().getProperty("selectedKey");
			var idBranch = sap.ui.getCore().byId("dialogBranch");
			var vPath = "/solutionsSet('" + solutionValue.toString() + "')/SolutionBranch";
			idBranch.setSelectedKey(null);
			var itemBranch = sap.ui.getCore().byId("itemBranch");
			var idSolutions = sap.ui.getCore().byId("dialogSolution");
			idBranch.setSelectedKey(null);
			this.getOwnerComponent().getModel().read(vPath, {
				success: function (oRetrievedResult) {
					debugger;
					var items = oRetrievedResult.results;
					if (items.length != 0) {
						idBranch.setEnabled(true);
						idBranch.bindItems({
							path: vPath,
							template: itemBranch,
							templateShareable: true
						});
					} else {
						idBranch.setSelectedKey(undefined);
						idSolutions.setSelectedKey(null);
						idBranch.setEnabled(false);
						sap.m.MessageBox.error("Choose a Solution with Design Branch", {
							title: "Error", // default
							onClose: null, // default
							styleClass: "", // default
							actions: sap.m.MessageBox.Action.Close, // default
							emphasizedAction: null, // default
							initialFocus: null, // default
							textDirection: sap.ui.core.TextDirection.Inherit // default
						});
						return;
					}
				}
			});

		},
		// onSave: function () {
		// 	var fnSuccess = function () {
		// 		this._setBusy(false);
		// 		MessageToast.show(this._getText("changesSentMessage"));
		// 		this._setUIChanges(false);
		// 	}.bind(this);

		// 	var fnError = function (oError) {
		// 		this._setBusy(false);
		// 		this._setUIChanges(false);
		// 		MessageBox.error(oError.message);
		// 	}.bind(this);

		// 	this._setBusy(true); // Lock UI until submitBatch is resolved.
		// 	this.getView().getModel().submitBatch("peopleGroup").then(fnSuccess, fnError);
		// 	this._bTechnicalErrors = false; // If there were technical errors, a new save resets them.
		// },
		_setBusy: function (bIsBusy) {
			var oModel = this.getView().getModel("appView");
			oModel.setProperty("/busy", bIsBusy);
		},
		_setUIChanges: function (bHasUIChanges) {
				if (this._bTechnicalErrors) {
					// If there is currently a technical error, then force 'true'.
					bHasUIChanges = true;
				} else if (bHasUIChanges === undefined) {
					bHasUIChanges = this.getView().getModel().hasPendingChanges();
				}
				var oModel = this.getView().getModel("appView");
				oModel.setProperty("/hasUIChanges", bHasUIChanges);
			}
			// onMessageBindingChange: function (oEvent) {
			// 	var aContexts = oEvent.getSource().getContexts(),
			// 		aMessages,
			// 		bMessageOpen = false;

		// 	if (bMessageOpen || !aContexts.length) {
		// 		return;
		// 	}

		// 	// Extract and remove the technical messages
		// 	aMessages = aContexts.map(function (oContext) {
		// 		return oContext.getObject();
		// 	});
		// 	sap.ui.getCore().getMessageManager().removeMessages(aMessages);

		// 	this._setUIChanges(true);
		// 	this._bTechnicalErrors = true;
		// 	MessageBox.error(aMessages[0].message, {
		// 		id: "serviceErrorMessageBox",
		// 		onClose: function () {
		// 			bMessageOpen = false;
		// 		}
		// 	});

		// 	bMessageOpen = true;
		// },
		// onResetChanges: function () {
		// 	this.byId("peopleList").getBinding("items").resetChanges();
		// 	this._bTechnicalErrors = false;
		// 	this._setUIChanges();
		// },
		// onInputChange: function (oEvt) {
		// 	if (oEvt.getParameter("escPressed")) {
		// 		this._setUIChanges();
		// 	} else {
		// 		this._setUIChanges(true);
		// 		if (oEvt.getSource().getParent().getBindingContext().getProperty("UserName")) {
		// 			this.getView().getModel("appView").setProperty("/usernameEmpty", false);
		// 		}
		// 	}
		// }

	});
});