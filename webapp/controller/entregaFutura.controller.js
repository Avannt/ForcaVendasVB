sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (jQuery, MessageToast, Fragment, BaseController, Filter, FilterOperator, MessageBox) {
	"use strict";
	var vetorCliente = [];
	var oItensEF = [];
	var oPedEF = [];
	var oSF;
	
	return BaseController.extend("testeui5.controller.entregaFutura", {

		onInit: function () {
			this.getRouter().getRoute("entregaFutura").attachPatternMatched(this._onLoadFields, this);
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

		onNavBack2: function () {
			var isTablet = this.getOwnerComponent().getModel("modelAux").getProperty("/isTablet");

			if (isTablet == true) {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			} else {
				// this.byId("table_pedidos").clearSelection();
				this.byId("listClientes").removeSelections(true);
				this.onPressDetailBack();
			}
		},
		/* Fim navBack2*/

		onPressDetailBack: function () {
			this.getSplitContObj().backDetail();
			// this.getView().byId("ObjListCliente").removeSelections(true);
			// this.byId("ObjListCliente").setProperty("/selected", false);
		},
		/* Fim onPressDetailBack*/

		onSearch: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("kunnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			//oEvent.getSource().getBinding("items").filter(aFilters, "Application");
			this.byId("listClientes").getBinding("items").filter(aFilters, "Application");
		},
		/* Fim onSearch*/

		onExit: function () {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},
		/* Fim onExit*/

		_onLoadFields: function () {
			var that = this;
			oSF = this.byId("sfItem");
			
			this.getView().byId("objectHeader").setTitle();
			this.getView().byId("objectHeader").setNumber();
			this.getView().byId("objectAttribute_cnpj").setText();

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				var transaction = db.transaction("Clientes", "readonly");
				var objectStore = transaction.objectStore("Clientes");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function (event) {
						vetorCliente = event.target.result;

						var oModel = new sap.ui.model.json.JSONModel(vetorCliente);
						that.getView().setModel(oModel, "clientesCadastrados");
					};

				}
			};
		},
		/*Fim _onLoadFields */

		onSelectionChange: function (oEvent) {
			var that = this;
			oItensEF = [];
			oPedEF = [];

			//filtra somente os pedidos do cliente e vai pra detail
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			//seta os dados da objectHeader
			this.getView().byId("objectHeader").setTitle(oItem.getTitle());
			this.getView().byId("objectHeader").setNumber(oItem.getNumber());
			this.getView().byId("objectAttribute_cnpj").setText(oItem.getIntro());
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", oItem.getNumber());
			this.getSplitContObj().toDetail(this.createId("detail"));

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;
				var promise = new Promise(function (resolve, reject) {
					that.carregaModelCliente(db, resolve, reject);
				});

				promise.then(function () {
					var transactionPedEF = db.transaction("EntregaFutura", "readonly");
					var objectStorePedEF = transactionPedEF.objectStore("EntregaFutura");
					var iVbeln = objectStorePedEF.index("Vbeln");

					/* Cursor para percorrer todos os registros de ENTREGA FUTURA */
					// objectStorePedEF.openCursor().onsuccess = function (event) {
					// 	var cursor = event.target.result;

					// 	if (cursor) {
					// 		if (cursor.value.kunnr == that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr")) {
					// 			oItensEF.push(cursor.value);
					// 		}

					// 		cursor.continue();

					// 	} else {
					// 		var oModel = new sap.ui.model.json.JSONModel(oItensEF);

					// 		that.getView().setModel(oModel, "pedidosCadastrados");
					// 	}
					// };/* Fim do cursor ENTREGA FUTURA */

					/* Cursor para percorrer todos os PEDIDOS ÚNICOS EF */
					iVbeln.openCursor(undefined, "nextunique").onsuccess = function (event) {
						var cursor = event.target.result;

						if (cursor) {
							if (cursor.value.Kunrg === oItem.getNumber()) {
								oPedEF.push(cursor.value);
							}
							cursor.continue();
						} else {
							var oModel = new sap.ui.model.json.JSONModel(oPedEF);
							that.getView().setModel(oModel, "PedidosEF");
						}
					}; /* Fim do cursor PEDIDOS ÚNICOS EF */

				});
			};
		},
		/*Fim onSelectionChange */

		getSplitContObj: function () {
			var result = this.byId("SplitContDemo2");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		},
		/*Fim getSplitContObj*/

		carregaModelCliente: function (db, resolve, reject) {
			var that = this;

			var codCliente = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			var tx = db.transaction("Clientes", "readwrite");
			var objClientes = tx.objectStore("Clientes");

			var request = objClientes.get(codCliente);

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
		/* Fim carregaModelCliente */

		onSelectDialogPress: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("testeui5.view.Dialog", this);
			}
			
			oSF.setValue('');
			var oModel = this.getView().getModel("PedidosEF");

			this._oDialog.setModel(oModel, "PedidosEF");
			this._oDialog.setMultiSelect(false);
			this._oDialog.setShowClearButton(true);
			this._oDialog.setGrowing(true);

			// Limpa o filtro da pesquisa antigo
			this._oDialog.getBinding("items").filter([]);

			// Alternar o estilo compacto (toggle compact style)
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},
		/* Fim onSelectDialogPress */

		onDialogClose: function (oEvent) {
			var that = this;
			var aContexts = oEvent.getParameter("selectedContexts");
			
			oItensEF = [];
			if (aContexts && aContexts.length) {
				var iVbeln = aContexts[0].getObject().Vbeln;
				
				that.getView().byId("ifVbeln").setValue(iVbeln);
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function () {
					MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function () {
					var db = open.result;
					var transactionPedEF = db.transaction("EntregaFutura", "readonly");
					var objectStorePedEF = transactionPedEF.objectStore("EntregaFutura");
					var keyRangeValue = IDBKeyRange.only(iVbeln);
					var ixVbeln = objectStorePedEF.index("Vbeln");
					
					var request = ixVbeln.openCursor(keyRangeValue);
					
					request.onsuccess = function(event){
						var cursor = event.target.result;
						
						if ( cursor ) {
							oItensEF.push(cursor.value);
							cursor.continue();
						} else {
							var oModel = new sap.ui.model.json.JSONModel(oItensEF);
							that.getView().setModel(oModel, "ItensEF");
						}
					};
					
					request.onerror = function(event){
						MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
							icon: MessageBox.Icon.ERROR,
							title: "Banco não encontrado!",
							actions: [MessageBox.Action.OK]
						});
					};
				};
			} else {
				oItensEF = [];
				var oModel = new sap.ui.model.json.JSONModel(oItensEF);
				that.getView().setModel(oModel, "ItensEF");
				
				MessageToast.show("Nenhum item foi selecionado.");
			}
		},
		/* Fim onDialogClose */

		onDialogSearch: function (oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			var oFilter = [new Filter("Vbeln", sap.ui.model.FilterOperator.Contains, sValue),
				new Filter("NameOrg1", sap.ui.model.FilterOperator.Contains, sValue)
			];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);

			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters, "Application");
		},
		/* Fim onDialogSearch */

		sfItemSearch: function (oEvent) {
			// var item = oEvent.getParameter("suggestionItem");
			// if (item) {
			// 	sap.m.MessageToast.show("Procurar por: " + item.getText());
			// }
		},
		/* Fim sfItemSearch */

		sfItemSuggest: function (oEvent) {
			var value = oEvent.getParameter("suggestValue");
			var filters = [];
			if (value) {
				filters = [
					new sap.ui.model.Filter([
						new sap.ui.model.Filter("Matnr", function(sText) {
							return (sText || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
						}),
						new sap.ui.model.Filter("Arktx", function(sDes) {
							return (sDes || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
						})
					], false)
				];
			}

			oSF.getBinding("suggestionItems").filter(filters);
			oSF.suggest();		
		},
		/* Fim sfItemSuggest */
		
		onInserirItemPress: function (oEvent){
			var iVbeln = 0;
			var iKunrg = 0;
			var sMatnr = 0;
			var iQuantidade = 0;
			
			iKunrg = this.getView().byId("objectHeader").getNumber();
			iVbeln = this.getView().byId("ifVbeln").getValue();
			sMatnr = this.getView().byId("sfItem").getValue();
			iQuantidade = this.getView().byId("ifQtde").getValue(); 
		}
		/* Fim onInserirItemPress */
	});
});