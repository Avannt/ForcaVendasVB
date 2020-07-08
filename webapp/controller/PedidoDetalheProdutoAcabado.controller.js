/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function (BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheProdutoAcabado", {

		constructor: function (sView) {

			that = this;
			that.setLog("Inicio da verificação de campanha de produto acabado.");

			/* CAMPOS - INICIO */
			that.PDControllerCpPA = undefined;
			that.oCmpPA = undefined;
			that.kunnr = undefined;
			that.oItemCpPA = undefined;
			that.oItemGrCpPA = undefined;
			/* CAMPOS - FIM */

			that.bCampanhaPAAtiva = false;
			that.PDControllerCpPA = sView;
			that.kunnr = that.PDControllerCpPA.getView().getModel("modelAux").getProperty("/Kunnr");

			that.setLog("Iniciando campanha PA.");
			that.InicializarEventosCampPA();
		},
		/* constructor */

		onChangeIdTipoPedidoCpPA: function () {
			this.setLog("Mudança de tipo de pedido", "CPA");

			that.VerificarCampanhaPA();
		} /* onChangeIdTipoPedidoCpPA */ ,

		onSelectIconTabBarCpPA: function (evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.calcularTotalPedidoCpPA();
			}
		},
		/* onSelectIconTabBarCpPA */

		InicializarEventosCampPA: function () {
			var that = this;
			this.setLog("Atribuindo eventos.", "CPA");

			new Promise(function (resTop, rejTop) {

				that.GetCampanha(resTop, rejTop);

			}).then(function () {

				that.onVerificarEvento("idTipoPedido", that.onChangeIdTipoPedidoCpPA, "change"); /* change */
				that.onVerificarEvento("idTopLevelIconTabBar", that.onSelectIconTabBarCpPA, "select"); /* select */
				that.onVerificarEvento("idInserirItem", that.onInserirItemPressCpPA, "press"); /* press */

				that.onVerificarEvento("idItemPedido", that.onSuggestItemCpPA, "search"); /* Evento ao incluir um novo item. */

				that.onVerificarEvento("idButtonSalvarDialog", that.onSalvarItemDialogCpPA, "press"); /* press 'salvar' ao incluir um item */
				that.onVerificarEvento("idQuantidade", that.onQuantidadeChangeCpPA, "liveChange"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
				that.onVerificarEvento("table_pedidos", that.onItemPressCpPA, "itemPress"); /* itemPress ao editar um item na tabela de itens */

			});

		},

		//Realiza promise.
		InicializarEventosCampPA_Promise: function (res, rej) {
			var that = this;
			this.setLog("Atribuindo eventos.", "CPA");

			new Promise(function (resTop, rejTop) {

				that.GetCampanha(resTop, rejTop);

			}).then(function () {

				that.onVerificarEvento("idTipoPedido", that.onChangeIdTipoPedidoCpPA, "change"); /* change */
				that.onVerificarEvento("idTopLevelIconTabBar", that.onSelectIconTabBarCpPA, "select"); /* select */
				that.onVerificarEvento("idInserirItem", that.onInserirItemPressCpPA, "press"); /* press */

				that.onVerificarEvento("idItemPedido", that.onSuggestItemCpPA, "search"); /* Evento ao incluir um novo item. */

				that.onVerificarEvento("idButtonSalvarDialog", that.onSalvarItemDialogCpPA, "press"); /* press 'salvar' ao incluir um item */
				that.onVerificarEvento("idQuantidade", that.onQuantidadeChangeCpPA, "liveChange"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
				that.onVerificarEvento("table_pedidos", that.onItemPressCpPA, "itemPress"); /* itemPress ao editar um item na tabela de itens */
				res();
			});

		},
		/* InicializarEventosCampPA */

		onVerificarEvento: function (sIdControle, oMetodoEvento, sTipoEvento) {
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

		onItemPressCpPA: function (evt) {

			var that = this;
			var oPanel = sap.ui.getCore().byId("idDialog");
			oPanel.setBusy(true);

			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function () {
				var db = open.result;

				// var sItem = that.PDControllerCpPA.oItemPedido.matnr;

				/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
				// that.InicializarEventosCampPA(db);

				// that.verificarExibicaoCampoQtdePA(sItem , db);
				new Promise(function (res, rej) {

					that.InicializarEventosCampPA_Promise(res, rej);

				}).then(function () {

					new Promise(function (resTop, rejTop) {

						that.GetCampanha(resTop, rejTop);

					}).then(function () {

						that.onSuggestItemCpPA(db);
						that.onQuantidadeChangeCpPA();
						
					});
					
					oPanel.setBusy(false);

				});
			};
		},
		/* onItemPressCpPA */

		onSuggestItemCpPA: function (evt, db) {
			var that = this;

			if (db == undefined) {
				var open = indexedDB.open("VB_DataBase");

				open.onsuccess = function () {
					var db = open.result;
					var sItem = sap.ui.getCore().byId("idItemPedido").getValue();

					that.oItemCpPA = undefined;
					that.oItemGrCpPA = undefined;

					that.verificarExibicaoCampoQtdePA(sItem, db);

				};

			} else {

				var sItem = sap.ui.getCore().byId("idItemPedido").getValue();

				that.oItemCpPA = undefined;
				that.oItemGrCpPA = undefined;

				that.verificarExibicaoCampoQtdePA(sItem, db);
			}
		},
		/* onSuggestItemCpPA */

		onSalvarItemDialogCpPA: function (evt) {
			/* Ao pressionar o botão salvar, o sistema irá identificar o que é excedente de PA e o que é equivalente a campanha */

			var iQtdeCpPA = parseFloat(sap.ui.getCore().byId("idQuantidadePA").getValue());

			if (isNaN(iQtdeCpPA) == false && this.oItemGrCpPA != undefined && this.oItemCpPA != undefined) {
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = iQtdeCpPA;
				this.PDControllerCpPA.oItemPedido.zzGrupoCpPA = this.oItemGrCpPA.grupoSku;
				this.PDControllerCpPA.oItemPedido.zzIDCpPA = this.oItemCpPA.idcampanha;

			} else {
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = 0;
				this.PDControllerCpPA.oItemPedido.zzGrupoCpPA = "";
				this.PDControllerCpPA.oItemPedido.zzIDCpPA = "";
			}
		},

		onQuantidadeChangeCpPA: function () {
			this.setLog("Ao digitar a quantidade dos itens", "CPA");

			/* Só chamo a função de setar valores se encontrou um item de campanha */
			if (this.oItemCpPA) {
				this.setValoresCpPA(this);
			}
		},
		/* onQuantidadeChangeCpPA */

		onInserirItemPressCpPA: function () {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function () {
				var db = open.result;

				that.InicializarEventosCampPA(db);

				that.setLog("onInserirItemPressCpPA da campanha de produto acabado!", "CPA");
			};
		},
		/* onInserirItemPressCpPA */

		onSearchItemPedido: function () {
			this.setLog("onSearchItemPedido da campanha de produto acabado!", "CPA");
		},
		/* onSearchItemPedido */

		VerificarCampanhaPA: function () {
			/*Restrições (
				TABELA DA CAMPANHA S4		=> VERIFICAR
				TABELA DA CAMPANNHA LOCAL	=> CmpProdsAcabs
				Tipo de pedido: YBON																=> sIdTipoPed
				Vigência da campanha																=> that.oCmpPA[i].bCampanhaVigente, 
				
				Resultado																			=> that.bCampanhaPAAtiva = true
			)*/

			/* Verifico se não existe duas campanhas ativas para o mesmo representante e item */
			for (var i = 0; i < that.oCmpPA.length; i++) {

				if (that.oCmpPA[i].bCampanhaVigente) {
					/* Se existir mais de uma campanha ativa para o mesmo item, bloqueio o processo */
					var iTempQtdeCampanhasAtivasMesmoItem = 0;

					/* Percorro todos os materiais */
					for (var j = 0; j < that.oCmpPA[i].length; j++) {

						/* Para cada item de campanha, percorro todos os itens para identificar
						se existe algum em duplicidade. */
						for (var i2 = 0; i2 < that.oCmpPA.length; i2++) {
							for (var j2 = 0; j2 < that.oCmpPA[i2].length; j2++) {

								/* Preciso desconsiderar o item da campanha atual */
								if (i === i2 && j === j2) {
									continue;
								}

								/* Verifico se não é o mesmo material */
								if (that.oCmpPA[i].grupo[j].matnr === that.oCmpPA[i2].grupo[j2].matnr) {
									iTempQtdeCampanhasAtivasMesmoItem += 1;
								}
							}
						}
					}

					if (iTempQtdeCampanhasAtivasMesmoItem > 1) {
						sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante e material, campanha de 'PA' não será considerada!", {
							title: "Inconsitência no cadastro",
							actions: [sap.m.MessageBox.Action.OK],
							close: function () {
								that.bCampanhaPAAtiva = false;
							}
						});

						this.setLog("Não usa campanha PA: Mais de uma campanha ativa para o mesmo representante / material!", "CPA");
						return;
					}

					this.setLog("Verificação de duplicidades de campanhas concluídas.", "CPA");
				}
			}
		} /* VerificarCampanhaPA */ ,

		GetCampanha: function (resTop, rejTop) {

			new Promise(function (res, rej) {
				var open = indexedDB.open("VB_DataBase");

				open.onsuccess = function () {
					var db = open.result;

					var tCmpPA = db.transaction("CmpProdsAcabs", "readonly");
					var osCmpPA = tCmpPA.objectStore("CmpProdsAcabs");

					if ("getAll" in osCmpPA) {
						osCmpPA.getAll().onsuccess = function (event) {
							var tmpCampanha = event.target.result;

							res(tmpCampanha);
						};
					}
				};
			}).then(function (tmpCampanha) {
				var oCp;
				var oSg;
				that.oCmpPA = [];
				var bMudouCampanha = false;
				var sProximaCamp = "";

				/* Filtro as campanhas únicas */
				var cpUnicas = tmpCampanha.filter(function (value, index, self) {
					var bRetorno;

					/* Verifico se é o primeiro registro */
					if (index === 0) {
						bRetorno = true;
					} else {
						/* Comparo sempre com o registro anterior */
						if (self[index].Idcamp === self[index - 1].Idcamp) {
							bRetorno = false;
						} else {
							bRetorno = true;
						}
					}

					return bRetorno;
				});

				/* Percorro todas as campanhas únicas */
				for (var i = 0; i < cpUnicas.length; i++) {
					oCp = new Object();

					oCp.idcampanha = cpUnicas[i].Idcamp || "";
					oCp.representante = cpUnicas[i].representante || "";
					oCp.descricaoRepresentante = cpUnicas[i].descricaoRepresentante || "";
					oCp.dataInicio = cpUnicas[i].dataInicio || "";
					oCp.dataFim = cpUnicas[i].dataFim || "";
					oCp.quantidadeMaxima = cpUnicas[i].quantidadeMaxima || 0;
					oCp.bCampanhaVigente = true;

					/* Filtro somente os grupos da campanha atual */
					var gruposCP = tmpCampanha.filter(function (value, index, self) {
						var bRetorno;

						bRetorno = cpUnicas[i].Idcamp === self[index].Idcamp;
						// if(index === 0){
						// 	bRetorno = cpUnicas[i].Idcamp === self[index].Idcamp;
						// }
						// else{
						// 	/* Retorno grupos das mesmas campanha */
						// 	bRetorno = cpUnicas[i].Idcamp === self[index - 1].Idcamp;
						// }

						return bRetorno;
					});

					oCp.grupo = [];
					/* Percorro todos os grupos da campanha em questão para criar os objetos */
					for (var j = 0; j < gruposCP.length; j++) {
						oSg = new Object();

						oSg.idcampanha = gruposCP[j].Idcamp || "";
						oSg.grupoSku = gruposCP[j].Grupo || "";
						oSg.matnr = gruposCP[j].material || "";

						oCp.grupo.push(oSg);
					}

					that.oCmpPA.push(oCp);
				}

				that.setLog(that.oCmpPA, "CPA");

				that.VerificarCampanhasValidas(resTop);
			});

		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function (resTop) {
			var dDataAtual = new Date();

			this.setLog("Verificação de vigência das campanhas.", "CPA");
			for (var i = 0; i < that.oCmpPA.length; i++) {

				if ((dDataAtual >= that.oCmpPA[i].dataInicio) && (dDataAtual <= that.oCmpPA[i].dataFim)) {
					this.setLog("Campanha " + that.oCmpPA[i].idcampanha + " com vigência VÁLIDA!", "CPA");
					that.oCmpPA[i].bCampanhaVigente = true;

					var sIdTipoPed = that.PDControllerCpPA.byId("idTipoPedido").getSelectedKey();
					/* Se não for pedido de bonificação, não é válido para campanha */
					if (sIdTipoPed != "YBON") {
						this.setLog("Campanha não ativada! Pedido não é de bonificação!", "CPA");
						that.oCmpPA[i].bCampanhaVigente = false;
					}

					/* REGRA CONVERSADA COM FIGUEIREDO DIA 22/05/2019								*/
					/* CAMPANHA DE ENXOVAL TEM PRIORIDADE SOBRE A CAMPANHA DE BRINDES				*/
					/* OU SEJA, SE TIVER CAMPANHA ENXOVAL ATIVA, INUTILIZO A CAMPANHA DE BRINDES	*/
					if (this.PDControllerCpPA.pedidoDetalheEnxoval) {
						if (this.PDControllerCpPA.pedidoDetalheEnxoval.bCampanhaEnxovalAtiva) {
							this.setLog("Campanha " + that.oCmpPA[i].idcampanha + " não será utilizada pois existe uma de ENXOVAL ativa!", "CPA");
							that.oCmpPA[i].bCampanhaVigente = false;
						}
					}
				} else {
					this.setLog("Campanha " + that.oCmpPA[i].idcampanha + " com vigência INVÁLIDA!", "CPA");
					that.oCmpPA[i].bCampanhaVigente = false;
				}

			}
			resTop();
		},
		/* VerificarCampanhasValidas */

		/* VERIFICA SE EXISTE VESTIGIO DE VENDAS DO ITEM E CASO EXISTA INUTILIZA A CAMPANHA */
		VerificarCampanhaValidaItem: function (resolv, db) {
			var that2 = this;
			// var open = indexedDB.open("VB_DataBase");

			// open.onsuccess = function() {
			// 	var db = open.result;

			var store = db.transaction("AcompPedidoTopo", "readwrite");
			var objPedidos = store.objectStore("AcompPedidoTopo");
			var iKunnr = objPedidos.index("Kunnr");

			/* Recupero todos os pedidos do histórico do cliente em questão. */
			var reqPedidos = iKunnr.getAll(that.kunnr);

			/* VERIFICO HISTÓRICO - INICIO */
			new Promise(function (resH, rejH) {
				new Promise(function (res, rej) {
					reqPedidos.onsuccess = function (e) {
						res(e.target.result);
					};
				}).then(function (oPedidosTopo) {
					store = db.transaction("AcompPedidoDetalhe", "readwrite");
					var objPedidosDet = store.objectStore("AcompPedidoDetalhe");
					var iMatnr = objPedidosDet.index("Matnr");

					var reqItens = iMatnr.getAll(that.oItemCpPA.matnr);

					new Promise(function (res2, rej2) {
						reqItens.onsuccess = function (e) {
							var oPedidos = new Object();
							oPedidos.cliente = that.kunnr;
							oPedidos.topo = oPedidosTopo;
							oPedidos.det = e.target.result;

							res2(oPedidos);
						};
					}).then(function (oPed) {
						var bRetorno;

						/* Filtro pra trazer soemnte os itens do cliente em questão  */
						var vTempPed = oPed.det.filter(function (obj, i, array) {
							bRetorno = false;

							/* Preciso percorrer todos os pedidos pra verificar se o item em questão deve ser mantido */
							for (var j = 0; j < oPed.topo.length; j++) {

								/* Se encontrar o número do pedido, retorno o registro pro vetor*/
								if (obj.Nrpedcli === oPed.topo[j].Nrpedcli) {
									bRetorno = true;
								}
							}
							return bRetorno;
						});

						oPed.det = vTempPed;

						that2.setLog("Verificar se para cada campanha, já existe vestígio de vendas HISTÓRICO.", "CPA");
						var sTempMatnr = "";
						var sTempGrupoSku = "";
						var bEncontrouItem = false;

						/*	Verifico se tem algum item em questão, inutilizo ele na campanha. 
							19/08/2019 -> Verificar se o mesmo gruposku do item que está sendo inserido está no histórico
							Percorrer os itens já inseridos e ver se já tem algum item com gruposku inserido. Se sim, invalidar a campanha.
						*/
						for (var j = 0; j < that.oItemCpPA.grupo.length; j++) {
							if (that.PDControllerCpPA.oItemPedido.matnr == that.oItemCpPA.grupo[j].matnr) {
								sTempGrupoSku = that.oItemCpPA.grupo[j].grupoSku;
								sTempMatnr = that.PDControllerCpPA.oItemPedido.matnr;
								break;
							}
						}

						for (var j = 0; j < that.oItemCpPA.grupo.length; j++) {
							// sTempMatnr = that.oItemCpPA.grupo[j].matnr;
							// sTempGrupoSku = that.oItemCpPA.grupo[j].grupoSku;

							//Verifico se o item que estou inserindo, o gruposku está incluso já no historico.
							if (that.oItemCpPA.grupo[j].grupoSku == sTempGrupoSku) {

								/* Percorro todas as vendas */
								for (var k = 0; k < oPed.det.length; k++) {

									/* Se eu encontrar registro de vendas para o item, inutilizo a campanha */
									/* obs: as propriedades do AcompPedidoDetalhe estão diferentes do itensPedido, verificar corretamente o nome delas. */
									// if (oPed.det[k].Zzgrupocppa === sTempGrupoSku) { // Alteração dia 17/04 - não pode ativar item se tiver vendido algum item 
									if (oPed.det[k].Matnr === sTempMatnr) {
										that2.setLog("Item encontrado HIST: " + sTempMatnr + " já foi vendido. A campanha será inutilizada.", "CPA");
										that.oItemCpPA.bCampanhaVigente = false;
										bEncontrouItem = true;

										/* Se encontrou pelo menos um material, sai do loop*/
										break;
									}
								}

								if (bEncontrouItem) {
									break;
								}
							}
						}

						resH();
					});
				});
				/* VERIFICO HISTÓRICO - FIM */

			}).then(function (oPedidoHist) {
				/* VERIFICO TABELAS LOCAIS - INICIO */
				store = db.transaction("PrePedidos", "readwrite");
				objPedidos = store.objectStore("PrePedidos");
				iKunnr = objPedidos.index("kunnr");

				/* Recupero todos os pedidos do histórico do cliente em questão. */
				reqPedidos = iKunnr.getAll(that.kunnr);

				new Promise(function (res, rej) {
					reqPedidos.onsuccess = function (e) {
						res(e.target.result);
					};
				}).then(function (oPedidosTopo) {

					store = db.transaction("ItensPedido", "readwrite");
					var objPedidosDet = store.objectStore("ItensPedido");
					var iMatnr = objPedidosDet.index("matnr");

					var reqItens = iMatnr.getAll(that.oItemCpPA.matnr);

					new Promise(function (res2, rej2) {
						reqItens.onsuccess = function (e) {
							var oPedidos2 = new Object();
							oPedidos2.cliente = that.kunnr;
							oPedidos2.topo = oPedidosTopo;
							oPedidos2.det = e.target.result;

							res2(oPedidos2);
						};
					}).then(function (oPed2) {
						var bRetorno;

						/* Filtro pra trazer soemnte os itens do cliente em questão  */
						var vTempPed2 = oPed2.det.filter(function (obj, i, array) {
							bRetorno = false;

							/* Preciso percorrer todos os pedidos pra verificar se o item em questão deve ser mantido */
							for (var j = 0; j < oPed2.topo.length; j++) {

								/* Se encontrar o número do pedido, retorno o registro pro vetor*/
								if (obj.nrPedCli === oPed2.topo[j].nrPedCli) {
									var sPedAtual = that.PDControllerCpPA.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

									// Não pode ser o pedido em questão
									if (obj.nrPedCli != sPedAtual) {
										bRetorno = true;
									}
								}
							}
							return bRetorno;
						});

						oPed2.det = vTempPed2;

						that2.setLog("Verificar se para cada campanha, já existe vestígio de vendas LOCAL.", "CPA");
						var sTempMatnr = "";
						var sTempGrupoSku = "";
						var bEncontrouItem = false;

						/* Verifico se tem algum item em questão, inutilizo ele na campanha. */
						for (var j = 0; j < that.oItemCpPA.grupo.length; j++) {
							if (that.PDControllerCpPA.oItemPedido.matnr == that.oItemCpPA.grupo[j].matnr) {
								sTempGrupoSku = that.oItemCpPA.grupo[j].grupoSku;
								sTempMatnr = that.PDControllerCpPA.oItemPedido.matnr;
								break;
							}
						}

						for (var j = 0; j < that.oItemCpPA.grupo.length; j++) {
							// sTempMatnr = that.oItemCpPA.grupo[j].matnr;
							// sTempGrupoSku = that.oItemCpPA.grupo[j].grupoSku;

							if (that.oItemCpPA.grupo[j].grupoSku == sTempGrupoSku) {
								/* Percorro todas as vendas */
								for (var k = 0; k < oPed2.det.length; k++) {

									/* Se eu encontrar registro de vendas para o item, inutilizo a campanha */
									/* Alteração Rcardilo - 19/08/2019 - && oPed2.det[k].zzGrupoCpPA === sTempGrupoSku
										-> Verifiquei que só desabilita se o item econtrado pertence ao mesmo gruposku */
									// if (oPed2.det[k].zzGrupoCpPA === sTempGrupoSku) {  // Alteração dia 17/04 - não pode ativar item se tiver vendido algum item 
									if (oPed2.det[k].Matnr === sTempMatnr) {
										that2.setLog("Item encontrado LOCAL: " + sTempMatnr + " já foi vendido. A campanha será inutilizada.", "CPA");
										that.oItemCpPA.bCampanhaVigente = false;
										bEncontrouItem = true;

										/* Se encontrou pelo menos um material, sai do loop*/
										break;
									}
								}

								if (bEncontrouItem) {
									break;
								}
							}
						}

						resolv();
					});
				});
				/* VERIFICO TABELAS LOCAIS - FIM */
			});
			// };
		},

		setValoresCpPA: function (that) {
			var iQtdeMaxPedGrupo = 0;
			var iQtdeDigitada = parseFloat(sap.ui.getCore().byId("idQuantidade").getValue());
			var iQtdeDigitadaGrupo = 0;
			var iSaldoCpPA;
			var iQtdePA = 0;

			var sCodCampanha = this.oItemGrCpPA.idcampanha || "";
			var sCodGrupo = this.oItemGrCpPA.grupoSku || "";

			/* Preciso verificar se para o item em questão a campanha está ativa, se não tiver */
			/* Atribuo zero no valor da campanha e saio da função */
			if (this.oItemCpPA.bCampanhaVigente == false) {
				sap.ui.getCore().byId("idQuantidadePA").setValue(0);
				return;
			}

			/* Vou na campanha identificar qual a quantidade liberada para um grupo de SKU */
			iQtdeMaxPedGrupo = this.oItemCpPA.quantidadeMaxima;

			/* Identifico quanto já foi digitado nesse pedido do grupo de SKU em questão. */
			/*that.objItensPedidoTemplate*/
			for (var i = 0; i < this.PDControllerCpPA.objItensPedidoTemplate.length; i++) {

				/* O material em questão não pode ser considerado pra o saldo (no caso da edição eu devo ignorar no montante total) */
				if (this.PDControllerCpPA.objItensPedidoTemplate[i].idItemPedido != this.PDControllerCpPA.oItemPedido.idItemPedido) {

					/* Para cada linha percorro todos itens da campanha para verificar se a eles pertencem
					e somar a quantidade*/
					for (var j = 0; j < this.oItemCpPA.grupo.length; j++) {

						/* zzGrupoCpPA -> Gravo essa informação no momento que o usuário pressiona o botão 'salvar' */
						if (((this.PDControllerCpPA.objItensPedidoTemplate[i].zzGrupoCpPA || "") === sCodGrupo) &&
							((this.PDControllerCpPA.objItensPedidoTemplate[i].zzIDCpPA || "") === sCodCampanha)) {
							iQtdeDigitadaGrupo = iQtdeDigitadaGrupo + this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA;
							break;
						}
					}
				}
			}

			iSaldoCpPA = iQtdeMaxPedGrupo - iQtdeDigitadaGrupo;

			if (iQtdeDigitada < iSaldoCpPA) {
				iQtdePA = iQtdeDigitada;
			} else {
				iQtdePA = iSaldoCpPA;
			}

			/*parseFloat(this.oItemCpPA.quantidadeMaxima)*/
			sap.ui.getCore().byId("idQuantidadePA").setValue(iQtdePA);
			if (isNaN(iQtdePA) == false) {
				sap.m.MessageToast.show("Campanha produto novo ativada, quantidade: " + iQtdePA.toString(), {
					duration: 3000
				});
			} else {
				sap.ui.getCore().byId("idQuantidadePA").setValue(0);
			}

			var oPanel = sap.ui.getCore().byId("idDialog");
			oPanel.setBusy(false);
			/* Fim */
		},
		/* setValoresCpPA */

		verificarExibicaoCampoQtdePA: function (sItem, db) {
			this.setLog("Verifico se é pra exibir ou ocultar o campo de quantidade.", "CPA");
			var this2 = this;

			var bEncontrouCp = false;

			/* O campo começa invisível */
			//sap.ui.getCore().byId("idQuantidadePA").setVisible(false);

			/* O evento é disparado duas vezes, controlo pelo valor sugerido, se tiver diferente de branco é proque 
			foi executado. */
			if (sItem != "") {
				/* Verifico se existe campanha ativa para o item escolhido. */
				for (var i = 0; i < this.oCmpPA.length; i++) {
					/* A campanha tem que estar vigente*/
					if (this.oCmpPA[i].bCampanhaVigente) {

						for (var j = 0; j < this.oCmpPA[i].grupo.length; j++) {

							/* Verifico se é para o material escolhido */
							if (this.oCmpPA[i].grupo[j].matnr == sItem) {
								bEncontrouCp = true;

								new Promise(function (resolv) {
									this2.setLog("Campanha encontrada para o item: " + sItem, "CPA");
									this2.oItemCpPA = this2.oCmpPA[i];
									this2.oItemGrCpPA = this2.oCmpPA[i].grupo[j];

									this2.setLog("Verificando se o item " + sItem + " já foi vendido.", "CPA");
									this2.VerificarCampanhaValidaItem(resolv, db);
								}).then(function () {

									/* Só chamo a função de setar valores se encontrou um item de campanha */
									if (this2.oItemCpPA) {
										/* Se for item de campanha, preencho o valor da campanha automaticamnete e exibo o campo quantidade de produto acabado*/
										//sap.ui.getCore().byId("idQuantidadePA").setVisible(this2.oItemCpPA.bCampanhaVigente);
										// sap.ui.getCore().byId("idQuantidade").focus();

										/* Chamo a primeira vez a distribuição de valores pois o item inserido é incluso com valor 1. */
										this2.setValoresCpPA(this2);
									} else {
										this2.setLog("Nenhuma campanha encontrada para o item: " + sItem, "CPA");
									}
								});

								break;
							}
						}
					}

					if (bEncontrouCp) {
						break;
					}
				}

			}
		},

		disponibilizarValoresCpPAs: function () {
			/* Percorro todos os itens para distribuir os excedentes */
			this.setLog("MUDAR TAB CAMPANHA PA.", "CPA");
		},

		calcularTotalPedidoCpPA: function () {
			var oModelPed = that.PDControllerCpPA.getOwnerComponent().getModel("modelDadosPedido");

			var dValorExcedenteTotal = 0;
			var dValorExcProduto = 0;
			var dValorBExcedenteBonific = 0;
			var dValorLExcedenteBonific = 0;
			var dValorBonificacao = parseFloat(oModelPed.getProperty("/ValTotalExcedenteNaoDirecionadoBonif"));

			for (var i = 0; i < this.PDControllerCpPA.objItensPedidoTemplate.length; i++) {
				dValorExcProduto = 0;

				/* Verifico houve quantidade exclusiva para campanhas */
				if (parseInt(this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA, 10) > 0) {
					dValorExcProduto = this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA * parseFloat(this.PDControllerCpPA.objItensPedidoTemplate[i].zzVprodDesc2);
					dValorExcedenteTotal = dValorExcedenteTotal + dValorExcProduto;
				}
			}

			if (this.PDControllerCpPA.objItensPedidoTemplate.length == 0) {
				dValorExcProduto = 0;
				dValorExcedenteTotal = 0;
			}

			dValorBExcedenteBonific = parseFloat(oModelPed.getProperty("/ValTotalExcedenteBonif") || 0);

			if (dValorBExcedenteBonific >= 0) {
				var dValorLiquidoBonificacao = dValorBonificacao - dValorExcedenteTotal;
				dValorLExcedenteBonific = dValorBExcedenteBonific - dValorExcedenteTotal;

				if (dValorLiquidoBonificacao < 0) {
					dValorLiquidoBonificacao = 0;
				}

				dValorLExcedenteBonific = Math.round(dValorLExcedenteBonific * 100) / 100;
				dValorExcedenteTotal = Math.round(dValorExcedenteTotal * 100) / 100;
				dValorLiquidoBonificacao = Math.round(dValorLiquidoBonificacao * 100) / 100;

				oModelPed.setProperty("/ValTotalExcedenteBonif", dValorLExcedenteBonific);
				oModelPed.setProperty("/ValTotalCampProdutoAcabado", dValorExcedenteTotal || 0);
				oModelPed.setProperty("/ValTotalExcedenteNaoDirecionadoBonif", dValorLiquidoBonificacao.toString());
			}
		}
	});
});