/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function(BaseController, jQuery, Controller, formatter) {
	"use strict";

	return BaseController.extend("testeui5.controller.produtoConsultas", {

		onInit: function() {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("produtoConsultas").attachPatternMatched(this._onCreateModel, this);
		},

		_onCreateModel: function() {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				console.log(open.error.mensage);
			};

			open.onsuccess = function() {
				var db = open.result;
				
				var objectStore = db.transaction("A963", "readonly").objectStore("A963"); // Chave default
				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function(event) {
						var vetorTabPreco = [];
						vetorTabPreco = event.target.result;
						
						var oModel = new sap.ui.model.json.JSONModel(vetorTabPreco);
						that.getView().setModel(oModel, "tabPreco");
					};
				}
			};
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onPressDetailBack: function() {
			this.byId("list").removeSelections(true);
			this.getSplitContObj().backDetail();
		},
		
		onChangeTabelaPreco: function(oEvent){
			var that = this;
			var tabnorm = oEvent.getSource().getSelectedKey();
			var werks = this.getOwnerComponent().getModel("modelAux").getProperty("/Werks");
			var tabbri = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
			var tabamo = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
			var tabbon = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;
			
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				console.log(open.error.mensage);
			};

			open.onsuccess = function() {
				var db = open.result;
				
				var promise = new Promise(function(resolve, reject) {
					//Busca o preço do item
					var objectStore = db.transaction("Materiais", "readonly").objectStore("Materiais"); // Chave default
					if ("getAll" in objectStore) {
						objectStore.getAll().onsuccess = function(event) {
							var vetorProdutos = [];
							vetorProdutos = event.target.result;
							
							var oModel = new sap.ui.model.json.JSONModel(vetorProdutos);
							that.getView().setModel(oModel, "consultasProdutos");
							
							resolve(vetorProdutos);
						};
					}
				});
				
				promise.then(function(vetorProdutos) {
					
					var storeA960 = db.transaction("A960", "readwrite");
					var objA960 = storeA960.objectStore("A960");
					var itemPreco = [];
					var idA960 = "";
					var tabPreco = "";
					
					for(var i=0; i<vetorProdutos.length; i++){
						
						if(vetorProdutos[i].mtpos == "YBRI"){
							tabPreco = tabbri;
						} else if(vetorProdutos[i].mtpos == "YBON"){
							tabPreco = tabbon;
						} else if(vetorProdutos[i].mtpos == "YAMO"){
							tabPreco = tabamo;
						} else{
							tabPreco = tabnorm;
						}
						
						idA960 = werks + "." + tabPreco + "." + vetorProdutos[i].matnr;
						
						var requesA960 = objA960.get(idA960);
						
						requesA960.onsuccess = function(e) {
							var oA960 = e.target.result;
							
							if(oA960 != undefined){
								for(var j=0; j<vetorProdutos.length; j++){
									
									if(vetorProdutos[j].matnr == oA960.matnr){
										
										vetorProdutos[j].zzVprod = oA960.zzVprod;
										
										itemPreco.push(vetorProdutos[j]);
									}
								}
								
								var oModel = new sap.ui.model.json.JSONModel(itemPreco);
								that.getView().setModel(oModel, "consultasProdutos");
							}
						};
					}
				});
			};
		},
		
		onSelectionChange: function(oEvent) {
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
			var oFilter = [new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];
			
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("tableProdutos").getBinding("items").filter(aFilters, "Application");
		},
		
		onPressModeBtn: function(oEvent) {
			var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();
			
			this.getSplitContObj().setMode(sSplitAppMode);
		},
		
		getSplitContObj: function() {
			var result = this.byId("SplitContDemoProdutos");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		}
	});
});