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
				case "relatorios":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
					break;
				case "menuConsultas":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
					break;
				case "envioPedidos":
					var that = this;
					sap.m.MessageBox.warning(
						"Escolha o documento que gostaria de enviar.", {
							title: "Envio de documentos",
							actions: ["Pedido", "Entrega", sap.m.MessageBox.Action.CANCEL],
							onClose: function(sAction) {
								switch (sAction) {
									case "Pedido":
										that.getOwnerComponent().getModel("modelAux").setProperty("/bEnviarPedido", true);
										sap.ui.core.UIComponent.getRouterFor(that).navTo("enviarPedidos");
										break;
									case "Entrega":
										that.getOwnerComponent().getModel("modelAux").setProperty("/bEnviarPedido", false);
										sap.ui.core.UIComponent.getRouterFor(that).navTo("enviarPedidos");
										break;
									case "CANCEL":
										return;
								}
							}
						}
					);
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

								oModel.read("/PedidosAprovar/$count", {
									urlParameters: {
										"$filter": "IAprovador eq '" + codRepres + "'"
									},
									success: function(retorno) {
										// oMenuAprovar.number = retorno;
										oMenuAprovar.number = retorno;
										that.getView().getModel("menu").refresh();
									},
									error: function(error) {
										console.log(error);
										that.byId("idTableEnvioPedidos").setBusy(false);
										that.onMensagemErroODATA(error.statusCode);
									}
								});
							}
						}
					}/*if bAprovador*/
					
					that.getView().getModel("menu").refresh(true);
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
		}

	});

});