/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"
], function (BaseController, MessageBox) {

	"use strict";
	var oItensAprovar = [];

	return BaseController.extend("testeui5.controller.Aprovacoes", {

		onInit: function () {
			this.getRouter().getRoute("Aprovacoes").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function (evt) {

			this.onBuscaPedidos();

		},

		myFormatterDataImp: function (value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {
				var aux = value.split("/");
				// var aux2 = aux[2].substring(2, aux[2].length);
				// value = aux[0] + "/" + aux[1] + "/" + aux2;
				aux = aux[0] + "/" + aux[1];
				return aux;
			}
		},

		onNavBack: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			// this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			// this.onResetaCamposPrePedido();

		},

		onOpenDialog: function () {
			
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

			this._ItemDialog.open();

		},

		handleChange: function (oEvent) {
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

		onBuscaPedidos: function () {
			var that = this;

			var oModel = that.getView().getModel();
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

			oModel.read("/PedidosAprovar", {
				urlParameters: {
					"$filter": "IAprovador eq '" + codRepres + "'"
				},
				success: function (retorno) {

					for (var i = 0; i < retorno.results.length; i++) {

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
							Erdat: retorno.results[i].Erdat,
							Horaped: retorno.results[i].Horaped,
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
							Vlrexc: retorno.results[i].Vlrexc,
							Aprov: retorno.results[i].Aprov,
							Provg: retorno.results[i].Provg,
							Totitens: retorno.results[i].Totitens,
							Valcomdesc: retorno.results[i].Valcomdesc,
							Valcampbrinde: retorno.results[i].Valcampbrinde,
							Valcomutdesc: retorno.results[i].Valcomutdesc,
							Valverbautdesc: retorno.results[i].Valverbautdesc,
							Valtotpedido: retorno.results[i].Valtotpedido,
							Valtotabcampenx: retorno.results[i].Valtotabcampenx,
							Valtotabcampglob: retorno.results[i].Valtotabcampglob,
							Valtotabcamppa: retorno.results[i].Valtotabcamppa,
							Valtotabcampbrinde: retorno.results[i].Valtotabcampbrinde,
							Valtotexcdesc: retorno.results[i].Valtotexcdesc,
							Valtotexcndirdesc: retorno.results[i].Valtotexcndirdesc,
							Valtotexcndirprazo: retorno.results[i].Valtotexcndirprazo,
							Valtotexcprazo: retorno.results[i].Valtotexcprazo,
							Valverbapedido: retorno.results[i].Valverbapedido,
							Valabverba: retorno.results[i].Valabverba,
							Valcomutprazo: retorno.results[i].Valcomutprazo,
							Valtotabcomissao: retorno.results[i].Valtotabcomissao
						};
						
						oItensAprovar.push(aux);
					}
					
					var oModelAprovacoes = new sap.ui.model.json.JSONModel(oItensAprovar);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovar");
				},
				error: function (error) {
					console.log(error);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
		},
		
		onExit: function () {
			
		},

		onMensagemErroODATA: function (codigoErro) {
			var that = this;

			if (codigoErro == 0) {
				sap.m.MessageBox.show(
					"Verifique a conexão com a internet!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Falha na Conexão!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {
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
						onClose: function (oAction) {
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
						onClose: function (oAction) {
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
						onClose: function (oAction) {
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
						onClose: function (oAction) {
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
						onClose: function (oAction) {
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