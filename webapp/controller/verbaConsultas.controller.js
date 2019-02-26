/*eslint-disable no-console, no-alert */

sap.ui.define([
	"jquery.sap.global",
	"testeui5/controller/BaseController",
	"testeui5/model/formatter"

], function(jQuery, BaseController, formatter) {
	"use strict";

	return BaseController.extend("testeui5.controller.verbaConsultas", {

		formatter: formatter,

		onInit: function() {
			this.getRouter().getRoute("VerbaConsultas").attachPatternMatched(this._onLoadFields, this);
			// this.getRouter().getRoute("verbaConsultas").attachPatternMatched(this._onLoadFields, this);
		},
		
		_onLoadFields: function(){
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				alert(open.error.mensage);
			};
			
			open.onsuccess = function() {
				var db = open.result;
				
				var store = db.transaction("SaldoVerba").objectStore("SaldoVerba");
				store.getAll().onsuccess = function(event) {
					var vetorSaldo = [];
					vetorSaldo = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(vetorSaldo);

					that.getView().setModel(oModel, "Verbas");
				};
			};
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},
		
		onSearch: function(oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Reprs", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_Verbas").getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

		},

		onItemPress: function(oEvent) {
			// 	//popula modelVerba
			// var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/idEmpresaVerba", oItem.getBindingContext().getProperty("CodEmpresa"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/nomeEmpresaVerba", oItem.getBindingContext().getProperty("NomEmpresa"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/idUsuarioVerba", oItem.getBindingContext().getProperty("CodRepres"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/dataLancamentoVerba", oItem.getBindingContext().getProperty("Periodo"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/verbaInicialVerba", oItem.getBindingContext().getProperty("SaldoInicial"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/valorDebitoVerba", oItem.getBindingContext().getProperty("Debito"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/valorCreditoVerba", oItem.getBindingContext().getProperty("Credito"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/VerbaFinalVerba", oItem.getBindingContext().getProperty("SaldoFinal"));

			// sap.ui.core.UIComponent.getRouterFor(this).navTo("verbaConsultasDetalhe");
		}
	});
});