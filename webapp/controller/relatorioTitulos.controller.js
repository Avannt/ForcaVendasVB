sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/m/MessageBox",
	"testeui5/model/formatter",
	"sap/ui/core/mvc/Controller",
	"sap/m/TablePersoController",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/model/json/JSONModel"

], function(BaseController, MessageBox, Controller) {
	"use strict";
	var oDuplicataRelatorio = [];

	return BaseController.extend("testeui5.controller.relatorioTitulos", {

		onInit: function() {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioTitulos").attachPatternMatched(this._onLoadFields, this);
		},

		_handleValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("CodCliente", sap.ui.model.FilterOperator.StartsWith, sValue), new sap.ui.model.Filter(
				"NomeEmit", sap.ui.model.FilterOperator.Contains, sValue)];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("idClientesRelatorio").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClientesRelatorio").suggest();
		},

		myFormatterDataImp: function(value) {

			if (value !== undefined && value !== null && value !== "") {
				var aux = value.split("/");
				var ano = aux[2];
				ano = ano.substring(2, 4);
				// var aux2 = aux[2].substring(2, aux[2].length);
				// value = aux[0] + "/" + aux[1] + "/" + aux2;
				value = aux[0] + "/" + aux[1] + "/" + ano;
				return value;
			}
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
			var oClientes = [];
			var oTitulos = [];
			oDuplicataRelatorio = [];
			this.byId("idtableTitulos").setGrowingTriggerText("Próximo >>>");
			this.byId("idClientesRelatorio").setValue("");
			this.byId("idtableTitulos").setBusy(true);

			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
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
				var sTitulos = db.transaction("TitulosAbertos").objectStore("TitulosAbertos");
				var sClientes = db.transaction("TitulosAbertos").objectStore("TitulosAbertos");

				sClientes.getAll().onsuccess = function(event) {
					oClientes = event.target.result;
				};
			};
		},

		onItemChange: function() {
			var that = this;
			oDuplicataRelatorio = [];
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

				var store = db.transaction("DuplicataCliente").objectStore("DuplicataCliente");
				//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
				store.openCursor().onsuccess = function(event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.CodCliente == fValue && cursor.value.IdBase == IdBase) {
							oDuplicataRelatorio.push(cursor.value);

						}
						cursor.continue();

					} else {
						var oModel = new sap.ui.model.json.JSONModel(oDuplicataRelatorio);
						that.getView().setModel(oModel);
						that.getOwnerComponent().getModel("modelAux").setProperty("/CodCliente", "");
					}
				};
			};
		}

		// onDataExport: sap.m.Table.prototype.exportData || function() {
		// 	var oModel = new sap.ui.model.json.JSONModel(oDuplicataRelatorio);
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
		// 				content: "{CodTitAcr}"
		// 			}
		// 		}, {
		// 			name: "Dt' Emissao",
		// 			template: {
		// 				content: "{DatEmisDocto}"
		// 			}
		// 		}, {
		// 			name: "Dt Vencimento",
		// 			template: {
		// 				content: "{DatVenctoTitAcr}"
		// 			}
		// 		}, {
		// 			name: "Dias de atraso",
		// 			template: {
		// 				content: "{DiasAtraso}"
		// 			}
		// 		}, {
		// 			name: "Valor Orginal",
		// 			template: {
		// 				content: "{ValOriginTitAcr}"
		// 			}
		// 		}, {
		// 			name: "Juros",
		// 			template: {
		// 				content: "{ValSdoTitAcr}"
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