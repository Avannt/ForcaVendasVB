/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/core/mvc/Controller"
], function(BaseController) {
	"use strict";

	return BaseController.extend("testeui5.controller.Menu", {

		onInit: function() {
			// sap.ui.getCore().byId("__component0---app--MyShell").setHeaderVisible(false);
			// this.setShellHeader(true);
			this.getRouter().getRoute("menu").attachPatternMatched(this._onRouteMatched, this);
		},

		onTile: function(oEvent) {
			switch (oEvent.getSource().data("opcao")) {
				case "pedido":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
					break;
				case "entregaFutura":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("entregaFutura");
					break;
				case "aprovacoes":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Aprovacoes");
					break;
				// case "relatorios":
				// 	sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
				// 	break;
				case "menuConsultas":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
					break;
			}
		},

		onExibicaoMenu: function() {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function(hxr) {
				console.log("Erro ao abrir tabelas.");
				console.log(hxr.Message);
			};

			open.onsuccess = function(e) {
				var db = e.target.result;
				var tx = db.transaction("Usuarios", "readwrite");
				var objUsuarios = tx.objectStore("Usuarios");
				var Werks = that.getOwnerComponent().getModel("modelAux").getProperty("/Werks");

				var request = objUsuarios.get(Werks);

				/* Verifico se existe a tabela de Usuários.*/
				request.onsuccess = function(e1) {
					var result1 = e1.target.result;

					that.getOwnerComponent().getModel("modelAux").setProperty("/Usuario", result1);
					var oPrincipal = that.getView().getModel("menu").getProperty("/Principal");

					/* TRATAMENTO DE EXIBIÇÃO DOS MENUS */
					// Oculto alguns menus para o usuário Preposto
					var sTipoUsuario = that.getOwnerComponent().getModel("modelAux").getProperty("/Tipousuario");
					
					/* Comentário mega blaster de bom
					result1.buGroup > VERT == Representante
					result1.buGroup > ZCO == Coordenador
					result1.buGroup > ZSR == Sup Regional
					result1.buGroup > ZSN == Sup Nacional
					result1.buGroup > ZPJ == VB
					
					Finalidade: variavel criada para ser usada na tela de relatórios de pedidos, se for != de 
					VERT chamar a RFC online para trazer os pedidos.
					*/
					that.getOwnerComponent().getModel("modelAux").setProperty("/TipoAprovador", result1.buGroup);
				
					// VERT -> Representante
					// Diferente de VERT -> Aprovador
					var bAprovador = (result1.buGroup != "VERT");
					// var bAprovador = true;
					
					var bPreposto = sTipoUsuario == "2";
					var bRepresentante = (sTipoUsuario == "1" && !bAprovador);
					
					/*Representante e Preposto -> Oculto aprovações */
					if (bRepresentante || bPreposto) {
						for (var i = 0; i < oPrincipal.length; i++) {
							
							if (oPrincipal[i].id == "aprovacoes") {
								oPrincipal[i].visible = false;
							}else if (oPrincipal[i].id == "pedido" || oPrincipal[i].id == "entregaFutura") {
								oPrincipal[i].visible = true;
							}
						}
					}
					
					/* Aprovador-> Ocultar pedido de vendas e entrega futura
								-> Verifico a quantidade de pedidos para aprovação*/
					if (bAprovador) {
						for (var i = 0; i < oPrincipal.length; i++) {
							
							if (oPrincipal[i].id == "pedido" || oPrincipal[i].id == "entregaFutura") {
								oPrincipal[i].visible = false;
							}
							
							if (oPrincipal[i].id == "aprovacoes") {
								var oMenuAprovar = oPrincipal[i];
								var oModel = that.getView().getModel();
								var codRepres = that.getView().getModel("modelAux").getProperty("/CodRepres");
								oMenuAprovar.visible = true;
								oMenuAprovar.busy = true;

								oModel.read("/PedidosAprovar/$count", {
									urlParameters: {
										"$filter": "IAprovador eq '" + codRepres + "'"
									},
									success: function(retorno) {
										// oMenuAprovar.number = retorno;
										oMenuAprovar.number = retorno;
										oMenuAprovar.busy = false;
										that.getView().getModel("menu").refresh();
									},
									error: function(error) {
										oMenuAprovar.busy = false;
										that.getView().getModel("menu").refresh();
										console.log(error);
										that.onMensagemErroODATA(error.statusCode);
									}
								});
							}
						}
					}/*if bAprovador*/
					
					that.getView().getModel("menu").refresh();
				};
			};
		},
		/* onExibicaoMenu */

		onDialogCloseImagem: function() {
			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onAfterRendering: function() {

		},
		
		_onRouteMatched: function(oEvent) {
			var oModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().getModel("modelAux");
			
			this.onExibicaoMenu();

			// var empresa = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			// var nomeEmpresa;
			// var icone;

			// if(empresa == 1){
			// 	nomeEmpresa = "Pred -Só Fruta -Lafer";
			// 	icone = "img/predilecta.png";
			// }
			// else if(empresa == 2){
			// 	nomeEmpresa = "Stella";
			// 	icone = "img/SD.png";
			// }
			// else if(empresa == 3){
			// 	nomeEmpresa = "Minas";
			// 	icone = "img/soFrutas.png";
			// }
			// this.getOwnerComponent().getModel("modelAux").setProperty("/nomeEmpresa", nomeEmpresa);
			// this.getOwnerComponent().getModel("modelAux").setProperty("/iconeEmpresa", icone);
			// this.getOwnerComponent().getModel("helper").setProperty("/showShellHeader", true);
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
					"Ocorreu uma falha com a comunicação do servidor (500). Refaça a operação.", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Falha de comunicação!",
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
						title: "Problema com a conexão!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					}
				);
			} else if(codigoErro == 503){
				sap.m.MessageBox.show(
					"Conexão perdida !Por favor, reinicie a aplicação!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Problema com a conexão!",
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