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
			console.log(oItensPedidoGrid);
			console.log(oPedidoGrid);
			oPedidosEnviar = [];
			oItensPedidoGrid = [];
			oItensPedidoEnviar = [];

			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("PedidosEnviar").getProperty("NrPedcli");
			that.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", nrPedCli);

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
				var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

				var store = db.transaction("PrePedidos", "readwrite").objectStore("PrePedidos");
				store.openCursor().onsuccess = function (event) {
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.IdBase == IdBase && cursor.value.idStatus == 2 && cursor.value.NrPedcli == nrPedCli) {
							oPedidosEnviar.push(cursor.value);
						}
						cursor.continue();
					}
				};

				var store1 = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
				store1.openCursor().onsuccess = function (event) {
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.IdBase == IdBase && cursor.value.NrPedcli == nrPedCli) {
							oItensPedidoEnviar.push(cursor.value);
						}
						cursor.continue();
					}
				};
			};
		},

		onEnviarPedido: function (oEvent) {
			var objPedido = {
				Nrpedcli: "1",
				Idstatuspedido: "",
				Kunnr: "",
				Werks: "1",
				Lifnr: "",
				Auart: "",
				Situacaopedido: "",
				Ntgew: "1",
				Brgew: "1",
				Dataentrega: "16/11/2018",
				Pltyp: "",
				Completo: "",
				Valminped: "",
				Erdat: "",
				Horaped: "",
				Valorcomissao: "",
				Obsped: "",
				Obsaudped: "",
				Existeentradapedido: "",
				Percentradapedido: "",
				Valorentradapedido: "",
				Inco1: "",
				Diasprimeiraparcela: "",
				Quantparcelas: "",
				Intervaloparcelas: "",
				Tiponego: ""
			};
			var oModel = this.getView().getModel();

			oModel.create("/InserirOV", objPedido, {
				success: function (data) {
					MessageBox.show("Pedido Enviado!", {
						icon: MessageBox.Icon.SUCCESS,
						title: "Pedido enviado!",
						actions: [MessageBox.Action.OK],
					});
				},
				error: function (data) {
					MessageBox.show("Verificar sistema!", {
						icon: MessageBox.Icon.ERROR,
						title: "Verificar sistema!",
						actions: [MessageBox.Action.OK],
					});

				}
			});
		}
	});
});