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
		},
		/* InicializarEventosCampPrazoMedio */

		onSelectIconTabBarCmpPrazoMedio: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				//Busca se tem campnha de Prazo Médio ativa.
				that.onGetCmpPrzMed();
			}
		},
		//Consulta se tem registro cadastrado para a campanha de Prazo
		onGetCmpPrzMed: function() {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;

				var tCmpPrzMed = db.transaction("CmpPrzMed", "readonly");
				var osCmpPrzMed = tCmpPrzMed.objectStore("CmpPrzMed");

				if ("getAll" in osCmpPrzMed) {

					osCmpPrzMed.getAll().onsuccess = function(event) {
						that.oVetorCmpPrzMed = event.target.result;
						//Ordena o vetor e deixa o valor menor em cima. 
						that.oVetorCmpPrzMed.sort(function(a, b) {
							return a.valorMin - b.valorMin;
						});

						console.log("Vetor Prazo Médio", that.oVetorCmpPrzMed);
					};
				}
			};
		},

		//Método precisa esperar a execução do calculTotalPedido para pegar o total do Atualizado para depois acionar o range da cmp de Prz Méd
		onChecarRangeCmpPrzMed: function() {

			var vetorItemCampPrzMed = "";
			// this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed"
			var percExcedentePrazoMed = 0;
			var tipoNeg = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/TipoNegociacao");
			var prazoMedioParcelas = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/PrazoMedioParcelas");
			// var prazoMedioPercJurosDia = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/PercJurosDiaPrazoMedio");
			var prazoMedioPercJurosDia = 0;
			var totalPedido = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/ValTotPed");
			var diasExcedente = 0;
			console.error("Inicio Camp Prz Médio");

			if (that.oVetorCmpPrzMed.length == 0) {
				console.log("Não existe Range de Prazo Cadastrado para a Cmp Prazo Médio.");
				console.error("Fim Camp Prz Médio");
				return;
			}

			for (var i = 0; i < that.oVetorCmpPrzMed.length; i++) {

				if (totalPedido > that.oVetorCmpPrzMed[i].valorMin) {
					// var rangePermitido = that.oVetorCmpPrzMed[i].range
					vetorItemCampPrzMed = that.oVetorCmpPrzMed[i];

				} else {
					break;
				}
			}

			if (vetorItemCampPrzMed) {
				//Pagamento Ávista
				if (tipoNeg == 1) {
					
					diasExcedente = prazoMedioParcelas - vetorItemCampPrzMed.przmaxav;
					prazoMedioPercJurosDia = vetorItemCampPrzMed.taxa / 30;
					
					percExcedentePrazoMed = Math.round((diasExcedente * prazoMedioPercJurosDia) * 100) / 100;
					console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
					
					if(percExcedentePrazoMed < 0){
						percExcedentePrazoMed = 0;
					}
					
					this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);
					
					this.onAtualizaExcedentePrazoMed();
					this.onValidaDestinacaoPrazoMedio();
					
				} //Pagamento a Prazo
				else if (tipoNeg == 2) {
					
					diasExcedente = prazoMedioParcelas - vetorItemCampPrzMed.przmaxap;
					prazoMedioPercJurosDia = vetorItemCampPrzMed.taxa / 30;
					
					percExcedentePrazoMed = Math.round((diasExcedente * prazoMedioPercJurosDia) * 100) / 100;
					console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
					
					if(percExcedentePrazoMed < 0){
						percExcedentePrazoMed = 0;
					}
					
					this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);
					
					this.onAtualizaExcedentePrazoMed();
					this.onValidaDestinacaoPrazoMedio();
				}
			}
		},
		
		onAtualizaExcedentePrazoMed: function() {
			
			var tipoPedido = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/TipoPedido");
			var percAcresPrazoMed = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/PercExcedentePrazoMed");
			var valorTotalAcresPrazoMed = 0;
			var vetorItensPedido = this.PDControllerCmpPrazoMedio.objItensPedidoTemplate;
			
			for (var i = 0; i < vetorItensPedido.length; i++) {
				if (vetorItensPedido[i].mtpos == "NORM") {
					if (tipoPedido != "YBON" && tipoPedido != "YTRO") {
						if (vetorItensPedido[i].tipoItem == "Normal") {
							if (vetorItensPedido[i].tipoItem2 == "Normal") {
								//Calculo do acréscimo de prazo médio .
								
								valorTotalAcresPrazoMed += parseFloat(vetorItensPedido[i].zzVprodDesc2 * (percAcresPrazoMed / 100) *
									(vetorItensPedido[i].zzQnt - vetorItensPedido[i].zzQntDiluicao));
								
							}
						} else if (vetorItensPedido[i].tipoItem == "Diluido") {
							
							valorTotalAcresPrazoMed += parseFloat(vetorItensPedido[i].zzVprodDesc2 * (percAcresPrazoMed / 100) *
									(vetorItensPedido[i].zzQnt - vetorItensPedido[i].zzQntDiluicao));
									
						}
					}
				}
			}
			
			this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").setProperty("/ValTotalExcedentePrazoMed", parseFloat(valorTotalAcresPrazoMed).toFixed(2));
		},
		
		onValidaDestinacaoPrazoMedio: function(){
			
			var valorTotalAcresPrazoMed = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/ValTotalExcedentePrazoMed");
			var valUtilizadoVerbaPrazoMed = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaPrazoMed");
			var comissaoUtilizadaPrazoMed = this.PDControllerCmpPrazoMedio.getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoPrazoMed");
			
			var valorNaoDirecionadoPrazoMed = Math.round((valorTotalAcresPrazoMed - (valUtilizadoVerbaPrazoMed + comissaoUtilizadaPrazoMed)) * 100) / 100;
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed", parseFloat(valorNaoDirecionadoPrazoMed).toFixed(2));
			
			valorTotalAcresPrazoMed = Math.round(valorTotalAcresPrazoMed * 100) / 100;
			valUtilizadoVerbaPrazoMed = Math.round(valUtilizadoVerbaPrazoMed * 100) / 100;
			comissaoUtilizadaPrazoMed = Math.round(comissaoUtilizadaPrazoMed * 100) / 100;
			

			//PRAZO MÉDIO
			if ((comissaoUtilizadaPrazoMed + valUtilizadoVerbaPrazoMed).toFixed(2) > valorTotalAcresPrazoMed) {

				this.PDControllerCmpPrazoMedio.byId("idTopLevelIconTabBar").setSelectedKey("tab5");

				this.PDControllerCmpPrazoMedio.byId("idComissaoUtilizadaPrazo").setValueState("Error");
				this.PDControllerCmpPrazoMedio.byId("idComissaoUtilizadaPrazo").setValueStateText("Valor destinado para abater da comissão ultrapassou o valor total necessário. Excedente Prazo Médio (" + valorTotalAcresPrazoMed + ")");
				this.PDControllerCmpPrazoMedio.byId("idVerbaUtilizadaPrazo").focus();

				this.PDControllerCmpPrazoMedio.byId("idVerbaUtilizadaPrazo").setValueState("Error");
				this.PDControllerCmpPrazoMedio.byId("idVerbaUtilizadaPrazo").setValueStateText("Valor destinado para abater da comissão ultrapassou o valor total necessário. Excedente Prazo Médio (" + valorTotalAcresPrazoMed + ")");

			} else {
				
				this.PDControllerCmpPrazoMedio.byId("idComissaoUtilizadaPrazo").setValueState("None");
				this.PDControllerCmpPrazoMedio.byId("idComissaoUtilizadaPrazo").setValueStateText("");

				this.PDControllerCmpPrazoMedio.byId("idVerbaUtilizadaPrazo").setValueState("None");
				this.PDControllerCmpPrazoMedio.byId("idVerbaUtilizadaPrazo").setValueStateText("");
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