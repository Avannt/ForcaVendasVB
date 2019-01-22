/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function(BaseController, jQuery, Controller, formatter) {
	"use strict";

	return BaseController.extend("testeui5.controller.relatorioEnvSaldo", {

		onInit: function() {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("relatorioEnvSaldo").attachPatternMatched(this._onCreateModel, this);
		},

		_onCreateModel: function() {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				console.log(open.error.mensage);
			};

			open.onsuccess = function() {
				var db = open.result;
				var objectStore = db.transaction("EntregaFutura3", "readonly").objectStore("EntregaFutura3");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function(event) {
						var vetorEF = [];
						vetorEF = event.target.result;

						var oModel = new sap.ui.model.json.JSONModel(vetorEF);

						that.getView().setModel(oModel, "Envio");
					};
				}
			};
		},

		onLimparLog: function() {
			var that = this;
			
			sap.m.MessageBox.show("Deseja excluir o log?", {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: "Limpar Log",
				actions: ["Sim", "Cancelar"],
				onClose: function(oAction) {
					if (oAction == "Sim") {
						var open = indexedDB.open("VB_DataBase");
						open.onsuccess = function() {
							var db = open.result;
							var objectStore = db.transaction("EntregaFutura3", "readwrite").objectStore("EntregaFutura3");
							
							objectStore.clear();
							
							objectStore = db.transaction("EntregaFutura3", "readonly").objectStore("EntregaFutura3");

							if ("getAll" in objectStore) {
								objectStore.getAll().onsuccess = function(event) {
									var vetorEF = [];
									vetorEF = event.target.result;

									var oModel = new sap.ui.model.json.JSONModel(vetorEF);

									that.getView().setModel(oModel, "Envio");
								};
							}
						};
					}
				}
			});
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onPressDetailBack: function() {
			this.byId("list").removeSelections(true);
			this.getSplitContObj().backDetail();
		},

		onSelectionChange2: function(oEvent) {
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

			//seta os dados da objectHeader
			this.getView().byId("idCodigoProduto").setValue(oItem.getBindingContext("consultasProdutos").getProperty("ProdutoId"));
			this.getView().byId("idNomeProduto").setValue(oItem.getBindingContext("consultasProdutos").getProperty("Descricao"));
			this.getView().byId("idGrupoEstoque").setValue(oItem.getBindingContext("consultasProdutos").getProperty("GrupoEstoque"));
			this.getView().byId("idFamilia").setValue(oItem.getBindingContext("consultasProdutos").getProperty("Familia"));
			this.getView().byId("idClassificacaoFiscal").setValue(oItem.getBindingContext("consultasProdutos").getProperty(
				"ClassificacaoFiscal"));
			this.getView().byId("idUnidadeNegocio").setValue(oItem.getBindingContext("consultasProdutos").getProperty("UnidadeNegocio"));
			this.getView().byId("idPesoBruto").setValue(oItem.getBindingContext("consultasProdutos").getProperty("PesoBruto"));
			this.getView().byId("idPesoLiquido").setValue(oItem.getBindingContext("consultasProdutos").getProperty("PesoLiquido"));
			this.getView().byId("idValidade").setValue(oItem.getBindingContext("consultasProdutos").getProperty("DiasValidade"));
			this.getView().byId("idQuantidadeNoPallet").setValue(oItem.getBindingContext("consultasProdutos").getProperty("QtPallet"));
			this.getView().byId("idUnidadeMedida").setValue(oItem.getBindingContext("consultasProdutos").getProperty("UnidadeMedida"));
			this.getView().byId("idQuantidadeNaCaixa").setValue(oItem.getBindingContext("consultasProdutos").getProperty("QtCaixa"));
			this.getView().byId("idComprimento").setValue(oItem.getBindingContext("consultasProdutos").getProperty("Comprimento"));
			this.getView().byId("idAltura").setValue(oItem.getBindingContext("consultasProdutos").getProperty("Altura"));
			this.getView().byId("idLargura").setValue(oItem.getBindingContext("consultasProdutos").getProperty("Largura"));
			this.getView().byId("idCodigoEAN").setValue(oItem.getBindingContext("consultasProdutos").getProperty("CodigoEAN"));
			this.getView().byId("idCodigoDUN").setValue(oItem.getBindingContext("consultasProdutos").getProperty("CodigoDUN"));
			this.getView().byId("idPictureSrc").setSrc(oItem.getBindingContext("consultasProdutos").getProperty("ProdutoURL"));

			this.getSplitContObj().toDetail(this.createId("detailProdutos"));

		},

		onSearch: function(oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Arktx", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Arktx", sap.ui.model.FilterOperator.Contains, sValue),
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("tableProdutos").getBinding("items").filter(aFilters, "Application");
		},

		onPressModeBtn2: function(oEvent) {
			var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();

			this.getSplitContObj().setMode(sSplitAppMode);
			// MessageToast.show("Split Container mode is changed to: " + sSplitAppMode, {duration: 5000});
		},

		getSplitContObj2: function() {
			var result = this.byId("SplitContDemoProdutos");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		}

	});

});