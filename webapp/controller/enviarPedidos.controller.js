/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, MessageBox) {
	"use strict";
	var oPedidosEnviar = [];
	var oItensPedidoGrid = [];
	var oPedidoGrid = [];
	var oItensPedidoEnviar = [];
	var oItensPedidoGridEnviar = [];
	var deletarMovimentos = [];
	var ajaxCall;
	var envioPedidos;

	return BaseController.extend("testeui5.controller.enviarPedidos", {

		onInit: function () {
			this.getRouter().getRoute("enviarPedidos").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {
			var that = this;
			oPedidosEnviar = [];
			oItensPedidoGrid = [];
			oPedidoGrid = [];
			oItensPedidoEnviar = [];
			oItensPedidoGridEnviar = [];
			//Se for true mostrar a grid de envio de pedidos, senão mostrar a grid de entrega futura.
			envioPedidos = that.getOwnerComponent().getModel("modelAux").getProperty("/bEnviarPedido");

			that.byId("table_pedidos").setVisible(envioPedidos);
			that.byId("table_entregas").setVisible(!envioPedidos);

			if (envioPedidos) {
				this.onLoadPedidos();
			} else {
				this.onLoadEntregas();
			}

		},
		/*FIM _onLoadFields*/

		onLoadPedidos: function () {
			var open = indexedDB.open("VB_DataBase");
			var that = this;

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				var store = db.transaction("PrePedidos").objectStore("PrePedidos");
				var indiceStatusPed = store.index("idStatusPedido");

				var request = indiceStatusPed.getAll(2);

				request.onsuccess = function (event) {
					oPedidoGrid = event.target.result;

					var vetorPromise = [];

					/* Recupero todos os pedidos pendentes de preposto (9)*/
					store = db.transaction("PrePedidos").objectStore("PrePedidos");
					indiceStatusPed = store.index("idStatusPedido");

					request = indiceStatusPed.getAll(9);
					request.onsuccess = function (event) {
						var oPedidoGrid2 = event.target.result;
						
						/* Verifico se já existem registros de pedidos de representante (status=2) */
						if (oPedidoGrid == undefined || oPedidoGrid.length == 0) {
							/* Caso não tenha, considero somente os pedidos de prepostos */
							oPedidoGrid = event.target.result;
						} else {
							/* Caso exista pedidos de representantes, necessito verificar se existe pedidos de prepostos.*/
							if (!(oPedidoGrid2 == undefined || oPedidoGrid2 == 0)) {
								
								/* Se existir, necessito acrescentar 1 a 1 nos pedidos de representantes */
								for (var k = 0; k < oPedidoGrid2.length; k++) {
									oPedidoGrid.push(oPedidoGrid2[k]);
								}
							}
						}

						var oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
						that.getView().setModel(oModel, "PedidosEnviar");

						for (var j = 0; j < oPedidoGrid.length; j++) {

							vetorPromise.push(new Promise(function (resolve, reject) {
								var storeItensPed = db.transaction("ItensPedido").objectStore("ItensPedido");
								var indiceNrPed = storeItensPed.index("nrPedCli");

								request = indiceNrPed.getAll(oPedidoGrid[j].nrPedCli);

								request.onsuccess = function (event) {

									for (var i = 0; i < event.target.result.length; i++) {
										var aux = event.target.result[i];
										oItensPedidoGrid.push(aux);
									}
									console.log(oItensPedidoGrid);
									resolve();
								};

								request.onerror = function (event) {
									console.error(event.error.mensage);
									reject();
								};

							}));
						}
					};

					Promise.all(vetorPromise).then(function (values) {
						console.log(oItensPedidoGrid);
					});

				};
			};

		},
		/*FIM onLoadPedidos*/

		onLoadEntregas: function () {
			var that = this;
			var oModel = new sap.ui.model.json.JSONModel();
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				var store = db.transaction("EntregaFutura2").objectStore("EntregaFutura2");
				var request = store.getAll();

				request.onsuccess = function (event) {
					oPedidoGrid = event.target.result;

					oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
					that.getOwnerComponent().setModel(oModel, "EntregasEnviar");
				};
			};
		},
		/*FIM onLoadEntregas*/

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("login");
		},
		/*FIM onNavBack*/

		myFormatterDataImp: function (value) {
			if (value != undefined) {
				var aux = value.split("/");
				var aux2 = aux[2].substring(2, aux[2].length);
				value = aux[0] + "/" + aux[1] + "/" + aux2;
				return value;
			}
		},
		/*FIM myFormatterDataImp*/

		onItemPress: function (oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("PedidosEnviar").getProperty("nrPedCli");
			var variavelCodigoCliente = oItem.getBindingContext("PedidosEnviar").getProperty("kunnr");
			that.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", variavelCodigoCliente);
			that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", nrPedCli);

			MessageBox.show("Deseja mesmo detalhar o Pedido?", {
				icon: MessageBox.Icon.WARNING,
				title: "Detalhamento Solicitado",
				actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction == sap.m.MessageBox.Action.YES) {

						var open = indexedDB.open("VB_DataBase");

						open.onerror = function () {
							console.log("não foi possivel encontrar e/ou carregar a base de clientes");
						};

						open.onsuccess = function (e) {
							var db = e.target.result;

							var promise = new Promise(function (resolve, reject) {
								that.carregaModelCliente(db, resolve, reject);
							});

							promise.then(function () {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
							});
						};
					}
				}
			});
		},
		/*FIM onItemPress*/

		carregaModelCliente: function (db, resolve, reject) {
			var that = this;

			var codCliente = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			var tx = db.transaction("Clientes", "readwrite");
			var objUsuarios = tx.objectStore("Clientes");

			var request = objUsuarios.get(codCliente);

			request.onsuccess = function (e1) {

				var result = e1.target.result;

				if (result !== null && result !== undefined) {

					that.getOwnerComponent().getModel("modelCliente").setProperty("/Kunnr", result.kunnr);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Land1", result.land1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name1", result.name1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name2", result.name2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort01", result.ort01);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort02", result.ort02);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Regio", result.regio);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stras", result.stras);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Pstlz", result.pstlz);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd1", result.stcd1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd2", result.stcd2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Inco1", result.inco1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Parvw", result.parvw);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Lifnr", result.lifnr);
					resolve();
				} else {
					console.log("ERRO!! Falha ao ler Clientes.");
					reject();
				}
			};
		},
		/*FIM carregaModelCliente*/

		onSelectionChange: function (oEvent) {
			oPedidosEnviar = [];
			oItensPedidoGridEnviar = [];
			oItensPedidoEnviar = [];

			var that = this;
			var oSelectedItems = this.getView().byId("table_pedidos").getSelectedItems();

			for (var i = 0; i < oSelectedItems.length; i++) {
				var nrPedido = oSelectedItems[i].getBindingContext("PedidosEnviar").getProperty("nrPedCli");

				for (var j = 0; j < oPedidoGrid.length; j++) {

					if (oPedidoGrid[j].nrPedCli == nrPedido) {
						oPedidosEnviar.push(oPedidoGrid[j]);
					}
				}
				for (var k = 0; k < oItensPedidoGrid.length; k++) {
					if (oItensPedidoGrid[k].nrPedCli == nrPedido) {
						oItensPedidoGridEnviar.push(oItensPedidoGrid[k]);
					}
				}
			}
		},
		/*FIM onSelectionChange*/

		onEnviarPedido: function (oEvent) {
			var that = this;

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				MessageBox.show("Deseja enviar os itens selecionados?", {
					icon: MessageBox.Icon.WARNING,
					title: "Envio de itens",
					actions: ["Enviar", "Cancelar"],
					onClose: function (oAction) {

						if (oAction == "Enviar") {

							var oModel = that.getView().getModel();
							oModel.setUseBatch(true);
							oModel.refreshSecurityToken();
							that.byId("table_pedidos").setBusy(true);

							var repres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

							for (var j = 0; j < oItensPedidoGrid.length; j++) {

								var objItensPedido = {
									Iditempedido: String(oItensPedidoGrid[j].idItemPedido),
									Tindex: oItensPedidoGrid[j].index,
									Knumh: String(oItensPedidoGrid[j].knumh),
									Knumhextra: String(oItensPedidoGrid[j].knumhExtra),
									Zzregra: String(oItensPedidoGrid[j].zzRegra),
									Zzgrpmatextra: String(oItensPedidoGrid[j].zzGrpmatExtra),
									Zzgrpmat: String(oItensPedidoGrid[j].zzGrpmat),
									Zzregraextra: String(oItensPedidoGrid[j].zzRegraExtra),
									Maktx: String(oItensPedidoGrid[j].maktx),
									Matnr: String(oItensPedidoGrid[j].matnr),
									Nrpedcli: String(oItensPedidoGrid[j].nrPedCli),
									Ntgew: String(oItensPedidoGrid[j].ntgew),
									Tipoitem: String(oItensPedidoGrid[j].tipoItem),
									Zzdesext: String(oItensPedidoGrid[j].zzDesext),
									Zzdesitem: String(oItensPedidoGrid[j].zzDesitem),
									Zzpercdescdiluicao: String(oItensPedidoGrid[j].zzPercDescDiluicao),
									Zzpercdesctotal: String(oItensPedidoGrid[j].zzPercDescTotal),
									Zzpercom: String(oItensPedidoGrid[j].zzPercom),
									Zzpervm: String(oItensPedidoGrid[j].zzPervm),
									Zzqnt: String(oItensPedidoGrid[j].zzQnt),
									Zzvprod: String(oItensPedidoGrid[j].zzVprod),
									Zzvproddesc: String(oItensPedidoGrid[j].zzVprodDesc),
									Zzvproddesctotal: String(oItensPedidoGrid[j].zzVprodDescTotal),
									Length: String(oItensPedidoGrid.length)
								};

								oModel.create("/InserirLinhaOV", objItensPedido, {
									method: "POST",
									success: function (data) {
										console.info("Itens Inserido");
										that.byId("table_pedidos").setBusy(false);

									},
									error: function (error) {
										that.byId("table_pedidos").setBusy(false);
										that.onMensagemErroODATA(error.statusCode);
									}
								});
							}

							for (var i = 0; i < oPedidosEnviar.length; i++) {

								var objPedido = {
									Nrpedcli: oPedidosEnviar[i].nrPedCli,
									Idstatuspedido: String(oPedidosEnviar[i].idStatusPedido),
									Kunnr: oPedidosEnviar[i].kunnr,
									Werks: oPedidosEnviar[i].werks,
									Lifnr: repres,
									Auart: oPedidosEnviar[i].tipoPedido,
									Situacaopedido: oPedidosEnviar[i].situacaoPedido,
									Ntgew: String(oPedidosEnviar[i].ntgew),
									// Brgew: null, // Não usa
									// Dataentrega: "20181116", //Não usa
									Pltyp: String(oPedidosEnviar[i].tabPreco),
									Completo: oPedidosEnviar[i].completo,
									Valminped: String(oPedidosEnviar[i].valMinPedido),
									Erdat: String(oPedidosEnviar[i].dataImpl.substr(6, 4) + oPedidosEnviar[i].dataImpl.substr(3, 2) + 
										oPedidosEnviar[i].dataImpl.substr(0, 2)),
									Horaped: String(oPedidosEnviar[i].dataImpl.substr(11, 2) + oPedidosEnviar[i].dataImpl.substr(14, 2) + 
										oPedidosEnviar[i].dataImpl.substr(17, 2)),
									Obsped: oPedidosEnviar[i].observacaoPedido,
									Obsaudped: oPedidosEnviar[i].observacaoAuditoriaPedido,
									Existeentradapedido: String(oPedidosEnviar[i].existeEntradaPedido),
									Percentradapedido: String(oPedidosEnviar[i].percEntradaPedido),
									Valorentradapedido: String(oPedidosEnviar[i].valorEntradaPedido),
									Inco1: String(oPedidosEnviar[i].tipoTransporte),
									Diasprimeiraparcela: String(oPedidosEnviar[i].diasPrimeiraParcela),
									Quantparcelas: String(oPedidosEnviar[i].quantParcelas),
									Intervaloparcelas: String(oPedidosEnviar[i].intervaloParcelas),
									Tiponego: String(oPedidosEnviar[i].tipoNegociacao),
									// CodRepres: oPedidosEnviar[i].codRepres,
									Totitens: oPedidosEnviar[i].totalItensPedido,
									// ValCampBrinde: String(oPedidosEnviar[i].valCampBrinde),
									// ValCampEnxoval: String(oPedidosEnviar[i].valCampEnxoval),
									// ValCampGlobal: String(oPedidosEnviar[i].valCampGlobal),
									Valorcomissao: String(parseFloat(oPedidosEnviar[i].valComissao)),
									// ValDescontoTotal: oPedidosEnviar[i].valDescontoTotal,
									// ValMinPedido: oPedidosEnviar[i].valMinPedido,
									Valtotpedido: String(oPedidosEnviar[i].valTotPed),
									Valtotabcomissao: String(oPedidosEnviar[i].valTotalAbatidoComissao),
									Valabverba: String(oPedidosEnviar[i].valTotalAbatidoVerba),
									Vlrprz: String(oPedidosEnviar[i].valTotalExcedentePrazoMed),
									VlrprzCom: String(oPedidosEnviar[i].valUtilizadoComissaoPrazoMed),
									VlrprzVm: String(0), //NÃO UTILIZA VERBA PARA PRAZO 
									VlrprzDd: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									VlrprzVvb: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									Vlrdsc: String(oPedidosEnviar[i].valTotalExcedenteDesconto),
									VlrdscCom: String(oPedidosEnviar[i].valComissaoUtilizadaDesconto),
									VlrdscVm: String(oPedidosEnviar[i].valVerbaUtilizadaDesconto),
									VlrdscDd: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									VlrdscVvb: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									Vlramo: String(oPedidosEnviar[i].valTotalExcedenteAmostra),
									VlramoCom: String(oPedidosEnviar[i].valUtilizadoComissaoAmostra),
									VlramoVm: String(oPedidosEnviar[i].valUtilizadoVerbaAmostra),
									VlramoDd: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									VlramoVvb: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									Vlrbri: String(oPedidosEnviar[i].valTotalExcedenteBrinde),
									VlrbriCom: String(oPedidosEnviar[i].valUtilizadoComissaoBrinde),
									VlrbriVm: String(oPedidosEnviar[i].valUtilizadoVerbaBrinde),
									VlrbriDd: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									VlrbriVvb: String(0), //CAMPO UTILIZADO APENAS NA APROVAÇÃO
									Vlrbon: String(oPedidosEnviar[i].valTotalExcedenteBonif),
									VlrbonCom: String(oPedidosEnviar[i].valUtilizadoComissaoBonif),
									VlrbonVm: String(oPedidosEnviar[i].valUtilizadoVerbaBonif),
									VlrbonDd: String(0),
									VlrbonVvb: String(0),
									Valtotabcamppa: String(oPedidosEnviar[i].valUtilizadoCampProdutoAcabado),
									Valtotabcampbrinde: String(oPedidosEnviar[i].valUtilizadoCampBrinde),
									Valtotexcndirdesc: String(oPedidosEnviar[i].valTotalExcedenteNaoDirecionadoDesconto),
									Valtotexcndirprazo: String(oPedidosEnviar[i].valTotalExcedenteNaoDirecionadoPrazoMed),
									Valverbapedido: String(oPedidosEnviar[i].valVerbaPedido),
									BuGruop: ""
								};

								oModel.create("/InserirOV", objPedido, {
									method: "POST",
									success: function (data) {

										var tx = db.transaction("PrePedidos", "readwrite");
										var objPedido = tx.objectStore("PrePedidos");

										var requestPrePedidos = objPedido.get(data.Nrpedcli);

										requestPrePedidos.onsuccess = function (e) {
											var oPrePedido = e.target.result;

											oPrePedido.idStatusPedido = 3;
											oPrePedido.situacaoPedido = "FIN";

											var requestPutItens = objPedido.put(oPrePedido);

											requestPutItens.onsuccess = function () {
												MessageBox.show("Pedido: " + data.Nrpedcli + " Enviado!", {
													icon: MessageBox.Icon.SUCCESS,
													title: "Pedido enviado!",
													actions: [MessageBox.Action.OK],
													onClose: function () {

														for (var o = 0; o < oPedidoGrid.length; o++) {
															if (oPedidoGrid[o].nrPedCli == data.Nrpedcli) {
																oPedidoGrid.splice(o, 1);
															}
														}
														// oModel = new sap.ui.model.json.JSONModel();
														// that.getView().setModel(oModel, "PedidosEnviar");

														oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
														that.getView().setModel(oModel, "PedidosEnviar");
														that.byId("table_pedidos").setBusy(false);
													}
												});
											};
										};
									},
									error: function (error) {
										that.byId("table_pedidos").setBusy(false);
										that.onMensagemErroODATA(error.statusCode);
									}
								});
							}

							oModel.submitChanges();
						}
					}
				});
			};
		},
		/*FIM onEnviarPedido*/

		onEnviarEntrega: function (oEvent) {
			var that = this;
			var aIndices = this.byId("table_entregas").getSelectedContextPaths();

			if (aIndices.length === 0) {
				MessageBox.show("Nenhuma linha foi selecionada.", {
					icon: MessageBox.Icon.ERROR,
					title: "Erro",
					actions: [MessageBox.Action.OK]
				});

				return;
			}

			MessageBox.show("Deseja enviar os itens selecionados?", {
				icon: MessageBox.Icon.WARNING,
				title: "Envio de itens",
				actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function (oAction) {

					if (oAction == sap.m.MessageBox.Action.YES) {
						var oModel = that.getView().getModel();
						oModel.setUseBatch(true);
						oModel.refreshSecurityToken();

						var open = indexedDB.open("VB_DataBase");

						open.onerror = function () {
							MessageBox.show(open.error.mensage, {
								icon: MessageBox.Icon.ERROR,
								title: "Banco não encontrado!",
								actions: [MessageBox.Action.OK]
							});
						};

						open.onsuccess = function () {
							var db = open.result;

							var oModelEntregas = that.getView().getModel("EntregasEnviar").getData();

							var tx = db.transaction("EntregaFutura", "readwrite");
							var objItensEntrega = tx.objectStore("EntregaFutura");
							var vItensEntregar = [];

							// Separo todos os itens que devem ser entregues
							for (var i = 0; i < aIndices.length; i++) {
								var iIndex = aIndices[i].substring(1, 2);

								vItensEntregar.push(oModelEntregas[iIndex]);
							}

							// Ordeno os itens a entregar por pedido (Vbeln)
							vItensEntregar.sort(function (a, b) {
								if (a.Vbeln < b.Vbeln)
									return -1;
								if (a.Vbeln > b.Vbeln)
									return 1;
								return 0;
							});

							// É necessário identificar o último item de cada pedido a ser enviado para fechar um doc
							// de entrega no Sap.
							for (var i = 0; i < vItensEntregar.length; i++) {

								// Verifico se o item atual é o último
								if (i == vItensEntregar.length - 1) {
									vItensEntregar[i].Ultitm = "X";
									continue;
								}

								/* Comparo o elemento atual com o próximo, se o doc for diferente, identifico como sendo o último item*/
								var iProximo = i + 1;
								if (vItensEntregar[i].Vbeln !== vItensEntregar[iProximo].Vbeln) {
									vItensEntregar[i].Ultitm = "X";
								} else {
									vItensEntregar[i].Ultitm = "X";
								}
							}

							var vetorPromise = [];

							/* Percorro o vetor para enviar ao Sap */
							for (var i = 0; i < vItensEntregar.length; i++) {
								vetorPromise.push(new Promise(function (resolve, reject) {

									var oItemEntregar = vItensEntregar[i];
									var tmpItem = {
										Arktx: oItemEntregar.Arktx,
										Aubel: oItemEntregar.Aubel,
										Aupos: oItemEntregar.Aupos,
										Bstkd: oItemEntregar.Bstkd,
										Fkimg: String(oItemEntregar.Fkimg),
										Fkimg2: String(oItemEntregar.Fkimg2),
										Kunrg: oItemEntregar.Kunrg,
										Lifnr: oItemEntregar.Lifnr,
										Matnr: oItemEntregar.Matnr,
										NameOrg1: oItemEntregar.NameOrg1,
										NameOrg2: oItemEntregar.NameOrg2,
										Posnr: oItemEntregar.Posnr,
										Sldfut: String(oItemEntregar.Sldfut),
										Ultitm: oItemEntregar.Ultitm,
										Vbeln: oItemEntregar.Vbeln,
									};

									oModel.create("/EntregaFuturaRetorno", tmpItem, {
										method: "POST",
										success: function (data) {
											tx = db.transaction("EntregaFutura", "readwrite");
											objItensEntrega = tx.objectStore("EntregaFutura");

											var requestGetEntrega = objItensEntrega.get(oItemEntregar.idEntregaFutura);

											requestGetEntrega.onsuccess = function (e) {
												var oEntrega = e.target.result;

												oEntrega.Slddia = parseInt(oEntrega.Slddia) + parseInt(oItemEntregar.Fkimg2);

												tx = db.transaction("EntregaFutura", "readwrite");
												objItensEntrega = tx.objectStore("EntregaFutura");
												var requestPutEntrega = objItensEntrega.put(oEntrega);

												requestPutEntrega.onsuccess = function (e) {
													var sMensagem = "Item " + oItemEntregar.Matnr + " da Entrega " + oItemEntregar.Vbeln +
														" enviado com sucesso.";
													sap.m.MessageBox.show(
														sMensagem, {
															icon: sap.m.MessageBox.Icon.SUCCESS,
															title: "Sucesso",
															actions: [sap.m.MessageBox.Action.OK]
														}
													);

													var txEF2 = db.transaction("EntregaFutura2", "readwrite");
													var objItensEntrega2 = txEF2.objectStore("EntregaFutura2");
													var requestDelEntrega2 = objItensEntrega2.delete(oItemEntregar.idEntregaFutura);

													requestDelEntrega2.onsuccess = function (e) {
														console.info("item ef excluido");
														resolve();
													};

													requestDelEntrega2.onerror = function (e) {
														console.info(e);
														reject();
													};
												};

												requestPutEntrega.onerror = function (e) {
													sap.m.MessageBox.show(
														"Erro ao enviar pedido.", {
															icon: sap.m.MessageBox.Icon.ERROR,
															title: "Erro no programa Fiori!",
															actions: [sap.m.MessageBox.Action.OK],
														}
													);
												};
											}; /*requestGetEntrega*/
										},
										error: function (error) {
											that.onMensagemErroODATA(error.statusCode);
										}
									});
								})); /*vetorPromise*/
							}

							Promise.all(vetorPromise).then(function (values) {
								that.onLoadEntregas();
							});
						};
					}
				}
			});
		},
		/*FIM onEnviarEntrega*/

		onMontarCabecalho: function (that, idPedido, dadosPedidoCab) {

		},
		/*FIM onMontarCabecalho*/

		onMontarLinha: function () {

		},
		/*FIM onMontarLinha*/

		onMensagemErroODATA: function (codigoErro) {

				if (codigoErro == 0) {
					sap.m.MessageBox.show(
						"Verifique a conexão com a internet!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Falha na Conexão!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				} else if (codigoErro == 400) {
					sap.m.MessageBox.show(
						"Url mal formada! Contate a consultoria!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Erro no programa Fiori!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				} else if (codigoErro == 403) {
					sap.m.MessageBox.show(
						"Usuário sem autorização para executar a função (403)! Contate a consultoria!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Erro no programa Abap!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				} else if (codigoErro == 404) {
					sap.m.MessageBox.show(
						"Função não encontrada e/ou Parâmentros inválidos  (404)! Contate a consultoria!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Erro no programa Abap!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				} else if (codigoErro == 500) {
					sap.m.MessageBox.show(
						"Ocorreu um Erro (500)! Contate a consultoria!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Erro no programa Abap!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				} else if (codigoErro == 501) {
					sap.m.MessageBox.show(
						"Função não implementada (501)! Contate a consultoria!", {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: "Erro no programa Abap!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {

							}
						}
					);
				}
			}
			/*FIM onMensagemErroODATA*/

	});
});