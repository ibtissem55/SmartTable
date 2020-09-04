sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/Text", "sap/ui/model/json/JSONModel", "sap/ui/unified/FileUploader",
	"sap/ui/model/Filter", "sap/m/library", 'sap/ui/Device', "sap/m/StandardListItem", 'sap/m/SearchField', 'sap/ui/export/Spreadsheet',
	"sap/m/List", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/resource/ResourceModel",
	"sap/ui/model/FilterOperator", "sap/ui/table/Table", "sap/ui/commons/Label", 'sap/ui/core/Fragment', "sap/ui/table/RowSettings",
	"sap/m/Button", "sap/m/MessagePopover", 'sap/ui/core/Element', 'sap/ui/core/message/Message',
	'sap/ui/core/MessageType', "sap/m/MessagePopoverItem", "sap/ui/core/ValueState", "../utils/formatter"

], function (Controller, JSONModel, Device, SearchField, Spreadsheet, Table, Label, MessageBox, Fragment, Dialog, Filter,
	FilterOperator, MessageToast, FileUploader, Button, mobileLibrary, List, StandardListItem, ResourceModel, Text,
	RowSettings, MessagePopover, MessageType, Message, Element, MessagePopoverItem, ValueState, formatter) {
	"use strict";

	return Controller.extend("smartTable.SmartTable.controller.Wp", {
		formatter: formatter,
		onInit: function () {
			this._oMessageManager = sap.ui.getCore().getMessageManager();

			this._oMessageManager.registerObject(this.getView().byId("smartTable"), true);
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
				highlight: undefined,
				editable: true,
				mandatory: false
			});
			this.getView().setModel(oViewModel, "appView");
			this.oModel = this.getOwnerComponent().getModel();
			this.oModel.setUseBatch(true);
			this._bTechnicalErrors = false;
		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
	onEditToggeled: function (oValue) {
			this._setEdit(oValue.getParameters().editable);
		},
		// onListRowSelect: function (oEvent) {
		// 	var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		// 	var wpPath = oEvent.getParameter("rowContext").getPath(),
		// 	scope = wpPath.match(/(\d+)/)[0];

		// 	oRouter.navTo("ScopeItems", {ScopeItems: scope});
		// },
		handleUploadPress: function (oEvt) {
			this._setBusy(true);
			var that = this;
			//upload excel file and get json 
			var oFileUploader = sap.ui.getCore().byId("WpfileUploader");
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
						for (var k = 0; k < json.length; ++k) {
							json[k].ClassifAttributes = {
								Value: json[k]["ClassifAttributes - Text"],
								Key: json[k]["ClassifAttributes - Classification"]
							};

						}
						var oModelMNA = new sap.ui.model.json.JSONModel();

						oModelMNA.setData(json);

						that.datacopy = JSON.parse(JSON.stringify(json));
						that.getView().setModel(oModelMNA, "oModelMNA");

						var aColumns = that.getView().byId("smartTable").getTable().getColumns();
						var oValue;
						//	var key;

						for (var m = 0; m < aColumns.length; m++) {
							var val = aColumns[m].data("p13nData").columnKey;
							var valeur = that.renameKeysReverse(val);
							var sPath = "oModelMNA>" + valeur;
							if (sPath === "oModelMNA>Long Description") {
								var input = aColumns[m].getTemplate().getItems()[0];
								input.bindValue({
									path: sPath,
									formatter: that.formatter.reformatText
								});

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
			this._setBusy(false);
		},
		handleCloseButton: function (oEvent) {
			this._oPopover.close();
		},
		onSaveDescr: function (oEvent) {

			this._oPopover.close();

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
		onSave: function () {
			var j;
			var table = this.byId("smartTable");
			var d = this.getView().getModel("oModelMNA").getData();

			var oContext = new sap.ui.model.Context(this.oModel, "/WorkPackageSet");
			this.oModel.setDeferredGroups(["addRequ"]);
			for (var i = 0; i < d.length; i++) {
				delete d[i]['ClassifAttributes - Component name'];
				delete d[i]['ClassifAttributes - Classification'];
				delete d[i]['ClassifAttributes - Text'];
				d[i]["Description"] = d[i]["Title"];
				delete d[i]['Title'];
				delete d[i]['Owner'];
				j = this.renameKeys(d[i]);
				oContext = this.oModel.createEntry("/WorkPackageSet", {
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
			var oMessageModel = new sap.ui.model.json.JSONModel({
				data: this.getOwnerComponent().getModel().mMessages,
				type: "Error"
			});
			this.getView().setModel(oMessageModel, "oMessageModel");
		},
		renameKeys: function (obj) {
			var newKeys = {
				'Work Package ID': "Id",
				'Text': 'Value',
				'Created By': "Created_By",
				'Actual Release': "ActualRelease",
				'Long Description': "LongDescription",
				'Value Points': "ValuePoint",
				'Effort Points': "EFFORT_POINT",
				'DESCRIPTION': "Description",
				'Requirement GUID': "REQUIREMENT_GUID",
				'GUID': "Guid",
				'Transaction Last Changed Time': "ChangedAt",
				'Changed By': "ChangedBy",
				'Time of transaction creation': "CreatedAt",
				'Document Type': "TypeId",
				'Element ID': "Element_ID",
				'Status': "Status",
				'Status Text': "StatusText",
				'PRIORITY': "Priority",
				'Owner ID': "OwnerId",
				'Solution ID': "Solution_ID",
				'Branch ID': "Branch_ID",
				'Priority ID': "Priority_ID",
				'Priority Text': "PriorityText",
				'Project Phase Guid': "ProjectPhase",
				'Project Phase': "ProjectPhaseText",
				'Dev Team': "DevTeam",
				'Requirements Team ID': "RequirementsteamId",
				'Requested Release': "RequestedRelease",
				'List of assigned requirements Id': "RequirementMsg",
				'Requirements Team': "Requirementsteam",
				'BP Expert Name': "Business_Process_Expert_Name",
				'Project Name': "Project",
				'Project Guid': "ProjectGuid",
				'RELEASE_NUMBER': "ReleaseNumber",
				'WRICEF_STRING': "WricefString",
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
		fnSuccess: function (data, response) {
			this._setBusy(false);
			if (this.oModel.hasPendingChanges()) {
				sap.m.MessageToast.show("Error during creating Work Packages");
				this._setHilight(false);
			} else {
				this.getView().byId("smartTable").setEditable(false);
				sap.m.MessageToast.show("Your Work Packages are created successfully as Stand alone");
				this._setHilight(true);
				this._setUIChanges(false);
				this._setEdit(false);

			}

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
		press: function (oEvent) {

			var oButton = oEvent.getSource();
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("fragmentId", "smartTable.SmartTable.view.WpRichText", this);
			}
			this.getView().addDependent(this._oPopover);
			var oContext = oEvent.getSource().getBindingContext("oModelMNA");
			this._oPopover.setBindingContext(oContext, "oModelMNA");
			this._oPopover.openBy(oButton);
		},
		fnError: function (e) {
			this._setBusy(false);
			sap.m.MessageToast.show("Error during creating Work Packages");
		//	this._setUIChanges(false);
			//this._setEdit(false);
				this._setHilight(false);
		},
		_setBusy: function (bIsBusy) {
			var oModele = this.getView().getModel("appView");
			oModele.setProperty("/busy", bIsBusy);
		},
		renameKeysReverse: function (obj) {

			switch (obj) {
			case 'Id':
				obj = "Work Package ID";
				break;
			case "CreatedBy":
				obj = 'Time of transaction creation';
				break;
			case "Effortpoint":
				obj = 'Effort Points';
				break;
			case "Valuepoint":
				obj = 'Value Points';
				break;
			case "TypeId":
				obj = 'Document Type';
				break;
			case "ActualRelease":
				obj = 'Actual Release';
				break;
			case "Guid":
				obj = 'GUID';
				break;
			case "ChangedAt":
				obj = 'Transaction Last Changed Time';
				break;
			case "ChangedBy":
				obj = 'ChangedBy';
				break;
			case "CreatedAt":
				obj = 'Time of transaction creation';
				break;
			case "ProjectPhase":
				obj = 'Project Phase Guid';
				break;
			case "StatusText":
				obj = 'Status Text';
				break;
			case "Status_ID":
				obj = 'Status ID';
				break;
			case "Priority":
				obj = 'PRIORITY';
				break;
			case "OwnerId":
				obj = 'Owner ID';
				break;
			case "Requirementsteam":
				obj = 'Requirements Team';
				break;
			case "RequirementMsg":
				obj = 'List of assigned requirements Id';
				break;
			case "WricefString":
				obj = 'WRICEF_STRING';
				break;
			case "RequirementsteamId":
				obj = 'Requirements Team ID';
				break;
			case "CategoryGUID":
				obj = 'Category GUID';
				break;
			case "RequestedRelease":
				obj = 'Requested Release';
				break;
			case "BpExpertId":
				obj = 'BP Expert No';
				break;
			case "LongDescription":
				obj = 'Long Description';
				break;
			case "ProjectPhaseText":
				obj = 'Project Phase';
				break;
			case "PriorityText":
				obj = 'Priority Text';
				break;
			case "Text":
				obj = 'Value';
				break;
			default:
				obj = obj;
			}

			return obj;
		},
		_onObjectMatched: function (oEvent) {

			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").invoicePath),
				model: "invoice"
			});
		},
		onOpenWp: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var source = oEvent.getParameter("key");
			if (source === "03") {
				oRouter.navTo("ScopeItems");
			} else if (source === "01") {

				oRouter.navTo("Wp");

			} else {
				oRouter.navTo("Mtable");
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}
		},
		handleSave: function (oEvent) {

			this.oMessagePopover.openBy(oEvent.getSource());

		},
		onInitialise: function (oEvent) {
			this.oTable = oEvent.getSource().getTable();

		},
		onButtonPress: function (oEvent) {
			var oButton = oEvent.getSource();
			this.byId("actionSheet").openBy(oButton);
		},
		onOpenDialog: function () {
			this._getDialog().open();
		},
		onCloseDialog: function () {
			this._getDialog().close();
		},

		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("smartTable.SmartTable.view.WpDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		onDataReceived: function (oEvent) {
			this.oTable = oEvent.getSource().getTable();
			var aColumns = this.oTable.getColumns();

			for (var m = 0; m < aColumns.length; m++) {
				aColumns[m].setWidth("150px");
			}

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
		// this function is to verify the required fields 
		onInputChange: function (oEvt) {
			if (oEvt.getParameter("escPressed")) {
				this._setInputChanges();
			} else {
				this._setInputChanges(true);
				this._setUIChanges(true);
			}
			var _value = oEvt.getParameter("changeEvent").getSource().mBindingInfos.value.binding.sPath;
			if (_value === "Title" || _value === "Priority" || _value === "Status" || _value === "Owner") {

				if (oEvt.getParameter("changeEvent").getSource().getValue() === "") {

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
				if (b[i]["WorkPackageID"] === "" || b[i]["Title"] === "" || b[i]["Owner"] === "" || b[i]["Classification"] === "") {
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
		}
	});

});