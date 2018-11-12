sap.ui.define([
	"jquery.sap.global",
	"testeui5/controller/BaseController",
	"testeui5/model/formatter"

], function(jQuery, BaseController, formatter) {
	"use strict";

	return BaseController.extend("testeui5.controller.verbaConsultas", {

		formatter: formatter,

		onInit: function() {
			this.getRouter().getRoute("verbaConsultas").attachPatternMatched(this._onLoadFields, this);
			// this.getRouter().getRoute("verbaConsultas").attachPatternMatched(this._onLoadFields, this);
		},
		
		_onLoadFields: function(){
			
			
			var oModel = new sap.ui.model.json.JSONModel({
				idEmpresaVerba: "",
				idUsuarioVerba: "",
				nomeEmpresaVerba: "",
				dataLancamentoVerba: "",
				verbaInicialVerba: "",
				valorDebitoVerba: "",
				valorCreditoVerba: "",
				VerbaFinalVerba: ""
			});
			this.getOwnerComponent().setModel(oModel, "modelVerba");
			
			

			//bind headers
			
			//bind table de acordo com o usuário logado
			// var list = this.getView().byId("table_Verbas");
			// var oBinding = list.getBinding("items");

			// var aFilters = [];
			// var oFilter = [new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, this.getOwnerComponent().getModel("modelUser").getProperty(
			// 	"/modelUserId"))];

			// //	         oEvent.getSource().getBinding("items").filter(aFilters, "Application");
			// this.byId("table_Verbas").getBinding("items").filter(oFilter, "Application");
			
			//>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Carregar a tabela de transações DO GRID INICIAL >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
			var oItemSaldoVerbas = [];
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				alert(open.error.mensage);
			};
			
			open.onsuccess = function() {
				var db = open.result;
				var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
				
				var store = db.transaction("SaldoVerbas").objectStore("SaldoVerbas");
				store.openCursor().onsuccess = function(event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if(cursor.value.IdBase == IdBase){
							oItemSaldoVerbas.push(cursor.value);

						}
						cursor.continue();
						
					} else {
						oModel = new sap.ui.model.json.JSONModel(oItemSaldoVerbas);
						that.getView().setModel(oModel);
					}
				};
				
				var store1 = db.transaction("Usuarios", "readwrite");
				var objUsuarios = store1.objectStore("Usuarios");
				
				var request = objUsuarios.get(IdBase);
				
				request.onsuccess = function(e) {
					var result = e.target.result;
					//preparar o obj a ser adicionado ou editado
					if (result !== undefined) {
						that.getOwnerComponent().getModel("modelUser").setProperty("/modelUserNome", result.nomeUsuario);
						that.getOwnerComponent().getModel("modelUser").setProperty("/modelUserCOD", result.codUsuario);
						that.getOwnerComponent().getModel("modelUser").setProperty("/modelUserEmail", result.email);
						that.getView().byId("objectHeader_nomeUsuario").setTitle(that.getOwnerComponent().getModel("modelUser").getProperty("/modelUserNome"));
						that.getView().byId("objectHeader_nomeUsuario").setNumber(that.getOwnerComponent().getModel("modelUser").getProperty("/modelUserCOD"));
						that.getView().byId("objectAttribute_email").setText(that.getOwnerComponent().getModel("modelUser").getProperty("/modelUserEmail"));
					}
				};
			};
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onItemPress: function(oEvent) {
			// 	//popula modelVerba
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			this.getOwnerComponent().getModel("modelVerba").setProperty("/idEmpresaVerba", oItem.getBindingContext().getProperty("CodEmpresa"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/nomeEmpresaVerba", oItem.getBindingContext().getProperty("NomEmpresa"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/idUsuarioVerba", oItem.getBindingContext().getProperty("CodRepres"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/dataLancamentoVerba", oItem.getBindingContext().getProperty("Periodo"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/verbaInicialVerba", oItem.getBindingContext().getProperty("SaldoInicial"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/valorDebitoVerba", oItem.getBindingContext().getProperty("Debito"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/valorCreditoVerba", oItem.getBindingContext().getProperty("Credito"));
			this.getOwnerComponent().getModel("modelVerba").setProperty("/VerbaFinalVerba", oItem.getBindingContext().getProperty("SaldoFinal"));

			sap.ui.core.UIComponent.getRouterFor(this).navTo("verbaConsultasDetalhe");
		}
	});
});