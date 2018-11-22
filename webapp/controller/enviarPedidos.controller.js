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

	return BaseController.extend("testeui5.controller.enviarPedidos", {

		onInit: function () {
			this.getRouter().getRoute("enviarPedidos").attachPatternMatched(this._onLoadFields, this);
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

		myFormatterDataImp: function (value) {
			var aux = value.split("/");
			var aux2 = aux[2].substring(2, aux[2].length);
			value = aux[0] + "/" + aux[1] + "/" + aux2;
			return value;
		},

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

		_onLoadFields: function () {
			var that = this;
			oPedidosEnviar = [];
			oItensPedidoGrid = [];
			oPedidoGrid = [];
			oItensPedidoEnviar = [];
			oItensPedidoGridEnviar = [];

			var oModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().getModel("modelAux");
			this.getOwnerComponent().setModel(oModel, "modelCliente");

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

				var store = db.transaction("PrePedidos").objectStore("PrePedidos");
				store.openCursor().onsuccess = function (event) {
					var cursor = event.target.result;

					if (cursor) {
						if (cursor.value.idStatusPedido == 2) {
							oPedidoGrid.push(cursor.value);
						}
						cursor.continue();
					} else {
						oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
						that.getView().setModel(oModel, "PedidosEnviar");

						// var tx = db.transaction("ItensPedido", "readwrite");
						// var objItensPedido = tx.objectStore("ItensPedido");

						var store1 = db.transaction("ItensPedido").objectStore("ItensPedido");
						store1.openCursor().onsuccess = function (event1) {
							cursor = event1.target.result;

							if (cursor) {
								for (var j = 0; j < oPedidoGrid.length; j++) {
									if (cursor.value.nrPedCli == oPedidoGrid[j].nrPedCli) {
										oItensPedidoGrid.push(cursor.value);
									}
								}
								cursor.continue();
							}
						};
					}
				};
			};
		},

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

		onEnviarPedido: function (oEvent) {
			var that = this;

			var oModel = this.getView().getModel();
			oModel.setUseBatch(true);
			oModel.refreshSecurityToken();

			// oModel.attachRequestSent(function(e){
			//      console.error(e);
			//   });
			//  oModel.attachRequestCompleted(function(e){
			//      MessageBox.show("Pedido Enviado!", {
			// 		icon: MessageBox.Icon.SUCCESS,
			// 		title: "Pedido enviado!",
			// 		actions: [MessageBox.Action.OK],
			// 	});
			// });
			// oModel.attachRequestFailed(function(e){
			//      console.error(e);
			// });
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

				var repres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

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
						Erdat: String(oPedidosEnviar[i].dataImpl.substr(6, 4) + oPedidosEnviar[i].dataImpl.substr(3, 2) + oPedidosEnviar[i].dataImpl.substr(
							0, 2)),
						Horaped: String(oPedidosEnviar[i].dataImpl.substr(11, 2) + oPedidosEnviar[i].dataImpl.substr(14, 2) + oPedidosEnviar[i].dataImpl
							.substr(17, 2)),
						Valorcomissao: String(oPedidosEnviar[i].valComissaoPedido),
						Obsped: oPedidosEnviar[i].observacaoPedido,
						Obsaudped: oPedidosEnviar[i].observacaoAuditoriaPedido,
						Existeentradapedido: String(oPedidosEnviar[i].existeEntradaPedido),
						Percentradapedido: String(oPedidosEnviar[i].percEntradaPedido),
						Valorentradapedido: String(oPedidosEnviar[i].valorEntradaPedido),
						Inco1: String(oPedidosEnviar[i].tipoTransporte),
						Diasprimeiraparcela: String(oPedidosEnviar[i].diasPrimeiraParcela),
						Quantparcelas: String(oPedidosEnviar[i].quantParcelas),
						Intervaloparcelas: String(oPedidosEnviar[i].intervaloParcelas),
						Tiponego: String(oPedidosEnviar[i].tipoNegociacao)
					};

					oModel.create("/InserirOV", objPedido, {
						method: "POST",
						success: function (data) {

							var tx = db.transaction("PrePedidos", "readwrite");
							var objItensPedido = tx.objectStore("PrePedidos");

							var requestPrePedidos = objItensPedido.get(data.Nrpedcli);

							requestPrePedidos.onsuccess = function (e) {
								var oPrePedido = e.target.result;

								oPrePedido.idStatusPedido = 3;
								oPrePedido.situacaoPedido = "FIN";

								var requestPutItens = objItensPedido.put(oPrePedido);

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
											oModel = new sap.ui.model.json.JSONModel();
											that.getView().setModel(oModel, "PedidosEnviar");

											oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
											that.getView().setModel(oModel, "PedidosEnviar");
										}
									});
								};
							};
						},
						error: function (error) {
							that.onMensagemErroODATA(error.statusCode);
						}
					});
				}

				for (var j = 0; j < oItensPedidoGrid.length; j++) {

					var objItensPedido = {
						Iditempedido: String(oItensPedidoGrid[j].idItemPedido),
						Tindex: oItensPedidoGrid[j].index,
						Knumh: String(oItensPedidoGrid[j].knumh),
						Knumhextra: String(oItensPedidoGrid[j].knumhExtra),
						Konda: String(oItensPedidoGrid[j].konda),
						Kondmextra: String(oItensPedidoGrid[j].kondmExtra),
						Kondm: String(oItensPedidoGrid[j].kondm),
						Kondaextra: String(oItensPedidoGrid[j].kondaExtra),
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
						Length: String(oItensPedidoGrid[j].length)
					};

					oModel.create("/InserirLinhaOV", objItensPedido, {
						method: "POST",
						success: function (data) {
							console.info("Itens Inserido");

						},
						error: function (error) {
							that.onMensagemErroODATA(error.statusCode);
						}
					});
				}

				oModel.submitChanges();

			};

		},

		onMontarCabecalho: function (that, idPedido, dadosPedidoCab) {

		},

		onMontarLinha: function () {

		},

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

	});
});