sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function(BaseController, Filter, FilterOperator, MessageBox) {
	"use strict";
	var oPedidosEnviar = [];
	var oItensPedidoGrid = [];
	var oPedidoGrid = [];
	var oItensPedidoEnviar = [];
	var deletarMovimentos = [];
	var ajaxCall;
	
	return BaseController.extend("testeui5.controller.enviarPedidos", {

		onInit: function() {
			this.getRouter().getRoute("enviarPedidos").attachPatternMatched(this._onLoadFields, this);

		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

		myFormatterDataImp: function(value) {
			var aux = value.split("/");
			var aux2 = aux[2].substring(2, aux[2].length);
			value = aux[0] + "/" + aux[1] + "/" + aux2;
			return value;
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

		detalharPedido: function(oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("PedidosEnviar").getProperty("NrPedcli");
			var variavelCodigoCliente = oItem.getBindingContext("PedidosEnviar").getProperty("CodCliente");
			that.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", nrPedCli);
			
			MessageBox.show("Deseja mesmo detalhar o Pedido?", {
				icon: MessageBox.Icon.WARNING,
				title: "Detalhamento Solicitado",
				actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction == sap.m.MessageBox.Action.YES) {

						var open = indexedDB.open("VB_DataBase");

						open.onerror = function() {
							console.log("não foi possivel encontrar e/ou carregar a base de clientes");
						};

						open.onsuccess = function(e) {
							var db = e.target.result;

							that.carregaModelCliente(variavelCodigoCliente, db);
							// COLOQUEI PARA MUDAR A TELA DEPOIS QUE CARREGAR O CLIENTE.
							// sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
							// that.checkOnline(db);
						};
					}
				}
			});
		},

		checkOnline: function(db) {
			var that = this;
			var mensagem1 = "";
			var tabela = "CheckAtualizacao";
			var jsonAtualizacao = [];
			var IdBase = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			var imeiCelular = that.getOwnerComponent().getModel("modelAux").getProperty("/imei");
			var numVersao = that.getOwnerComponent().getModel("modelAux").getProperty("/versaoApp");

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
								console.log("Dados do Usuário não foram atualizados.");
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
						title: "Falha ao checar atualização",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
							}
						}
					});
				}
			});
		},

		carregaModelCliente: function(variavelCodigoCliente, db) {
			var that = this;

			var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

			var store = db.transaction("Clientes").objectStore("Clientes");
			//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
			store.openCursor().onsuccess = function(event) {
				// consulta resultado do event
				var cursor = event.target.result;
				if (cursor) {
					if (cursor.value.CodCliente == variavelCodigoCliente && cursor.value.IdBase == IdBase) {
						var nome = (cursor.value.NomeEmit);
						// that.getOwnerComponent().getModel("modelAux").setProperty("/userID", cursor.value.CodigoRepresentante);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoRepresentante", cursor.value.CodigoRepresentante);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente", cursor.value.CodCliente);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCliente", nome);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeAbrevCliente", cursor.value.NomeAbrev);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/nomeCidadeCliente", cursor.value.Cidade);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/cepCliente", cursor.value.CEP);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/matrizCliente", cursor.value.Matriz);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/estadoCliente", cursor.value.Estado);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/cnpjCliente", cursor.value.CNPJ);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailCliente", cursor.value.Email);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailContasCliente", cursor.value.Email_ContasPagar);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/emailXMLCliente", cursor.value.Email_XML);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/snCliente", cursor.value.SN);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/statusCreditoCliente", cursor.value.StatusCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/enderecoCliente", cursor.value.Endereco);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/telefoneCliente", cursor.value.Telefone);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataCadastroCliente", cursor.value.DataCadastro);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/limiteCreditoCliente", cursor.value.LimiteCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/canalVendaCliente", cursor.value.CanalVenda);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoEstadualCliente", cursor.value.InscricaoEstadual);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/inscricaoAuxSubsTribCliente", cursor.value.InscricaoAuxSubsTrib);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/grupoCliente", cursor.value.Grupo);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/codigoSuframaCliente", cursor.value.CodigoSuframa);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataLimiteCreditoCliente", cursor.value.DataLimiteCredito);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/valorUltimoTituloNFCliente", cursor.value.valorUltimoTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/valorMaiorTituloNFCliente", cursor.value.ValorMaiorTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/microrregiaoCliente", cursor.value.Microrregiao);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/faturarSaldoCliente", cursor.value.FaturaParcial);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataMaiorTituloNFCliente", cursor.value.DataMaiorTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/dataUltimoTituloNFCliente", cursor.value.DataUltimoTituloNF);
						that.getOwnerComponent().getModel("modelCliente").setProperty("/DataVigenciaInscSTCliente", cursor.value.DataVigenciaInscST);
					}
					cursor.continue();
				}else{
					sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
				}
			};
		},

		_onLoadFields: function() {
			var that = this;
			oPedidosEnviar = [];
			oItensPedidoGrid = [];
			oPedidoGrid = [];
			oItensPedidoEnviar = [];

			var oModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().getModel("modelAux");
			this.getOwnerComponent().setModel(oModel, "modelCliente");

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
				var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

				var store = db.transaction("PrePedidos").objectStore("PrePedidos");
				store.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;

					if (cursor) {
						if (cursor.value.IdBase == IdBase && cursor.value.idStatus == 2) {
							oPedidoGrid.push(cursor.value);
						}
						cursor.continue();
					} else {
						oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
						that.getView().setModel(oModel, "PedidosEnviar");

						// var tx = db.transaction("ItensPedido", "readwrite");
						// var objItensPedido = tx.objectStore("ItensPedido");

						var store1 = db.transaction("ItensPedido").objectStore("ItensPedido");
						store1.openCursor().onsuccess = function(event) {
							cursor = event.target.result;

							if (cursor) {
								for (var j = 0; j < oPedidoGrid.length; j++) {
									if (cursor.value.IdBase == IdBase && cursor.value.NrPedcli == oPedidoGrid[j].NrPedcli) {
										oItensPedidoGrid.push(cursor.value);
									}
								}
								cursor.continue();
							}else{
								var tx = db.transaction("Usuarios", "readwrite");
								var objUsuarios = tx.objectStore("Usuarios");
				
								var request = objUsuarios.get(that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase"));
				
								request.onsuccess = function(e1) {
									var result1 = e1.target.result;
									if(result1.zerVerba == "Sim" && oPedidoGrid.length == 0){
										that.checarZeraVerba();
										
									}
								};
							}
						};
						// 

						// 	objItensPedido.index("NrPedcli").get().onsuccess = function(e) {
						// 		oItensPedidoGrid.push(e.target.result);
						// 	};
						// }
					}
				};
			};
		},

		onSelectionChange: function(oEvent) {
			console.log(oItensPedidoGrid);
			console.log(oPedidoGrid);
			oPedidosEnviar = [];
			oItensPedidoGrid = [];
			oItensPedidoEnviar = [];

			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("PedidosEnviar").getProperty("NrPedcli");
			that.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", nrPedCli);

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
				var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

				var store = db.transaction("PrePedidos", "readwrite").objectStore("PrePedidos");
				store.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.IdBase == IdBase && cursor.value.idStatus == 2 && cursor.value.NrPedcli == nrPedCli) {
							oPedidosEnviar.push(cursor.value);
						}
						cursor.continue();
					}
				};

				var store1 = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
				store1.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.IdBase == IdBase && cursor.value.NrPedcli == nrPedCli) {
							oItensPedidoEnviar.push(cursor.value);
						}
						cursor.continue();
					}
				};
			};
		},

		onEnviarPedido: function(oEvent) {
			// console.log(oItensPedidoGrid);
			// console.log(oPedidoGrid);
			this.byId("idTableEnvioPedidos").setBusy(true);
			var that = this;
			var aux = [];
			var mensagem1 = "";
			var json = [];
			var sdoVerba = [];
			var nrPedidos = [];
			oPedidosEnviar = [];
			deletarMovimentos = [];
			oItensPedidoEnviar = [];
			var oPedidosFinalizados = [];
			var oSelectedItem = this.byId("idTableEnvioPedidos").getSelectedItems();
			var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			var imeiCelular = that.getOwnerComponent().getModel("modelAux").getProperty("/imei");
			var numVersao = that.getOwnerComponent().getModel("modelAux").getProperty("/versaoApp");
			
			if (oSelectedItem.length == 0) {
				MessageBox.show("Favor inserir pelo menos um pedido para envio.", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao enviar.",
					actions: [MessageBox.Action.OK],
					onClose: function() {
						that.byId("idTableEnvioPedidos").setBusy(false);
					}
				});
			} else {
				for (var i = 0; i < oSelectedItem.length; i++) {
					var item1 = oSelectedItem[i].getCells();
					// var cells = item1.getCells();
					nrPedidos.push(item1[5].getText());
				}

				for (var j = 0; j < nrPedidos.length; j++) {
					for (var k = 0; k < oPedidoGrid.length; k++) {
						if (oPedidoGrid[k].NrPedcli == nrPedidos[j]) {
							oPedidosEnviar.push(oPedidoGrid[k]);
						}
					}
					for (var l = 0; l < oItensPedidoGrid.length; l++) {
						if (oItensPedidoGrid[l].NrPedcli == nrPedidos[j]) {
							oItensPedidoEnviar.push(oItensPedidoGrid[l]);
						}
					}
				}

				//MONTA O PEDIDO E ITENS DO PEDIDO 
				aux[1] = '"ttPrePedido":' + JSON.stringify(oPedidosEnviar);
				aux[2] = '"ttItemPrePedido":' + JSON.stringify(oItensPedidoEnviar) + "}}";
				aux[1] = aux[1].replace(/&/g, "CHR1");
				aux[1] = aux[1].replace(/ /g, "CHR2");
				aux[1] = aux[1].replace(/'+'/g, "CHR3");
				
				aux[2] = aux[2].replace(/&/g, "CHR1");
				aux[2] = aux[2].replace(/ /g, "CHR2");
				aux[2] = aux[2].replace(/'+'/g, "CHR3");

				if (IdBase == 1) {
					var senha = that.getOwnerComponent().getModel("modelAux").getProperty("/senha1");
					var usuario = that.getOwnerComponent().getModel("modelAux").getProperty("/userID");
					var variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + usuario + '","senha":"' + senha + 
						'","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]';
					//MONTA LOGIN E SENHA 
					aux[0] = variavel;

					var log =
						'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSPredilecta:WSPredilecta">' +
						'<soapenv:Header/>' +
						'<soapenv:Body>' +
						'<urn:GetCadastros>' +
						'<urn:inputXML>' + aux + '</urn:inputXML>' +
						'<urn:inputTabela>EnvioPedido</urn:inputTabela>' +
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
						'","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]';
						
					//MONTA LOGIN E SENHA 
					aux[0] = variavel;
					// aux[1] = aux[1].replace("&","CHR1").replace('" "', "CHR2").replace("+", "CHR3");
					// aux[2] = aux[2].replace("&","CHR1").replace('" "', "CHR2").replace("+", "CHR3");
					
					log =
						'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSStella:WSStella">' +
						'<soapenv:Header/>' +
						'<soapenv:Body>' +
						'<urn:GetCadastros>' +
						'<urn:inputXML>' + aux + '</urn:inputXML>' +
						'<urn:inputTabela>EnvioPedido</urn:inputTabela>' +
						'</urn:GetCadastros>' +
						'</soapenv:Body>' +
						'</soapenv:Envelope>';

					settings = {
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
					variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + usuario + '","senha":"' + senha3 + '","IMEI":"' + imeiCelular + '","numVersao":"' + numVersao + '"}]';
					
					//MONTA LOGIN E SENHA 
					aux[0] = variavel;
					// aux[1] = aux[1].replace("&","CHR1").replace('" "', "CHR2").replace("+", "CHR3");
					// aux[2] = aux[2].replace("&","CHR1").replace('" "', "CHR2").replace("+", "CHR3");
					
					log =
						'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:WSMinas:WSMinas">' +
						'<soapenv:Header/>' +
						'<soapenv:Body>' +
						'<urn:GetCadastros>' +
						'<urn:inputXML>' + aux + '</urn:inputXML>' +
						'<urn:inputTabela>EnvioPedido</urn:inputTabela>' +
						'</urn:GetCadastros>' +
						'</soapenv:Body>' +
						'</soapenv:Envelope>';

					settings = {
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

				ajaxCall = $.ajax(settings).done(function(response) {
					mensagem1 = response.getElementsByTagName("outputResult");
					mensagem1 = mensagem1[0].innerHTML;
					var x = response.getElementsByTagName("outputJASON");
					var y = x[0].textContent;
					if (mensagem1 == 'OK') {
						json = JSON.parse(y);
					}

				}).fail(function(xhr, statusReq) {
					if (xhr.status == 0) {
						MessageBox.show("Verifique a internet", {
							icon: MessageBox.Icon.ERROR,
							title: "Erro de conexão!",
							actions: [MessageBox.Action.OK],
							onClose: function() {
								that.byId("idTableEnvioPedidos").setBusy(false);
							}
						});
					}
					if (xhr.status == 404) {
						MessageBox.show("Página não encontrada.", {
							icon: MessageBox.Icon.ERROR,
							title: "Erro de conexão!",
							actions: [MessageBox.Action.OK],
							onClose: function() {
								that.byId("idTableEnvioPedidos").setBusy(false);
							}
						});
					}
					if (xhr.status == 500) {
						MessageBox.show("Servidor está fora do ar. Entre em contato com a TI", {
							icon: MessageBox.Icon.ERROR,
							title: "Erro de conexão!",
							actions: [MessageBox.Action.OK],
							onClose: function() {
								that.byId("idTableEnvioPedidos").setBusy(false);
							}
						});
					}
				}).then(function() {
					if (mensagem1 == 'OK') {
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
							var aux3 = json;
							var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

							//ENVIA OS PEDIDOS ESCOLHIDOS E POPULA deletarMovimentos PARA REMOVER OS MOVIMENTOS E ADICIONAR VINDO DA RESPOSTA DO AJAX
							for (i = 0; i < aux3.PrePedidoMobileCollection.length; i++) {
								var mensag = aux3.PrePedidoMobileCollection[i].DesMensagem;
								var contains = "";
								contains = mensag.indexOf("Pedido Inserido.");
								
								if (aux3.PrePedidoMobileCollection[i].DesMensagem == "Integrado com sucesso" || contains > -1){
									for (var m = 0; m < oPedidosEnviar.length; m++){
										if (aux3.PrePedidoMobileCollection[i].NrPedCli == oPedidosEnviar[m].NrPedcli){
											oPedidosEnviar[m].idStatus = 3;
											oPedidosEnviar[m].DescStatus = "FIN";
											oPedidosEnviar[m].NrPedCliDTS = aux3.PrePedidoMobileCollection[i].NrPedCliDTS;
											oPedidosFinalizados.push(oPedidosEnviar[m]);
											deletarMovimentos.push(oPedidosEnviar[m]);

										}
									}
								} else {
									MessageBox.show(aux3.PrePedidoMobileCollection[i].DesMensagem + "- Num Pedido :" + aux3.PrePedidoMobileCollection[i].NrPedCli, {
										icon: MessageBox.Icon.ERROR,
										title: "Falha ao inserir item.",
										actions: [MessageBox.Action.YES]
									});
								}
							}

							//DELETAR TODOS OS MOVIMENTOS QUE ESTÃO COM STATUS = "SIM"
							var storeTabelaMovto = db.transaction("TabelaMovimentacao", "readwrite").objectStore("TabelaMovimentacao");
							storeTabelaMovto.openCursor().onsuccess = function(event) {
								var cursor = event.target.result;
								if (cursor) {
									var tx1 = db.transaction("TabelaMovimentacao", "readwrite");
									var objTransacaoTabela = tx1.objectStore("TabelaMovimentacao");

									if (cursor.value.IdBase == IdBase && cursor.value.Atualizado == "Sim") {
										// var idDelete = cursor.value.IdBase + "." + cursor.value.IdMovto;
										var req1 = objTransacaoTabela.delete(cursor.value.idTabelaMovimentacao);
										req1.onsuccess = function() {
											console.log("Transação deletado!");
										};
										req1.onerror = function() {
											console.log("Transação não foi deletado!");
										};
									}
									for (var a = 0; a < deletarMovimentos.length; a++) {
										if (cursor.value.IdBase == IdBase && cursor.value.NrPedCli == deletarMovimentos[a].NrPedcli) {
											var req = objTransacaoTabela.delete(cursor.value.idTabelaMovimentacao);
											req.onsuccess = function() {
												console.log("Transação deletado do pedido!");
											};
											req.onerror = function() {
												console.log("Transação não foi deletado! do pedido ");
											};
										}
									}
									cursor.continue();
								} else {
									//ADICIONA AS TRANSAÇÕES RECEBIDAS PELO ENVIO
									var tx3 = db.transaction("TabelaMovimentacao", "readwrite");
									var objCliente = tx3.objectStore("TabelaMovimentacao");
									for (var b = 0; b < aux3.MovtoVerbaCollection.length; b++) {
										aux3.MovtoVerbaCollection[b].idTabelaMovimentacao = aux3.MovtoVerbaCollection[b].IdBase + "." + aux3.MovtoVerbaCollection[
											b].IdMovto;
										var req3 = objCliente.add(aux3.MovtoVerbaCollection[b]);

									}
									req3.onsuccess = function() {
										console.log("Transação inseridas!");
										var saldo = 0;
										//ATUALIZAR O SALDO PERCORRENDO A TABELA DE MOVIMENTOS E PEGAR SALDO APENAS DOS ATUALIZADO = 'NÃO'
										var storeAtualizaVerba = db.transaction("TabelaMovimentacao", "readwrite").objectStore("TabelaMovimentacao");
										storeAtualizaVerba.openCursor().onsuccess = function(event) {
											var cursor1 = event.target.result;
											if (cursor1) {
												if (cursor1.value.IdBase == IdBase && cursor1.value.Atualizado == "Não") {
													if (cursor1.value.Tipo == "Débito") {
														saldo = parseFloat(aux3.SaldoVerbaCollection[0].SaldoFinal);
														saldo += parseFloat(cursor1.value.Valor);
														aux3.SaldoVerbaCollection[0].SaldoFinal = saldo;

													} else {
														saldo = parseFloat(aux3.SaldoVerbaCollection[0].SaldoFinal);
														saldo -= parseFloat(cursor1.value.Valor);
														aux3.SaldoVerbaCollection[0].SaldoFinal = saldo;

													}
												}
												cursor1.continue();
											} else {
												var tx2 = db.transaction("SaldoVerbas", "readwrite");
												var objTransacaoSaldoVerba = tx2.objectStore("SaldoVerbas");
												sdoVerba = aux3.SaldoVerbaCollection[0];
												sdoVerba.IdSaldo = aux3.SaldoVerbaCollection[0].IdBase + "." + aux3.SaldoVerbaCollection[0].CodEmpresa + "." +
													aux3.SaldoVerbaCollection[0].CodRepres + "." + aux3.SaldoVerbaCollection[0].Periodo;
												var request = objTransacaoSaldoVerba.put(sdoVerba);
												// var req2 = objTransacaoSaldoVerba.put(aux3.SaldoVerbaCollection[0]);
												request.onsuccess = function() {
													console.log("Saldo Atualizado");
												};
												request.onerror = function() {
													console.log("Saldo não foi Atualizado!");
												};
											}
										};
									};
									req3.onerror = function() {
										console.log("Transação não foi inseridas!");
									};
								}
							};

							var getIndex = function(val) {
								for (var z = 0; z < oPedidoGrid.length; z++) {
									if (oPedidoGrid[z] == val) {
										var a = z;
									}
								}
								return a;
							};

							var tx = db.transaction("PrePedidos", "readwrite");
							var objPrePedido = tx.objectStore("PrePedidos");

							for (var n = 0; n < oPedidosFinalizados.length; n++) {
								objPrePedido.put(oPedidosFinalizados[n]);
							}

							$.each(oPedidosFinalizados, function(i) {
								for (var g = 0; g < oPedidoGrid.length; g++) {
									if (oPedidoGrid[i].NrPedcli == oPedidosFinalizados[i].NrPedcli) {
										oPedidoGrid.splice(i, 1);
										return false;
									}
								}
							});

							oPedidoGrid = [];
							var zeraGrid = [];
							var store = db.transaction("PrePedidos", "readwrite").objectStore("PrePedidos");
							store.openCursor().onsuccess = function(event) {
								var cursor = event.target.result;
								var oModel = new sap.ui.model.json.JSONModel(zeraGrid);
								that.getView().setModel(oModel, "PedidosEnviar");
								if (cursor) {
									if (cursor.value.IdBase == IdBase && cursor.value.idStatus == 2) {
										oPedidoGrid.push(cursor.value);
									}
									cursor.continue();
								} else {
									oModel = new sap.ui.model.json.JSONModel(oPedidoGrid);
									that.getView().setModel(oModel, "PedidosEnviar");
									
									if(oPedidoGrid.length == 0){
										that.checarZeraVerba();
									}
								}
							};

							that.byId("idTableEnvioPedidos").setBusy(false);
						};
					} else {
						MessageBox.show(mensagem1, {
							icon: MessageBox.Icon.ERROR,
							title: "Falha ao enviar Pedido!",
							actions: [MessageBox.Action.OK],
							onClose: function() {
								if (that._ItemDialog) {
									that._ItemDialog.destroy(true);
								}
								that.byId("idTableEnvioPedidos").setBusy(false);
							}
						});
					}
				});
			}
		},
		
		checarZeraVerba: function(){
				var open = indexedDB.open("VB_DataBase");
				var that = this;
				var sdoVerba = [];
				var jsonResult = [];
				var mensagemLogin = "";
				var numVersao = that.getOwnerComponent().getModel("modelAux").getProperty("/versaoApp");

				open.onerror = function(hxr) {
					console.log("Erro ao abrir tabelas.");
					console.log(hxr.Message);
				};

				open.onsuccess = function(e) {
					var db = open.result;
			
					var tx = db.transaction("Usuarios", "readwrite");
					var objUsuarios = tx.objectStore("Usuarios");
		
					var request = objUsuarios.get(that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase"));
					request.onsuccess = function(e){
						var result = e.target.result;
						
						if(result.zeraVerba == "Sim"){
							//caso não tiver pedidos pendentes, enviar tabela zerarVerba como nome da tabela.
							var tabela = "ZeraVerba";
							var variavel = '{"dsMobile":{"ttUsuario":[{"codUsuario":"' + result.codUsuario + '","senha":"' + result.senha + 
								'","IMEI":"' + result.imei + '","numVersao":"' + numVersao + '"}]}}';
		
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
		
							$.ajax(settings).done(function(response) {
								mensagemLogin = response.getElementsByTagName("outputResult");
								mensagemLogin = mensagemLogin[0].innerHTML;
								var x = response.getElementsByTagName("outputJASON");
								var y = x[0].textContent;
								if (mensagemLogin == 'OK') {
									jsonResult = JSON.parse(y);
								}
		
							}).fail(function(xhr, statusReq) {
								if (xhr.status == 0) {
									MessageBox.show("Verifique a internet e/ou Espere a reinicialização do servidor", {
										icon: MessageBox.Icon.ERROR,
										title: "Banco não encontrado!",
										actions: [MessageBox.Action.OK]
									});
								}
								if (xhr.status == 404) {
									MessageBox.show("Página não encontrada.", {
										icon: MessageBox.Icon.ERROR,
										title: "Banco não encontrado!",
										actions: [MessageBox.Action.OK]
									});
								}
								if (xhr.status == 500) {
									MessageBox.show("Servidor está fora do ar. Entre em contato com a TI", {
										icon: MessageBox.Icon.ERROR,
										title: "Banco não encontrado!",
										actions: [MessageBox.Action.OK]
									});
								}
							}).then(function() {
								
								var transaction = db.transaction(["TabelaMovimentacao"], "readwrite");
								var objectStore = transaction.objectStore("TabelaMovimentacao");
								var objectStoreRequest = objectStore.clear();
								objectStoreRequest.onsuccess = function(event) {
									// report the success of our clear operation
									console.log("Dados dos TabelaMovimentacao removidos com sucesso");
								};
								objectStoreRequest.onerror = function(event) {
									console.log("Erro ao limpar dados da TabelaMovimentacao");
								};
								
								//ADICIONA AS TRANSAÇÕES RECEBIDAS PELO ZERAMENTO DA VERBA
								var tx3 = db.transaction("TabelaMovimentacao", "readwrite");
								var objMov = tx3.objectStore("TabelaMovimentacao");
								
								for (var b = 0; b < jsonResult.MovtoVerbaCollection.length; b++) {
									var movVerba = {
										idTabelaMovimentacao: jsonResult.MovtoVerbaCollection[b].IdBase + "." + jsonResult.MovtoVerbaCollection[b].IdMovto,
										Atualizado: jsonResult.MovtoVerbaCollection[b].Atualizado,
										CodEmpresa: jsonResult.MovtoVerbaCollection[b].CodEmpresa,
										CodRepres: jsonResult.MovtoVerbaCollection[b].CodRepres,
										Data: jsonResult.MovtoVerbaCollection[b].Data,
										Descricao: jsonResult.MovtoVerbaCollection[b].Descricao,
										Hora: jsonResult.MovtoVerbaCollection[b].Hora,
										IdBase: jsonResult.MovtoVerbaCollection[b].IdBase,
										IdMovto: jsonResult.MovtoVerbaCollection[b].IdMovto,
										NomeAbrev: jsonResult.MovtoVerbaCollection[b].NomeAbrev,
										NrPedCli: jsonResult.MovtoVerbaCollection[b].NrPedCli,
										Periodo: jsonResult.MovtoVerbaCollection[b].Periodo,
										Saldo: jsonResult.MovtoVerbaCollection[b].Saldo,
										Tipo: jsonResult.MovtoVerbaCollection[b].Tipo,
										Usuario: jsonResult.MovtoVerbaCollection[b].Usuario,
										Valor: jsonResult.MovtoVerbaCollection[b].Valor
									};
									
									var req3 = objMov.add(movVerba);
									
									req3.onsuccess = function() {
										console.log("Transação inseridas!");
										
										movVerba = {
											Atualizado: "",
											CodEmpresa: "",
											CodRepres: "",
											Data: "",
											Descricao: "",
											Hora: "",
											IdBase: "",
											IdMovto: "",
											NomeAbrev: "",
											NrPedCli: "",
											Periodo: "",
											Saldo: "",
											Tipo: "",
											Usuario: "",
											Valor: ""
										};
										
									};
									req3.onerror = function() {
										console.log("Transação não foi inseridas!");
									};
								}
								
								var tx2 = db.transaction("SaldoVerbas", "readwrite");
								var objTransacaoSaldoVerba = tx2.objectStore("SaldoVerbas");
								
								for(var d=0; d<jsonResult.SaldoVerbaCollection.length; d++){
									sdoVerba = jsonResult.SaldoVerbaCollection[d];
									sdoVerba.IdSaldo = jsonResult.SaldoVerbaCollection[d].IdBase + "." + jsonResult.SaldoVerbaCollection[d].CodEmpresa + "." + 
										jsonResult.SaldoVerbaCollection[d].CodRepres + "." + jsonResult.SaldoVerbaCollection[d].Periodo;
										
									var request1 = objTransacaoSaldoVerba.put(sdoVerba);
									
									request1.onsuccess = function() {
										console.log("Saldo Atualizado");
									};
									request1.onerror = function() {
										console.log("Saldo não foi Atualizado!");
									};
								}
								
								var tx1 = db.transaction("Usuarios", "readwrite");
								var objUsuarios = tx1.objectStore("Usuarios");
			
								var aux = [];
			
								var request2 = objUsuarios.get(jsonResult.UsuarioCollection[0].idEmpresa);
			
								request2.onsuccess = function(e1) {
									var result1 = e1.target.result;
			
									if (result1 !== null && result1 !== undefined) {
										aux = {
											idEmpresa: jsonResult.UsuarioCollection[0].idEmpresa,
											email: jsonResult.UsuarioCollection[0].email,
											atualizacao: jsonResult.UsuarioCollection[0].atualizacao,
											codUsuario: jsonResult.UsuarioCollection[0].codUsuario,
											nomeUsuario: jsonResult.UsuarioCollection[0].nomeUsuario,
											nomeEmpresa: result1.nomeEmpresa,
											senha: result1.senha,
											hrImp: result1.hrImp,
											departamento: result1.departamento,
											dataAtualizacao: result1.dataAtualizacao,
											imei: result1.imei,
											zeraVerba: "Não",
											utilizaMobile: result1.utilizaMobile
										};
			
										var request3 = objUsuarios.put(aux);
			
										request3.onsuccess = function(event) {
											console.log("Dados do Usuário foram atualizados.");
										};
										request1.onerror = function(event) {
											console.log("Dados do Usuário não foram atualizados.");
										};
									}
								};
			
								request2.onerror = function(ex) {
									console.log(ex);
									console.log("Não foi possivel encontrar o registro na tabela de usuários");
								};
							});
						}
					};
				};

		},

		onItemPress: function(oEvent) {
			var oNumeroPedido = oEvent.getParameter("listItem") || oEvent.getSource();

			var NrPedido = oNumeroPedido.getBindingContext("PedidosCadastrados").getProperty("NrPedcli");
			this.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", NrPedido);

		},

		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel();
			this.byId("list").getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		}

	});
});