sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/mvc/Controller"
], function(BaseController, Controller) {
	"use strict";

	return BaseController.extend("testeui5.controller.PedidoDetalheAprov", {

		onInit: function() {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("PedidoDetalheAprov").attachPatternMatched(this._onLoadFields, this);
		},
		
		_onLoadFields: function(){
			var that = this;
			
			var oModel = that.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http:// /sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });
			
			var nrPed = this.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

			oModel.read("/BuscaCabecPedidoAprov(INrpedcli='" + nrPed + "')", {
				success: function(retorno) {
					
					var oModelAprovacoes = new sap.ui.model.json.JSONModel(retorno);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovarDetalhe");
					
					
					oModel.read("/BuscaItemPedidoAprov", {
						urlParameters: {
							"$filter": "INrpedcli eq '" + nrPed + "'"
						},
						success: function(retornoitens) {
							
							var oModelAprovacoes = new sap.ui.model.json.JSONModel(retornoitens.results);
							that.getView().setModel(oModelAprovacoes, "PedidosAprovarItens");
							
							
							
						},
						error: function(error) {
							
							that.onMensagemErroODATA(error.statusCode);
						}
					});
				},
				error: function(error) {
					
					that.onMensagemErroODATA(error.statusCode);
				}
			});
			
		},
		
		onNavBack: function(oEvent) {
			
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("clienteConsultas", {}, true);
			}
			// sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf testeui5.view.PedidoDetalheAprov
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf testeui5.view.PedidoDetalheAprov
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf testeui5.view.PedidoDetalheAprov
		 */
		//	onExit: function() {
		//
		//	}

	});

});