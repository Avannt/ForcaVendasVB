/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";
	
	return BaseController.extend("testeui5.controller.PedidoDetalheGlobal", {
		
		constructor: function(sView){
			this.PDController = sView;
			
			this.onInicializarEventosPedidoDetalheGlobal();
		},

		onInit: function() {
		},
		
		onInicializarEventosPedidoDetalheGlobal: function(){
			this.PDController.byId("idItemPedido").attachSearch(this.onBuscaGrupoGlobal);
		},
		
		onBuscaGrupoGlobal: function(){
			alert();
		}
	});
});