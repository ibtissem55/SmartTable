sap.ui.define([
	"sap/ui/core/mvc/Controller", "sap/m/Text", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter", "sap/m/library", 'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet',
	"sap/m/List", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/resource/ResourceModel",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/ui/table/RowSettings",
	"sap/m/Button", "sap/m/MessagePopover", 'sap/ui/core/Element', 'sap/ui/core/message/Message',
	'sap/ui/core/MessageType', "sap/m/MessagePopoverItem", "sap/ui/core/ValueState", "../utils/formatter"
], function (Controller, JSONModel, Device, SearchField, Spreadsheet, Table, Label, MessageBox, Fragment, Dialog, Filter,
	FilterOperator, MessageToast, FileUploader, Button, mobileLibrary, List, StandardListItem, ResourceModel, Text,
	RowSettings, MessagePopover, MessageType, Message, Element, MessagePopoverItem, ValueState, formatter) {
	"use strict";

	return Controller.extend("smartTable.SmartTable.controller.Mtable", {
		formatter: formatter,
		onInit: function () {
			sap.ui.core.UIComponent.extend("MyComponent", {
				metadata: {
					version: "1.0",
					handleValidation: true
				}
			});

			this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();

			sap.ui.getCore().attachValidationError(function (oEvent) {
				oEvent.getParameter("element").setValueState(ValueState.Error);
			});
			sap.ui.getCore().attachValidationSuccess(function (oEvent) {

				oEvent.getParameter("element").setValueState(ValueState.None);
			});

			this._oMessageManager = sap.ui.getCore().getMessageManager();
			//	this._oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			this._oMessageManager.registerObject(this.getView().byId("smartTab"), true);
			this.getView().setModel(this._oMessageManager.getMessageModel(), "message");

			this.oMessageTemplate = new MessagePopoverItem({
				type: "{message>type}",
				title: "{message>message}",
				subtitle: "{message>additionalText}",
				description: "{message>description}",
				key: "{message>id}"

			});

			this.oMessagePopover = new MessagePopover({

				items: {
					path: "message>/",
					template: this.oMessageTemplate
				}
			});
			this.byId("popover").addDependent(this.oMessagePopover);

			this.datacopy = "";
			var oViewModel = new sap.ui.model.json.JSONModel({
				busy: false,
				hasUIChanges: false,
				hasInputChanges: false,
				solutionEmpty: true,
				groupId: "myGroupId",
				buttonV: true,
				highlight: undefined,
				editable: true,
				state: 'None'

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
		// onChangeInput: function (event) {

		// },
		onOpenFormDialog: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("add");
		},
		_setHilight: function (bHilight) {

			if (this._bTechnicalErrors) {
				// If there is currently a technical error, then force 'true'.
				bHilight = false;
			} else if (bHilight === undefined) {
				bHilight = !this.getView().getModel().hasPendingChanges();
			}
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/highlight", bHilight);

		},
		_setEdit: function (bValue) {
			if (this._bTechnicalErrors) {
				// If there is currently a technical error, then force 'true'.
				bValue = false;
			} else if (bValue === undefined) {
				bValue = !this.getView().getModel().hasPendingChanges();
			}
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/editable", bValue);
		},
		onEditToggeled: function (oValue) {
			this._setEdit(oValue.getParameters().editable);
		},
		onSave: function () {
			var j;
			var table = this.byId("smartTab");
			var d = this.getView().getModel("oModelMNA").getData();

			var oContext = new sap.ui.model.Context(this.oModel, "/requirementSet");
			this.oModel.setDeferredGroups(["addRequ"]);
			for (var i = 0; i < d.length; i++) {

				delete d[i]['ClassifAttributes - Component name'];
				delete d[i]['ClassifAttributes - Classification'];
				delete d[i]['ClassifAttributes - Text'];
				delete d[i]['Category - Category GUID'];
				delete d[i]['Category - Category ID'];
				delete d[i]['Category - Parent Category GUID'];
				delete d[i]['Category - Category Level'];
				delete d[i]['Category - Asp ID'];
				delete d[i]['Category - Description'];
				delete d[i]['Category - Editability'];
				delete d[i]['Category - Editability'];
				delete d[i]['Priority ID'];

				delete d[i]['Boolean Variable (X=True, -=False, Space=Unknown)'];

				j = this.renameKeys(d[i]);
				oContext = this.oModel.createEntry("/requirementSet", {
					properties: j,
					changeSetId: "changeset " + i,
					error: this.fnError.bind(this),
					success: this.fnSuccess.bind(this)
				});
				table.setBindingContext(oContext);
			}

			this._setBusy(true); // Lock UI until submit is resolved.

			this.oModel.submitChanges({
				groupId: "addRequ"

			});

			this._bTechnicalErrors = false;
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
							json[k].Classification_Attributes = {
								Value: json[k]["ClassifAttributes - Text"],
								Key: json[k]["ClassifAttributes - Classification"]
							};
							json[k].Category = {

								CatId: json[k]["Category - Category ID"]
							};
							json[k]["Branch"] = branch;
							json[k]["Solution"] = solution;
							json[k]["Branch ID"] = branchId;
							json[k]["Solution ID"] = solutionId;
							json[k]["Status"] = "Draft";
							//json[k]["Status ID"] = "E0001";
							json[k]["Work Package GUID"] = "";
							json[k]["WP Description"] = "";
							json[k]["Work Package ID"] = "";

						}

						var oModelMNA = new sap.ui.model.json.JSONModel();
						oModelMNA.setData(json);

						that.datacopy = JSON.parse(JSON.stringify(json));
						that.getView().setModel(oModelMNA, "oModelMNA");

						var aColumns = that.getView().byId("smartTab").getTable().getColumns();
						var oValue;
						//	var key;

						for (var m = 0; m < aColumns.length; m++) {
							var val = aColumns[m].data("p13nData").columnKey;
							var valeur = that.renameKeysReverse(val);
							var sPath = "oModelMNA>" + valeur;

							//	oValue = aColumns[m].getTemplate().getEdit().bindValue(sPath);
							if (sPath === "oModelMNA>Description") {
								var input = aColumns[m].getTemplate().getItems()[0];
								input.bindValue({
									path: sPath,
									formatter: that.formatter.reformatText
								});

							}  else if (sPath === "oModelMNA>Status" || sPath === "oModelMNA>StatusID") {
								aColumns[m].getTemplate().getEdit().setEnabled(false);
								aColumns[m].getTemplate().getDisplay().bindText(sPath);
								aColumns[m].getTemplate().getEdit().bindValue(sPath);
							} else {
								aColumns[m].getTemplate().getDisplay().bindText(sPath);
								aColumns[m].getTemplate().getEdit().bindValue(sPath);
							}
						}

						that.oTable.bindRows("oModelMNA>/");
					};
					reader.readAsArrayBuffer(file);
					this._getDialog().close();
					this._setUIChanges(true);
				}
			}
		},
		press: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("fragmentId", "smartTable.SmartTable.view.RichText", this);
			}
			this.getView().addDependent(this._oPopover);
			var oContext = oEvent.getSource().getBindingContext("oModelMNA");
			this._oPopover.setBindingContext(oContext, "oModelMNA");
			this._oPopover.openBy(oButton);
		},
		getEdit: function () {
			var oModele = this.getView().getModel("appView");
			return oModele.getProperty("/editable");
		},

		fnSuccess: function (data, response) {

			if (this.oModel.hasPendingChanges()) {
				sap.m.MessageToast.show("Error during creating requirement");
				this._setHilight(false);
			} else {
				this.getView().byId("smartTab").setEditable(false);
				sap.m.MessageToast.show("Your requirements are created successfully");
				this._setHilight(true);
				this._setUIChanges(false);
				this._setEdit(false);

			}

		},
		fnError: function (e) {
			sap.m.MessageToast.show("Error during creating requirement");
			this._setHilight(false);
			this._setUIChanges(false);
		},
		onOpenWp: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var source = oEvent.getParameter("key");

			if (source === "03") {
				oRouter.navTo("ScopeItems");
				sap.ui.getCore().getMessageManager().removeAllMessages();
			} else if (source === "01") {

				oRouter.navTo("Wp");
				sap.ui.getCore().getMessageManager().removeAllMessages();

			} else {
				oRouter.navTo("Mtable");
			}
		},
		handleSave: function (oEvent) {

			this.oMessagePopover.openBy(oEvent.getSource());

		},

		onDataReceived: function (oEvent) {
			this.oTable = oEvent.getSource().getTable();
			var aColumns = this.oTable.getColumns();

			for (var m = 0; m < aColumns.length; m++) {
				aColumns[m].setWidth("150px");
			}
		},
		renameKeysReverse: function (obj) {

			switch (obj) {
			case 'Requirement_ID':
				obj = "Requirement ID";
				break;
			case "Created_By":
				obj = 'Created By';
				break;
			case "TTUNC_PATH":
				obj = 'TRUNC PATH';
				break;
			case "Work_Package_ID":
				obj = 'Work Package ID';
				break;
			case "WP_Description":
				obj = 'WP Description';
				break;
			case "Effort_Points":
				obj = 'Effort Points';
				break;
			case "Value_Points":
				obj = 'Value Points';
				break;
			case "WpCrmLink":
				obj = 'Wp Crm Link';
				break;
			case "REQUIREMENT_GUID":
				obj = 'Requirement GUID';
				break;
			case "Work_Package_GUID":
				obj = 'Work Package GUID';
				break;
			case "Changed_At":
				obj = 'Changed At';
				break;
			case "Changed_By":
				obj = 'Changed By';
				break;
			case "Created_At":
				obj = 'Created At';
				break;
			case "Element":
				obj = 'Element Name';
				break;
			case "Element_ID":
				obj = 'Element ID';
				break;
			case "Status_ID":
				obj = 'Status ID';
				break;
			case "Crm_Link":
				obj = 'Crm Link';
				break;
			case "Owner_BP_No":
				obj = 'Owner BP Number';
				break;
			case "Solution_ID":
				obj = 'Solution ID';
				break;
			case "Suggested_Solution":
				obj = 'Suggested Solution';
				break;
			case "Branch_ID":
				obj = 'Branch ID';
				break;
			case "Priority_ID":
				obj = 'Priority ID';
				break;
			case "External_ID":
				obj = 'External ID';
				break;
			case "External_URL":
				obj = 'External URL';
				break;
			case "Scope_ID":
				obj = 'Scope ID';
				break;
			case "CategoryGUID":
				obj = 'Category GUID';
				break;
			case "Requ_number":
				obj = 'Number of requirements';
				break;
			case "Business_Process_Expert_Name":
				obj = 'Business Process Expert Name';
				break;
			case "Business_Process_Expert_No":
				obj = 'Bus. Proc. Expert BP';
				break;
			case "Local":
				obj = 'Local Requirement';
				break;
			case "RequirementsTeamName":
				obj = 'Requirements Team';
				break;
			case "RequirementsTeamNo":
				obj = 'Req. Team BP No';
				break;
			case "PlannedProject":
				obj = 'Planned Project';
				break;
			default:
				obj = obj;
			}

			return obj;
		},
		renameKeys: function (obj) {
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
				'Status ID': "Status_ID",
				'Crm Link': "Crm_Link",
				'Owner BP Number': "Owner_BP_No",
				'Solution ID': "Solution_ID",
				'Branch ID': "Branch_ID",
				'Priority ID': "Priority_ID",
				'External ID': "External_ID",
				'External URL': "External_URL",
				'Scope ID': "Scope_ID",
				'Scope Name': "Scope_Name",
				'Suggested Solution': "Suggested_Solution",
				'Category GUID': "CategoryGUID",
				'Number of requirements': "Requ_number",
				'BP Expert Name': "Business_Process_Expert_Name",
				'Bus. Proc. Expert BP': "Business_Process_Expert_No",
				'Local Requirement': "Local",
				'Requirements Team': "RequirementsTeamName",
				'Req. Team BP No': "RequirementTeamNo",
				'Planned Project': "PlannedProject"
			};
			var keyValues = Object.keys(obj).map(key => {
				const newKey = newKeys[key] || key;
				return {
					[newKey]: obj[key]
				};
			});
			return Object.assign({}, ...keyValues);
		},

		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("smartTable.SmartTable.view.Dialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		handleCloseButton: function (oEvent) {
			this._oPopover.close();
		},
		onSaveDescr: function (oEvent) {

			this._oPopover.close();

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
		_setInputChanges: function (bHasUIChanges) {
			if (this._bTechnicalErrors) {
				// If there is currently a technical error, then force 'true'.
				bHasUIChanges = true;
			} else if (bHasUIChanges === undefined) {
				bHasUIChanges = this.getView().getModel().hasPendingChanges();
			}
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/hasInputChanges", bHasUIChanges);
		},
		_getText: function (sTextId, aArgs) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sTextId, aArgs);

		},
		onLive: function (oEvent) {
			if (oEvent.getParameter("liveValue") === "") {
				this.setValueState(sap.ui.core.ValueState.Error);
			} else {
				this.setValueState(sap.ui.core.ValueState.Success);
			}
		},
		onInputChange: function (oEvt) {
			if (oEvt.getParameter("escPressed")) {
				this._setInputChanges();
			} else {
				this._setInputChanges(true);
				this._setUIChanges(true);
			}
			var _value = oEvt.getParameter("changeEvent").getSource().mBindingInfos.value.binding.sPath;
			if (_value === "Title" || _value === "Priority" || _value === "Status" || _value === "Owner") {
				//	this.checkInputConstraints(oEvt);
				//	this.handleRequiredField(oEvt);

				//	var sBindingPath = "/" + oEvt.getParameter("changeEvent").getSource().getId() + "/";
				if (oEvt.getParameter("changeEvent").getSource().getValue() === "") {
			//	this.stateSet("Error");
				oEvt.getParameter("changeEvent").getSource().setValueState(sap.ui.core.ValueState.Error);
					this._setUIChanges(false);
					this._oMessageManager.addMessages(
						new Message({
							message: "A mandatory field is empty",
							type: sap.ui.core.MessageType.Error,
							//	additionalText: oInput.getLabels()[0].getText(),
							processor: this.oMessageProcessor
						})
					);
				} else if (oEvt.getParameter("changeEvent").getSource().getValue() !== "") {
					oEvt.getParameter("changeEvent").getSource().setValueState(sap.ui.core.ValueState.None);
				}
			}
			var bl = null;
			var b = this.getView().getModel("oModelMNA").getData();
			for (var i = 0; i < b.length; i++) {
				if (b[i]["Title"] === "" || b[i]["Priority"] === "" || b[i]["Owner"] === "") {
					bl = false;
				}
			}
			if (bl === false) {
				this._setUIChanges(false);
			} else if (bl === null) {
				this._setUIChanges(true);
				//	this.onMessageBindingChange(oEvt);
				this._oMessageManager.removeAllMessages();
			}
		}
	});
});