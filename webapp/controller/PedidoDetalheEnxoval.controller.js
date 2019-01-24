/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/

sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheEnxoval", {

		constructor: function(sView) {
			that = this;

			/* CAMPOS - INICIO */
			/* that.oCmpEnxoval[i].bCampanhaVigente */
			that.PDController = undefined;
			that.oCmpEnxoval = undefined;
			that.bCampanhaEnxovalAtiva = false;
			that.bClienteEfetuouCompra = false;
			/* CAMPOS - FIM */

			that.PDController = sView;

			this.InicializarEventosCampEnxoval();
		} /* constructor */ ,

		onChangeIdTipoPedido: function() {
			that.VerificarCampanhaEnxoval();
		} /* onChangeIdTipoPedido */ ,

		onSelectIconTabBar: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaEnxoval();

				// that.DisponibilizarValoresCampanhaEnxoval();
			}
		},
		/* onSelectIconTabBar */

		InicializarEventosCampEnxoval: function() {
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
			}

			this.GetCampanha();
		} /* InicializarEventosCampEnxoval */ ,

		VerificarCampanhaEnxoval: function() {
			/*Restrições (
				Pedido de bonificação YBON															=> sIdTipoPed
				Vigência da campanha																=> that.oCmpEnxoval[i].bCampanhaVigente, 
				Cadastro do cliente (cliente pode ou não permitir compra pela campanha enxoval)		=> that.bClienteEfetuouCompra
				
				Resultado																			=> that.bCampanhaEnxovalAtiva = true
			)*/
			/* Verifico se o tipo de pedido é YBON */
			var sIdTipoPed = that.PDController.byId("idTipoPedido").getSelectedKey();

			/* Se não for pedido de bonificação, não é válido para campanha */
			if (sIdTipoPed != "YBON") {
				that.bCampanhaEnxovalAtiva = false;

				console.log("Não usa campanha Enxoval: Não é ped bonificação!");
				return;
			}
			console.log("Passo 1 de 3: Campanha enxoval: YBON, OK");

			/* Verifico se não existe duas campanhas ativas para o mesmo representante */
			var iQtdeCampanhasValidas = 0;
			for (var i = 0; i < that.oCmpEnxoval.length; i++) {

				if (that.oCmpEnxoval[i].bCampanhaVigente) {
					iQtdeCampanhasValidas += 1;
				}

				if (iQtdeCampanhasValidas > 1) {

					sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante, campanha de 'Enxoval' não será considerada!", {
						title: "Inconsitência no cadastro",
						actions: [sap.m.MessageBox.Action.OK],
						close: function() {
							that.bCampanhaEnxovalAtiva = false;
						}
					});

					console.log("Não usa campanha Enxoval: Mais de uma campanha ativa!");
					return;
				}
			}

			/* Verifico se existe somente 1 campanha ativa */
			if (iQtdeCampanhasValidas == 1) {

				console.log("Passo 2 de 3: Representante possui campanha ativa!");

				/* Verifico se o cliente efetuou compra, para a campanha ser válida, será somente se o cliente NÃO efetuou compra (bClienteEfetuouCompra = false) */
				if (that.bClienteEfetuouCompra == false) {
					console.log("Campanha Enxoval Ativada! Todos os pré-requisitos foram atendidos!");
					that.bCampanhaEnxovalAtiva = true;
				} else {
					console.log("Não usa campanha Enxoval: Cliente fora do período de compras! O USO TÁ LIBERADO TEMPORARIAMENTE, LEMBRAR DE RESTRINGIR APÓS OS TESTES");
					that.bCampanhaEnxovalAtiva = false; //false;
				}
			} else {
				console.log("Não usa campanha Enxoval: Representante não tem campanha!");
				that.bCampanhaEnxovalAtiva = false;
			}
		} /* VerificarCampanhaEnxoval */ ,

		GetCampanha: function() {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;

				var tCmpEnxoval = db.transaction("CmpEnxoval", "readonly");
				var osCmpEnxoval = tCmpEnxoval.objectStore("CmpEnxoval");

				if ("getAll" in osCmpEnxoval) {
					osCmpEnxoval.getAll().onsuccess = function(event) {
						var tmpCampanha = event.target.result;
						// var oModel = new sap.ui.model.json.JSONModel(tmpCampanha);

						that.oCmpEnxoval = tmpCampanha;
						that.VerificarCampanhasValidas();

						// that.getView().setModel(oModel, "tiposPedidos");
					};
				}
			};
		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function() {
			var dDataAtual = new Date();

			for (var i = 0; i < that.oCmpEnxoval.length; i++) {

				if ((dDataAtual >= that.oCmpEnxoval[i].DataInicio) && (dDataAtual <= that.oCmpEnxoval[i].DataFim)) {
					that.oCmpEnxoval[i].bCampanhaVigente = true;
				} else {
					that.oCmpEnxoval[i].bCampanhaVigente = false;
				}
			}

			/* A campanha só é válida se o cliente tiver com efetuoucompra = false */
			that.bClienteEfetuouCompra = that.PDController.getModel("modelCliente").getProperty("/efetuoucompra") == "true";

		},
		/* VerificarCampanhasValidas */

		ProcessarSaldoCampanhaEnxoval: function() {
			if (that.bCampanhaEnxovalAtiva) {
				that.oCmpEnxoval[0].ValorSaldo = 0;
			}
		},
		/* ProcessarSaldoCampanhaEnxoval */

		DisponibilizarValoresCampanhaEnxoval: function() {
			/* Só populo os valores se a campanha estiver ativa para o representante / cliente */
			if (that.bCampanhaEnxovalAtiva) {
				var dValorLiberar = 0;

				var dValorLimite;
				var dValorTotal;
				var dValorBonificacao;

				dValorLimite = parseFloat(that.oCmpEnxoval[0].ValorLimite);
				dValorTotal = parseFloat(that.oCmpEnxoval[0].ValorTotal);
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

			if (that.bCampanhaEnxovalAtiva) {
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
			} /*if bCampanhaEnxovalAtiva */
		}

	});
});