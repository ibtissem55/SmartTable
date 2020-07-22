sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/Text", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter", "sap/m/library", 'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet',
	"sap/m/List", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/m/Button"
], function (Controller, JSONModel, Device, SearchField, Spreadsheet, Table, Label, MessageBox, Fragment, Dialog, Filter,
	FilterOperator, MessageToast,
	FileUploader, Button, mobileLibrary, List, StandardListItem, Text) {
	"use strict";

	return Controller.extend("smartTable.SmartTable.controller.Mtable", {

		onInit: function () {
			var oViewModel = new sap.ui.model.json.JSONModel({
				busy: false,
				hasUIChanges: false,
				solutionEmpty: true,
				groupId: "myGroupId"
			});
			this.getView().setModel(oViewModel, "appView");
			this.oModel = this.getOwnerComponent().getModel();
			this.oModel.setUseBatch(true);
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
			this.oTable = oEvent.getSource().getTable();
		},
		renameKeys: function (obj) {
			var newSubKey = {}
			var newKeys = {
				'Requirement ID': "Requirement_ID",
				'Created By': "Created_By",
				'TRUNC PATH': "TTUNC_PATH",
				'Work Package ID': "Work_Package_ID",
				'WP Description': "WP_Description",
				'Value Points': "Value_Points",
				'Effort Points': "Effort_Points",
				'Wp Crm Link': "WpCrmLink",
				'Requirement GUID': "REQUIREMENT_GUID",
				'Work Package GUID': "Work_Package_GUID",
				'Changed At': "Changed_At",
				'Changed By': "Changed_By",
				'Created At': "Created_At",
				'Element Name': "Element",
				'Element ID': "Element_ID",
				'Status ID': "Status ID",
				'Crm Link': "Crm_Link",
				'Owner BP Number': "Owner_BP_No",
				'Solution ID': "Solution_ID",
				'Branch ID': "Branch_ID",
				'Priority ID': "Priority_ID",
				'External ID': "External_ID",
				'External URL': "External_URL",
				'Scope ID': "Scope_ID",
				'Scope Name': "Scope_Name",
				'Status ID': "Status_ID",
				'Suggested Solution': "Suggested_Solution",
				'Category GUID': "CategoryGUID",
				'Number of requirements': "Requ_number",
				// 'Category - Category GUID': "Category - CatGuid",
				// 'Category - Category ID': "Category - CatId",
				// 'Category - Parent Category GUID': "Category - ParentGuid",
				// 'Category - Category Level': "Category - CatLevel",
				// 'Category - Asp ID': "Category - AspId",
				// 'ClassifAttributes - Component name': "ClassifAttributes-AttrName",
				'Business Process Expert Name': "Business_Process_Expert_Name",
				'Business Process Expert No': "Business_Process_Expert_No"
			};
			var keyValues = Object.keys(obj).map(key => {
				const newKey = newKeys[key] || key;
				return {
					[newKey]: obj[key]
				};
			});
			return Object.assign({}, ...keyValues);
		},
		handleUploadPress: function (oEvt) {
			var that = this;
			var branch = sap.ui.getCore().byId("dialogBranch").getSelectedItem().getText();
			var solution = sap.ui.getCore().byId("dialogSolution").getSelectedItem().getText();
			var branchId = sap.ui.getCore().byId("dialogBranch").getSelectedItem().getKey();
			var solutionId = sap.ui.getCore().byId("dialogSolution").getSelectedItem().getKey();
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
							json[k]["Branch ID"] = branchId;
							json[k]["Solution ID"] = solutionId;
							json[k]["Status"] = "Draft";
						}
						var oModelMNA = new sap.ui.model.json.JSONModel();
						oModelMNA.setData(json);
						that.getView().setModel(oModelMNA, "oModelMNA");
						var aColumns = that.oTable.getColumns();
						for (var m = 0; m < aColumns.length; m++) {
							var sPath = "oModelMNA>" + aColumns[m].data("p13nData").columnKey;
							sPath = sPath.replace("_", " ");
							aColumns[m].getTemplate().getDisplay().bindText(sPath);
							aColumns[m].getTemplate().getEdit().bindValue(sPath);
						}

						that.oTable.bindRows("oModelMNA>/");
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
			this.oModel.read(vPath, {
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
		_getText: function (sTextId, aArgs) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sTextId, aArgs);

		},
		fnSuccess: function (data, response) {
			sap.m.MessageToast.show("Your requirements are created successfully");
			//	this._setUIChanges(false);
		},
		fnError: function (e) {
			sap.m.MessageToast.show("Error during creating requirement");
		},
		onSave: function () {
			debugger;
			var j;
			var table = this.byId("smartTab");
			var d = this.getView().getModel("oModelMNA").getData();
			var oContext = new sap.ui.model.Context(this.oModel, "/requirementSet");
			this.oModel.setDeferredGroups(["addRequ"]);
			for (var i = 0; i < d.length; i++) {
				oContext = this.oModel.createEntry("/requirementSet", {
					properties: j,
					changeSetId: "changeset " + i
				});
				table.setBindingContext(oContext);
			}
			var c = this.oModel.getPendingChanges();
			this._setBusy(true); // Lock UI until submit is resolved.

			this.oModel.submitChanges({
				groupId: "addRequ",
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
			this.byId("smartTab").resetChanges();
			this._bTechnicalErrors = false;
			this._setUIChanges();
		}
	});
});
