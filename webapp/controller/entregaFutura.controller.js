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

	return BaseController.extend("testeui5.controller.entregaFutura", {

		onInit: function () {
			this.getRouter().getRoute("entregaFutura").attachPatternMatched(this._onLoadFields, this);
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

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

		onExit: function () {

		},

		_onLoadFields: function () {
			var that = this;

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
		}

	});

});