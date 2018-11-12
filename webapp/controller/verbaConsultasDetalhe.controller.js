sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/routing/History"
], function(BaseController, History) {
	"use strict";

	return BaseController.extend("testeui5.controller.verbaConsultasDetalhe", {

		onInit: function(oEvent) {

			this.getRouter().getRoute("verbaConsultasDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		onAfterRendering: function() {

		
		},

		onNavBack: function(oEvent) {

			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("clienteConsultas", {}, true);
			}
			// sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
		},
		
		_onLoadFields: function() {
			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
			// this.getOwnerComponent().setModel(oModel, "modelAux");
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			
			//carrega os dados do Clinte Consultas pelo model Verba
			//var codigoEmp = this.getOwnerComponent().getModel("modelVerba").getProperty("/idEmpresaVerba");

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			//seta os dados da objectHeader
			this.getView().byId("idCodigoCliente").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/idUsuarioVerba"));
			this.getView().byId("idNomeEmpresa").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/nomeEmpresaVerba"));
			this.getView().byId("idPeriodo").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/dataLancamentoVerba"));
			this.getView().byId("idVerbaInicial").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/verbaInicialVerba"));
			this.getView().byId("idDebito").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/valorDebitoVerba"));
			this.getView().byId("idCredito").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/valorCreditoVerba"));
			this.getView().byId("idVerbaFinal").setValue(this.getOwnerComponent().getModel("modelVerba").getProperty("/VerbaFinalVerba"));

			//>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Carregar a tabela de transações >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
			var oItemVerbas = [];
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				alert(open.error.mensage);
			};

			open.onsuccess = function() {
				var db = open.result;
				var store = db.transaction("TabelaMovimentacao").objectStore("TabelaMovimentacao");

				// var tx = db.transaction("Produtos", "read");
				// oItemTemplate = tx.objectStore("Verbas");
				var codEmpresa = that.getOwnerComponent().getModel("modelVerba").getProperty("/idEmpresaVerba");
				var iDUsuario = that.getOwnerComponent().getModel("modelVerba").getProperty("/idUsuarioVerba");
				
				store.openCursor().onsuccess = function(event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.CodEmpresa == codEmpresa && cursor.value.CodRepres == iDUsuario){
							
							oItemVerbas.push(cursor.value);
						}
						cursor.continue();
					}
					else {
						for(var i =0; i<oItemVerbas.length; i++){
							var Data = oItemVerbas[i].Data; 
							var Hora = oItemVerbas[i].Hora;
							var Tipo = oItemVerbas[i].Tipo;
							
							var Dia = Data.substr(0,2);
							var Mes = Data.substr(3,2);
							var Ano = Data.substr(8,2);
							var DataCheia = Dia + "/" + Mes + "/" + Ano;
							
							oItemVerbas[i].Tipo = Tipo.substr(0,3); 
							oItemVerbas[i].Data = DataCheia;
							oItemVerbas[i].Hora = Hora.substr(0,5);
						}
						oModel = new sap.ui.model.json.JSONModel(oItemVerbas);
						that.getView().setModel(oModel);
					}
				};
			};
		}
	});
});