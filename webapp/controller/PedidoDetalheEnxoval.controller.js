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
			that.PDControllerCpEnxoval = undefined;
			that.oCmpEnxoval = undefined;
			that.bCampanhaEnxovalAtiva = false;
			that.bClienteEfetuouCompra = false;
			/* CAMPOS - FIM */

			that.PDControllerCpEnxoval = sView;

			this.InicializarEventosCampEnxoval();
		} /* constructor */ ,

		onChangeIdTipoPedidoCpEnxoval: function() {
			that.VerificarCampanhaEnxoval();
		} /* onChangeIdTipoPedidoCpEnxoval */ ,

		onSelectIconTabBarCpEnxoval: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaEnxoval();

				// that.DisponibilizarValoresCampanhaEnxoval();
			}
		},
		/* onSelectIconTabBarCpEnxoval */

		InicializarEventosCampEnxoval: function() {
			// this.PDControllerCpEnxoval.byId("idObservacoesAuditoria").attachLiveChange(this.onLiveChangeIdCodCliente);
			var oEventRegistry = that.PDControllerCpEnxoval.byId("idTipoPedido").mEventRegistry;
			var bAtribuiuEvento = false;

			/* Preciso verificar se o evento já não foi atribuído ao controle pelo menos uma vez para 
			que não chame em duplicidade */
			for (var i = 0; i < oEventRegistry.change.length; i++) {

				if (oEventRegistry.change[i].fFunction.name == "onChangeIdTipoPedidoCpEnxoval") {
					bAtribuiuEvento = true;
				}
			}

			if (!bAtribuiuEvento) {
				/* Atribuição de eventos exclusivos da campanha */
				that.PDControllerCpEnxoval.byId("idTipoPedido").attachChange(this.onChangeIdTipoPedidoCpEnxoval);
				that.PDControllerCpEnxoval.byId("idTopLevelIconTabBar").attachSelect(this.onSelectIconTabBarCpEnxoval);
			}

			this.GetCampanha();
		} /* InicializarEventosCampEnxoval */ ,

		VerificarCampanhaEnxoval: function() {
			/*Restrições (
				Pedido de bonificação YBON															=> sIdTipoPed
				Vigência da campanha																=> that.oCmpEnxoval[i].bCampanhaVigente, 
				Cadastro do cliente (cliente pode ou não permitir compra pela campanha enxoval)		=> that.bClienteEfetuouCompra
				Cliente tem que ser pessoa jurídica													=> ModelAux idFiscalCliente com quantidade de caracteres equivalente a CPNJ
				
				Resultado																			=> that.bCampanhaEnxovalAtiva = true
			)*/

			/* Verifico se o cliente em questão é empresa CNPJ > (stcd1 != "") */
			var idFiscalCliente = that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelAux").getProperty("/idFiscalCliente");
			if (idFiscalCliente == false) {
				console.log("Não usa campanha Enxoval: CNPJ não encontrado!");
				return;
			}

			if (idFiscalCliente.length != "14") {
				console.log("Não usa campanha Enxoval: Cliente pessoa física!");
				return;
			}

			console.log("Passo 1 de 4: Campanha enxoval: Cliente é empresa (CPNJ), OK");

			/* Verifico se o tipo de pedido é YBON */
			var sIdTipoPed = that.PDControllerCpEnxoval.byId("idTipoPedido").getSelectedKey();

			/* Se não for pedido de bonificação, não é válido para campanha */
			if (sIdTipoPed != "YBON") {
				that.bCampanhaEnxovalAtiva = false;

				console.log("Não usa campanha Enxoval: Não é ped bonificação!");
				return;
			}
			console.log("Passo 2 de 4: Campanha enxoval: YBON, OK");

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

				console.log("Passo 3 de 4: Representante possui campanha ativa!");

				/* Verifico se o cliente efetuou compra, para a campanha ser válida, será somente se o cliente NÃO efetuou compra (bClienteEfetuouCompra = false) */
				if (that.bClienteEfetuouCompra == false) {
					console.log("Passo 4 de 4: Cliente não efetuou compra no período pré-estabelido! OK");
					console.log("Campanha Enxoval Ativada! Todos os pré-requisitos foram atendidos!");
					that.bCampanhaEnxovalAtiva = true;
				} else {
					console.log("Não usa campanha Enxoval: Cliente fora do período de compras! O USO TÁ LIBERADO TEMPORARIAMENTE, LEMBRAR DE RESTRINGIR APÓS OS TESTES");
					that.bCampanhaEnxovalAtiva = true; //false;
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
			that.bClienteEfetuouCompra = that.PDControllerCpEnxoval.getModel("modelCliente").getProperty("/efetuoucompra") == "true";

		},
		/* VerificarCampanhasValidas */

		ProcessarSaldoCampanhaEnxoval: function() {
			if (that.bCampanhaEnxovalAtiva) {
				that.oCmpEnxoval[0].ValorSaldo = 0;
			}
		},
		/* ProcessarSaldoCampanhaEnxoval */

		DisponibilizarValoresCampanhaEnxoval: function() {
			var this2 = this;
			
			/* Só populo os valores se a campanha estiver ativa para o representante / cliente */
			if (that.bCampanhaEnxovalAtiva) {
				var dValorLiberar = 0;

				var dValorLimite;
				var dValorTotal;
				var dValorBonificacao;
				var dTotalSistema;
				
				/* Faço o levantamento de quanto possuo no sistema já digitado. */
				new Promise(function(res4, rej4){
					var oEnxovais = [];
					var oModelPed = that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").getData();
					
					this2.getTotalSistema(oEnxovais, res4, oModelPed);
				}).then(function(oEnxovais){
					dValorLimite = parseFloat(that.oCmpEnxoval[0].ValorLimite);
					dValorTotal = parseFloat(that.oCmpEnxoval[0].ValorTotal);
					dValorBonificacao = parseFloat(that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"));
					dTotalSistema = parseFloat(oEnxovais.qtde);
					
					/* dValorTotal (Saldo) = Total cadastrado para o representante menos o que ele já digitou no sistema (em aberto ou 
					enviado depois da útlima atualização) */
					dValorTotal = dValorTotal - dTotalSistema;
	
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
	
					// that.PDControllerCpEnxoval.getView().byId("idValorTotalEnxoval").setValue(parseFloat(dValorLiberar).toFixed(2));
					that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampEnxoval", parseFloat(dValorLiberar).toFixed(2));
					that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampEnxoval", parseFloat(dValorLiberar).toFixed(2));
	
					/* Regra: 20190308 - Em conversa entre o Fernando e o Figueiredo, foi confirmado que a campanha será de uso obrigatória
					sendo assim todo o valor destinado a ela deverá ser o total disponível*/
				});
			}
		},
		/* DisponibilizarValoresCampanhaEnxoval */

		getTotalSistema: function(oEnxovais, res4, docAtual) {
			var open = indexedDB.open("VB_DataBase");
			var db = "";

			new Promise(function(res, rej) {

				open.onsuccess = function() {
					db = open.result;

					var sPedidos = db.transaction("PrePedidos", "readwrite");
					var objPedidos = sPedidos.objectStore("PrePedidos");
					var iStatus = objPedidos.index("idStatusPedido");

					/*
					Regra dos status dos pedidos
					1 - Pedidos em digitação: Considerar todos.
					2 - Pedidos pendentes de envio: Considerar todos.
					3 - Pedidos enviados: Considerar todos os pedidos 
					enviados DEPOIS DA ÚLTIMA ATUALIZAÇÃO.(Os pedidos
					enviados antes da última atualização já estarão
					sendo considerados no saldo retornado da atualização
					de tabelas).
					*/

					/* Recupero todos os pedidos com status 1, 2, 3 */
					var krStatus = IDBKeyRange.bound(1, 3);
					var tPedido = iStatus.openCursor(krStatus);
					var oDocsPendentes = [];
					var cursor;
					var oDoc;

					tPedido.onsuccess = function(e) {
						cursor = e.target.result;

						if (cursor) {
							oDoc = cursor.value;

							// Verifico se o pedido já foi enviado (Status = 3) /
							if (oDoc.idStatusPedido == 3) {

								// Recupero a data da última atualização de tabelas /
								/**/
								var sUltimaAtualizacao = that.getOwnerComponent().getModel("modelAux").getProperty("/DataAtualizacao");
								sUltimaAtualizacao = sUltimaAtualizacao.replace("/", "-").replace("/", "-").replace(":", "-").replace(" ", "").replace(" ", "") + "-00";
								var p = sUltimaAtualizacao.split("-");
								var dUltimaAtualizacao = new Date("20" + p[2], parseInt(p[1]) - 1, p[0], p[3], p[4], p[5]);

								var sDataImpl = oDoc.dataImpl.replace("/", "-").replace("/", "-").replace(":", "-").replace(":", "-").replace(" ", "").replace(" ", "") + "-00";
								p = sDataImpl.split("-");
								var dDataImpl = new Date(p[2], parseInt(p[1]) - 1, p[0], p[3], p[4], p[5]);
								/**/

								// Verifico se a data do pedido é superior a data da última atualização /
								if (dDataImpl > dUltimaAtualizacao) {
									
									/* Verifico se o pedido em questão tem valor de enxoval */
									if ((oDoc.valUtilizadoCampEnxoval || 0) > 0){
										/* Verifico se não é o pedido em questão, ele não deve ser considerado para levantamneto de saldo */
										if (docAtual.nrPedCli !=  oDoc.nrPedCli){
											oDocsPendentes.push(oDoc);
										}
									}
								}
								cursor.continue();
							} else {
								
								/* Verifico se o pedido em questão tem valor de enxoval */
								if ((oDoc.valUtilizadoCampEnxoval || 0) > 0){
									/* Verifico se não é o pedido em questão, ele não deve ser considerado para levantamneto de saldo */
									if (docAtual.nrPedCli !=  oDoc.nrPedCli){
										oDocsPendentes.push(oDoc);
									}
								}
							}
						} else {
							res(oDocsPendentes);
						}
					};
				};

			}).then(function(oDocsPendentes) {
				var iQtdeUtilizada = 0;
				
				for (var i = 0; i < oDocsPendentes.length; i++) {
					iQtdeUtilizada = iQtdeUtilizada + oDocsPendentes[i].valUtilizadoCampEnxoval;
				}
				
				oEnxovais.docs = oDocsPendentes;
				oEnxovais.qtde = iQtdeUtilizada;
				
				res4(oEnxovais);
			}).catch(function() {

			});
		},
		/* getTotalSistema */

		ajustarValoresBonificacao: function() {
			var oModelPed = that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido");

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

				var dValorLiberado = that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampEnxoval");
				var dValorUtilizado = that.PDControllerCpEnxoval.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampEnxoval");

				if (parseFloat(dValorUtilizado) > parseFloat(dValorLiberado)) {
					var sMensagem = "Valor destinado para abater a campanha enxonval ultrapassou o valor total permitido.";
					that.PDControllerCpEnxoval.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
					that.PDControllerCpEnxoval.byId("idVerbaEnxoval").setValueState("Error");
					that.PDControllerCpEnxoval.byId("idVerbaEnxoval").setValueStateText(sMensagem);
					that.PDControllerCpEnxoval.byId("idVerbaEnxoval").focus();
				} else {
					that.PDControllerCpEnxoval.byId("idVerbaEnxoval").setValueState("None");
					that.PDControllerCpEnxoval.byId("idVerbaEnxoval").setValueStateText("");

					that.ajustarValoresBonificacao();
				}
			} /*if bCampanhaEnxovalAtiva */
		}

	});
});