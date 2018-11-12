sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("testeui5.controller.MenuComercial", {

		onInit: function() {
			this.getRouter().getRoute("menuComercial").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function() {
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
		},
		
		onAfterRendering: function() {
			//tive que colocar porque tem um bug no tile container que mostra uma tile 
			//só se deixar o showHeader da page=true na view
			this.byId("page").setShowHeader(true);
		},
		
		onTile: function(oEvent) {
			switch (oEvent.getSource().data("opcao")) {
				case "menuConsultas":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
					break;
				case "relatorios":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
					break;
			}
		},
		
		onNavBack: function(){
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		}
	});
});