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
			this.byId("idPedAprovar").setBusy(true);
			var oModel = that.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http://104.208.137.3:8000/sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });
			
			var nrPed = this.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

			oModel.read("/BuscaCabecPedidoAprov(INrpedcli='" + nrPed + "')", {
				success: function(retorno) {
					//Tipo pedido
					if(retorno.Auart == "YVEN"){
						retorno.Auart = "YVEN - VENDA NORMAL";
					} else if(retorno.Auart == "YVEF"){
						retorno.Auart = "YVEF - VENDA FUTURA";
					} else if(retorno.Auart == "YBON"){
						retorno.Auart = "YBON - BONIFICAÇÃO/AMOSTRA/BRINDE";
					} else if(retorno.Auart == "YTRO"){
						retorno.Auart = "YTRO - TROCAS";
					} else if(retorno.Auart == "YVEX"){
						retorno.Auart = "YVEX - EXPORTAÇÃO";
					}
					
					retorno.Erdat = retorno.Erdat.substring(4,6) + "/" + retorno.Erdat.substring(6,8) + "/" + retorno.Erdat.substring(0,4); 
					retorno.Hora = retorno.Horaped.substring(0,2) + ":" + retorno.Horaped.substring(2,4) + ":" + retorno.Horaped.substring(4,6);
					
					if(retorno.Tiponego == "01"){
						retorno.Tiponego = "01 - Avista";
					} else if(retorno.Tiponego == "02"){
						retorno.Tiponego = "02 - A prazo";
					}
					
					retorno.Quantparcelas = parseInt(retorno.Quantparcelas, 10);
					retorno.Diasprimeiraparcela = parseInt(retorno.Diasprimeiraparcela, 10);
					
					retorno.Existeentradapedido = Boolean(retorno.Existeentradapedido);
					retorno.Zzprazomed = parseFloat(retorno.Zzprazomed);
					
					var oModelAprovacoes = new sap.ui.model.json.JSONModel(retorno);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovarDetalhe");
					
					oModel.read("/BuscaItensPedidoAprov", {
						urlParameters: {
							"$filter": "INrpedcli eq '" + nrPed + "'"
						},
						success: function(retornoitens) {
							
							var oModelItensAprovacoes = new sap.ui.model.json.JSONModel(retornoitens.results);
							that.getView().setModel(oModelItensAprovacoes, "PedidosAprovarItens");
							
							that.byId("idPedAprovar").setBusy(false);
							
						},
						error: function(error) {
							that.byId("idPedAprovar").setBusy(false);
							that.onMensagemErroODATA(error.statusCode);
						}
					});
				},
				error: function(error) {
					that.byId("idPedAprovar").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
		},
		
		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Aprovacoes");
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