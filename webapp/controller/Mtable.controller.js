sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/Text", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter", "sap/m/library", 'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet',
	"sap/m/List", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/m/Button"
], function (Controller, JSONModel, Device, SearchField, Spreadsheet, Table, Label, MessageBox, Fragment, Dialog, Filter,
	FilterOperator, MessageToast,
	FileUploader, Button, mobileLibrary, List, StandardListItem, Text) {
	"use strict";

	var oTable;
	return Controller.extend("smartTable.SmartTable.controller.Mtable", {

		onInit: function () {
		
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageModel = oMessageManager.getMessageModel(),
				oMessageModelBinding = oMessageModel.bindList("/", undefined, [],
					new Filter("technical", FilterOperator.EQ, true)),
				oViewModel = new sap.ui.model.json.JSONModel({
					busy: false,
					hasUIChanges: false,
					solutionEmpty: true,
					order: 0,
					groupId: "myGroupId"
				});
			this.getView().setModel(oViewModel, "appView");
			this.getView().setModel(oMessageModel, "message");
			oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
			this.oModel = this.getOwnerComponent().getModel();
			var oContext = this.oModel.createEntry("/requirementSet");
			var oSmartTab = this.getView().byId("smartTab");
			oSmartTab.setBindingContext(oContext);
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
		onInitialise: function (oEvent) {
			oTable = oEvent.getSource().getTable();
			oTable.bindRows("oModelMNA>/");
		},
		handleUploadPress: function (oEvt) {
			var that = this;
			var branch = sap.ui.getCore().byId("dialogBranch").getSelectedItem().getText();
			var solution = sap.ui.getCore().byId("dialogSolution").getSelectedItem().getText();
			//upload excel file and get json 
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
						for (var k = 0; k < json.length; ++k) {
							json[k]["Branch"] = branch;
							json[k]["Solution"] = solution;
							json[k]["Status"] = "Draft";
						}
						//	this.getView().getModel("oModelMNA").setData(json);
						var oModelMNA = new sap.ui.model.json.JSONModel();
						oModelMNA.setData(json);
						that.getView().setModel(oModelMNA, "oModelMNA");
						var aColumns = oTable.getColumns();
						for (var m = 0; m < aColumns.length; m++) {
							var sPath = "oModelMNA>" + aColumns[m].data("p13nData").columnKey;
							sPath = sPath.replace("_", " ");
							aColumns[m].getTemplate().getDisplay().bindText(sPath);
							aColumns[m].getTemplate().getEdit().bindValue(sPath);
						}

						oTable.bindRows("oModelMNA>/");
						debugger;
						var c = that.oModel.getPendingChanges();
						that.oModel.submitChanges({
							success: function (dataa, response) {
								sap.m.MessageToast.show("Your requirement is created successfully");
							},
							error: function (ea) {
								that._setBusy(false);
								that._setUIChanges(false);
								MessageBox.error(ea.message);
							}
						});
						that._setUIChanges(true);
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
			this.byId("actionSheet").openBy(oButton);
		},
		onWorkPCackagePress: function (oEvent) {
			var oButton = oEvent.getSource();
			this.byId("actionWP").openBy(oButton);
		},
		solutionBranch: function (oEvent) {

			var solutionValue = oEvent.getSource().getProperty("selectedKey");
			if (solutionValue !== "") {
				this.getView().getModel("appView").setProperty("/solutionEmpty", false);
			}
			var idBranch = sap.ui.getCore().byId("dialogBranch");
			var vPath = "/solutionsSet('" + solutionValue.toString() + "')/SolutionBranch";
			idBranch.setSelectedKey(null);
			var itemBranch = sap.ui.getCore().byId("itemBranch");
			var idSolutions = sap.ui.getCore().byId("dialogSolution");
			idBranch.setSelectedKey(null);
			this.getOwnerComponent().getModel().read(vPath, {
				success: function (oRetrievedResult) {
					var items = oRetrievedResult.results;
					if (items.length !== 0) {
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
		_setBusy: function (bIsBusy) {
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/busy", bIsBusy);
		},
		_setUIChanges: function (bHasUIChanges) {
			if (this._bTechnicalErrors) {
				// If there is currently a technical error, then force 'true'.
				bHasUIChanges = true;
			} else if (bHasUIChanges === undefined) {
				bHasUIChanges = this.getView().getModel().hasPendingChanges();
			}
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/hasUIChanges", bHasUIChanges);
		},
		// _getText: function (sTextId, aArgs) {
		// 	return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sTextId, aArgs);

		// },
		fnSuccess: function (data, response) {
			this._setBusy(false);
			var sMessage = this._getText("changesSentMessage");
			MessageToast.show(sMessage);
			this._setUIChanges(false);
		},
		fnError: function (e) {
			this._setBusy(false);
			this._setUIChanges(false);
			MessageBox.error(e.message);
		},
		onSave: function () {
			debugger;

			//	var oSmartTab = this.byId("smartTab");
			//	var oModele = this.byId("smartTab").getModel();
			//	var oModel = this.byId("smartTab").getModel("oModelMNA");
			this.oModel.getPendingChanges();
			//oModele.getPendingChanges();
			//oModel.setDeferredGroups("myGroupId");
			//oModel.setUseBatch(true);
			this._setBusy(true); // Lock UI until submit is resolved.
			this.oModel.submitChanges({
				success: this.fnSuccess,
				error: this.fnError
			});
			this._bTechnicalErrors = false;
		},
		onInputChange: function (oEvt) {
			if (oEvt.getParameter("escPressed")) {
				this._setUIChanges();
			} else {
				this._setUIChanges(true);
				if (oEvt.getSource().getParent().getBindingContext().getProperty("Solution")) {
					this.getView().getModel("appView").setProperty("/solutionEmpty", false);
				}
			}
		},
		onMessageBindingChange: function (oEvent) {
			var aContexts = oEvent.getSource().getContexts(),
				aMessages,
				bMessageOpen = false;

			if (bMessageOpen || !aContexts.length) {
				return;
			}

			// Extract and remove the technical messages
			aMessages = aContexts.map(function (oContext) {
				return oContext.getObject();
			});
			sap.ui.getCore().getMessageManager().removeMessages(aMessages);

			this._setUIChanges(true);
			this._bTechnicalErrors = true;
			MessageBox.error(aMessages[0].message, {
				id: "serviceErrorMessageBox",
				onClose: function () {
					bMessageOpen = false;
				}
			});

			bMessageOpen = true;
		},
		onResetChanges: function () {
			that.byId("smartTab").resetChanges();
			that._bTechnicalErrors = false;
			that._setUIChanges();
		}

	});
});