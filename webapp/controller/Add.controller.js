sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent"
], function (Controller, History, UIComponent) {
	"use strict";

	return Controller.extend("smartTable.SmartTable.controller.Add", {
		onInit: function () {
			var oModel = this.getOwnerComponent().getModel().createEntry("/requirementSet");
			var oField1 = this.getView().byId("smartForm");
			oField1.setBindingContext(oModel);
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
		}
	});
});