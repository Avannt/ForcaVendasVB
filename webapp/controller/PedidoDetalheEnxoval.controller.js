/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";
	
	return BaseController.extend("testeui5.controller.PedidoDetalheEnxoval", {
		
		constructor: function(sView){
			this.PDController = sView;
			
			this.onInicializarEventosCampEnxoval();
		},

		onInit: function() {
		},
		
		onInicializarEventosCampEnxoval: function(){
			// this.PDController.byId("idObservacoesAuditoria").attachLiveChange(this.onLiveChangeIdCodCliente);
		},
		
		onAtivarCampanhaEnxoval: function(){
			
		}
	});
});