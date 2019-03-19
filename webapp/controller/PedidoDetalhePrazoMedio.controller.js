/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalhePrazoMedio", {

		constructor: function(sView) {
			that = this;

			/* CAMPOS - INICIO */
			that.PDControllerCmpPrazoMedio = undefined;
			that.oVetorCmpPrzMed = [];
			/* CAMPOS - FIM */

			that.PDControllerCmpPrazoMedio = sView;

			this.InicializarEventosCampPrazoMedio();
		} /* constructor */ ,

		InicializarEventosCampPrazoMedio: function() {
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCmpPrazoMedio, "select"); /* select */
		}, /* InicializarEventosCampPrazoMedio */
		
		onSelectIconTabBarCmpPrazoMedio: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				//Busca se tem campnha de Prazo Médio ativa.
				that.onGetCmpPrzMed();
			}
		},
		
		onGetCmpPrzMed: function(){
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;
				
				var tCmpPrzMed = db.transaction("CmpPrzMed", "readonly");
				var osCmpPrzMed = tCmpPrzMed.objectStore("CmpPrzMed");
				
				if ("getAll" in osCmpPrzMed) {
					
					osCmpPrzMed.getAll().onsuccess = function(event) {
						that.oVetorCmpPrzMed = event.target.result;
						alert();
					};
				}
			};
		},
		
		//Método precisa esperar a execução do calculTotalPedido para pegar o total do Atualizado para depois acionar o range da cmp de Prz Méd
		onChecarRangeCmpPrzMed: function(){
			
			var totalPedido = that.PDControllerCmpPrazoMedio.oView.getModel("modelDadosPedido").getProperty("/ValTotPed");
			console.error("Inicio Camp Prz Médio");
			
			if(that.oVetorCmpPrzMed.length == 0){
				console.log("Não existe Range de Prazo Cadastrado para a Cmp Prazo Médio.");
				console.error("Fim Camp Prz Médio");
				return;
			}
			
			for(var i=0; i<that.oVetorCmpPrzMed.length; i++){
				if(totalPedido > that.oVetorCmpPrzMed[i].valorDe && totalPedido < that.oVetorCmpPrzMed[i].valorAte){
					var rangePermitido = that.oVetorCmpPrzMed[i].range
				}
				
			}
			
		},
		
		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCmpPrazoMedio.byId(sIdControle)) {
				oElemento = that.PDControllerCmpPrazoMedio.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCmpPrazoMedio.byId(sIdControle)){
			if (oElemento) {
				oEventRegistry = oElemento.mEventRegistry;
				var bExisteEvento = false;

				/* Preciso verificar se o evento já não foi atribuído ao controle pelo menos uma vez para 
				que não chame em duplicidade */

				if (sTipoEvento == "itemPress") {
					for (var i = 0; i < oEventRegistry.itemPress.length; i++) {
						if (oEventRegistry.itemPress[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachItemPress(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "change") {
					for (var i = 0; i < oEventRegistry.change.length; i++) {
						if (oEventRegistry.change[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachChange(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "select") {
					for (var i = 0; i < oEventRegistry.select.length; i++) {
						if (oEventRegistry.select[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachSelect(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "press") {
					for (var i = 0; i < oEventRegistry.press.length; i++) {
						if (oEventRegistry.press[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachPress(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "suggest") {
					for (var i = 0; i < oEventRegistry.search.length; i++) {
						if (oEventRegistry.suggest[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachSuggest(oMetodoEvento, this);
					}
				}
			}
		}
	});
});