sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent"
], function (Controller, History, UIComponent) {
	"use strict";

	return Controller.extend("smartTable.SmartTable.controller.Add", {

		onInit: function () {

			var oProperties = {
				Status: "Draft"
			};

			var oViewModel = new sap.ui.model.json.JSONModel({
				hasUIChanges: false
			});
			this.getView().setModel(oViewModel, "appView");
			this.oModel = this.getOwnerComponent().getModel();
			var oContext = this.oModel.createEntry("/requirementSet", {
				properties: oProperties
			});
			var oSmartForm = this.getView().byId("smartForm");
			oSmartForm.setBindingContext(oContext);
		},
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		_onObjectMatched: function (oEvent) {

			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").invoicePath),
				model: "invoice"
			});
		},
		onNavBack: function () {

			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("View1", {}, true /*no history*/ );
			}
		},
		handleSubmit: function (oEvent) {

			this.oModel.submitChanges({
				success: this.fnSuccess,
				error: this.fnError
			});
			// var oModele = this.getView().getModel();
			// var that = this;
			// oModele.create("/requirementSet", this.requirement, {
			// 	success: function (oData, oResponse) {
			// 		sap.m.MessageToast.show("Your requirement is created successfully");

			// 	},
			// 	error: function (err, oResponse) {
			// 		sap.m.MessageToast.show("Error while creating Requirement");
			// 	}

			// });
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
		fnSuccess: function (dataa, response) {
			sap.m.MessageToast.show("Your requirement is created successfully");
		},
		fnError: function (ea) {
			sap.m.MessageToast.show("Error while creating Requirement");
		},
		onResetChanges: function (data) {
	
			this.oModel.resetChanges();
			this._setUIChanges(false)

		},onchangeModelValue : function (oEvt) {
			if (oEvt.getParameter("escPressed")) {
				this._setUIChanges();
			} else {
				this._setUIChanges(true);
			}
		}
	});
});