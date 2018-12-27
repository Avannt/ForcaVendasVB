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
		
		fValMonetario: function(fnValue){
			return parseFloat(fnValue).toFixed(2).toString().replace('.', ',');
		},

		formatRentabilidade: function(Value) {
			if (Value > -3) {
				this.byId("table_relatorio_pedidos").getColumns()[6].setVisible(false);
				return "";

			} else {
				this.byId("table_relatorio_pedidos").getColumns()[6].setVisible(true);
				return Value;
			}
		},

		myFormatterCodEmpresa: function(value) {

			if (value == 1) {
				value = "Pred.";
				return value;
			}
			if (value == 2) {
				value = "SóFruta";
				return value;
			}
			if (value == 3) {
				value = "Stella";
				return value;
			}
			// if (value == 5) {
			// 	value = "";
			// 	return value;
			// }
			if (value == 6) {
				value = "Minas";
				return value;
			}
		},

		myFormatterDataImp: function(value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {
				var aux = value.split("/");
				// var aux2 = aux[2].substring(2, aux[2].length);
				// value = aux[0] + "/" + aux[1] + "/" + aux2;
				aux = aux[0] + "/" + aux[1];
				return aux;
			}
		},

		// myFormatterDataImp: function(value) {

		// 	if (value !== undefined && value !== null && value !== "" && value !== 0) {
		// 		var aux = value.split("/");
		// 		var ano = aux[2];
		// 		ano = ano.substring(2, 4);
		// 		// var aux2 = aux[2].substring(2, aux[2].length);
		// 		// value = aux[0] + "/" + aux[1] + "/" + aux2;
		// 		value = aux[0] + "/" + aux[1] + "/" + aux[2];
		// 		return value;
		// 	}
		// },

		handleChange: function(oEvent) {
			var oDP = oEvent.getSource();
			var sValue = oEvent.getParameter("value");
			var bValid = oEvent.getParameter("valid");
			// this.byId("DP6").setValue(sValue);

			if (bValid) {
				oDP.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDP.setValueState(sap.ui.core.ValueState.Error);
			}

			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Erdat", sap.ui.model.FilterOperator.Contains, sValue)];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_relatorio_pedidos").getBinding("items").filter(aFilters, "Application");

		},

		myFormatterEmp: function(value) {
			if (value !== undefined && value !== null && value !== "") {
				if (value == 1) {
					return "Pred.-SoFruta";
				} else if (value == 2) {
					return "Stella";
				} else if (value == 3) {
					return "Minas";
				}
			}
		},

		_onLoadFields: function() {
			var that = this;
			var oclientes = [];
			oPrePedidoRelatorio = [];
			this.byId("DP6").setValue();
			this.byId("idClientesRelatorio").setValue();
			this.byId("table_relatorio_pedidos").setBusy(true);
			this.byId("idClientesRelatorio").setBusy(true);
			this.byId("table_relatorio_pedidos").setGrowingTriggerText("Próximo >>>");
			var IdBase = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
			this.getView().getModel("modelAux");
			this.getOwnerComponent().setModel(oModel, "modelCliente");

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

				var store = db.transaction("StatusPedidos").objectStore("StatusPedidos");
				store.openCursor().onsuccess = function(event1) {
					var cursor1 = event1.target.result;
					if (cursor1 !== null) {
						if (cursor1.value.IdBase === IdBase) {
							
							cursor1.value.pathImg = sap.ui.require.toUrl("testeui5/img/") + cursor1.value.Aprovado + ".png ";                         
							oPrePedidoRelatorio.push(cursor1.value);
						}
						cursor1.continue();

					} else {
						//CARREGA OS CAMPOS DO LOCAL DE ENTREGA
						store = db.transaction("Clientes").objectStore("Clientes");
						store.openCursor().onsuccess = function(event) {
							var cursor = event.target.result;
							if (cursor) {
								if (cursor.value.IdBase === IdBase) {
									oclientes.push(cursor.value);
								}
								cursor.continue();
							} else {
								for (var a = 0; a < oPrePedidoRelatorio.length; a++) {
									for (var b = 0; b < oclientes.length; b++) {
										if (oPrePedidoRelatorio[a].CodCliente == oclientes[b].CodCliente) {
											oPrePedidoRelatorio[a].NomeCliente = oclientes[b].NomeAbrev;
										}
									}
								}
								that.byId("idClientesRelatorio").setBusy(false);
								oModel = new sap.ui.model.json.JSONModel(oclientes);
								that.getView().setModel(oModel, "cliRelatorio");
								oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorio);
								that.getView().setModel(oModel, "pedidoRelatorio");
								that.byId("table_relatorio_pedidos").setBusy(false);
							}
						};
					}
				};

			};
		},

		_handleValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("CodCliente", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("NomeEmit", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("idClientesRelatorio").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClientesRelatorio").suggest();
		},

		onItemChange: function() {
			var that = this;
			oPrePedidoRelatorio = [];
			var oPrePedidoRelatorioAux = [];
			var fValue = this.byId("idClientesRelatorio").getValue();
			var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

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

				//CARREGA OS CAMPOS DO LOCAL DE ENTREGA
				var store = db.transaction("StatusPedidos").objectStore("StatusPedidos");
				store.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor != null) {

						if (cursor.value.Kunnr == fValue) {
							oPrePedidoRelatorio.push(cursor.value);
						}
						if (cursor.value.NameOrg1.toUpperCase().includes(fValue.toUpperCase())) {
							oPrePedidoRelatorio.push(cursor.value);
						}
						if (fValue == "") {
							oPrePedidoRelatorioAux.push(cursor.value);
						}
						cursor.continue();
					}
					if (oPrePedidoRelatorioAux.length > 0) {
						var oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorioAux);
						that.getView().setModel(oModel, "pedidoRelatorio");

					} else {
						oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorio);
						that.getView().setModel(oModel, "pedidoRelatorio");

					}
				};
			};
		},

		onSelectionChange: function(oEvent) {
			var that = this;
			var open = indexedDB.open("VB_DataBase");
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("pedidoRelatorio").getProperty("NrPedcli");
			var variavelCodigoCliente = oItem.getBindingContext("pedidoRelatorio").getProperty("CodCliente");
			that.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", nrPedCli);

			open.onerror = function() {
				console.log("não foi possivel encontrar e/ou carregar a base de clientes");
			};

			open.onsuccess = function(e) {
				var db = e.target.result;

				that.carregaModelCliente(variavelCodigoCliente, db);
				sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
				that.checkOnline(db);
			};

		},

		carregaModelCliente: function(variavelCodigoCliente, db) {
			var that = this;

			var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

			var store = db.transaction("Clientes").objectStore("Clientes");
			//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
			store.openCursor().onsuccess = function(event) {
				// consulta resultado do event
				var cursor = event.target.result;
				if (cursor) {
					if (cursor.value.CodCliente == variavelCodigoCliente && cursor.value.IdBase == IdBase) {
						var nome = (cursor.value.NomeEmit);
						// that.getOwnerComponent().getModel("modelAux").setProperty("/userID", cursor.value.CodigoRepresentante);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoRepresentante", cursor.value.CodigoRepresentante);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente", cursor.value.CodCliente);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCliente", nome);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeAbrevCliente", cursor.value.NomeAbrev);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCidadeCliente", cursor.value.Cidade);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/cepCliente", cursor.value.CEP);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/matrizCliente", cursor.value.Matriz);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/estadoCliente", cursor.value.Estado);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/cnpjCliente", cursor.value.CNPJ);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailCliente", cursor.value.Email);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailContasCliente", cursor.value.Email_ContasPagar);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailXMLCliente", cursor.value.Email_XML);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/snCliente", cursor.value.SN);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/statusCreditoCliente", cursor.value.StatusCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/enderecoCliente", cursor.value.Endereco);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/telefoneCliente", cursor.value.Telefone);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataCadastroCliente", cursor.value.DataCadastro);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/limiteCreditoCliente", cursor.value.LimiteCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/canalVendaCliente", cursor.value.CanalVenda);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoEstadualCliente", cursor.value.InscricaoEstadual);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoAuxSubsTribCliente", cursor.value.InscricaoAuxSubsTrib);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/grupoCliente", cursor.value.Grupo);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoSuframaCliente", cursor.value.CodigoSuframa);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataLimiteCreditoCliente", cursor.value.DataLimiteCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/valorUltimoTituloNFCliente", cursor.value.valorUltimoTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/valorMaiorTituloNFCliente", cursor.value.ValorMaiorTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/microrregiaoCliente", cursor.value.Microrregiao);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/faturarSaldoCliente", cursor.value.FaturaParcial);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataMaiorTituloNFCliente", cursor.value.DataMaiorTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataUltimoTituloNFCliente", cursor.value.DataUltimoTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/DataVigenciaInscSTCliente", cursor.value.DataVigenciaInscST);
					}
					cursor.continue();
				}
			};
		},

		// onDataExport: sap.m.Table.prototype.exportData || function(oEvent) {

		// 	var oModel = new sap.ui.model.json.JSONModel(oPrePedidoRelatorio);
		// 	this.getView().setModel(oModel);

		// 	var oExport = new sap.ui.core.util.Export({

		// 		// Type that will be used to generate the content. Own ExportType's can be created to support other formats
		// 		exportType: new sap.ui.core.util.ExportTypeCSV({
		// 			separatorChar: ";"
		// 		}),

		// 		// Pass in the model created above
		// 		models: oModel,
		// 		// binding information for the rows aggregation
		// 		rows: {
		// 			path: "/"
		// 		},

		// 		// column definitions with column name and binding info for the content

		// 		columns: [{
		// 			name: "Nº Pedido",
		// 			template: {
		// 				content: "{CodCliente}"
		// 			}
		// 		},{
		// 			name: "Nº Pedido",
		// 			template: {
		// 				content: "{NrPedcli}"
		// 			}
		// 		}, {
		// 			name: "Dt Implant.",
		// 			template: {
		// 				content: "{DatImpl}"
		// 			}
		// 		}, {
		// 			name: "Total Pedido",
		// 			template: {
		// 				content: "{ValTotPed}"
		// 			}
		// 		}, {
		// 			name: "Status",
		// 			template: {
		// 				content: "{DescStatus}"
		// 			}
		// 		}]
		// 	});

		// 	// download exported file
		// 	oExport.saveFile().catch(function(oError) {
		// 		MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
		// 	}).then(function() {
		// 		oExport.destroy();
		// 	});
		// }
	});
});