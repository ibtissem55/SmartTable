sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/routing/History","sap/ui/core/UIComponent"],function(e,t,n){"use strict";return e.extend("smartTable.SmartTable.controller.Add",{onInit:function(){var e=this.getOwnerComponent().getModel().createEntry("/requirementSet");var t=this.getView().byId("smartForm");t.setBindingContext(e)},getRouter:function(){return n.getRouterFor(this)},_onObjectMatched:function(e){this.getView().bindElement({path:"/"+window.decodeURIComponent(e.getParameter("arguments").invoicePath),model:"invoice"})},onNavBack:function(){var e,n;e=t.getInstance();n=e.getPreviousHash();if(n!==undefined){window.history.go(-1)}else{this.getRouter().navTo("View1",{},true)}}})});