sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/mvc/Controller"
], function(BaseController) {
	"use strict";

	return BaseController.extend("testeui5.controller.Menu", {

		onInit: function() {
			// sap.ui.getCore().byId("__component0---app--MyShell").setHeaderVisible(false);
			// this.setShellHeader(true);
			this.getRouter().getRoute("menu").attachPatternMatched(this._onRouteMatched, this);
		},

		onTile: function(oEvent) {
			switch (oEvent.getSource().data("opcao")) {
				case "pedido":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
					break;
				case "entregaFutura":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("entregaFutura");
					break;
				case "aprovacoes":
					sap.m.MessageToast.show("Em construção.");
					//sap.ui.core.UIComponent.getRouterFor(this).navTo("");
					break;
				case "relatorios":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
					break;
				case "menuConsultas":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
					break;
				case "envioPedidos":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("enviarPedidos");
					break;
					
			}
		},
		
		onDialogCloseImagem: function() {
			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},
		
		onAfterRendering: function() {

		},
		_onRouteMatched: function(oEvent) {
			var oModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().getModel("modelAux");
			// var empresa = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			// var nomeEmpresa;
			// var icone;
			
			// if(empresa == 1){
			// 	nomeEmpresa = "Pred -Só Fruta -Lafer";
			// 	icone = "img/predilecta.png";
			// }
			// else if(empresa == 2){
			// 	nomeEmpresa = "Stella";
			// 	icone = "img/SD.png";
			// }
			// else if(empresa == 3){
			// 	nomeEmpresa = "Minas";
			// 	icone = "img/soFrutas.png";
			// }
			// this.getOwnerComponent().getModel("modelAux").setProperty("/nomeEmpresa", nomeEmpresa);
			// this.getOwnerComponent().getModel("modelAux").setProperty("/iconeEmpresa", icone);
			// this.getOwnerComponent().getModel("helper").setProperty("/showShellHeader", true);
		}

	});

});