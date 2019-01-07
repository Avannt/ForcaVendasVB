/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"
], function(BaseController, MessageBox) {

	"use strict";
	var oItensAprovar = [];

	return BaseController.extend("testeui5.controller.Aprovacoes", {

		onInit: function() {
			this.getRouter().getRoute("Aprovacoes").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function(evt) {
			this.onBuscaPedidos();
		},

		onCarregaExcedentes: function() {

			var Vlrdsc = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdsc"));
			var Vlrdsccom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdsccom"));
			var Vlrdscdd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscdd"));
			var Vlrdscvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscvm"));
			var Vlrdscvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscvvb"));
			var Valtotexcndirdesc = Vlrdsc - (Vlrdsccom + Vlrdscdd + Vlrdscvm + Vlrdscvvb).toFixed(2);

			var Vlrprz = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprz"));
			var Vlrprzcom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzcom"));
			var Vlrprzdd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzdd"));
			var Vlrprzvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvm"));
			var Vlrprzvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvvb"));
			var Valtotexcndirprazo = Vlrprz - (Vlrprzcom + Vlrprzdd + Vlrprzvm + Vlrprzvvb).toFixed(2);

			var Vlrbri = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbri"));
			var Vlrbrivm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbrivm"));
			var Vlrbricom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbricom"));
			var Vlrbridd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbridd"));
			var Vlrbrivvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbrivvb"));
			var ValtotexcndirBrinde = Vlrbri - (Vlrbrivm + Vlrbricom + Vlrbridd + Vlrbrivvb).toFixed(2);

			var Vlramo = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramo"));
			var Vlramovm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramovm"));
			var Vlramocom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramocom"));
			var Vlramodd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramodd"));
			var Vlramovvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramovvb"));
			var ValtotexcndirAmostra = Vlramo - (Vlramovm + Vlramocom + Vlramodd + Vlramovvb).toFixed(2);

			var Vlrbon = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbon"));
			var Vlrbonvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbonvm"));
			var Vlrboncom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrboncom"));
			var Vlrbondd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbondd"));
			var Vlrbonvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbonvvb"));
			var ValtotexcndirBonif = Vlrbon - (Vlrbonvm + Vlrboncom + Vlrbondd + Vlrbonvvb).toFixed(2);

			this.getView().getModel("ItemAprovar").setProperty("/Valtotexcndirdesc", Valtotexcndirdesc.toFixed(2));
			this.getView().getModel("ItemAprovar").setProperty("/Valtotexcndirprazo", Valtotexcndirprazo.toFixed(2));
			this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirBrinde", ValtotexcndirBrinde.toFixed(2));
			this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirAmostra", ValtotexcndirAmostra.toFixed(2));
			this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirBonif", ValtotexcndirBonif.toFixed(2));

			//Atualiza o total de excedente para ser destinado.
			var totalExc = Vlramo + Vlrprz + Vlrbri + Vlrbon + Vlrdsc;
			this.getView().getModel("ItemAprovar").setProperty("/Vlrexc", totalExc.toFixed(2));

		},

		onCarregaLimites: function() {

			var that = this;
			this.byId("idTableEnvioPedidos").setBusy(true);

			var oModel = that.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http:// /sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });
			
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

			oModel.read("/PedidosAprovar(IAprovador='" + codRepres + "')", {
				success: function(retorno) {
					var oModelAprovacoes = new sap.ui.model.json.JSONModel(oItensAprovar);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovar");
					that.byId("idTableEnvioPedidos").setBusy(false);
				},
				error: function(error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});

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

		myFormatterName: function(value) {

			if (value.length > 30) {
				
				return value.substring(0, 28) + "...";
				
			} else {
				
				return value;
			}
		},

		onItemChange: function(oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			//oEvent.getSource().getBinding("items").filter(aFilters, "Application");
			this.byId("idTableEnvioPedidos").getBinding("items").filter(aFilters, "Application");
		},

		onNavBack: function() {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			// this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			// this.onResetaCamposPrePedido();

		},

		onOpenDialog: function() {
			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();

			if (oSelectedItems.length == 0) {
				MessageBox.show("Selecione um pedido para aprovar", {
					icon: sap.m.MessageBox.Icon.INFORMATION,
					title: "escolher um pedido!",
					actions: [MessageBox.Action.OK],
					onClose: function() {

					}
				});
			} else {
				var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");

				var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1, 2)];

				console.log(itemAprovar);

				var oModelAprovacoes = new sap.ui.model.json.JSONModel(itemAprovar);
				this.getView().setModel(oModelAprovacoes, "ItemAprovar");

				this.onCarregaExcedentes();
				this.onCalculaTotalDestinar();

				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}

				if (!this._CreateMaterialFragment) {

					this._ItemDialog = sap.ui.xmlfragment(
						"testeui5.view.AprovacaoDialog",
						this
					);

					this.getView().addDependent(this._ItemDialog);
				}

				this.onBloquearVerbas();

				this._ItemDialog.open();

			}
		},

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
			var oFilter = [new sap.ui.model.Filter("DatImpl", sap.ui.model.FilterOperator.Contains, sValue)];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_relatorio_pedidos").getBinding("items").filter(aFilters, "Application");

		},

		onDestinaDesc: function(evt) {

			var Valtotexcndirdesc = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Valtotexcndirdesc")).toFixed(2);
			var vlrTotalDesc = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdsc"));
			var Vlrdsccom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdsccom"));
			var Vlrdscdd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscdd"));
			var Vlrdscvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscvm"));
			var Vlrdscvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrdscvvb"));
			var somaDosDestinados = (Vlrdsccom + Vlrdscdd + Vlrdscvm + Vlrdscvvb).toFixed(2);
			var msg = "Valores destinados para abater o excedente de descontos, ultrapassou o valor total necessário. Valor Excedente (" + vlrTotalDesc + ")";

			if (somaDosDestinados > vlrTotalDesc) {
				sap.ui.getCore().byId("idComissaoUtilizadaDesconto").setValueState("Error");
				sap.ui.getCore().byId("idComissaoUtilizadaDesconto").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaUtilizadaDesconto").setValueState("Error");
				sap.ui.getCore().byId("idVerbaUtilizadaDesconto").setValueStateText(msg);
				sap.ui.getCore().byId("idVerbaUtilizadaDesconto").focus();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setValueState("Error");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setValueState("Error");
				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setValueStateText(msg);

			} else {

				Valtotexcndirdesc = vlrTotalDesc - somaDosDestinados;
				this.getView().getModel("ItemAprovar").setProperty("/Valtotexcndirdesc", Valtotexcndirdesc.toFixed(2));

				this.onCalculaTotalDestinar();

				sap.ui.getCore().byId("idComissaoUtilizadaDesconto").setValueState("None");
				sap.ui.getCore().byId("idComissaoUtilizadaDesconto").setValueStateText();

				sap.ui.getCore().byId("idVerbaUtilizadaDesconto").setValueState("None");
				sap.ui.getCore().byId("idVerbaUtilizadaDesconto").setValueStateText();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setValueState("None");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setValueStateText();

				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setValueState("None");
				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setValueStateText();

			}
		},

		onDestinaPrazo: function(evt) {
			var Valtotexcndirprazo = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Valtotexcndirprazo"));

			var Vlrprz = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprz")).toFixed(2);
			var Vlrprzcom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzcom"));
			var Vlrprzdd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzdd"));
			var Vlrprzvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvm"));
			var Vlrprzvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvvb"));
			var somaDosDestinados = (Vlrprzcom + Vlrprzdd + Vlrprzvm + Vlrprzvvb).toFixed(2);
			var msg = "Valores destinados para abater o excedente de Prazos, ultrapassou o valor total necessário. Valor Excedente (" + Vlrprz + ")";

			if (somaDosDestinados > Vlrprz) {
				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").setValueState("Error");
				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").setValueStateText(msg);
				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").focus();

				sap.ui.getCore().byId("idComissaoUtilizadaPrazo").setValueState("Error");
				sap.ui.getCore().byId("idComissaoUtilizadaPrazo").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setValueState("Error");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setValueState("Error");
				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setValueStateText(msg);

			} else {

				Valtotexcndirprazo = Vlrprz - somaDosDestinados;
				this.getView().getModel("ItemAprovar").setProperty("/Valtotexcndirprazo", Valtotexcndirprazo.toFixed(2));

				this.onCalculaTotalDestinar();

				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").setValueState("None");
				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").setValueStateText();
				sap.ui.getCore().byId("idVerbaUtilizadaPrazo").focus();

				sap.ui.getCore().byId("idComissaoUtilizadaPrazo").setValueState("None");
				sap.ui.getCore().byId("idComissaoUtilizadaPrazo").setValueStateText();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setValueState("None");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setValueStateText();

				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setValueState("None");
				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setValueStateText();
			}
		},

		onDestinaBonif: function(evt) {
			var ValtotexcndirBonif = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirBonif"));

			var Vlrprz = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprz")).toFixed(2);
			var Vlrprzcom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzcom"));
			var Vlrprzdd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzdd"));
			var Vlrprzvm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvm"));
			var Vlrprzvvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrprzvvb"));
			var somaDosDestinados = (Vlrprzcom + Vlrprzdd + Vlrprzvm + Vlrprzvvb).toFixed(2);
			var msg = "Valores destinados para abater o excedente de Prazos, ultrapassou o valor total necessário. Valor Excedente (" + Vlrprz + ")";

			if (somaDosDestinados > Vlrprz) {
				sap.ui.getCore().byId("idVerbaUtilizadaBonif").setValueState("Error");
				sap.ui.getCore().byId("idVerbaUtilizadaBonif").setValueStateText(msg);

				sap.ui.getCore().byId("idComissaoUtilizadaBonif").setValueState("Error");
				sap.ui.getCore().byId("idComissaoUtilizadaBonif").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setValueState("Error");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setValueState("Error");
				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setValueStateText(msg);

			} else {

				ValtotexcndirBonif = Vlrprz - somaDosDestinados;
				this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirBonif", ValtotexcndirBonif.toFixed(2));

				this.onCalculaTotalDestinar();

				sap.ui.getCore().byId("idVerbaUtilizadaBonif").setValueState("None");
				sap.ui.getCore().byId("idVerbaUtilizadaBonif").setValueStateText();

				sap.ui.getCore().byId("idComissaoUtilizadaBonif").setValueState("None");
				sap.ui.getCore().byId("idComissaoUtilizadaBonif").setValueStateText();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setValueState("None");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setValueStateText();

				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setValueState("None");
				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setValueStateText();
			}
		},

		onDestinaAmostra: function(evt) {
			var ValtotexcndirAmostra = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirAmostra"));

			var Vlramo = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramo")).toFixed(2);
			var Vlramocom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramocom"));
			var Vlramodd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramodd"));
			var Vlramovm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramovm"));
			var Vlramovvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlramovvb"));
			var somaDosDestinados = (Vlramocom + Vlramodd + Vlramovm + Vlramovvb).toFixed(2);
			var msg = "Valores destinados para abater o excedente de Prazos, ultrapassou o valor total necessário. Valor Excedente (" + Vlramo + ")";

			if (somaDosDestinados > Vlramo) {
				sap.ui.getCore().byId("idVerbaUtilizadaAmostra").setValueState("Error");
				sap.ui.getCore().byId("idVerbaUtilizadaAmostra").setValueStateText(msg);
				sap.ui.getCore().byId("idVerbaUtilizadaAmostra").focus();

				sap.ui.getCore().byId("idComissaoUtilizadaAmostra").setValueState("Error");
				sap.ui.getCore().byId("idComissaoUtilizadaAmostra").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setValueState("Error");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setValueState("Error");
				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setValueStateText(msg);

			} else {

				ValtotexcndirAmostra = Vlramo - somaDosDestinados;
				this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirAmostra", ValtotexcndirAmostra.toFixed(2));

				this.onCalculaTotalDestinar();

				sap.ui.getCore().byId("idVerbaUtilizadaAmostra").setValueState("None");
				sap.ui.getCore().byId("idVerbaUtilizadaAmostra").setValueStateText();

				sap.ui.getCore().byId("idComissaoUtilizadaAmostra").setValueState("None");
				sap.ui.getCore().byId("idComissaoUtilizadaAmostra").setValueStateText();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setValueState("None");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setValueStateText();

				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setValueState("None");
				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setValueStateText();
			}
		},

		onDestinaBrinde: function(evt) {
			var ValtotexcndirBrinde = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirBrinde"));

			var Vlrbri = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbri")).toFixed(2);
			var Vlrbricom = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbricom"));
			var Vlrbridd = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbridd"));
			var Vlrbrivm = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbrivm"));
			var Vlrbrivvb = parseFloat(this.getView().getModel("ItemAprovar").getProperty("/Vlrbrivvb"));
			var somaDosDestinados = (Vlrbricom + Vlrbridd + Vlrbrivm + Vlrbrivvb).toFixed(2);
			var msg = "Valores destinados para abater o excedente de Prazos, ultrapassou o valor total necessário. Valor Excedente (" + Vlrbri + ")";

			if (somaDosDestinados > Vlrbri) {
				sap.ui.getCore().byId("idVerbaUtilizadaBrinde").setValueState("Error");
				sap.ui.getCore().byId("idVerbaUtilizadaBrinde").setValueStateText(msg);
				sap.ui.getCore().byId("idVerbaUtilizadaBrinde").focus();

				sap.ui.getCore().byId("idComissaoUtilizadaBrinde").setValueState("Error");
				sap.ui.getCore().byId("idComissaoUtilizadaBrinde").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setValueState("Error");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setValueStateText(msg);

				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setValueState("Error");
				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setValueStateText(msg);

			} else {

				ValtotexcndirBrinde = Vlrbri - somaDosDestinados;
				this.getView().getModel("ItemAprovar").setProperty("/ValtotexcndirBrinde", ValtotexcndirBrinde.toFixed(2));

				this.onCalculaTotalDestinar();

				sap.ui.getCore().byId("idVerbaUtilizadaBrinde").setValueState("None");
				sap.ui.getCore().byId("idVerbaUtilizadaBrinde").setValueStateText();

				sap.ui.getCore().byId("idComissaoUtilizadaBrinde").setValueState("None");
				sap.ui.getCore().byId("idComissaoUtilizadaBrinde").setValueStateText();

				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setValueState("None");
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setValueStateText();

				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setValueState("None");
				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setValueStateText();
			}
		},

		onCalculaTotalDestinar: function() {

			var var1 = this.getView().getModel("ItemAprovar").getProperty("/Valtotexcndirdesc");
			var var2 = this.getView().getModel("ItemAprovar").getProperty("/Valtotexcndirprazo");
			var var3 = this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirBrinde");
			var var4 = this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirAmostra");
			var var5 = this.getView().getModel("ItemAprovar").getProperty("/ValtotexcndirBonif");

			var Vlrdst = parseFloat(var1) + parseFloat(var2) + parseFloat(var3) + parseFloat(var4) + parseFloat(var5);
			this.getView().getModel("ItemAprovar").setProperty("/Vlrdst", Vlrdst);

		},

		onBuscaPedidos: function() {
			var that = this;
			this.byId("idTableEnvioPedidos").setBusy(true);

			var oModel = that.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http://104.208.137.3:8000/sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });
				
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

			oModel.read("/PedidosAprovar", {
				urlParameters: {
					"$filter": "IAprovador eq '" + codRepres + "'"
				},
				success: function(retorno) {
					oItensAprovar = [];

					for (var i = 0; i < retorno.results.length; i++) {
						var data = retorno.results[i].Erdat;

						data = data.substring(6, 8) + "/" + data.substring(4, 6) + "/" + data.substring(0, 4);

						var hora = retorno.results[i].Horaped;
						hora = hora.substring(0, 2) + ":" + hora.substring(2, 4);

						var aux = {
							IAprovador: retorno.results[i].IAprovador,
							Nivel: retorno.results[i].Nivel,
							Nrpedcli: retorno.results[i].Nrpedcli,
							Idstatuspedido: retorno.results[i].Idstatuspedido,
							Kunnr: retorno.results[i].Kunnr,
							Werks: retorno.results[i].Werks,
							Lifnr: retorno.results[i].Lifnr,
							Auart: retorno.results[i].Auart,
							Situacaopedido: retorno.results[i].Situacaopedido,
							Ntgew: retorno.results[i].Ntgew,
							Brgew: retorno.results[i].Brgew,
							Pltyp: retorno.results[i].Pltyp,
							Completo: retorno.results[i].Completo,
							Valminped: retorno.results[i].Valminped,
							Erdat: data,
							Horaped: hora,
							Valorcomissao: retorno.results[i].Valorcomissao,
							Obsped: retorno.results[i].Obsped,
							Obsaudped: retorno.results[i].Obsaudped,
							Existeentradapedido: retorno.results[i].Existeentradapedido,
							Percentradapedido: retorno.results[i].Percentradapedido,
							Valorentradapedido: retorno.results[i].Valorentradapedido,
							Inco1: retorno.results[i].Inco1,
							Diasprimeiraparcela: retorno.results[i].Diasprimeiraparcela,
							Quantparcelas: retorno.results[i].Quantparcelas,
							Intervaloparcelas: retorno.results[i].Intervaloparcelas,
							Tiponego: retorno.results[i].Tiponego,
							Aprov: retorno.results[i].Aprov,
							Provg: retorno.results[i].Provg,
							Totitens: retorno.results[i].Totitens,
							Valcomdesc: String(parseFloat(retorno.results[i].Valcomdesc)),
							Valcampbrinde: String(parseFloat(retorno.results[i].Valcampbrinde)),
							Valcomutdesc: String(parseFloat(retorno.results[i].Valcomutdesc)),
							Valverbautdesc: String(parseFloat(retorno.results[i].Valverbautdesc)),
							Valtotpedido: String(parseFloat(retorno.results[i].Valtotpedido)),
							Valtotabcampenx: String(parseFloat(retorno.results[i].Valtotabcampenx)),
							Valtotabcampglob: String(parseFloat(retorno.results[i].Valtotabcampglob)),
							Valtotabcamppa: String(parseFloat(retorno.results[i].Valtotabcamppa)),
							Valtotabcampbrinde: String(parseFloat(retorno.results[i].Valtotabcampbrinde)),
							Valtotexcdesc: String(parseFloat(retorno.results[i].Valtotexcdesc)),
							Valtotexcndirdesc: String(parseFloat(retorno.results[i].Valtotexcndirdesc)),
							Valtotexcndirprazo: String(parseFloat(retorno.results[i].Valtotexcndirprazo)),
							Valtotexcprazo: String(parseFloat(retorno.results[i].Valtotexcprazo)),
							Valverbapedido: String(parseFloat(retorno.results[i].Valverbapedido)),
							Valabverba: String(parseFloat(retorno.results[i].Valabverba)),
							Valcomutprazo: String(parseFloat(retorno.results[i].Valcomutprazo)),
							Valtotabcomissao: String(parseFloat(retorno.results[i].Valtotabcomissao)),
							Vlramo: retorno.results[i].Vlramo,
							Vlramocom: retorno.results[i].Vlramocom,
							Vlramodd: retorno.results[i].Vlramodd,
							Vlramovm: retorno.results[i].Vlramovm,
							Vlramovvb: retorno.results[i].Vlramovvb,
							Vlrbon: retorno.results[i].Vlrbon,
							Vlrboncom: retorno.results[i].Vlrboncom,
							Vlrbondd: retorno.results[i].Vlrbondd,
							Vlrbonvm: retorno.results[i].Vlrbonvm,
							Vlrbonvvb: retorno.results[i].Vlrbonvvb,
							Vlrbri: retorno.results[i].Vlrbri,
							Vlrbricom: retorno.results[i].Vlrbricom,
							Vlrbridd: retorno.results[i].Vlrbridd,
							Vlrbrivm: retorno.results[i].Vlrbrivm,
							Vlrbrivvb: retorno.results[i].Vlrbrivvb,
							Vlrdsc: retorno.results[i].Vlrdsc,
							Vlrdsccom: retorno.results[i].Vlrdsccom,
							Vlrdscdd: retorno.results[i].Vlrdscdd,
							Vlrdscvm: retorno.results[i].Vlrdscvm,
							Vlrdscvvb: retorno.results[i].Vlrdscvvb,
							Vlrdst: retorno.results[i].Vlrdst,
							Vlrexc: retorno.results[i].Vlrexc,
							Vlrprz: retorno.results[i].Vlrprz,
							Vlrprzcom: retorno.results[i].Vlrprzcom,
							Vlrprzdd: retorno.results[i].Vlrprzdd,
							Vlrprzvm: retorno.results[i].Vlrprzvm,
							Vlrprzvvb: retorno.results[i].Vlrprzvvb,
							Obsvvb: retorno.results[i].Obsvvb,
							Obsdd: retorno.results[i].Obsdd,
							Obscom: retorno.results[i].Obscom,
							Obsvm: retorno.results[i].Obsvm,
							Bugruop: retorno.results[i].BuGruop,
							Namecli: retorno.results[i].Namecli,
							Namerep: retorno.results[i].Namerep
						};

						oItensAprovar.push(aux);
					}

					var oModelAprovacoes = new sap.ui.model.json.JSONModel(oItensAprovar);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovar");
					that.byId("idTableEnvioPedidos").setBusy(false);
				},
				error: function(error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
		},

		onAprovar: function() {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			if (!this._CreateMaterialFragment) {

				this._ItemDialog = sap.ui.xmlfragment(
					"testeui5.view.observacoesAprovador",
					this
				);

				this.getView().addDependent(this._ItemDialog);
			}

			this.onBloquearCampos();

			this._ItemDialog.open();

		},

		onReprovar: function() {
			var that = this;
			that.byId("idTableEnvioPedidos").setBusy(true);

			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");
			var teste = this.getView().getModel("ItemAprovar");
			
			var oModel = this.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http://104.208.137.3:8000/sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });

			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();
			var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");

			var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1, 2)];

			var aux = {
				Nrpedcli: String(itemAprovar.Nrpedcli),
				Aprov: String(itemAprovar.Aprov),
				Nivel: String(itemAprovar.Nivel),
				Vlrprz: String(itemAprovar.Vlrprz),
				VlrprzCom: String(itemAprovar.Vlrprzcom),
				VlrprzVm: String(itemAprovar.Vlrprzvm),
				VlrprzDd: String(itemAprovar.Vlrprzdd),
				VlrprzVvb: String(itemAprovar.Vlrprzvvb),
				Vlrdsc: String(itemAprovar.Vlrdsc),
				VlrdscCom: String(itemAprovar.Vlrdsccom),
				VlrdscVm: String(itemAprovar.Vlrdscvm),
				VlrdscDd: String(itemAprovar.Vlrdscdd),
				VlrdscVvb: String(itemAprovar.Vlrdscvvb),
				Vlramo: String(itemAprovar.Vlramo),
				VlramoCom: String(itemAprovar.Vlramocom),
				VlramoVm: String(itemAprovar.Vlramovm),
				VlramoDd: String(itemAprovar.Vlramodd),
				VlramoVvb: String(itemAprovar.Vlramovvb),
				Vlrbri: String(itemAprovar.Vlrbri),
				VlrbriCom: String(itemAprovar.Vlrbricom),
				VlrbriDd: String(itemAprovar.Vlrbridd),
				VlrbriVm: String(itemAprovar.Vlrbrivm),
				VlrbriVvb: String(itemAprovar.Vlrbrivvb),
				Vlrbon: String(itemAprovar.Vlrbon),
				VlrbonCom: String(itemAprovar.Vlrboncom),
				VlrbonVm: String(itemAprovar.Vlrbonvm),
				VlrbonDd: String(itemAprovar.Vlrbondd),
				VlrbonVvb: String(itemAprovar.Vlrbonvvb),
				Vlrdst: String(itemAprovar.Vlrdst),
				Obscom: String(itemAprovar.Obscom),
				Obsdd: String(itemAprovar.Obsdd),
				Obsvm: String(itemAprovar.Obsvm),
				Obsvvb: String(itemAprovar.Obsvvb),
				IvReprov: "X"
			};

			oModel.create("/AprovarOV", aux, {
				success: function(retorno) {

					that.byId("idTableEnvioPedidos").setBusy(false);

					oItensAprovar = [];

					if (that._ItemDialog) {
						that._ItemDialog.destroy(true);
					}

					if (retorno.Message == "") {
						var mensagem = "Pedido reprovado com sucesso!";
					} else {
						mensagem = retorno.Message;
					}

					sap.m.MessageBox.show(
						mensagem, {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Sucesso!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function(oAction) {
								that.onBuscaPedidos();
							}
						}
					);
				},
				error: function(error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
		},

		onAprovarDialog: function() {
			var that = this;
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");
			var teste = this.getView().getModel("ItemAprovar");
			
			var oModel = this.getView().getModel();
			
			// var oModel = new sap.ui.model.odata.v2.ODataModel("http://104.208.137.3:8000/sap/opu/odata/sap/ZFORCA_VENDAS_VB_SRV/", {
			// 	json: true,
			// 	user: "appadmin",
			// 	password: "sap123"
			// });

			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();
			var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");

			var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1, 2)];

			var aux = {
				Nrpedcli: String(itemAprovar.Nrpedcli),
				Aprov: String(itemAprovar.Aprov),
				Nivel: String(itemAprovar.Nivel),
				Vlrprz: String(itemAprovar.Vlrprz),
				VlrprzCom: String(itemAprovar.Vlrprzcom),
				VlrprzVm: String(itemAprovar.Vlrprzvm),
				VlrprzDd: String(itemAprovar.Vlrprzdd),
				VlrprzVvb: String(itemAprovar.Vlrprzvvb),
				Vlrdsc: String(itemAprovar.Vlrdsc),
				VlrdscCom: String(itemAprovar.Vlrdsccom),
				VlrdscVm: String(itemAprovar.Vlrdscvm),
				VlrdscDd: String(itemAprovar.Vlrdscdd),
				VlrdscVvb: String(itemAprovar.Vlrdscvvb),
				Vlramo: String(itemAprovar.Vlramo),
				VlramoCom: String(itemAprovar.Vlramocom),
				VlramoVm: String(itemAprovar.Vlramovm),
				VlramoDd: String(itemAprovar.Vlramodd),
				VlramoVvb: String(itemAprovar.Vlramovvb),
				Vlrbri: String(itemAprovar.Vlrbri),
				VlrbriCom: String(itemAprovar.Vlrbricom),
				VlrbriDd: String(itemAprovar.Vlrbridd),
				VlrbriVm: String(itemAprovar.Vlrbrivm),
				VlrbriVvb: String(itemAprovar.Vlrbrivvb),
				Vlrbon: String(itemAprovar.Vlrbon),
				VlrbonCom: String(itemAprovar.Vlrboncom),
				VlrbonVm: String(itemAprovar.Vlrbonvm),
				VlrbonDd: String(itemAprovar.Vlrbondd),
				VlrbonVvb: String(itemAprovar.Vlrbonvvb),
				Vlrdst: String(itemAprovar.Vlrdst),
				Obscom: String(itemAprovar.Obscom),
				Obsdd: String(itemAprovar.Obsdd),
				Obsvm: String(itemAprovar.Obsvm),
				Obsvvb: String(itemAprovar.Obsvvb),
				IvReprov: ""
			};

			oModel.create("/AprovarOV", aux, {
				success: function(retorno) {
					oItensAprovar = [];

					if (retorno.ENumber == "104") {
						sap.m.MessageBox.show(
							retorno.Message, {
								icon: sap.m.MessageBox.Icon.WARNING,
								title: "Destinação dos valores!",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function(oAction) {

									if (that._ItemDialog) {
										that._ItemDialog.destroy(true);
									}

									that.onOpenDialog();
								}
							}
						);
					} else if (retorno.ENumber == "001") {

						if (that._ItemDialog) {
							that._ItemDialog.destroy(true);
						}

						sap.m.MessageBox.show(
							retorno.Message, {
								icon: sap.m.MessageBox.Icon.SUCCESS,
								title: "Sucesso!",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function(oAction) {
									that.onBuscaPedidos();
								}
							}
						);

					} else {

						if (that._ItemDialog) {
							that._ItemDialog.destroy(true);
						}

						sap.m.MessageBox.show(
							retorno.Message, {
								icon: sap.m.MessageBox.Icon.SUCCESS,
								title: "Sucesso!",
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function(oAction) {
									that.onBuscaPedidos();
								}
							}
						);
					}
				},
				error: function(error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});

		},

		onCancelar: function() {
			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onReprovarPedido: function() {
			var that = this;
			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();
			var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");

			if (oSelectedItems.length == 0) {
				MessageBox.show("Selecione um pedido para aprovar", {
					icon: sap.m.MessageBox.Icon.INFORMATION,
					title: "escolher um pedido!",
					actions: [MessageBox.Action.OK],
					onClose: function() {

					}
				});
			} else {
				var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");

				var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1, 2)];

				console.log(itemAprovar);

				var oModelAprovacoes = new sap.ui.model.json.JSONModel(itemAprovar);
				this.getView().setModel(oModelAprovacoes, "ItemAprovar");

				sap.m.MessageBox.show(
					"A rotina de reprovação significa a exclusão do pedido. Deseja mesmo reprovar o pedido?", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Reprovação do pedido!",
						actions: ["Reprovar", sap.m.MessageBox.Action.CANCEL],
						onClose: function(oAction) {

							if (oAction == "Reprovar") {
								that.onReprovar();
							}
						}
					}
				);
			}
		},

		onBloquearVerbas: function() {
			var oModel = this.getView().getModel("ItemAprovar");
			var nivelAprovacao = oModel.getProperty("/Bugruop");

			if (nivelAprovacao == "ZCO" || nivelAprovacao == "ZSR") {

				//Desc - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaDesconto").setVisible(false);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setVisible(false);

				//Prazo - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaPrazo").setVisible(false);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setVisible(false);

				//Brinde - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBrinde").setVisible(false);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setVisible(false);

				//Bonif - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBonif").setVisible(false);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setVisible(false);

				//Amostra - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaAmostra").setVisible(false);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setVisible(false);

				//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

				//Desc - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaDesconto").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setVisible(false);

				//Prazo - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaPrazo").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setVisible(false);

				//Brinde - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBrinde").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setVisible(false);

				//Bonif - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBonf").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setVisible(false);

				//Amostra - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaAmostra").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setVisible(false);

			} else if (nivelAprovacao == "ZSN") {

				//Desc - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaDesconto").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setVisible(true);

				//Prazo - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaPrazo").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setVisible(true);

				//Brinde - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBrinde").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setVisible(true);

				//Bonif - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBonif").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setVisible(true);

				//Amostra - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaAmostra").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setVisible(true);

				//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

				//Desc - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaDesconto").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setVisible(false);

				//Prazo - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaPrazo").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setVisible(false);

				//Brinde - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBrinde").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setVisible(false);

				//Bonif - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBonf").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setVisible(false);

				//Amostra - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaAmostra").setVisible(false);
				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setVisible(false);

			} else if (nivelAprovacao == "ZPJ") {

				//Desc - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaDesconto").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaDesconto").setVisible(true);

				//Prazo - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaPrazo").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaPrazo").setVisible(true);

				//Brinde - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBrinde").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBrinde").setVisible(true);

				//Bonif - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaBonif").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaBonif").setVisible(true);

				//Amostra - dd
				sap.ui.getCore().byId("idLabelVerbaDiaDiaUtilizadaAmostra").setVisible(true);
				sap.ui.getCore().byId("idVerbaDiaDiaUtilizadaAmostra").setVisible(true);

				//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

				//Desc - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaDesconto").setVisible(true);
				sap.ui.getCore().byId("idVerbaVBUtilizadaDesconto").setVisible(true);

				//Prazo - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaPrazo").setVisible(true);
				sap.ui.getCore().byId("idVerbaVBUtilizadaPrazo").setVisible(true);

				//Brinde - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBrinde").setVisible(true);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBrinde").setVisible(true);

				//Bonif - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaBonf").setVisible(true);
				sap.ui.getCore().byId("idVerbaVBUtilizadaBonf").setVisible(true);

				//Amostra - vb
				sap.ui.getCore().byId("idLabelVerbaVBUtilizadaAmostra").setVisible(true);
				sap.ui.getCore().byId("idVerbaVBUtilizadaAmostra").setVisible(true);
			}
		},

		onBloquearCampos: function() {

			var oModel = this.getView().getModel("ItemAprovar");
			var nivelAprovacao = oModel.getProperty("/Bugruop");

			if (nivelAprovacao == "ZCO") {

				sap.ui.getCore().byId("idRepresentante").setEnabled(false);
				sap.ui.getCore().byId("idAprovador1").setEnabled(true);
				sap.ui.getCore().byId("idAprovador1").focus();
				sap.ui.getCore().byId("idAprovador2").setEnabled(false);
				sap.ui.getCore().byId("idAprovador3").setEnabled(false);
				sap.ui.getCore().byId("idAprovador4").setEnabled(false);

				sap.ui.getCore().byId("idRepresentante").setVisible(true);
				sap.ui.getCore().byId("idAprovador1").setVisible(true);
				sap.ui.getCore().byId("idAprovador2").setVisible(false);
				sap.ui.getCore().byId("idAprovador3").setVisible(false);
				sap.ui.getCore().byId("idAprovador4").setVisible(false);

			} else if (nivelAprovacao == "ZSR") {

				sap.ui.getCore().byId("idRepresentante").setEnabled(false);
				sap.ui.getCore().byId("idAprovador1").setEnabled(false);
				sap.ui.getCore().byId("idAprovador2").setEnabled(true);
				sap.ui.getCore().byId("idAprovador2").focus();
				sap.ui.getCore().byId("idAprovador3").setEnabled(false);
				sap.ui.getCore().byId("idAprovador4").setEnabled(false);

				sap.ui.getCore().byId("idRepresentante").setVisible(true);
				sap.ui.getCore().byId("idAprovador1").setVisible(true);
				sap.ui.getCore().byId("idAprovador2").setVisible(true);
				sap.ui.getCore().byId("idAprovador3").setVisible(false);
				sap.ui.getCore().byId("idAprovador3").focus();
				sap.ui.getCore().byId("idAprovador4").setVisible(false);

			} else if (nivelAprovacao == "ZSN") {

				sap.ui.getCore().byId("idRepresentante").setEnabled(false);
				sap.ui.getCore().byId("idAprovador1").setEnabled(false);
				sap.ui.getCore().byId("idAprovador2").setEnabled(false);
				sap.ui.getCore().byId("idAprovador3").setEnabled(true);
				sap.ui.getCore().byId("idAprovador4").setEnabled(false);
				sap.ui.getCore().byId("idAprovador4").focus();

				sap.ui.getCore().byId("idRepresentante").setVisible(true);
				sap.ui.getCore().byId("idAprovador1").setVisible(true);
				sap.ui.getCore().byId("idAprovador2").setVisible(true);
				sap.ui.getCore().byId("idAprovador3").setVisible(true);
				sap.ui.getCore().byId("idAprovador4").setVisible(false);

			} else if (nivelAprovacao == "ZPJ") {

				sap.ui.getCore().byId("idRepresentante").setEnabled(false);
				sap.ui.getCore().byId("idAprovador1").setEnabled(false);
				sap.ui.getCore().byId("idAprovador2").setEnabled(false);
				sap.ui.getCore().byId("idAprovador3").setEnabled(false);
				sap.ui.getCore().byId("idAprovador4").setEnabled(true);
				sap.ui.getCore().byId("idAprovador4").focus();

				sap.ui.getCore().byId("idRepresentante").setVisible(true);
				sap.ui.getCore().byId("idAprovador1").setVisible(true);
				sap.ui.getCore().byId("idAprovador2").setVisible(true);
				sap.ui.getCore().byId("idAprovador3").setVisible(true);
				sap.ui.getCore().byId("idAprovador4").setVisible(true);

			}
		},

		onCasasDecimais: function(value) {
			// return parseFloat(value).toFixed(2);
		},

		onMensagemErroODATA: function(codigoErro) {
			var that = this;

			if (codigoErro == 0) {
				sap.m.MessageBox.show(
					"Verifique a conexão com a internet!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Falha na Conexão!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if (codigoErro == 400) {
				sap.m.MessageBox.show(
					"Url mal formada! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Fiori!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if (codigoErro == 403) {
				sap.m.MessageBox.show(
					"Usuário sem autorização para executar a função (403)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if (codigoErro == 404) {
				sap.m.MessageBox.show(
					"Função não encontrada e/ou Parâmentros inválidos  (404)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if (codigoErro == 500) {
				sap.m.MessageBox.show(
					"Ocorreu um Erro (500)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if (codigoErro == 501) {
				sap.m.MessageBox.show(
					"Função não implementada (501)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			}
		}
	});
});