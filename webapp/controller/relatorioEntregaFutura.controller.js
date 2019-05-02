/*eslint-disable no-console, no-alert */
/*eslint-disable no-console, sap-no-localstorage */
sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function(jQuery, MessageToast, Fragment, BaseController, Filter, FilterOperator, MessageBox) {
	"use strict";
	var vetorCliente = [];
	var vClientesUnicosEF = [];
	var oItensEF = [];
	var oItemEF2 = [];
	var oPedEF = [];

	var oSF;

	return BaseController.extend("testeui5.controller.relatorioEntregaFutura", {

		onInit: function() {
			this.getRouter().getRoute("relatorioEntregaFutura").attachPatternMatched(this._onLoadFields, this);
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onNavBack2: function() {
			var isTablet = this.getOwnerComponent().getModel("modelAux").getProperty("/isTablet");

			if (isTablet == true) {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			} else {
				// this.byId("table_pedidos").clearSelection();
				this.byId("listClientes").removeSelections(true);
				this.onPressDetailBack();
			}
		},
		/* Fim navBack2*/

		onPressDetailBack: function() {
			this.getSplitContObj().backDetail();
			// this.getView().byId("ObjListCliente").removeSelections(true);
			// this.byId("ObjListCliente").setProperty("/selected", false);
		},
		/* Fim onPressDetailBack*/

		onSearch: function(oEvent) {
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
		/* Fim onSearch*/
		
		onSearch2: function(oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Erdat", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("tEntregas").getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

		},
		
		onDetalharItens: function (oEvent) {
			var that = this;
			var iVbeln = oEvent.getParameter("listItem").getBindingContext("PedidosEF").getProperty("Vbeln");
			var open = indexedDB.open("VB_DataBase");
			
			open.onerror = function() {
				MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				var db = open.result;
	
				var transactionPedEF = db.transaction("EntregaFutura3", "readonly");
				var objectStorePedEF = transactionPedEF.objectStore("EntregaFutura3");
				var ixVbeln = objectStorePedEF.index("Vbeln");
				
				var reqEF = ixVbeln.getAll(iVbeln);
				
				reqEF.onsuccess = function(event) {
					var oModel = new sap.ui.model.json.JSONModel(event.target.result);
					that.getView().setModel(oModel, "ItensEF");
					 
					if (!this._oDItens) {
						this._oDItens = sap.ui.xmlfragment("testeui5.view.relatorioEntregaFuturaItens", that);
					}
					
					this._oDItens.setMultiSelect(false);
					this._oDItens.setRememberSelections(false);
					that.getView().addDependent(this._oDItens);
		
					// toggle compact style
					jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), this._oDItens);
					this._oDItens.open();
				};
			};
		},
		/*onDetalharItens*/
		
		hProcurar: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Arktx", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		/* hProcurar */

		onExit: function() {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},
		/* Fim onExit*/

		_onLoadFields: function() {
			var that = this;

			this.onPressDetailBack();
			oSF = this.byId("sfItem");

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				var db = open.result;

				/* Recupero uma lista de todos os clientes que possuem venda futura */
				var transaction = db.transaction("EntregaFutura3", "readonly");
				var objectStore = transaction.objectStore("EntregaFutura3");
				var iKunrg = objectStore.index("Kunrg");

				var pClientes = new Promise(function(resolv, rject) {

					var reqEF = iKunrg.openCursor(undefined, "nextunique");

					vetorCliente = [];
					vClientesUnicosEF = [];
					/* Recuperto todos os clientes únicos do processo de entrega futura */
					reqEF.onsuccess = function(event) {
						var cursor = event.target.result;

						if (cursor) {
							vClientesUnicosEF.push(cursor.value);
							cursor.continue();
						} else {
							
							var sUltimoCliente = vClientesUnicosEF[vClientesUnicosEF.length - 1].Kunrg;
							/* Percorro todos os clientes que possuem vendas futuras pra recupearar cada 1 
							individualmente do cadastro de clientes */
							for (var i = 0; i < vClientesUnicosEF.length; i++) {
								var tCliente = db.transaction("Clientes", "readonly");
								var osCliente = tCliente.objectStore("Clientes");

								var reqClientes = osCliente.getAll(vClientesUnicosEF[i].Kunrg);

								reqClientes.onsuccess = function(event) {
									var cliente = event.target.result;
									
									if (cliente[0]){
										vetorCliente.push(cliente[0]);
										
										if (cliente[0].kunnr === sUltimoCliente){
											resolv(vetorCliente);
										}
									}

									// if (cursor2) {
									// 	vetorCliente.push(event.target.result.value);

									// 	cursor2.continue();
									// } else {
									// 	resolv(vetorCliente);
									// }
								};

								reqClientes.onerror = function(event) {
									console.log(event);
								};
							} /* for */
						} /* if */
					}; /* reqEF */

				});

				pClientes.then(function(vetorCliente) {
					var oModel = new sap.ui.model.json.JSONModel(vetorCliente);
					var oAux = that.getOwnerComponent().getModel("modelAux");
					that.getView().setModel(oModel, "clientesCadastrados");

					var sKunrg = oAux.getProperty("/KunrgEntrega");

					if (sKunrg) {
						that.getView().byId("ifVbeln").setValue("");
						that.getView().setModel(undefined, "ItensEF");

						oAux.setProperty("/KunrgEntrega", undefined);

						// that.byId("listClientes").attachItemPress(that.byId("listClientes").getItems()[0]);
						that.getSplitContObj().toDetail(that.createId("detail"));
						var oItem = that.byId("listClientes").getItems();

						var sTempCliente = "";
						var iIdItem = -1;
						/* Descubro qual o cliente em questão */
						for (var i = 0; i < oItem.length; i++) {
							sTempCliente = oItem[i].getNumber();

							if (sKunrg == sTempCliente) {
								iIdItem = i;
								break;
							}
						}

						/* Verifico se foi possível encontrar o cliente */
						if (iIdItem == -1) {
							MessageBox.show("Não foi possivel localizar o cliente.", {
								icon: MessageBox.Icon.ERROR,
								title: "Cliente não localizado.",
								actions: [MessageBox.Action.OK]
							});

							return;
						}

						that.onOpenFormDetail(oItem[iIdItem]);

						// that.byId("listClientes").attachSelectionChange(undefined, that.onSelectionChange, that.byId("listClientes").getItems()[0]);
					}
				});

			};
		},
		/*Fim _onLoadFields */

		onSelectionChange: function(oEvent) {
			oItensEF = [];
			oPedEF = [];

			//filtra somente os pedidos do cliente e vai pra detail
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

			this.onOpenFormDetail(oItem);
		},
		/*Fim onSelectionChange */

		onOpenFormDetail: function(oItem) {
			var that = this;
			oPedEF = [];

			//seta os dados da objectHeader
			// this.getView().byId("objectHeader").setTitle(oItem.getTitle());
			// this.getView().byId("objectHeader").setNumber(oItem.getNumber());
			// this.getView().byId("objectAttribute_cnpj").setText(oItem.getIntro());
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", oItem.getNumber());
			this.getSplitContObj().toDetail(this.createId("detail"));

			this.onGetDataFromEF2(oItem.getNumber());

			this.onClearView();

			var open = indexedDB.open("VB_DataBase");
			open.onerror = function() {
				MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				var db = open.result;
				var promise = new Promise(function(resolve, reject) {
					that.carregaModelCliente(db, resolve, reject);
				});

				promise.then(function() {
					var transactionPedEF = db.transaction("EntregaFutura3", "readonly");
					var objectStorePedEF = transactionPedEF.objectStore("EntregaFutura3");
					var iVbeln = objectStorePedEF.index("Vbeln");

					/* Cursor para percorrer todos os PEDIDOS ÚNICOS EF */
					iVbeln.openCursor(undefined, "nextunique").onsuccess = function(event) {
						var cursor = event.target.result;

						if (cursor) {
							if (cursor.value.Kunrg === oItem.getNumber()) {
								oPedEF.push(cursor.value);
							}
							cursor.continue();
						} else {
							var oModel = new sap.ui.model.json.JSONModel(oPedEF);
							that.getView().setModel(oModel, "PedidosEF");
						}
					}; /* Fim do cursor PEDIDOS ÚNICOS EF */

				});
			};
		},
		/*Fim onOpenForm */

		getSplitContObj: function() {
			var result = this.byId("SplitContDemo2");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		},
		/*Fim getSplitContObj*/

		carregaModelCliente: function(db, resolve, reject) {
			var that = this;

			var codCliente = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			var tx = db.transaction("Clientes", "readwrite");
			var objClientes = tx.objectStore("Clientes");

			var request = objClientes.get(codCliente);

			request.onsuccess = function(e1) {

				var result = e1.target.result;

				if (result !== null && result !== undefined) {

					that.getOwnerComponent().getModel("modelCliente").setProperty("/Kunnr", result.kunnr);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Land1", result.land1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name1", result.name1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name2", result.name2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort01", result.ort01);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort02", result.ort02);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Regio", result.regio);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stras", result.stras);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Pstlz", result.pstlz);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd1", result.stcd1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd2", result.stcd2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Inco1", result.inco1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Parvw", result.parvw);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Lifnr", result.lifnr);
					resolve();
				} else {
					console.log("ERRO!! Falha ao ler Clientes.");
					reject();
				}
			};
		},
		/* Fim carregaModelCliente */

		onSelectDialogPress: function(oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("testeui5.view.Dialog", this);
			}

			oSF.setValue('');
			var oModel = this.getView().getModel("PedidosEF");

			this._oDialog.setModel(oModel, "PedidosEF");
			this._oDialog.setMultiSelect(false);
			this._oDialog.setShowClearButton(true);
			this._oDialog.setGrowing(true);

			// Limpa o filtro da pesquisa antigo
			this._oDialog.getBinding("items").filter([]);

			// Alternar o estilo compacto (toggle compact style)
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},
		/* Fim onSelectDialogPress */

		onDialogClose: function(oEvent) {
			var that = this;
			var aContexts = oEvent.getParameter("selectedContexts");

			oItensEF = [];
			if (aContexts && aContexts.length) {
				var iVbeln = aContexts[0].getObject().Vbeln;
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function() {
					MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function() {
					var db = open.result;

					/* É necessário verificar se já existem lançamentos com Vbeln diferentes*/
					var tPedEF2 = db.transaction("EntregaFutura2", "readonly");
					var osPedEF2 = tPedEF2.objectStore("EntregaFutura2");

					var reqEF2 = osPedEF2.getAll();

					var p1 = new Promise(function(res, rej) {
						reqEF2.onsuccess = function(event) {
							var vEntregas = event.target.result;

							for (var i = 0; i < vEntregas.length; i++) {
								var oErro = [];

								oErro.iVbeln = vEntregas[0].Vbeln;
								oErro.iKunrg = vEntregas[0].Kunrg;

								if (vEntregas[i].Vbeln != iVbeln) {
									rej(oErro);
								}
							}

							res();
						};
					});
					/* --- */

					p1.then(function() {
						that.getView().byId("ifVbeln").setValue(iVbeln);

						var transactionPedEF = db.transaction("EntregaFutura", "readonly");
						var objectStorePedEF = transactionPedEF.objectStore("EntregaFutura");
						var keyRangeValue = IDBKeyRange.only(iVbeln);
						var ixVbeln = objectStorePedEF.index("Vbeln");

						var request = ixVbeln.openCursor(keyRangeValue);

						request.onsuccess = function(event) {
							var cursor = event.target.result;

							if (cursor) {
								oItensEF.push(cursor.value);
								cursor.continue();
							} else {
								var oModel = new sap.ui.model.json.JSONModel(oItensEF);
								that.getView().setModel(oModel, "ItensEF");
							}
						};

						request.onerror = function(event) {
							MessageBox.show("Não foi possivel fazer leitura do Banco Interno.", {
								icon: MessageBox.Icon.ERROR,
								title: "Banco não encontrado!",
								actions: [MessageBox.Action.OK]
							});
						};

					}).catch(function(oErro) {

						MessageBox.show("Finalize ou delete o envio de saldo do cliente " + oErro.iKunrg + ", pedido " + oErro.iVbeln + " para liberar uma nova digitação.", {
							icon: MessageBox.Icon.ERROR,
							title: "Erro!",
							actions: [MessageBox.Action.OK]
						});
					});
				};
			} else {
				oItensEF = [];
				var oModel = new sap.ui.model.json.JSONModel(oItensEF);
				that.getView().setModel(oModel, "ItensEF");

				MessageToast.show("Nenhum item foi selecionado.");
			}
		},
		/* Fim onDialogClose */

		onDialogSearch: function(oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			var oFilter = [new Filter("Vbeln", sap.ui.model.FilterOperator.Contains, sValue),
				new Filter("NameOrg1", sap.ui.model.FilterOperator.Contains, sValue)
			];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);

			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters, "Application");
		},
		/* Fim onDialogSearch */

		sfItemSearch: function(oEvent) {
			var that = this;
			var sMatnr = oEvent.getParameter("query");
			// var sMatnr = oEvent.getParameter("suggestionItem");
			var oModel = this.getView().getModel("ItensEF").getData();
			var sVbeln = this.getView().byId("ifVbeln").getValue();
			var iQtdeFaturada = 0;
			var iSaldoSap = 0;

			/* VOU TER QUE MUDAR A FORMA QUE PEGA O SALDO DIA, O SALDO DIA VAI TER
			QUE SER UM SELECT NA ENTREGAFUTURA2 PARA O ITEM SELECIONADO */
			if (sMatnr) {

				var iQtdeDia = 0;

				/* Recupero o saldo do Sap do item escolhido. */
				for (var i = 0; i < oModel.length; i++) {
					if (oModel[i].Matnr == sMatnr) {
						iQtdeFaturada = parseInt(oModel[i].Fkimg);
						iSaldoSap = parseInt(oModel[i].Sldfut);
						iQtdeDia = parseInt(oModel[i].Slddia);
					}
				}

				/* Recupero o saldo do Sap do item escolhido. */
				var open = indexedDB.open("VB_DataBase");
				open.onsuccess = function(ev) {
					var db = open.result;

					var tEF2 = db.transaction("EntregaFutura2", "readonly");
					var oEF2 = tEF2.objectStore("EntregaFutura2");
					var ixVbeln = oEF2.index("Vbeln");

					var reqEntrega2 = ixVbeln.getAll(sVbeln);

					reqEntrega2.onsuccess = function(event) {
						var vEntregas = event.target.result;
						var bErro = false;

						for (var i = 0; i < vEntregas.length; i++) {
							if (vEntregas[i].Matnr == sMatnr) {
								// iQtdeDia += parseInt(vEntregas[i].Fkimg2);
								bErro = true;

								break;
							}
						}

						if (bErro) {
							/* Se esse item já foi digitado, mando uma mensagem de erro */
							MessageBox.show("Item já digitado, por favor verifique.", {
								icon: MessageBox.Icon.ERROR,
								title: "Erro",
								actions: [MessageBox.Action.OK],
							});

							that.byId("sfItem").setValue("");
							return;
						} else {
							var saldo = 0;
							saldo = iSaldoSap - iQtdeDia;

							that.byId("ifSaldo").setValue(saldo);
						}
					};
				};

			} else {
				this.getView().byId("ifSaldo").setValue("");
			}
		},
		/* Fim sfItemSearch */

		sfItemSuggest: function(oEvent) {
			var value = oEvent.getParameter("suggestValue");
			var filters = [];
			if (value) {
				filters = [
					new sap.ui.model.Filter([
						new sap.ui.model.Filter("Matnr", function(sText) {
							return (sText || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
						}),
						new sap.ui.model.Filter("Arktx", function(sDes) {
							return (sDes || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
						})
					], false)
				];
			}

			oSF.getBinding("suggestionItems").filter(filters);
			oSF.suggest();
		},
		/* Fim sfItemSuggest */

		onLiveChangeQtde: function(e) {
			var Qtde = e.getParameter("value");

			this.getView().byId("ifQtde").setValue(parseInt(Qtde));
		},
		/* onLiveChangeQtde  */

		onInserirItemPress: function(oEvent) {
			var iVbeln = 0;
			var iKunrg = 0;
			var sMatnr = 0;
			var iQuantidade = 0;
			var idEntregaFutura = 0;
			var iSaldo = 0;

			var that = this;

			iKunrg = this.getView().byId("objectHeader").getNumber();
			iVbeln = this.getView().byId("ifVbeln").getValue();
			sMatnr = this.getView().byId("sfItem").getValue();
			iQuantidade = this.getView().byId("ifQtde").getValue();
			iSaldo = parseInt(this.getView().byId("ifSaldo").getValue(), 10);

			idEntregaFutura = iVbeln.toString() + sMatnr;

			var open = indexedDB.open("VB_DataBase");
			open.onerror = function() {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				var db = open.result;

				var store = db.transaction("EntregaFutura", "readwrite");
				var objMaterial = store.objectStore("EntregaFutura");

				var requestEF = objMaterial.get(idEntregaFutura);

				requestEF.onsuccess = function(e) {
					var oItemEF = e.target.result;

					if (oItemEF == undefined) {
						MessageBox.show("Não existe o material: " + sMatnr, {
							icon: MessageBox.Icon.ERROR,
							title: "Material não encontrado.",
							actions: [MessageBox.Action.OK],
						});
					} else {
						/*INSERIR AQUI A REGRA DE VERIFICAÇÃO DE DISPONIBILIDADE DE ENTREGA DO ITEM EM QUESTÃO*/
						if (iQuantidade > iSaldo) {
							var sMsgErro = "Quantidade digitada é maior que a disponível para entrega.";
							MessageBox.error(sMsgErro, {
								icon: MessageBox.Icon.ERROR,
								title: "Erro",
								actions: [MessageBox.Action.OK],
							});
						} else {
							var oModelAux = that.getOwnerComponent().getModel("modelAux");

							oItemEF2.Arktx = oItemEF.Arktx;
							oItemEF2.Aubel = oItemEF.Aubel;
							oItemEF2.Aupos = oItemEF.Aupos;
							oItemEF2.Bstkd = oItemEF.Bstkd;
							oItemEF2.Fkimg = parseInt(oItemEF.Fkimg, 10);
							oItemEF2.Fkimg2 = iQuantidade;
							oItemEF2.IRepresentante = oItemEF.IRepresentante;
							oItemEF2.Kunrg = oItemEF.Kunrg;
							oItemEF2.Lifnr = oItemEF.Lifnr;
							oItemEF2.Matnr = oItemEF.Matnr;
							oItemEF2.NameOrg1 = oItemEF.NameOrg1;
							oItemEF2.NameOrg2 = oItemEF.NameOrg2;
							oItemEF2.Vbeln = oItemEF.Vbeln;
							oItemEF2.Posnr = oItemEF.Posnr;
							oItemEF2.Sldfut = iSaldo;
							// oItemEF2.Sldfut = oItemEF.Sldfut;
							oItemEF2.Slddia = oItemEF.Slddia;

							oItemEF2.codRepres = oModelAux.getProperty("/CodRepres");
							oItemEF2.codUsr = oModelAux.getProperty("/CodUsr");
							oItemEF2.tipoUsuario = oModelAux.getProperty("/Tipousuario");

							var sDataHora = that.onDataAtualizacao();

							oItemEF2.idEntregaFutura = oItemEF.Vbeln + '.' + sDataHora;

							var storeEF2 = db.transaction("EntregaFutura2", "readwrite");
							var objEF2 = storeEF2.objectStore("EntregaFutura2");

							var requestAdd = objEF2.add(oItemEF2);

							requestAdd.onsuccess = function(e) {
								sap.m.MessageBox.success("Material inserido com sucesso!", {
									icon: MessageBox.Icon.SUCCESS,
									title: "Material inserido.",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function() {
										that.onGetDataFromEF2(iKunrg);
										that.onClearView();
									}
								});
							};

							requestAdd.onerror = function(e) {
								var sMsgErro = "";

								if (e.srcElement.error.message.includes("Key already exists")) {
									sMsgErro = "Pedido e material já selecionado para entrega.";
								} else {
									sMsgErro = "Erro ao inserir material: " + e.srcElement.error;
								}

								MessageBox.error(sMsgErro, {
									icon: MessageBox.Icon.ERROR,
									title: "Erro",
									actions: [MessageBox.Action.OK],
								});
							};
						}
					}
				};
			};
		},
		/* Fim onInserirItemPress */

		onDataAtualizacao: function() {
			var date = new Date();
			var dia = String(date.getDate());
			var mes = String(date.getMonth() + 1);
			var ano = String(date.getFullYear());
			var minuto = String(date.getMinutes());
			var hora = String(date.getHours());
			var seg = String(date.getSeconds());

			if (dia.length == 1) {
				dia = String("0" + dia);
			}
			if (mes.length == 1) {
				mes = String("0" + mes);
			}
			if (minuto.length == 1) {
				minuto = String("0" + minuto);
			}
			if (hora.length == 1) {
				hora = String("0" + hora);
			}
			if (seg.length == 1) {
				seg = String("0" + seg);
			}
			//HRIMP E DATIMP
			var data = String(dia + "/" + mes + "/" + ano);
			var horario = String(hora) + ":" + String(minuto) + ":" + String(seg);

			var sRetorno = String(ano) + String(mes) + String(dia);
			sRetorno += '.' + String(hora) + String(minuto) + String(seg);

			return sRetorno;
		},

		onGetDataFromEF2: function(iKunrg) {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				var db = open.result;
				var store = db.transaction("EntregaFutura3", "readwrite");
				var objEF2 = store.objectStore("EntregaFutura3");
				var ixKunrg = objEF2.index("Kunrg");

				var request = ixKunrg.getAll(iKunrg);

				request.onsuccess = function(event) {
					var oVetorEF2 = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(oVetorEF2);
					that.getView().setModel(oModel, "entregasEnviar");
				};
			};
		},
		/* Fim onGetDataFromEF2 */

		onClearView: function() {
			// this.getView().byId("ifQtde").setValue(1);
			// this.getView().byId("ifSaldo").setValue("");
			// this.getView().byId("sfItem").setValue("");
		}
	});
});