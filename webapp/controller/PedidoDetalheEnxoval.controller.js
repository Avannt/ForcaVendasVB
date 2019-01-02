/*eslint-disable no-console, no-alert */
sap.ui.define([
	"jquery.sap.global",
	"testeui5/controller/BaseController",
	"sap/m/MessageBox"
], function(jQuery, BaseController, MessageBox) {
	"use strict";
	return BaseController.extend("testeui5.controller.PedidoDetalheEnxoval", {

		onInit: function() {
			this.getRouter().getRoute("PedidoDetalheEnxoval").attachPatternMatched(this._onLoadFields, this);
		},
			
		_onLoadFields: function() {
			var that = this;
		},
		
		getView: function(sView){
			
			this.pedidoController = sView;
		}
	});
});