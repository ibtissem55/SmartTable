sap.ui.define(["sap/ui/core/mvc/Controller","sap/m/MessageToast","sap/ui/model/json/JSONModel","sap/ui/Device","sap/m/SearchField"],function(e,a,r,t,i){"use strict";var o,s;var l;return e.extend("smartTable.SmartTable.controller.Firstview",{onInit:function(){l=new sap.ui.model.json.JSONModel;o=this.getView().byId("smartTable");s=this.getView().byId("smartFilterBar")},onOpenFormDialog:function(){var e=sap.ui.core.UIComponent.getRouterFor(this);e.navTo("add")},handleUploadPress:function(){var e=this.byId("fileUploader");e.upload();if(!e.getValue()){a.show("choose a file first");return}else{var r=e.getFocusDomRef().files[0];if(r&&window.FileReader){var t=new FileReader;t.onload=function(e){var a=e.target.result;var r=a.match(/[\w .]+(?=;?)/g);var t=11;var i=r.splice(0,t);var n=[];while(r.length>0){var d={};var u=r.splice(0,t);for(var v=0;v<u.length;v++){d[i[v]]=u[v].trim()}n.push(d)}l.setData(n);o.setModel(l);s.setModel(l)};t.readAsBinaryString(r)}}}})});