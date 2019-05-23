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
			that.PDControllerCpBrinde = undefined;
			that.oCmpBrinde = undefined;
			that.oItemCpBrindeAtual = undefined;
			that.bCampanhaBrindeAtiva = false;
			/* CAMPOS - FIM */

			that.PDControllerCpBrinde = sView;

			this.InicializarEventosCampBrinde();
		} /* constructor */ ,

		onChangeIdTipoPedidoCpBrindes: function() {
			that.VerificarCampanhaBrinde();
		} /* onChangeIdTipoPedidoCpBrindes */ ,

		onSelectIconTabBarCpBrindes: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaBrinde();

				that.disponibilizarValoresCpBrindes();
			}
		},
		/* onSelectIconTabBarCpBrindes */

		InicializarEventosCampBrinde: function() {
			this.onVerificarEvento("idTipoPedido", this.onChangeIdTipoPedidoCpBrindes, "change"); /* change */
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCpBrindes, "select"); /* select */
			this.onVerificarEvento("idInserirItem", this.onInserirItemPressCpBrindes, "press"); /* press */

			this.onVerificarEvento("idItemPedido", this.onSuggestItemCpBrindes, "search"); /* Evento ao incluir um novo item. */

			this.onVerificarEvento("idQuantidade", this.onQuantidadeChangeCpBrinde, "liveChange"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
			this.onVerificarEvento("idButtonSalvarDialog", this.onSalvarItemDialogCpBrinde, "press"); /* press 'salvar' ao incluir um item */
			this.onVerificarEvento("table_pedidos", this.onItemPressCpBrinde, "itemPress"); /* itemPress 'salvar' ao incluir um item */

			this.GetCampanha();
		},
		/* InicializarEventosCampBrinde */

		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCpBrinde.byId(sIdControle)) {
				oElemento = that.PDControllerCpBrinde.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCpBrinde.byId(sIdControle)){
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
					if (oEventRegistry.change) {
						for (var i = 0; i < oEventRegistry.change.length; i++) {
							if (oEventRegistry.change[i].fFunction.name == oMetodoEvento.name) {
								bExisteEvento = true;
							}
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachChange(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "search") {
					if (oEventRegistry.search) {
						for (var i = 0; i < oEventRegistry.search.length; i++) {
							if (oEventRegistry.search[i].fFunction.name == oMetodoEvento.name) {
								bExisteEvento = true;
							}
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachSearch(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "liveChange") {
					if (oEventRegistry.liveChange) {
						for (var i = 0; i < oEventRegistry.liveChange.length; i++) {
							if (oEventRegistry.change[i].fFunction.name == oMetodoEvento.name) {
								bExisteEvento = true;
							}
						}
					}

					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachLiveChange(oMetodoEvento, this);
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
		},

		onItemPressCpBrinde: function(evt) {
			var sItem = this.PDControllerCpBrinde.oItemPedido.matnr;

			this.verificarExibicaoCampoQtdeBrinde(sItem);

			/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
			this.InicializarEventosCampBrinde();
		},
		/* onItemPressCpBrinde */

		onSuggestItemCpBrindes: function(evt) {
			var sItem = sap.ui.getCore().byId("idItemPedido").getValue();

			this.oItemCpBrindeAtual = undefined;

			this.verificarExibicaoCampoQtdeBrinde(sItem);
		},
		/* onSuggestItemCpBrindes */

		onSalvarItemDialogCpBrinde: function(evt) {
			/* Ao pressionar o botão salvar, o sistema irá identificar o que é excedente de brinde e o que é equivalente a campanha */

			var iQtdeCpBrinde = parseFloat(sap.ui.getCore().byId("idQuantidadeBrinde").getValue());

			if (isNaN(iQtdeCpBrinde) == false) {
				this.PDControllerCpBrinde.oItemPedido.zzQntCpBrinde = iQtdeCpBrinde;
			} else {
				this.PDControllerCpBrinde.oItemPedido.zzQntCpBrinde = 0;
			}
		},

		onQuantidadeChangeCpBrinde: function() {
			/* Só chamo a função de setar valores se encontrou um item de campanha */
			if (this.oItemCpBrindeAtual) {
				this.setValoresCpBrindes(this);
			}
		},
		/* onQuantidadeChangeCpBrinde */

		onInserirItemPressCpBrindes: function() {
			that.InicializarEventosCampBrinde();

			// that.PDControllerCpBrinde.byId("idTipoPedido").setVisible(false);
			console.log("onInserirItemPressCpBrindes da campanha de brindes!");
		},
		/* onInserirItemPressCpBrindes */

		onSearchItemPedido: function() {
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
						if (that.oCmpBrinde[i].material === that.oCmpBrinde[j].material) {
							iTempQtdeCampanhasAtivasMesmoItem += 1;
						}
					}

					if (iTempQtdeCampanhasAtivasMesmoItem > 1) {
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

		setValoresCpBrindes: function(that) {
			var that2 = that;
			var this2 = this;

			var iQtdeMaxPed = parseFloat(this.oItemCpBrindeAtual.quantidadeMaxima);
			var iQtdeTotal = parseFloat(this.oItemCpBrindeAtual.quantidadeTotal);
			var iQtdeDigitada = parseFloat(sap.ui.getCore().byId("idQuantidade").getValue());
			var iQtdeBrinde = 0;

			/* Busco todos os itens que foram utilizados em campanhas */
			var iTotalSistema = 0;
			new Promise(function(res4, rej4) {
				var oBrindes = [];

				this2.getTotalSistema(oBrindes, res4, that2.PDControllerCpBrinde.oItemPedido);
			}).then(function(oBrindes) {
				iTotalSistema = oBrindes.qtde;

				/* Calculo o saldo que consta no sistema */
				var iSaldo = iQtdeTotal - iTotalSistema;

				var iQtdeLiberadaBrinde = 0;

				/* Se o saldo for menor que a quantidade disponível, considero o saldo como liberada pra uso*/
				if (iSaldo < iQtdeMaxPed) {
					iQtdeLiberadaBrinde = iSaldo;
				} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
					iQtdeLiberadaBrinde = iQtdeMaxPed;
				}

				/* Agora preciso comparar a quantidade liberada pra uso com a quantidade digitada pelo usuário. */
				if (iQtdeLiberadaBrinde < iQtdeDigitada) {
					iQtdeBrinde = iQtdeLiberadaBrinde;
				} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
					iQtdeBrinde = iQtdeDigitada;
				}

				sap.ui.getCore().byId("idQuantidadeBrinde").setValue(iQtdeBrinde);
				if (isNaN(iQtdeBrinde) == false) {
					sap.m.MessageToast.show("Campanha de brindes ativada, quantidade: " + iQtdeBrinde.toString(), {
						duration: 3000
					});
				} else {
					sap.ui.getCore().byId("idQuantidadePA").setValue(0);
				}

			}).catch(function() {
				sap.ui.getCore().byId("idQuantidadeBrinde").setValue(iQtdeBrinde);
			});
			/* Fim */

		},
		/* setValoresCpBrindes */

		getTotalSistema: function(oBrindes, res4, itemPedido) {
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
								var sUltimaAtualizacao = that.PDControllerCpBrinde.getOwnerComponent().getModel("modelAux").getProperty("/DataAtualizacao");
								sUltimaAtualizacao = sUltimaAtualizacao.replace("/", "-").replace("/", "-").replace(":", "-").replace(" ", "").replace(" ", "") + "-00";
								var p = sUltimaAtualizacao.split("-");
								var dUltimaAtualizacao = new Date("20" + p[2], parseInt(p[1]) - 1, p[0], p[3], p[4], p[5]);

								var sDataImpl = oDoc.dataImpl.replace("/", "-").replace("/", "-").replace(":", "-").replace(":", "-").replace(" ", "").replace(" ", "") + "-00";
								p = sDataImpl.split("-");
								var dDataImpl = new Date(p[2], parseInt(p[1]) - 1, p[0], p[3], p[4], p[5]);
								/**/

								// Verifico se a data do pedido é superior a data da última atualização /
								if (dDataImpl > dUltimaAtualizacao) {
									oDocsPendentes.push(oDoc);
								}

								cursor.continue();

							} else {
								cursor.continue();

								oDocsPendentes.push(oDoc);
							}
						} else {
							res(oDocsPendentes);
						}
					};
				};

			}).then(function(oDocsPendentes) {
				var vItensBrindes = [];

				var p2 = new Promise(function(res2) {
					var iIteracao = 0;

					// Percorro todos os pedidos buscando os itens do tipo brindes em aberto /
					for (var i = 0; i < oDocsPendentes.length; i++) {

						var sItens = db.transaction("ItensPedido", "readwrite");
						var objItens = sItens.objectStore("ItensPedido");
						var inrPedCli = objItens.index("nrPedCli");

						var p3 = new Promise(function(res3, rej3) {
							var tItens = inrPedCli.openCursor(oDocsPendentes[i].nrPedCli);
							var tempItensBri = [];

							tItens.onsuccess = function(e) {
								var cursor = e.target.result;

								if (cursor) {

									/* Verifico se o item em questão é de BRINDE (YBRI)*/
									if (cursor.value.mtpos === "YBRI") {
										tempItensBri.push(cursor.value);
									}

									cursor.continue();
								} else {

									res3(tempItensBri);
								}
							};
						}).then(function(tempItensBri) { /*res3*/
							iIteracao = iIteracao + 1;

							for (var j = 0; j < tempItensBri.length; j++) {
								// Verifico se não é o pedido e o material em questão, não posso considerar para cálculo de saldo /
								if (tempItensBri[j].idItemPedido == itemPedido.idItemPedido && tempItensBri[j].index == itemPedido.index) {
									continue;
								}

								/* Só preciso de brindes do material que estou inserindo / atualizando no momento */
								if (tempItensBri[j].matnr == itemPedido.matnr) {
									vItensBrindes.push(tempItensBri[j]);
								}

							}

							// Verifico se é a últma iteração do loop pra dar continuidade ao processo /
							if (iIteracao == oDocsPendentes.length) {
								res2(vItensBrindes);
							}
						});

					} /* for */

				}).then(function(vItensBrindes) {
					var iQtdeUtilizada = 0;
					for (var i = 0; i < vItensBrindes.length; i++) {
						iQtdeUtilizada = iQtdeUtilizada + vItensBrindes[i].zzQnt;
					}

					oBrindes.itens = vItensBrindes;
					oBrindes.qtde = iQtdeUtilizada;

					res4(oBrindes);
				});

			}).catch(function() {

			});
		},
		/* getTotalSistema */

		verificarExibicaoCampoQtdeBrinde: function(sItem) {
			/* O evento é disparado duas vezes, controlo pelo valor sugerido, se tiver diferente de branco é proque 
			foi executado. */
			if (sItem != "") {
				var bItemCampanha = false;

				/* Verifico se existe campanha ativa para o item escolhido. */
				for (var i = 0; i < this.oCmpBrinde.length; i++) {
					/* A campanha tem que estar vigente*/
					if (this.oCmpBrinde[i].bCampanhaVigente) {
						/* Verifico se é para o material escolhido */
						if (this.oCmpBrinde[i].material == sItem) {
							bItemCampanha = true;
							this.oItemCpBrindeAtual = this.oCmpBrinde[i];
						}
					}
				}

				/* Se for item de campanha, preencho o valor da campanha automaticamnete e exibo o campo quantidade de brindes*/
				console.log("Digitação de itens da campanha de Brindes.");

				/*	FOI TIRADO O CAMPO VISUAL TEMPORARIAMENTE */
				//sap.ui.getCore().byId("idQuantidadeBrinde").setVisible(bItemCampanha);

				/* Só chamo a função de setar valores se encontrou um item de campanha */
				if (this.oItemCpBrindeAtual) {
					/* Chamo a primeira vez a distribuição de valores pois o item inserido é incluso com valor 1. */
					this.setValoresCpBrindes(this);
				}
			}
		},

		disponibilizarValoresCpBrindes: function() {

			/* Percorro todos os itens para distribuir os excedentes */
			console.log("MUDAR TAB CAMPANHA BRINDE.");

		}
	});
});