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
	var oPrePedidos = [];
	var variavelCodigoCliente = "";
	var ajaxCall;

	return BaseController.extend("testeui5.controller.Pedido", {

		onInit: function() {
			this.getRouter().getRoute("pedido").attachPatternMatched(this._onLoadFields, this);
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

		formatRentabilidade: function(Value) {
			if (Value > -3) {
				this.byId("table_pedidos").getColumns()[6].setVisible(false);
				return "";

			} else {
				this.byId("table_pedidos").getColumns()[6].setVisible(true);
				return Value;
			}
		},

		myFormatterCodEmpresa: function(value) {

			if (value == 1) {
				value = "Pred.";
				return value;
			}
			if (value == 2) {
				value = "SóFruta";
				return value;
			}
			if (value == 3) {
				value = "Stella";
				return value;
			}
			// if (value == 5) {
			// 	value = "";
			// 	return value;
			// }
			if (value == 6) {
				value = "Minas";
				return value;
			}
		},

		myFormatterDataImp: function(value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {
				var aux = value.split("/");
				// var aux2 = aux[2].substring(2, aux[2].length);
				// value = aux[0] + "/" + aux[1] + "/" + aux2;
				value = aux[0] + "/" + aux[1];
				return value;
			}
		},

		myFormatterPercLucro: function(aValue) {
			if (aValue !== undefined && aValue !== null && aValue !== "") {
				if (aValue < 0) {
					// sap.m.text.byId("idRentTable").addStyleClass("corVermelho");
					return aValue;
				} else {
					// sap.m.text.byId("idRentTable").addStyleClass("corVerde");
					return aValue;
				}
			}
		},

		_onLoadFields: function() {
			var that = this;

			this.getView().byId("objectHeader").setTitle();
			this.getView().byId("objectHeader").setNumber();
			this.getView().byId("objectAttribute_cnpj").setText();

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

				var transaction = db.transaction("Clientes", "readonly");
				var objectStore = transaction.objectStore("Clientes");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function(event) {
						vetorCliente = event.target.result;

						var oModel = new sap.ui.model.json.JSONModel(vetorCliente);
						that.getView().setModel(oModel, "clientesCadastrados");
					};
					
				}
			};
		},

		onDialogCloseImagem: function() {
			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onAfterRendering: function() {
			var oSplitCont = this.getSplitContObj(),
				ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
			// set all parent elements to 100% height, this should be done by app developer, but just in case
			if (ref && !ref._sapui5_heightFixed) {
				ref._sapui5_heightFixed = true;
				while (ref && ref !== document.documentElement) {
					var $ref = jQuery(ref);
					if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
						break;
					}
					if (!ref.style.height) {
						ref.style.height = "100%";
					}
					ref = ref.parentNode;
				}
			}
		},

		getSplitContObj: function() {
			var result = this.byId("SplitContDemo");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		},

		onPressNavToDetail: function() {
			this.getSplitContObj().to(this.createId("detailDetail"));
		},

		navBack2: function() {
			var isTablet = this.getOwnerComponent().getModel("modelAux").getProperty("/isTablet");

			if (isTablet == true) {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
			} else {
				// sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
				// sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");

				// this.byId("table_pedidos").clearSelection();
				this.byId("listClientes").removeSelections(true);
				this.onPressDetailBack();
			}
		},

		onPressDetailBack: function() {
			this.getSplitContObj().backDetail();
			// this.getView().byId("ObjListCliente").removeSelections(true);
			// this.byId("ObjListCliente").setProperty("/selected", false);
		},

		onSelectionChange: function(oEvent) {
			var that = this;
			oPrePedidos = [];
			//filtra somente os pedidos do cliente e vai pra detail
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			//seta os dados da objectHeader
			this.getView().byId("objectHeader").setTitle(oItem.getTitle());
			this.getView().byId("objectHeader").setNumber(oItem.getNumber());
			this.getView().byId("objectAttribute_cnpj").setText(oItem.getIntro());
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", oItem.getNumber());
			this.getSplitContObj().toDetail(this.createId("detail"));

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
					var transactionPrePedidos = db.transaction("PrePedidos", "readonly");
					var objectStorePrePedidos = transactionPrePedidos.objectStore("PrePedidos");
					
					objectStorePrePedidos.openCursor().onsuccess = function(event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.kunnr == that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr")) {
							oPrePedidos.push(cursor.value);
						}

						cursor.continue();

					} else{
						var oModel = new sap.ui.model.json.JSONModel(oPrePedidos);
						that.getView().setModel(oModel, "pedidosCadastrados");
					}
				};
			});
			};
		},

		carregaModelCliente: function(db, resolve, reject) {
			var that = this;

			var codCliente = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			var tx = db.transaction("Clientes", "readwrite");
			var objUsuarios = tx.objectStore("Clientes");

			var request = objUsuarios.get(codCliente);

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

		onAddPedido: function() {

			var that = this;

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedidoDetalhe");

			// var open1 = indexedDB.open("VB_DataBase");

			// open1.onerror = function(hxr) {
			// 	console.log("Erro ao abrir tabelas.");
			// 	console.log(hxr.Message);
			// };
			// //Load tables
			// open1.onsuccess = function(e) {
			// 	var db = open1.result;
			// 	var empresaCorrente = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			// 	var cliente = "";
			// 	var pedido = "";
			// 	var store = db.transaction("Clientes").objectStore("Clientes");
			// 	//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
			// 	store.openCursor().onsuccess = function(event) {
			// 		// consulta resultado do event
			// 		var cursor = event.target.result;
			// 		if (cursor) {
			// 			if (cursor.value.CodCliente == variavelCodigoCliente && cursor.value.IdBase == empresaCorrente) {
			// 				var nome = (cursor.value.NomeEmit);
			// 				that.getOwnerComponent().getModel("modelAux").setProperty("/CodCliente", cursor.value.CodCliente);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoRepresentante", cursor.value.CodigoRepresentante);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente", cursor.value.CodCliente);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCliente", nome);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeAbrevCliente", cursor.value.NomeAbrev);
			// 				//usado para popular o mov verba. pois naquele momento o programa reseta o modelCLIENTE antes usa-lo para popular o tal
			// 				that.getOwnerComponent().getModel("modelAux").setProperty("/NomeAbrev", cursor.value.NomeAbrev);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCidadeCliente", cursor.value.Cidade);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/cepCliente", cursor.value.CEP);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/matrizCliente", cursor.value.Matriz);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/estadoCliente", cursor.value.Estado);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/cnpjCliente", cursor.value.CNPJ);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/emailCliente", cursor.value.Email);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/emailContasCliente", cursor.value.Email_ContasPagar);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/emailXMLCliente", cursor.value.Email_XML);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/snCliente", cursor.value.SN);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/statusCreditoCliente", cursor.value.StatusCredito);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/enderecoCliente", cursor.value.Endereco);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/telefoneCliente", cursor.value.Telefone);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/dataCadastroCliente", cursor.value.DataCadastro);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/limiteCreditoCliente", cursor.value.LimiteCredito);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/canalVendaCliente", cursor.value.CanalVenda);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoEstadualCliente", cursor.value.InscricaoEstadual);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoAuxSubsTribCliente", cursor.value.InscricaoAuxSubsTrib);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/grupoCliente", cursor.value.Grupo);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoSuframaCliente", cursor.value.CodigoSuframa);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/dataLimiteCreditoCliente", cursor.value.DataLimiteCredito);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/valorUltimoTituloNFCliente", cursor.value.valorUltimoTituloNF);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/valorMaiorTituloNFCliente", cursor.value.ValorMaiorTituloNF);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/microrregiaoCliente", cursor.value.Microrregiao);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/faturarSaldoCliente", cursor.value.FaturaParcial);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/dataMaiorTituloNFCliente", cursor.value.DataMaiorTituloNF);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/dataUltimoTituloNFCliente", cursor.value.DataUltimoTituloNF);
			// 				that.getOwnerComponent().getModel("modelCliente").setProperty("/DataVigenciaInscSTCliente", cursor.value.DataVigenciaInscST);
			// 			}

			// 			cursor.continue();

			// 		}else{
			// 			var tx = db.transaction("Usuarios", "readwrite");
			// 			var objUsuarios = tx.objectStore("Usuarios");

			// 			var request = objUsuarios.get(empresaCorrente);

			// 			request.onsuccess = function(e1) {
			// 				var result1 = e1.target.result;
			// 				if (result1 !== null && result1 !== undefined) {
			// 					if (empresaCorrente == 1) {
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/senha1", result1.senha);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/userID", result1.codUsuario);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/emailRepres", result1.email);
			// 					}
			// 					if (empresaCorrente == 2) {
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/senha2", result1.senha);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/userID", result1.codUsuario);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/emailRepres", result1.email);
			// 					}
			// 					if (empresaCorrente == 3) {
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/senha3", result1.senha);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/userID", result1.codUsuario);
			// 						that.getOwnerComponent().getModel("modelAux").setProperty("/emailRepres", result1.email);
			// 					}

			// 					if (that.getView().byId("objectHeader").getNumber() == "") {
			// 						MessageBox.show("Nenhum cliente selecionado. Selecione um cliente na lista à esquerda.", {
			// 							icon: MessageBox.Icon.ERROR,
			// 							title: "Nenhum cliente selecionado",
			// 							actions: [MessageBox.Action.OK]
			// 						});
			// 						return;
			// 					} else if (that.getOwnerComponent().getModel("modelCliente").getProperty("inscricaoAuxSubsTribCliente") !== "" &&
			// 						that.getOwnerComponent().getModel("modelCliente").getProperty("inscricaoAuxSubsTribCliente") !== null &&
			// 						that.getOwnerComponent().getModel("modelCliente").getProperty("inscricaoAuxSubsTribCliente") !== undefined) {
			// 						var dataVigencia = that.getOwnerComponent().getModel("modelCliente").getProperty("/DataVigenciaInscSTCliente");
			// 						dataVigencia = dataVigencia.split("/");
			// 						dataVigencia = String(dataVigencia[2]) + String(dataVigencia[1]) + String(dataVigencia[0]);
			// 						dataVigencia = parseInt(dataVigencia);

			// 						var date = new Date();
			// 						var dia = String(date.getDate());
			// 						var tamanhoDia = parseInt(dia.length);
			// 						if (tamanhoDia == 1) {
			// 							dia = String("0" + dia);
			// 						}

			// 						var mes = String(date.getMonth() + 1);
			// 						var tamanhoMes = parseInt(mes.length);

			// 						if (tamanhoMes == 1) {
			// 							mes = String("0" + mes);
			// 						}

			// 						var ano = String(date.getFullYear());
			// 						var dataAtual = parseInt(ano + mes + dia);
			// 						if (dataVigencia < dataAtual) {

			// 							MessageBox.show("Cliente está com a Inscr Aux Subst Tributária fora da vigência!", {
			// 								icon: MessageBox.Icon.WARNING,
			// 								title: "Não Permitido",
			// 								actions: [MessageBox.Action.OK]
			// 							});

			// 						} else {
			// 							var store = db.transaction("PrePedidos").objectStore("PrePedidos");
			// 							store.openCursor().onsuccess = function(event) {
			// 								// consulta resultado do event
			// 								var cursor = event.target.result;

			// 								if (cursor) {
			// 									if (cursor.value.IdBase == empresaCorrente) {
			// 										if (cursor.value.idStatus != 3 && cursor.value.Completo != "Sim") {
			// 											cliente = cursor.value.CodCliente;
			// 											pedido = cursor.value.NrPedcli;
			// 										}
			// 									}
			// 									cursor.continue();
			// 								} else {
			// 									if (cliente != "" && pedido != "") {
			// 										MessageBox.show("O pedido do cliente " + cliente + " está incompleto", {
			// 											icon: MessageBox.Icon.ERROR,
			// 											title: "Falha iniciar do pedido",
			// 											actions: [MessageBox.Action.OK]
			// 										});

			// 									} else {

			// 										//CARREGA OS DADOS DO CLIENTE QUE FOI SELECIONADO.
			// 										// that.carregaModelCliente(variavelCodigoCliente, db);
			// 										sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
			// 										that.checkOnline(db);
			// 									}
			// 								}
			// 							};
			// 						}
			// 					}
			// 					//VERIFICA O STATUS DO CLIENTE .. SE ELE ESTIVER 'Suspenso' NÃO IMPLANTAR PEDIDO.
			// 					else if (that.getOwnerComponent().getModel("modelCliente").getProperty("/statusCreditoCliente") == "Suspenso") {

			// 						MessageBox.show("Situação de Crédito do Cliente não Permite Manutenção de Pedidos!", {
			// 							icon: MessageBox.Icon.WARNING,
			// 							title: "Não Permitido",
			// 							actions: [MessageBox.Action.OK]
			// 						});

			// 					} else if (result1.zeraVerba == "Sim") {
			// 						MessageBox.show("A rotina de zerar verba foi ativa, favor envie todos os pedidos pendentes ou delete - os", {
			// 							icon: MessageBox.Icon.WARNING,
			// 							title: "Rotina Obrigatória!",
			// 							actions: [MessageBox.Action.OK],
			// 							onClose: function() {
			// 								sap.ui.core.UIComponent.getRouterFor(that).navTo("enviarPedidos");
			// 							}
			// 						});
			// 					} else {

			// 						var store = db.transaction("PrePedidos").objectStore("PrePedidos");
			// 						store.openCursor().onsuccess = function(event) {
			// 							// consulta resultado do event
			// 							var cursor = event.target.result;

			// 							if (cursor) {
			// 								if (cursor.value.IdBase == empresaCorrente) {
			// 									if (cursor.value.idStatus != 3 && cursor.value.Completo != "Sim") {
			// 										cliente = cursor.value.CodCliente;
			// 										pedido = cursor.value.NrPedcli;
			// 									}
			// 								}
			// 								cursor.continue();
			// 							} else {
			// 								if (cliente != "" && pedido != "") {
			// 									MessageBox.show("O pedido do cliente " + cliente + " está incompleto.", {
			// 										icon: MessageBox.Icon.ERROR,
			// 										title: "Falha iniciar do pedido",
			// 										actions: [MessageBox.Action.OK]
			// 									});

			// 								} else {
			// 									//CARREGA OS DADOS DO CLIENTE QUE FOI SELECIONADO.
			// 									that.carregaModelCliente(variavelCodigoCliente, db);
			// 									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
			// 									that.checkOnline(db);

			// 								}
			// 							}
			// 						};
			// 					}
			// 				}
			// 		};
			// 		}
			// 	};
			// };
		},

		checkOnline: function(db) {
			var that = this;
			var mensagem1 = "";
			var tabela = "CheckAtualizacao";
			var jsonAtualizacao = [];
			var IdBase = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			var imeiCelular = that.getOwnerComponent().getModel("modelAux").getProperty("/imei");
			var numVersao = this.getOwnerComponent().getModel("modelAux").getProperty("/versaoApp");

			if (IdBase == 1) {
				var senha = that.getOwnerComponent().getModel("modelAux").getProperty("/senha1");
				var usuario = that.getOwnerComponent().getModel("modelAux").getProperty("/userID");
				var variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + usuario + '","senha":"' + senha +
					'","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]}}';

				var log =
					'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSPredilecta:WSPredilecta">' +
					'<soapenv:Header/>' +
					'<soapenv:Body>' +
					'<urn:GetCadastros>' +
					'<urn:inputXML>' + variavel + '</urn:inputXML>' +
					'<urn:inputTabela>' + tabela + '</urn:inputTabela>' +
					'</urn:GetCadastros>' +
					'</soapenv:Body>' +
					'</soapenv:Envelope>';

				var settings = {
					"async": true,
					"crossDomain": true,
					"url": "http://200.205.54.10:8180/wsa/WSPredilecta",
					"method": "POST",
					"headers": {
						"content-type": "text/xml;charset=UTF-8",
						"soapaction": "\\\"urn:WSPredilecta\\\"",
						"cache-control": "no-cache",
						"dataType": "json",
						"postman-token": "6bb5f28c-0326-4f98-0475-1fb4db00ea5f"
					},
					"data": log
				};

			}
			if (IdBase == 2) {
				var senha2 = that.getOwnerComponent().getModel("modelAux").getProperty("/senha2");
				usuario = that.getOwnerComponent().getModel("modelAux").getProperty("/userID");
				variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + usuario + '","senha":"' + senha2 +
					'","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]}}';

				var log =
					'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSStella:WSStella">' +
					'<soapenv:Header/>' +
					'<soapenv:Body>' +
					'<urn:GetCadastros>' +
					'<urn:inputXML>' + variavel + '</urn:inputXML>' +
					'<urn:inputTabela>' + tabela + '</urn:inputTabela>' +
					'</urn:GetCadastros>' +
					'</soapenv:Body>' +
					'</soapenv:Envelope>';

				var settings = {
					"async": true,
					"crossDomain": true,
					"url": "http://200.205.54.10:8380/wsa/WSStella",
					"method": "POST",
					"headers": {
						"content-type": "text/xml;charset=UTF-8",
						"soapaction": "\\\"urn:WSStella\\\"",
						"cache-control": "no-cache",
						"dataType": "json",
						"postman-token": "6bb5f28c-0326-4f98-0475-1fb4db00ea5f"
					},
					"data": log
				};
			}
			if (IdBase == 3) {
				var senha3 = that.getOwnerComponent().getModel("modelAux").getProperty("/senha3");
				usuario = that.getOwnerComponent().getModel("modelAux").getProperty("/userID");
				variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + usuario + '","senha":"' + senha3 +
					'","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]}}';

				var log =
					'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSMinas:WSMinas">' +
					'<soapenv:Header/>' +
					'<soapenv:Body>' +
					'<urn:GetCadastros>' +
					'<urn:inputXML>' + variavel + '</urn:inputXML>' +
					'<urn:inputTabela>' + tabela + '</urn:inputTabela>' +
					'</urn:GetCadastros>' +
					'</soapenv:Body>' +
					'</soapenv:Envelope>';

				var settings = {
					"async": true,
					"crossDomain": true,
					"url": "http://200.205.54.10:8480/wsa/WSMinas",
					"method": "POST",
					"headers": {
						"content-type": "text/xml;charset=UTF-8",
						"soapaction": "\\\"urn:WSMinas\\\"",
						"cache-control": "no-cache",
						"dataType": "json",
						"postman-token": "6bb5f28c-0326-4f98-0475-1fb4db00ea5f"
					},
					"data": log
				};
			}

			//CHAMADA DO WEBSERVICE DA PRIMEIRA EMPRESA.
			ajaxCall = $.ajax(settings).done(function(response) {
				mensagem1 = response.getElementsByTagName("outputResult");
				mensagem1 = mensagem1[0].innerHTML;
				var x = response.getElementsByTagName("outputJASON");
				var y = x[0].textContent;
				if (mensagem1 == 'OK') {
					jsonAtualizacao = JSON.parse(y);
				}

			}).fail(function(xhr, statusReq) {
				if (xhr.status == 0) {
					// MessageBox.show("Verifique a internet e/ou Espere a reinicialização do servidor", {
					// 	icon: MessageBox.Icon.ERROR,
					// 	title: "Erro de conexão!",
					// 	actions: [MessageBox.Action.OK]
					// });
					console.log("Verifique a internet e/ou Espere a reinicialização do servidor");
				}
				if (xhr.status == 404) {
					// MessageBox.show("Página não encontrada", {
					// 	icon: MessageBox.Icon.ERROR,
					// 	title: "Erro de conexão!",
					// 	actions: [MessageBox.Action.OK]
					// });
					console.log("Página não encontrada");
				}
				if (xhr.status == 500) {
					// MessageBox.show("Servidor está fora do ar. Entre em contato com a TI", {
					// 	icon: MessageBox.Icon.ERROR,
					// 	title: "Erro de conexão!",
					// 	actions: [MessageBox.Action.OK]
					// });
					console.log("Servidor está fora do ar. Entre em contato com a TI");
				}
			}).then(function() {
				if (mensagem1 == 'OK') {
					var empresaCorrente = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

					var tx = db.transaction("Usuarios", "readwrite");
					var objUsuarios = tx.objectStore("Usuarios");

					var aux = [];

					var request = objUsuarios.get(jsonAtualizacao.UsuarioCollection[0].idEmpresa);

					request.onsuccess = function(e1) {
						var result1 = e1.target.result;

						if (result1 !== null && result1 !== undefined) {
							aux = {
								idEmpresa: jsonAtualizacao.UsuarioCollection[0].idEmpresa,
								email: jsonAtualizacao.UsuarioCollection[0].email,
								atualizacao: jsonAtualizacao.UsuarioCollection[0].atualizacao,
								codUsuario: jsonAtualizacao.UsuarioCollection[0].codUsuario,
								nomeUsuario: jsonAtualizacao.UsuarioCollection[0].nomeUsuario,
								nomeEmpresa: result1.nomeEmpresa,
								senha: result1.senha,
								hrImp: result1.hrImp,
								departamento: result1.departamento,
								dataAtualizacao: result1.dataAtualizacao,
								imei: result1.imei,
								zeraVerba: result1.zerarVerba,
								utilizaMobile: result1.utilizaMobile

							};

							var request1 = objUsuarios.put(aux);

							request1.onsuccess = function(event) {
								if (aux.atualizacao == "Sim") {
									MessageBox.show("Você precisa realizar a atualização das tabelas.", {
										icon: MessageBox.Icon.WARNING,
										title: "ATUALIZAÇÃO",
										actions: [MessageBox.Action.OK],
										onClose: function(oAction) {
											if (oAction == sap.m.MessageBox.Action.OK) {
												sap.ui.core.UIComponent.getRouterFor(that).navTo("login");
												aux = {
													idEmpresa: "",
													email: "",
													atualizacao: "",
													codUsuario: "",
													nomeUsuario: "",
													nomeEmpresa: "",
													senha: "",
													hrImp: "",
													departamento: "",
													dataAtualizacao: "",
													imei: "",
													zeraVerba: "",
													utilizaMobile: ""
												};
											}
										}
									});
								}
							};
							request1.onerror = function(event) {
								aux = {
									idEmpresa: "",
									email: "",
									atualizacao: "",
									codUsuario: "",
									nomeUsuario: "",
									nomeEmpresa: "",
									senha: "",
									hrImp: "",
									departamento: "",
									dataAtualizacao: "",
									imei: "",
									zeraVerba: "",
									utilizaMobile: ""
								};
								console.log("Dados do Usuário não foram inseridos :");
							};
						}
					};

					request.onerror = function(ex) {
						console.log(ex);
						console.log("Não foi possivel encontrar o registro na tabela de usuários");
					};
				} else {
					MessageBox.show(mensagem1, {
						icon: MessageBox.Icon.ERROR,
						title: "Atenção!",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
							if (mensagem1.substring(0, 9) == "Erro IMEI") {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
							} else if (mensagem1.substring(0, 11) == "Erro Versão") {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
							} else {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
							}
						}
					});
				}
			});

			// ajaxCall = $.ajax({
			// 	type: "POST",
			// 	url: 'http://200.205.54.10:8280/WebService.asmx/GetCadastrosWSDL',
			// 	data: "{inputXML:" + "'" + log + "'" + "," + "inputTabela:" + "'" + tabela + "'" + "}",
			// 	contentType: "application/json; charset=utf-8",
			// 	dataType: "json",
			// 	success: function(data) {
			// 		var empresaCorrente = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			// 		var result = data.d;

			// 		for (var i = 0; i < result.length; i++) {
			// 			if (result[i] !== null) {
			// 				result[i] = result[i].substring(0, result[i].length - 1);
			// 				result[i] = "{" + result[i] + "}";
			// 				var resultAux = JSON.parse(result[i]);
			// 			}
			// 		}

			// 		var tx = db.transaction("Usuarios", "readwrite");
			// 		var objUsuarios = tx.objectStore("Usuarios");

			// 		var aux = [];
			// 		// aux[0] = {
			// 		// 	idEmpresa: resultAux.UsuarioCollection[0].idEmpresa,
			// 		// 	email: resultAux.UsuarioCollection[0].email,
			// 		// 	atualizacao: resultAux.UsuarioCollection[0].atualizacao,
			// 		// 	codUsuario: resultAux.UsuarioCollection[0].codUsuario,
			// 		// 	nomeUsuario: resultAux.UsuarioCollection[0].nomeUsuario
			// 		// };

			// 		var request = objUsuarios.get(resultAux.UsuarioCollection[0].idEmpresa);

			// 		request.onsuccess = function(e1) {
			// 			var result1 = e1.target.result;

			// 			if (result1 !== null && result1 !== undefined) {
			// 				aux = {
			// 					idEmpresa: resultAux.UsuarioCollection[0].idEmpresa,
			// 					email: resultAux.UsuarioCollection[0].email,
			// 					atualizacao: resultAux.UsuarioCollection[0].atualizacao,
			// 					codUsuario: resultAux.UsuarioCollection[0].codUsuario,
			// 					nomeUsuario: resultAux.UsuarioCollection[0].nomeUsuario,
			// 					nomeEmpresa: result1.nomeEmpresa,
			// 					senha: result1.senha,
			// 					hrImp: result1.hrImp,
			// 					departamento: result1.departamento,
			// 					dataAtualizacao: result1.dataAtualizacao

			// 				};

			// 				var request1 = objUsuarios.put(aux);

			// 				request1.onsuccess = function(event) {
			// 					if (aux.atualizacao == "Sim") {
			// 						MessageBox.show("Voçê precisa realizar a atualização das tabelas.", {
			// 							icon: MessageBox.Icon.WARNING,
			// 							title: "ATUALIZAÇÃO",
			// 							actions: [MessageBox.Action.OK],
			// 							onClose: function(oAction) {
			// 								if (oAction == sap.m.MessageBox.Action.OK) {
			// 									sap.ui.core.UIComponent.getRouterFor(that).navTo("login");
			// 									aux = {
			// 										idEmpresa: "",
			// 										email: "",
			// 										atualizacao: "",
			// 										codUsuario: "",
			// 										nomeUsuario: "",
			// 										nomeEmpresa: "",
			// 										senha: "",
			// 										hrImp: "",
			// 										departamento: "",
			// 										dataAtualizacao: ""
			// 									};
			// 								}
			// 							}
			// 						});
			// 					}
			// 				};
			// 				request1.onerror = function(event) {
			// 					aux = {
			// 						idEmpresa: "",
			// 						email: "",
			// 						atualizacao: "",
			// 						codUsuario: "",
			// 						nomeUsuario: "",
			// 						nomeEmpresa: "",
			// 						senha: "",
			// 						hrImp: "",
			// 						departamento: "",
			// 						dataAtualizacao: ""
			// 					};
			// 					console.log("Dados do Usuário não foram inseridos :");
			// 				};
			// 			}
			// 		};

			// 		request.onerror = function(ex) {
			// 			console.log(ex);
			// 			console.log("Não foi possivel encontrar o registro na tabela de usuários");
			// 		};
			// 	},
			// 	error: function(xhr) {
			// 		var tx = db.transaction("Usuarios", "readwrite");
			// 		var objUsuarios = tx.objectStore("Usuarios");

			// 		var aux = [];
			// 		// aux[0] = {
			// 		// 	idEmpresa: resultAux.UsuarioCollection[0].idEmpresa,
			// 		// 	email: resultAux.UsuarioCollection[0].email,
			// 		// 	atualizacao: resultAux.UsuarioCollection[0].atualizacao,
			// 		// 	codUsuario: resultAux.UsuarioCollection[0].codUsuario,
			// 		// 	nomeUsuario: resultAux.UsuarioCollection[0].nomeUsuario
			// 		// };

			// 		var request = objUsuarios.get(IdBase);

			// 		request.onsuccess = function(e1) {
			// 			var result1 = e1.target.result;

			// 			if (result1 !== null && result1 !== undefined) {
			// 				if (result1.atualizacao == "Sim") {
			// 					MessageBox.show("Voçê precisa realizar a atualização das tabelas.", {
			// 						icon: MessageBox.Icon.WARNING,
			// 						title: "ATUALIZAÇÃO",
			// 						actions: [MessageBox.Action.OK],
			// 						onClose: function(oAction) {
			// 							if (oAction == sap.m.MessageBox.Action.OK) {
			// 								sap.ui.core.UIComponent.getRouterFor(that).navTo("login");
			// 							}
			// 						}
			// 					});
			// 				}
			// 			} else {
			// 				console.log("Não precisa de atualização");
			// 			}
			// 		};
			// 	}
			// });
		},

		onItemPress: function(oEvent) {
			var that = this;
			var oNumeroPedido = oEvent.getParameter("listItem") || oEvent.getSource();
			var open1 = indexedDB.open("VB_DataBase");

			open1.onerror = function(hxr) {
				console.log("Erro ao abrir tabelas.");
				console.log(hxr.Message);
			};
			//Load tables
			open1.onsuccess = function(e) {
				var db = open1.result;

				var NrPedido = oNumeroPedido.getBindingContext("pedidosCadastrados").getProperty("nrPedCli");
				that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", NrPedido);

				var promise = new Promise(function(resolve, reject) {
					that.carregaModelCliente(db, resolve, reject);
				});
				
				promise.then(function() {
					sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
				});

			};

		},

		onExcluirPedido: function(oEvent) {
			var that = this;
			var naoDeletar = false;
			var oNumeroPedido = oEvent.getParameter("listItem") || oEvent.getSource();
			var NrPedido = oNumeroPedido.getBindingContext("pedidosCadastrados").getProperty("nrPedCli");

			MessageBox.show("Deseja mesmo excluir o pedido?.", {
				icon: MessageBox.Icon.WARNING,
				title: "Exclusão de Pedidos",
				actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction == sap.m.MessageBox.Action.YES) {
						var open = indexedDB.open("VB_DataBase");

						open.onerror = function() {
							MessageBox.show(open.error.mensage, {
								icon: MessageBox.Icon.ERROR,
								title: "Banco não encontrado, exclusão pedido!",
								actions: [MessageBox.Action.OK]
							});
						};

						open.onsuccess = function() {
							for (var i = 0; i < oPrePedidos.length; i++) {
								if (oPrePedidos[i].nrPedCli == NrPedido) {
									if (oPrePedidos[i].idStatus === 3) {
										naoDeletar = true;
									} else {
										oPrePedidos.splice(i, 1);
									}
								}
							}
							var oModel = new sap.ui.model.json.JSONModel(oPrePedidos);
							that.getView().setModel(oModel, "pedidosCadastrados");

							if (naoDeletar === true) {
								MessageBox.show("Esse Pedido está com status Finalizado e não pode ser deletado.", {
									icon: MessageBox.Icon.WARNING,
									title: "Impossivel Excluir",
									actions: [MessageBox.Action.OK]
								});

							} else {
								var db = open.result;
								var store1 = db.transaction("PrePedidos", "readwrite");
								var objPedido = store1.objectStore("PrePedidos");
								var request = objPedido.delete(NrPedido);

								request.onsuccess = function() {

									that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
									console.log("Pedido deletado!");

								};
								request.onerror = function() {
									console.log("Pedido não foi deletado!");
								};

								var store = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
								store.openCursor().onsuccess = function(event) {
									// consulta resultado do event
									var cursor = event.target.result;
									if (cursor) {
										if (cursor.value.nrPedCli === NrPedido) {
											var store2 = db.transaction("ItensPedido", "readwrite");
											var objItemPedido = store2.objectStore("ItensPedido");
											request = objItemPedido.delete(cursor.key);
											request.onsuccess = function() {
												console.log("Itens Pedido deletado(s)!");
											};
											request.onerror = function() {
												console.log("Itens Pedido não foi deletado(s)!");
											};
										}
										cursor.continue();
									} else {
										oModel = new sap.ui.model.json.JSONModel(oPrePedidos);
										that.getView().setModel(oModel, "PedidosCadastrados");
									}
								};
							}
						};
					}
				}
			});
		},

		onBusyDialogClosed: function() {
			var call = ajaxCall;
			call.abort();
			// MessageBox.show("Operação Cancelada!", {
			// 	icon: MessageBox.Icon.ERROR,
			// 	title: "Acesso negado",
			// 	actions: [MessageBox.Action.OK],
			// 	onClose: function() {
			// 		call.abort();
			// 	}
			// });
		},

		handleLinkPress: function() {
			var cliente = this.getOwnerComponent().getModel("modelAux").getProperty("/CodCliente");
			this.getOwnerComponent().getModel("modelAux").setProperty("/telaPedido", true);
			// alert(cliente);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTitulos");
		}
	});
});