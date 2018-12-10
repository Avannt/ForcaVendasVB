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
			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();
			
			var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");
			
			var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1,2)];
			
			console.log(itemAprovar);
			
			var oModelAprovacoes = new sap.ui.model.json.JSONModel(itemAprovar);
			this.getView().setModel(oModelAprovacoes, "ItemAprovar");
			
			
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
			this.byId("idTableEnvioPedidos").setBusy(true);

			var oModel = that.getView().getModel();
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

			oModel.read("/PedidosAprovar", {
				urlParameters: {
					"$filter": "IAprovador eq '" + codRepres + "'"
				},
				success: function (retorno) {
					oItensAprovar = [];

					for (var i = 0; i < retorno.results.length; i++) {
						var data = retorno.results[i].Erdat;
						
						data = data.substring(6,8) + "/" + data.substring(4,6) + "/" + data.substring(0,4);
						
						var hora = retorno.results[i].Horaped;
						hora = hora.substring(0,2) + ":" + hora.substring(2,4);
						
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
						};
						
						oItensAprovar.push(aux);
					}
					
					var oModelAprovacoes = new sap.ui.model.json.JSONModel(oItensAprovar);
					that.getView().setModel(oModelAprovacoes, "PedidosAprovar");
					that.byId("idTableEnvioPedidos").setBusy(false);
				},
				error: function (error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
		},
		
		onAprovar: function(){
			var that = this;
			var codRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");
			var teste = this.getView().getModel("ItemAprovar");
			var oModel = this.getView().getModel();
			
			var oSelectedItems = this.getView().byId("idTableEnvioPedidos").getSelectedItems();
			var refModel = oSelectedItems[0].getBindingContext("PedidosAprovar");
			
			var itemAprovar = refModel.getModel().oData[refModel.getPath().substring(1,2)];
			
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
				VlrbonVvb: String(itemAprovar.Vlrbonvvb)
			};
					
			oModel.create("/AprovarOV", aux , {
				success: function (retorno) {
					oItensAprovar = [];
					
					if (that._ItemDialog) {
						that._ItemDialog.destroy(true);
					}
						
					sap.m.MessageBox.show(
						"Verifique a conexão com a internet!", {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Falha na Conexão!",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function (oAction) {
									
								oModel.read("/PedidosAprovar", {
									urlParameters: {
										"$filter": "IAprovador eq '" + codRepres + "'"
									},
									success: function (retorno) {
										oItensAprovar = [];
										
										for (var i = 0; i < retorno.results.length; i++) {
												
											var data = retorno.results[i].Erdat;
											data = data.substring(6,8) + "/" + data.substring(4,6) + "/" + data.substring(0,4);
											
											var hora = retorno.results[i].Horaped;
											hora = hora.substring(0,2) + ":" + hora.substring(2,4);
												
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
												Valcomdesc: parseFloat(retorno.results[i].Valcomdesc),
												Valcampbrinde: parseFloat(retorno.results[i].Valcampbrinde),
												Valcomutdesc: parseFloat(retorno.results[i].Valcomutdesc),
												Valverbautdesc: parseFloat(retorno.results[i].Valverbautdesc),
												Valtotpedido: parseFloat(retorno.results[i].Valtotpedido),
												Valtotabcampenx: parseFloat(retorno.results[i].Valtotabcampenx),
												Valtotabcampglob: parseFloat(retorno.results[i].Valtotabcampglob),
												Valtotabcamppa: parseFloat(retorno.results[i].Valtotabcamppa),
												Valtotabcampbrinde: parseFloat(retorno.results[i].Valtotabcampbrinde),
												Valtotexcdesc: parseFloat(retorno.results[i].Valtotexcdesc),
												Valtotexcndirdesc: parseFloat(retorno.results[i].Valtotexcndirdesc),
												Valtotexcndirprazo: parseFloat(retorno.results[i].Valtotexcndirprazo),
												Valtotexcprazo: parseFloat(retorno.results[i].Valtotexcprazo),
												Valverbapedido: parseFloat(retorno.results[i].Valverbapedido),
												Valabverba: parseFloat(retorno.results[i].Valabverba),
												Valcomutprazo: parseFloat(retorno.results[i].Valcomutprazo),
												Valtotabcomissao: parseFloat(retorno.results[i].Valtotabcomissao),
												Vlramo: retorno.results[i].Vlramo,
												VlramoCom: retorno.results[i].VlramoCom,
												VlramoDd: retorno.results[i].VlramoDd,
												VlramoVm: retorno.results[i].VlramoVm,
												VlramoVvb: retorno.results[i].VlramoVvb,
												Vlrbon: retorno.results[i].Vlrbon,
												VlrbonCom: retorno.results[i].VlrbonCom,
												VlrbonDd: retorno.results[i].VlrbonDd,
												VlrbonVm: retorno.results[i].VlrbonVm,
												VlrbonVvb: retorno.results[i].VlrbonVvb,
												Vlrbri: retorno.results[i].Vlrbri,
												VlrbriCom: retorno.results[i].VlrbriCom,
												VlrbriDd: retorno.results[i].VlrbriDd,
												VlrbriVm: retorno.results[i].VlrbriVm,
												VlrbriVvb: retorno.results[i].VlrbriVvb,
												Vlrdsc: retorno.results[i].Vlrdsc,
												VlrdscCom: retorno.results[i].VlrdscCom,
												VlrdscDd: retorno.results[i].VlrdscDd,
												VlrdscVm: retorno.results[i].VlrdscVm,
												VlrdscVvb: retorno.results[i].VlrdscVvb,
												Vlrdst: retorno.results[i].Vlrdst,
												Vlrexc: retorno.results[i].Vlrexc,
												Vlrprz: retorno.results[i].Vlrprz,
												VlrprzCom: retorno.results[i].VlrprzCom,
												VlrprzDd: retorno.results[i].VlrprzDd,
												VlrprzVm: retorno.results[i].VlrprzVm,
												VlrprzVvb: retorno.results[i].VlrprzVvb,
											};
											
											oItensAprovar.push(aux);
										}
										
										var oModelAprovacoes = new sap.ui.model.json.JSONModel(oItensAprovar);
										that.getView().setModel(oModelAprovacoes, "PedidosAprovar");
										that.byId("idTableEnvioPedidos").setBusy(false);
									},
									error: function (error) {
										console.log(error);
										that.byId("idTableEnvioPedidos").setBusy(false);
										that.onMensagemErroODATA(error.statusCode);
									}
								});
							}
						}
					);
					
				},
				error: function (error) {
					console.log(error);
					that.byId("idTableEnvioPedidos").setBusy(false);
					that.onMensagemErroODATA(error.statusCode);
				}
			});
			
		},
		
		onCancelar: function(){
			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
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