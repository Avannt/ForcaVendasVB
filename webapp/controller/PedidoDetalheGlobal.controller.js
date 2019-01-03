/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";
	
	return BaseController.extend("testeui5.controller.PedidoDetalheGlobal", {
		
		constructor: function(sView){
			this.PDController = sView;
		},

		onInit: function() {
			
		},
		
		onInicializarEventosPedidoDetalheGlobal: function(){
			sap.ui.getCore().byId("idItemPedido").attachSearch(this.onBuscaGrupoGlobal);
		},
		
		onBuscaGrupoGlobal: function(sView){
			alert(this.oItemPedido.tipoItem2);
		}
	});
});