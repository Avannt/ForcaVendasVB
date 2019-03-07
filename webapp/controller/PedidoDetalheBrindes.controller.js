/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheBrindes", {

		constructor: function(sView) {
			console.log("Inicio da verificação de campanha de brindes.");
			that = this;

			/* CAMPOS - INICIO */
			/* that.oCmpBrinde[i].bCampanhaVigente */
			that.PDController = undefined;
			that.oCmpBrinde = undefined;
			that.bCampanhaBrindeAtiva = false;
			/* CAMPOS - FIM */

			that.PDController = sView;

			this.InicializarEventosCampBrinde();
		} /* constructor */ ,

		onChangeIdTipoPedido: function() {
			that.VerificarCampanhaBrinde();
		} /* onChangeIdTipoPedido */ ,

		onSelectIconTabBar: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaBrinde();

				// that.DisponibilizarValoresCampanhaEnxoval();
			}
		},
		/* onSelectIconTabBar */

		InicializarEventosCampBrinde: function() {
			// this.PDController.byId("idObservacoesAuditoria").attachLiveChange(this.onLiveChangeIdCodCliente);
			var oEventRegistry = that.PDController.byId("idTipoPedido").mEventRegistry;
			var bAtribuiuEvento = false;

			/* Preciso verificar se o evento já não foi atribuído ao controle pelo menos uma vez para 
			que não chame em duplicidade */
			for (var i = 0; i < oEventRegistry.change.length; i++) {

				if (oEventRegistry.change[i].fFunction.name == "onChangeIdTipoPedido") {
					bAtribuiuEvento = true;
				}
			}

			if (!bAtribuiuEvento) {
				/* Atribuição de eventos exclusivos da campanha */
				that.PDController.byId("idTipoPedido").attachChange(this.onChangeIdTipoPedido);
				that.PDController.byId("idTopLevelIconTabBar").attachSelect(this.onSelectIconTabBar);
				that.PDController.byId("idInserirItem").attachPress(this.onInserirItemPress);
				//that.PDController.byId("idItemPedido").attachSearch(this.onSelectIconTabBar);
				/*idInserirItem*/
			}

			this.GetCampanha();
		},
		/* InicializarEventosCampBrinde */
		
		onInserirItemPress: function(){
			that.PDController.byId("idTipoPedido").setVisible(false);
			console.log("onInserirItemPress da campanha de brindes!");
		},
		/* onInserirItemPress */
		
		onSearchItemPedido: function(){
			console.log("onSearchItemPedido da campanha de brindes!");
		}, 
		/* onSearchItemPedido */

		VerificarCampanhaBrinde: function() {
			/*Restrições (
				TABELA DA CAMPANHA S4		=> zsdt025
				TABELA DA CAMPANNHA LOCAL	=> CmpSldBrindes
				Tipo de pedido: TODOS																=> sIdTipoPed
				Vigência da campanha																=> that.oCmpBrinde[i].bCampanhaVigente, 
				
				Resultado																			=> that.bCampanhaBrindeAtiva = true
			)*/
			
			/* Verifico se não existe duas campanhas ativas para o mesmo representante e item */
			for (var i = 0; i < that.oCmpBrinde.length; i++) {

				if (that.oCmpBrinde[i].bCampanhaVigente) {
					
					/* Se existir mais de uma campanha ativa para o mesmo item, bloqueio o processo */
					var iTempQtdeCampanhasAtivasMesmoItem = 0;
					
					/* Para cada campanha ativa, eu preciso percorrer todas novamente para verificar se não existe uma em duplicidade */
					for (var j = 0; j < that.oCmpBrinde.length; j++) {
						
						/* Se forem de materiais iguais, incremento a variável */
						if (that.oCmpBrinde[i].material === that.oCmpBrinde[j].material){
							iTempQtdeCampanhasAtivasMesmoItem += 1;
						}
					}
					
					if (iTempQtdeCampanhasAtivasMesmoItem > 1){
						sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante e material, campanha de 'Brinde' não será considerada!", {
							title: "Inconsitência no cadastro",
							actions: [sap.m.MessageBox.Action.OK],
							close: function() {
								that.bCampanhaBrindesAtiva = false;
							}
						});
	
						console.log("Não usa campanha Brinde: Mais de uma campanha ativa para o mesmo representante / material!");
						return;
					}
				}
			}
		} /* VerificarCampanhaBrinde */ ,

		GetCampanha: function() {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;

				var tCmpBrinde = db.transaction("CmpSldBrindes", "readonly");
				var osCmpBrinde = tCmpBrinde.objectStore("CmpSldBrindes");

				if ("getAll" in osCmpBrinde) {
					osCmpBrinde.getAll().onsuccess = function(event) {
						var tmpCampanha = event.target.result;
						// var oModel = new sap.ui.model.json.JSONModel(tmpCampanha);

						that.oCmpBrinde = tmpCampanha;
						that.VerificarCampanhasValidas();

						// that.getView().setModel(oModel, "tiposPedidos");
					};
				}
			};
		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function() {
			var dDataAtual = new Date();

			for (var i = 0; i < that.oCmpBrinde.length; i++) {

				if ((dDataAtual >= that.oCmpBrinde[i].dataInicio) && (dDataAtual <= that.oCmpBrinde[i].dataFim)) {
					that.oCmpBrinde[i].bCampanhaVigente = true;
				} else {
					that.oCmpBrinde[i].bCampanhaVigente = false;
				}
			}
		},
		/* VerificarCampanhasValidas */

		DisponibilizarValoresCampanhaBrindes: function() {
			
			/* Só populo os valores se a campanha estiver ativa para o representante / cliente */
			if (that.bCampanhaBrindeAtiva) {
				var dValorLiberar = 0;

				var dValorLimite;
				var dValorTotal;
				var dValorBonificacao;

				dValorLimite = parseFloat(that.oCmpBrinde[0].ValorLimite);
				dValorTotal = parseFloat(that.oCmpBrinde[0].ValorTotal);
				dValorBonificacao = parseFloat(that.PDController.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"));

				/* Verifico se o valor total a liberar é menor que o limite disponível por pedido */
				if (dValorTotal < dValorLimite) {
					dValorLiberar = dValorTotal;
				} else {
					dValorLiberar = dValorLimite;
				}

				/* Verifico se o valor a liberar é menor que o da bonificação */
				if (dValorLiberar > dValorBonificacao) {
					dValorLiberar = dValorBonificacao;
				}

				// that.PDController.getView().byId("idValorTotalEnxoval").setValue(parseFloat(dValorLiberar).toFixed(2));
				that.PDController.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampEnxoval", parseFloat(dValorLiberar).toFixed(2));
			}
		},
		/* DisponibilizarValoresCampanhaEnxoval */

		ajustarValoresBonificacao: function() {
			var oModelPed = that.PDController.getOwnerComponent().getModel("modelDadosPedido");
			
			var dValorUtilizadoCampanha = parseFloat(oModelPed.getProperty("/ValUtilizadoCampEnxoval"));
			var dValorBonificacao = parseFloat(oModelPed.getProperty("/ValTotalExcedenteNaoDirecionadoBonif"));
			var dValorLiquidoBonificacao = dValorBonificacao - dValorUtilizadoCampanha;
			
			dValorLiquidoBonificacao = Math.round(dValorLiquidoBonificacao * 100) / 100;
			
			console.log("Valor da bonificação total alterado.");
			oModelPed.setProperty("/ValTotalExcedenteNaoDirecionadoBonif", dValorLiquidoBonificacao.toString());
			oModelPed.setProperty("/ValUtilizadoCampEnxoval", dValorUtilizadoCampanha.toString());
			oModelPed.refresh();
			
		},
		/* ajustarValoresBonificacao */

		calculaTotalPedidoEnxoval: function() {

			if (that.bCampanhaBrindeAtiva) {
				that.DisponibilizarValoresCampanhaEnxoval();

				var dValorLiberado = that.PDController.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampEnxoval");
				var dValorUtilizado = that.PDController.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampEnxoval");

				if (parseFloat(dValorUtilizado) > parseFloat(dValorLiberado)) {
					var sMensagem = "Valor destinado para abater a campanha enxonval ultrapassou o valor total permitido.";
					that.PDController.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
					that.PDController.byId("idVerbaEnxoval").setValueState("Error");
					that.PDController.byId("idVerbaEnxoval").setValueStateText(sMensagem);
					that.PDController.byId("idVerbaEnxoval").focus();
				} else {
					that.PDController.byId("idVerbaEnxoval").setValueState("None");
					that.PDController.byId("idVerbaEnxoval").setValueStateText("");
					
					that.ajustarValoresBonificacao();
				}
			} /*if bCampanhaBrindeAtiva */
		}

	});
});