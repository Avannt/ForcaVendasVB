/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheProdutoAcabado", {

		constructor: function(sView) {
			console.log("Inicio da verificação de campanha de produto acabado.");
			that = this;

			/* CAMPOS - INICIO */
			that.PDControllerCpPA = undefined;
			that.oCmpPA = undefined;
			that.oItemCpPA = undefined;
			/* CAMPOS - FIM */
			that.bCampanhaPAAtiva = false;

			that.PDControllerCpPA = sView;

			this.InicializarEventosCampPA();
		} /* constructor */ ,

		onChangeIdTipoPedidoCpPA: function() {
			that.VerificarCampanhaPA();
		} /* onChangeIdTipoPedidoCpPA */ ,

		onSelectIconTabBarCpPA: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaPA();

				that.disponibilizarValoresCpPA();
			}
		},
		/* onSelectIconTabBarCpPA */

		InicializarEventosCampPA: function() {
			this.onVerificarEvento("idTipoPedido", this.onChangeIdTipoPedidoCpPA, "change"); /* change */
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCpPA, "select"); /* select */
			this.onVerificarEvento("idInserirItem", this.onInserirItemPressCpPA, "press"); /* press */
			this.onVerificarEvento("idItemPedido", this.onSuggestItemCpPA, "suggest"); /* Evento ao incluir um novo item. */
			this.onVerificarEvento("idQuantidade", this.onQuantidadeChangeCpPA, "change"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
			this.onVerificarEvento("idButtonSalvarDialog", this.onSalvarItemDialogCpPA, "press"); /* press 'salvar' ao incluir um item */
			this.onVerificarEvento("table_pedidos", this.onItemPressCpPA, "itemPress"); /* itemPress 'salvar' ao incluir um item */

			this.GetCampanha();
		},
		/* InicializarEventosCampPA */

		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCpPA.byId(sIdControle)) {
				oElemento = that.PDControllerCpPA.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCpPA.byId(sIdControle)){
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
		},
		
		onItemPressCpPA: function(evt){
			var sItem = this.PDControllerCpPA.oItemPedido.matnr;
			
			this.verificarExibicaoCampoQtdePA(sItem);
			
			/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
			this.InicializarEventosCampPA();
		},
		/* onItemPressCpPA */

		onSuggestItemCpPA: function(evt) {
			var sItem = evt.getParameter("suggestValue");
			this.oItemCpPA = undefined;
			
			this.verificarExibicaoCampoQtdePA(sItem);
		},
		/* onSuggestItemCpPA */
		
		onSalvarItemDialogCpPA: function(evt){
			/* Ao pressionar o botão salvar, o sistema irá identificar o que é excedente de PA e o que é equivalente a campanha */
			
			var iQtdeCpPA = parseFloat(sap.ui.getCore().byId("idQuantidadePA").getValue());
			
			if (isNaN(iQtdeCpPA) == false ){
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = iQtdeCpPA;
			}else{
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = 0;
			}
		},

		onQuantidadeChangeCpPA: function() {
			/* Só chamo a função de setar valores se encontrou um item de campanha */
			if (this.oItemCpPA) {
				this.setValoresCpPA(this);
			}
		},
		/* onQuantidadeChangeCpPA */

		onInserirItemPressCpPA: function() {
			that.InicializarEventosCampPA();

			// that.PDControllerCpPA.byId("idTipoPedido").setVisible(false);
			console.log("onInserirItemPressCpPA da campanha de produto acabado!");
		},
		/* onInserirItemPressCpPA */

		onSearchItemPedido: function() {
			console.log("onSearchItemPedido da campanha de produto acabado!");
		},
		/* onSearchItemPedido */

		VerificarCampanhaPA: function() {
			/*Restrições (
				TABELA DA CAMPANHA S4		=> zsdt025
				TABELA DA CAMPANNHA LOCAL	=> CmpSldPA
				Tipo de pedido: TODOS																=> sIdTipoPed
				Vigência da campanha																=> that.oCmpPA[i].bCampanhaVigente, 
				
				Resultado																			=> that.bCampanhaPAAtiva = true
			)*/

			/* Verifico se não existe duas campanhas ativas para o mesmo representante e item */
			for (var i = 0; i < that.oCmpPA.length; i++) {

				if (that.oCmpPA[i].bCampanhaVigente) {

					/* Se existir mais de uma campanha ativa para o mesmo item, bloqueio o processo */
					var iTempQtdeCampanhasAtivasMesmoItem = 0;

					/* Para cada campanha ativa, eu preciso percorrer todas novamente para verificar se não existe uma em duplicidade */
					for (var j = 0; j < that.oCmpPA.length; j++) {

						/* Se forem de materiais iguais, incremento a variável */
						if (that.oCmpPA[i].material === that.oCmpPA[j].material) {
							iTempQtdeCampanhasAtivasMesmoItem += 1;
						}
					}

					if (iTempQtdeCampanhasAtivasMesmoItem > 1) {
						sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante e material, campanha de 'PA' não será considerada!", {
							title: "Inconsitência no cadastro",
							actions: [sap.m.MessageBox.Action.OK],
							close: function() {
								that.bCampanhaPAAtiva = false;
							}
						});

						console.log("Não usa campanha PA: Mais de uma campanha ativa para o mesmo representante / material!");
						return;
					}
				}
			}
		} /* VerificarCampanhaPA */ ,

		GetCampanha: function() {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;

				var tCmpPA = db.transaction("CmpProdsAcabs", "readonly");
				var osCmpPA = tCmpPA.objectStore("CmpProdsAcabs");

				if ("getAll" in osCmpPA) {
					osCmpPA.getAll().onsuccess = function(event) {
						var tmpCampanha = event.target.result;
						// var oModel = new sap.ui.model.json.JSONModel(tmpCampanha);

						that.oCmpPA = tmpCampanha;
						that.VerificarCampanhasValidas();

						// that.getView().setModel(oModel, "tiposPedidos");
					};
				}
			};
		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function() {
			var dDataAtual = new Date();

			for (var i = 0; i < that.oCmpPA.length; i++) {

				if ((dDataAtual >= that.oCmpPA[i].dataInicio) && (dDataAtual <= that.oCmpPA[i].dataFim)) {
					that.oCmpPA[i].bCampanhaVigente = true;
				} else {
					that.oCmpPA[i].bCampanhaVigente = false;
				}
			}
		},
		/* VerificarCampanhasValidas */

		setValoresCpPA: function(that) {
			var that2 = that;
			var this2 = this;
			
			var iQtdeMaxPed = parseFloat(this.oItemCpPA.quantidadeMaxima);
			var iQtdeTotal = parseFloat(this.oItemCpPA.quantidadeTotal);
			var iQtdeDigitada = parseFloat(sap.ui.getCore().byId("idQuantidade").getValue());
			var iQtdePA = 0;

			/* Busco todos os itens que foram utilizados em campanhas */
			var iTotalSistema = 0;
			new Promise(function(res4, rej4){
				var oPAs = [];
				
				this2.getTotalSistema(oPAs, res4, that2.PDControllerCpPA.oItemPedido);
			}).then(function(oPAs){
				iTotalSistema = oPAs.qtde;
				
				/* Calculo o saldo que consta no sistema */
				var iSaldo = iQtdeTotal - iTotalSistema;
				
				var iQtdeLiberadaPA = 0;
				
				/* Se o saldo for menor que a quantidade disponível, considero o saldo como liberada pra uso*/
				if(iSaldo < iQtdeMaxPed){
					iQtdeLiberadaPA = iSaldo;
				} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
					iQtdeLiberadaPA = iQtdeMaxPed;
				}
				
				/* Agora preciso comparar a quantidade liberada pra uso com a quantidade digitada pelo usuário. */
				if(iQtdeLiberadaPA < iQtdeDigitada){
					iQtdePA = iQtdeLiberadaPA;
				} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
					iQtdePA = iQtdeDigitada;
				}
				
				sap.ui.getCore().byId("idQuantidadePA").setValue(iQtdePA);
				
			}).catch(function(){
				sap.ui.getCore().byId("idQuantidadePA").setValue(iQtdePA);
			});
			/* Fim */
			
		},
		/* setValoresCpPA */
		
		getTotalSistema: function(oPAs, res4, itemPedido){
			var open = indexedDB.open("VB_DataBase");
			var db = "";
			
			new Promise(function(res, rej){
				
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
								var sUltimaAtualizacao = that.PDControllerCpPA.getOwnerComponent().getModel("modelAux").getProperty("/DataAtualizacao");
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
				
			}).then(function(oDocsPendentes){
				var vItensPAs = [];
	
				var p2 = new Promise(function(res2) {
					var iIteracao = 0;
	
					// Percorro todos os pedidos buscando os itens do tipo produto acabado em aberto /
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
	
									/* Verifico se o item em questão é de PA (YBRI)*/
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
								
								/* Só preciso de produto acabado do material que estou inserindo / atualizando no momento */
								if (tempItensBri[j].matnr == itemPedido.matnr) {
									vItensPAs.push(tempItensBri[j]);
								}
	
							}
	
							// Verifico se é a últma iteração do loop pra dar continuidade ao processo /
							if (iIteracao == oDocsPendentes.length) {
								res2(vItensPAs);
							}
						});
	
					} /* for */
	
				}).then(function(vItensPAs) {
					var iQtdeUtilizada = 0;
					for (var i = 0; i < vItensPAs.length; i++) {
						iQtdeUtilizada = iQtdeUtilizada + vItensPAs[i].zzQnt;
					}
	
					oPAs.itens = vItensPAs;
					oPAs.qtde = iQtdeUtilizada;
	
					res4(oPAs);
				});
				
			}).catch(function(){
				
			});
		},
		/* getTotalSistema */
		
		verificarExibicaoCampoQtdePA: function(sItem){
			/* O evento é disparado duas vezes, controlo pelo valor sugerido, se tiver diferente de branco é proque 
			foi executado. */
			if (sItem != "") {
				var bItemCampanha = false;

				/* Verifico se existe campanha ativa para o item escolhido. */
				for (var i = 0; i < this.oCmpPA.length; i++) {
					/* A campanha tem que estar vigente*/
					if (this.oCmpPA[i].bCampanhaVigente) {
						/* Verifico se é para o material escolhido */
						if (this.oCmpPA[i].material == sItem) {
							bItemCampanha = true;
							this.oItemCpPA = this.oCmpPA[i];
						}
					}
				}

				/* Se for item de campanha, preencho o valor da campanha automaticamnete e exibo o campo quantidade de produto acabado*/
				sap.ui.getCore().byId("idQuantidadePA").setVisible(bItemCampanha);
				sap.ui.getCore().byId("idQuantidade").focus();

				/* Só chamo a função de setar valores se encontrou um item de campanha */
				if (this.oItemCpPA) {
					/* Chamo a primeira vez a distribuição de valores pois o item inserido é incluso com valor 1. */
					this.setValoresCpPA(this);
				}
			}			
		},
		
		disponibilizarValoresCpPAs: function(){
			
			/* Percorro todos os itens para distribuir os excedentes */
			console.log("MUDAR TAB CAMPANHA PA.");
			
		}
	});
});