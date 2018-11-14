sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("testeui5.controller.Aprovacoes", {

		onInit: function () {

		},
		
		onNavBack: function () {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			// this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			// this.onResetaCamposPrePedido();

		},

		onExit: function () {

		}

	});

});