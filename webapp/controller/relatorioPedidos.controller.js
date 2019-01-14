/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"testeui5/model/formatter",
	"sap/ui/model/Filter"

], function(BaseController, Filter, MessageBox) {
	"use strict";
	var oPrePedidoRelatorio = [];
	var ajaxCall;
	return BaseController.extend("testeui5.controller.relatorioPedidos", {

		onInit: function() {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioPedidos").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function() {

			var that = this;
			var oclientes = [];
			oPrePedidoRelatorio = [];
			this.byId("table_relatorio_pedidos").setBusy(true);
			var tipoAprovador = that.getOwnerComponent().getModel("modelAux").getProperty("/TipoAprovador");
			var CodRepres = that.getView().getModel("modelAux").getProperty("/CodRepres");
		
			var usrped = that.getOwnerComponent().getModel("modelAux").getProperty("/Usrped");
			var usrapr = that.getOwnerComponent().getModel("modelAux").getProperty("/Usrapr");
			
			var oModel = this.getView().getModel();
			this.getView().getModel("modelAux");
			
			var open1 = indexedDB.open("VB_DataBase");
			
			open1.onerror = function() {
				MessageBox.show(open1.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open1.onsuccess = function() {
				var db = open1.result;
				
				if (usrped == true) {
					
					var store = db.transaction("StatusPedidos").objectStore("StatusPedidos");
					store.openCursor().onsuccess = function(event1) {
						var cursor1 = event1.target.result;
						
						if (cursor1 !== null) {
							
							cursor1.value.pathImg = sap.ui.require.toUrl("testeui5/img/") + cursor1.value.Aprovado + ".png ";
							oPrePedidoRelatorio.push(cursor1.value);
							
							cursor1.continue();
							
						} else {
							
							//CARREGA OS CAMPOS DO LOCAL DE ENTREGA
							store = db.transaction("Clientes").objectStore("Clientes");
							store.openCursor().onsuccess = function(event) {
								var cursor = event.target.result;
								if (cursor) {
									
									oclientes.push(cursor.value);
									
									cursor.continue();
								} else {
									
									for (var a = 0; a < oPrePedidoRelatorio.length; a++) {
										for (var b = 0; b < oclientes.length; b++) {
											if (oPrePedidoRelatorio[a].CodCliente == oclientes[b].CodCliente) {
												oPrePedidoRelatorio[a].NomeCliente = oclientes[b].NomeAbrev;
											}
										}
									}
									
									oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorio);
									that.getView().setModel(oModel, "pedidoRelatorio");
									
									that.byId("table_relatorio_pedidos").setBusy(false);
								}
							};
						}
					};

				} else if (usrapr == true) {

					oModel.read("/AcompPedidos", {
						urlParameters: {
							"$filter": "IRepres eq '" + CodRepres + "'"
						},
						success: function(retornoAcompPedidos) {
							
							var txAcompPedidos = db.transaction("StatusPedidos", "readwrite");
							var objAcompPedidos = txAcompPedidos.objectStore("StatusPedidos");

							for (var i = 0; i < retornoAcompPedidos.results.length; i++) {
								
								var data = retornoAcompPedidos.results[i].Nrpedcli.split(".");
								data = data[1];
								data = data.substring(6,8) + "/" + data.substring(4,6) + "/" + data.substring(0,4);
								
								var objBancoAcompPedidos = {
									idStatusPedido: retornoAcompPedidos.results[i].Nrpedcli,
									Nrpedcli: retornoAcompPedidos.results[i].Nrpedcli,
									Kunnr: retornoAcompPedidos.results[i].Kunnr,
									NameOrg1: retornoAcompPedidos.results[i].NameOrg1,
									Erdat: data,
									Aprov: retornoAcompPedidos.results[i].Aprov,
									AprovNome: retornoAcompPedidos.results[i].AprovNome,
									Valtotpedido: retornoAcompPedidos.results[i].Valtotpedido,
									Vlrexc: retornoAcompPedidos.results[i].Vlrexc,
									Aprovado: retornoAcompPedidos.results[i].Aprovado,
									PathImg: sap.ui.require.toUrl("testeui5/img/") + retornoAcompPedidos.results[i].Aprovado + ".png "
								};

								var sDescAprovado = "";

								switch (retornoAcompPedidos.results[i].Aprovado) {
									case "S":
										sDescAprovado = "Aprovado";
										break;
									case "R":
										sDescAprovado = "Reprovado";
										break;
									default:
										sDescAprovado = "Pendente";
								}

								objBancoAcompPedidos.AprovadoDesc = sDescAprovado;

								oPrePedidoRelatorio.push(objBancoAcompPedidos);
							}
							
							//CARREGA OS CAMPOS DO LOCAL DE ENTREGA
							store = db.transaction("Clientes").objectStore("Clientes");
							store.openCursor().onsuccess = function(event) {
								var cursor = event.target.result;
								if (cursor) {
									
									oclientes.push(cursor.value);
									
									cursor.continue();
								} else {
									
									for (var a = 0; a < oPrePedidoRelatorio.length; a++) {
										for (var b = 0; b < oclientes.length; b++) {
											if (oPrePedidoRelatorio[a].CodCliente == oclientes[b].CodCliente) {
												oPrePedidoRelatorio[a].NomeCliente = oclientes[b].NomeAbrev;
											}
										}
									}
									
									oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorio);
									that.getView().setModel(oModel, "pedidoRelatorio");
									
									that.byId("table_relatorio_pedidos").setBusy(false);
								}
							};
						},
						error: function(error) {
							console.log(error);
							that.onMensagemErroODATA(error.statusCode);
						}
					});
				}
			};
		},
		
		handleChange: function(oEvent) {

			var aFilters = [];
			var oDP = oEvent.getSource();
			var sValue = oEvent.getParameter("value");
			var bValid = oEvent.getParameter("valid");

			if (bValid) {
				oDP.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDP.setValueState(sap.ui.core.ValueState.Error);
			}

			var oFilter = [
				new sap.ui.model.Filter("Erdat", sap.ui.model.FilterOperator.EQ, sValue)
			];
			
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_relatorio_pedidos").getBinding("items").filter(aFilters, "Application");
			
		},

		onSearch: function(oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Namecli", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Namerep", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Nrpedcli", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_relatorio_pedidos").getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

		},

		myFormatterName: function(value) {

			if (value.length > 28) {

				return value.substring(0, 20) + "...";

			} else {

				return value;
			}
		},
		
	});
});