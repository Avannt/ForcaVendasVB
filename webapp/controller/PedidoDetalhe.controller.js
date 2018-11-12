sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"testeui5/model/formatter"

], function(BaseController, JSONModel, MessageBox, formatter) {
	"use strict";
	//variavel para salvar o obj ATUAL do item do pedido E obj pra salvar TODOS os items do pedido
	var oItemTemplate = [];
	var oVetorMateriais = [];
	var oItemTemplateTotal = [];
	var indexItem;
	var verbaDisponivel;
	var oVetorTabPreco = [];
	var oVetorTipoTransporte = [];
	var oVetorTipoNegociacao = [];
	var oVetorTiposPedidos = [];
	var objPrePedidoTemplate = [];
	var objItensPedidoTemplate = [];
	var oItemPedido = [];

	return BaseController.extend("testeui5.controller.PedidoDetalhe", {

		formatter: formatter,

		onInit: function() {
			this.getRouter().getRoute("pedidoDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function() {
			var that = this;
			this.getView().setModel(this.getView().getModel("modelCliente"));
			this.getView().setModel(this.getView().getModel("modelAux"));

			that.onCarregaCliente();
			this.byId("tabItensPedidoStep").setProperty("enabled", false);
			this.byId("tabBalancoVerbaStep").setProperty("enabled", false);
			this.byId("tabTotalStep").setProperty("enabled", false);
			// this.byId("tabItensDiluicaoPedidoStep").setProperty("enabled", false);

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
					that.onCarregaCampos(db);
					resolve();
				});

				promise.then(function(value) {

					if (that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli") === "") {
						console.log("Criando numero pedido");
						that.onCriarNumeroPedido();

					} else {
						console.log("Carregando dados PrePedido");
						that.onCarregaDadosPedido(db);

					}
				});
			};
		},

		onCarregaCliente: function() {

			this.byId("idCodCliente").setValue(this.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr") + "-" +
				this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres"));
			this.byId("idNome").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Name1"));
			this.byId("idCNPJ").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stcd1"));
			this.byId("idEndereco").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stras"));
			this.byId("idCidade").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Ort01") + "-" +
				this.getOwnerComponent().getModel("modelCliente").getProperty("/Regio"));
			this.byId("idFone").setValue();
		},

		onResetaCamposPrePedido: function() {
			//*modelDadosPedido
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataEntrega", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/LocalEntrega", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValMinPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoBruto", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoLiquido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", 0);

			this.byId("idTabelaPreco").setSelectedKey();
			this.byId("idTipoTransporte").setSelectedKey();
			this.byId("idTipoNegociacao").setSelectedKey();
			this.byId("idTipoPedido").setSelectedKey();

			objItensPedidoTemplate = [];
			var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
			this.getView().setModel(oModel, "ItensPedidoGrid");
		},

		//CARREGA OS CAMPOS, POPULANDO OS COMBO BOX
		onCarregaCampos: function(db, resolve, reject) {
			var that = this;
			oVetorTabPreco = [];
			oVetorMateriais = [];
			oVetorTipoTransporte = [];
			oVetorTipoNegociacao = [];
			objItensPedidoTemplate = [];

			var data = this.onDataAtualizacao();

			var Kunnr = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			//Inicialização de Variáveis. *modelDadosPedido
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "EM DIGITAÇÃO");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", 1);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", data[0] + "-" + data[1]);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", data[0]);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataEntrega", data[0]);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/LocalEntrega",
				this.getOwnerComponent().getModel("modelCliente").getProperty("/Ort01"));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", false);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValMinPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoBruto", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoLiquido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", 0);

			//CARREGA OS MATERIAIS
			var transaction = db.transaction("Materiais", "readonly");
			var objectStore = transaction.objectStore("Materiais");

			if ("getAll" in objectStore) {
				objectStore.getAll().onsuccess = function(event) {
					oVetorMateriais = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(oVetorMateriais);
					that.getView().setModel(oModel, "materiaisCadastrados");
				};
			}

			//Tipos Pedidos
			var transactionTiposPedidos = db.transaction("TiposPedidos", "readonly");
			var objectStoreTiposPedidos = transactionTiposPedidos.objectStore("TiposPedidos");

			if ("getAll" in objectStore) {
				objectStoreTiposPedidos.getAll().onsuccess = function(event) {
					oVetorTiposPedidos = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(oVetorTiposPedidos);
					that.getView().setModel(oModel, "tiposPedidos");
				};
			}

			//CARREGA NEGOCIOAÇÃO
			oVetorTipoNegociacao = [{
				idNegociacao: "01",
				descNegociacao: "À vista"
			}, {
				idNegociacao: "02",
				descNegociacao: "À prazo"
			}];

			var oModelNegociacao = new sap.ui.model.json.JSONModel(oVetorTipoNegociacao);
			that.getView().setModel(oModelNegociacao, "tipoNegociacao");

			//CARREGA TIPO DE TRANSPORTE
			oVetorTipoTransporte = [{
				idTransporte: "CIF"
			}, {
				idTransporte: "FOB"
			}];

			var oModel = new sap.ui.model.json.JSONModel(oVetorTipoTransporte);
			that.getView().setModel(oModel, "tipoTransporte");

			var transactionA961 = db.transaction(["A961"], "readonly");
			var objectStoreA961 = transactionA961.objectStore("A961");

			objectStoreA961.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					if (cursor.value.kunnr == Kunnr) {

						oVetorTabPreco.push(cursor.value);
					}

					cursor.continue();

				} else {

					var oModelTabPreco = new sap.ui.model.json.JSONModel(oVetorTabPreco);
					that.getView().setModel(oModelTabPreco, "tabPreco");

					if (oVetorTabPreco.length == 0) {

						var CodRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

						var transactionA963 = db.transaction(["A963"], "readonly");
						var objectStoreA963 = transactionA963.objectStore("A963");

						objectStoreA963.openCursor().onsuccess = function(event) {
							var cursor1 = event.target.result;
							if (cursor1) {
								if (cursor.value.lifnr == CodRepres) {

									oVetorTabPreco.push(cursor.value);
								}

								cursor.continue();

							} else {

								oModelTabPreco = new sap.ui.model.json.JSONModel(oVetorTabPreco);
								that.getView().setModel(oModelTabPreco, "tabPreco");

							}
						};
					}
				}
			};
		},

		onCriarNumeroPedido: function() {
			var CodRepres = this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", "Não");

			var date = new Date();
			var dia = String(date.getDate());
			var mes = String(date.getMonth() + 1);
			var ano = String(date.getFullYear());
			var minuto = String(date.getMinutes());
			var hora = String(date.getHours());
			var seg = String(date.getSeconds());

			if (dia.length == 1) {
				dia = "0" + String(dia);
			}

			if (mes.length == 1) {
				mes = "0" + String(mes);
			}

			if (minuto.length == 1) {
				minuto = "0" + String(minuto);
			}
			if (hora.length == 1) {
				hora = "0" + String(hora);
			}
			if (seg.length == 1) {
				seg = "0" + String(seg);
			}
			//HRIMP E DATIMP
			var data = String(ano + mes + dia);
			var horario = String(hora) + String(minuto) + String(seg);

			var numeroPed = CodRepres + "." + data + "." + horario;
			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", numeroPed);
		},

		onCarregaDadosPedido: function(db) {
			var that = this;
			objItensPedidoTemplate = [];

			this.byId("tabItensPedidoStep").setProperty("enabled", true);
			this.byId("tabBalancoVerbaStep").setProperty("enabled", true);
			this.byId("tabTotalStep").setProperty("enabled", true);
			// this.byId("tabItensDiluicaoPedidoStep").setProperty("enabled", true);

			var store = db.transaction("PrePedidos", "readwrite");
			var objPrePedidos = store.objectStore("PrePedidos");

			var requestPrePedidos = objPrePedidos.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

			requestPrePedidos.onsuccess = function(e) {
				var oPrePedido = e.target.result;

				if (oPrePedido == undefined) {

					that.onCriarNumeroPedido();

				} else {

					that.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

					if (oPrePedido.existeEntradaPedido == true) {

						that.byId("idPercEntrada").setVisible(true);
						that.byId("idValorEntrada").setVisible(true);

					} else {

						that.byId("idPercEntrada").setVisible(false);
						that.byId("idValorEntrada").setVisible(false);
					}

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", oPrePedido.situacaoPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", oPrePedido.idStatusPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", oPrePedido.dataImpl);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", oPrePedido.dataPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataEntrega", oPrePedido.dataEntrega);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/LocalEntrega", oPrePedido.localEntrega);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", oPrePedido.diasPrimeiraParcela);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", oPrePedido.quantParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", oPrePedido.intervaloParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", oPrePedido.observacaoPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", oPrePedido.observacaoAuditoriaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", oPrePedido.existeEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", oPrePedido.percEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", oPrePedido.valorEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValMinPedido", oPrePedido.valMinPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", oPrePedido.tabPreco);
					that.byId("idTabelaPreco").setSelectedKey(oPrePedido.tabPreco);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", oPrePedido.tipoTransporte);
					that.byId("idTipoTransporte").setSelectedKey(oPrePedido.tipoTransporte);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", oPrePedido.tipoNegociacao);
					that.byId("idTipoNegociacao").setSelectedKey(oPrePedido.tipoNegociacao);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", oPrePedido.tipoPedido);
					that.byId("idTipoPedido").setSelectedKey(oPrePedido.tipoPedido);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoBruto", oPrePedido.pesoBruto);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PesoLiquido", oPrePedido.pesoLiquido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", oPrePedido.completo);

					var storeItensPedido = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
					storeItensPedido.openCursor().onsuccess = function(event) {
						// consulta resultado do event
						var cursor = event.target.result;
						if (cursor) {
							if (cursor.value.nrPedCli === that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli")) {

								objItensPedidoTemplate.push(cursor.value);

							}
							cursor.continue();
						} else {

							var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");

							that.calculaTotalPedido();
						}
					};
				}
			};
		},

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

			return [data, horario];
		},

		myFormatterRentabilidade: function(Value) {
			// var rentabilidade = sap.ui.getCore().byId("idRentabilidade").getValue();

			if (Value <= -3) {

				Value = "img/Verm.png";
				return Value;

			} else if (Value >= 3) {

				Value = "img/Verde.png";
				return Value;

			} else if (Value < 3 && Value > -3) {

				Value = "img/Amar.png";
				return Value;

			}
		},

		myFormatterRentabilidadePorcentagem: function(Value) {
			// var rentabilidade = sap.ui.getCore().byId("idRentabilidade").getValue();

			if (Value > -3) {

				this.byId("idRentabilidadePedido").setVisible(false);
				return "";

			} else {
				this.byId("idRentabilidadePedido").setVisible(true);
				return Value;
			}
		},

		carregarItensPedido: function(db) {
			var that = this;
			db = open.result;

			var store = db.transaction("ItensPedido").objectStore("ItensPedido");
			//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
			store.openCursor().onsuccess = function(event) {
				// consulta resultado do event
				var cursor = event.target.result;
				var numeroPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/numeroPedido");
				var IdBase = that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");

				if (cursor) {
					if (cursor.NrPedcli == numeroPedido && cursor.value.IdBase == IdBase) {
						oItemTemplateTotal.push(cursor.value);
					}
					cursor.continue();
				}
			};
			var oModel = new sap.ui.model.json.JSONModel(oItemTemplateTotal);
			that.getView().setModel(oModel, "ItensPedidoGrid");
		},

		/// EVENTOS STANDARD  APLICAÇÃO 			<<<<<<<<<<<<

		onAfterRendering: function() {},

		onBeforerRendering: function() {},

		onExit: function() {

		},

		///  FIM EVENTOS STANDARD  APLICAÇÃO

		/// EVENTOS CAMPOS							<<<<<<<<<<<<

		onChangeTipoPedido: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", oSource.getSelectedKey());
		},

		onExisteEntrada: function(evt) {

			var bSelected = evt.getParameter("selected");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", bSelected);

			if (bSelected == true) {

				this.byId("idPercEntrada").setVisible(true);
				this.byId("idValorEntrada").setVisible(true);

			} else {

				this.byId("idPercEntrada").setVisible(false);
				this.byId("idValorEntrada").setVisible(false);
			}
		},

		onBloqueiaPercEntrada: function(evt) {
			var percEntrada = evt.getSource();

			if (percEntrada.getValue() > 0) {
				this.byId("idPercEntrada").setEnabled(false);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", parseFloat(percEntrada.getValue()));
			} else {
				this.byId("idPercEntrada").setEnabled(true);
			}

		},

		onBloqueiaValorEntrada: function(evt) {

			var vlrEntrada = evt.getSource();

			if (vlrEntrada.getValue() > 0) {
				this.byId("idValorEntrada").setEnabled(false);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", vlrEntrada.getValue());
			} else {
				this.byId("idValorEntrada").setEnabled(true);
			}
		},

		onChangeTipoNegociacao: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", oSource.getSelectedKey());
		},

		onChangeTabelaPreco: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", oSource.getSelectedKey());
		},

		onChangeTipoTransporte: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", oSource.getSelectedKey());
		},

		onChangeDataPedido: function() {
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", this.byId("idDataPedido").getValue());
		},

		onChangeObservacoes: function(evt) {
			var oObservacoes = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", oObservacoes.getValue());
		},

		onChangeAuditoriaObservacoes: function(evt) {
			var oObservacoes = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", oObservacoes.getValue());
		},

		/// FIM EVENTOS CAMPOS

		/// EVENTOS UTILITARIOS						<<<<<<<<<<<<

		bloquearCampos: function() {

			this.byId("idEstabelecimento").setProperty("enabled", false);
			this.byId("idTipoPedido").setProperty("enabled", false);
			this.byId("idVencimento1").setProperty("enabled", false);
			this.byId("idVencimento2").setProperty("enabled", false);
			this.byId("idVencimento3").setProperty("enabled", false);
			this.byId("idTabelaPreco").setProperty("enabled", false);
			this.byId("idTipoTransporte").setProperty("enabled", false);

		},

		desbloquearCampos: function() {
			this.byId("idEstabelecimento").setProperty("enabled", true);
			this.byId("idTipoPedido").setProperty("enabled", true);
			this.byId("idVencimento1").setProperty("enabled", true);
			this.byId("idVencimento2").setProperty("enabled", true);
			this.byId("idVencimento3").setProperty("enabled", true);
			this.byId("idTabelaPreco").setProperty("enabled", true);
			this.byId("idTipoTransporte").setProperty("enabled", true);

		},

		resetarCamposTela: function() {

			this.byId("idNumeroPedido").setValue("");
			this.byId("idSituacao").setValue("");
			this.byId("idDataPedido").setValue("");
			this.byId("idTipoPedido").setSelectedKey("");
			this.byId("idTipoNegociacao").setSelectedKey("");
			this.byId("idTabelaPreco").setSelectedKey("");
			this.byId("idTipoTransporte").setSelectedKey("");
			this.byId("idDataEntrega").setSelectedKey("");
			this.byId("idLocalEntrega").setSelectedKey("");
			this.byId("idPrimeiraParcela").setValue("");
			this.byId("idQuantParcelas").setValue("");
			this.byId("idIntervaloParcelas").setValue("");
			this.byId("idValorMinimoPedido").setValue("");
			this.byId("idObservacoes").setText("");

		},

		onNavBack: function() {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			this.onResetaCamposPrePedido();

		},

		/// FIM EVENTOS UTILITARIOS

		// EVENTOS DO FRAGMENTO 					<<<<<<<<<<<<

		onItemChange: function(oEvent) {
			var that = this;
			var itemExistente = false;
			var oProduto = oEvent.getSource();
			var codItem = oProduto.getValue();
			var oPanel = sap.ui.getCore().byId("idDialog");
			oPanel.setBusy(true);
			var werks = this.getOwnerComponent().getModel("modelAux").getProperty("/Werks");
			var tabPreco = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco");

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

				oPanel.setBusy(true);

				if (codItem !== "") {

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(codItem);

					requestMaterial.onsuccess = function(e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + codItem, {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function() {
									that.onResetaCamposDialog();
									sap.ui.getCore().byId("idItemPedido").focus();
								}
							});

						} else {

							oItemPedido.zzQnt = 1;
							oItemPedido.matnr = oMaterial.matnr;
							oItemPedido.maktx = oMaterial.maktx;
							oItemPedido.ntgew = parseFloat(oMaterial.ntgew);
							oItemPedido.knumh = 0;
							oItemPedido.konda = 0;
							oItemPedido.kondm = 0;
							oItemPedido.knumhExtra = 0;
							oItemPedido.kondaExtra = 0;
							oItemPedido.kondmExtra = 0;
							oItemPedido.tipoItem = "Normal";

							for (var j = 0; j < objItensPedidoTemplate.length; j++) {
								if (oItemPedido.matnr == objItensPedidoTemplate[j].matnr && objItensPedidoTemplate[j].tipoItem == "Normal") {
									itemExistente = true;
									break;
								}
							}
							if (itemExistente == false) {
								//Busca o preço do item
								var storeA960 = db.transaction("A960", "readwrite");
								var objA960 = storeA960.objectStore("A960");

								var idA960 = werks + "." + tabPreco + "." + oMaterial.matnr;

								var requesA960 = objA960.get(idA960);

								requesA960.onsuccess = function(e) {
									var oA960 = e.target.result;

									if (oA960 == undefined) {
										oPanel.setBusy(false);

										MessageBox.show("Não existe preço para o produto: " + codItem + " de acordo com a tabela de preço: " +
											that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"), {
												icon: MessageBox.Icon.ERROR,
												title: "Preço do produto não encontrado.",
												actions: [MessageBox.Action.YES],
												onClose: function() {
													that.onResetaCamposDialog();
												}
											});

									} else {

										if (oA960.zzPervm !== "" || oA960.zzPervm !== undefined) {
											oA960.zzPervm = parseFloat(oA960.zzPervm);
										}
										if (oA960.zzPercom !== "" || oA960.zzPercom !== undefined) {
											oA960.zzPercom = parseFloat(oA960.zzPercom);
										}
										if (oA960.zzVprod !== "" || oA960.zzVprod !== undefined) {
											oA960.zzVprod = parseFloat(oA960.zzVprod);
										}

										// Desconto Extra aplicado depois do dento digitado no item
										oItemPedido.zzPervm = oA960.zzPervm; //Verba
										oItemPedido.zzPercom = oA960.zzPercom; //Comissão
										oItemPedido.zzVprod = oA960.zzVprod;
										oItemPedido.knumh = 0; //Desconto familia
										oItemPedido.zzDesext = 0;
										oItemPedido.zzDesitem = 0;
										oItemPedido.zzPercDescDiluicao = 0;
										//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA OS DESCONTOS
										oItemPedido.zzVprodDesc = oItemPedido.zzVprod;

										var vetorAuxFamilias = [];
										var vetorAuxFamiliasExtra = [];
										//Buscando informações da FAMILIA de desconto normal
										var objA965 = db.transaction("A965").objectStore("A965");
										objA965.openCursor().onsuccess = function(event) {

											var cursor = event.target.result;

											if (cursor) {
												if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

													vetorAuxFamilias.push(cursor.value);
													console.log("Familia: " + cursor.value.kondm + " para o Item: " + cursor.value.matnr);
												}

												cursor.continue();

											} else {

												var objA966 = db.transaction("A966").objectStore("A966");
												objA966.openCursor().onsuccess = function(event2) {
													var cursor2 = event2.target.result;

													if (cursor2) {
														for (var i = 0; i < vetorAuxFamilias.length; i++) {

															if (cursor2.value.kondm === vetorAuxFamilias[i].kondm && cursor2.value.pltyp === tabPreco) {

																oItemPedido.kondm = cursor2.value.kondm; //Código Familia
																oItemPedido.konda = cursor2.value.konda; //Grupo de preço 
																console.log("Grupo de Preço:" + oItemPedido.konda + " do grupo da familia: " + cursor2.value.kondm);
															}
														}
														cursor2.continue();

													} else {

														var objA967 = db.transaction("A967").objectStore("A967");
														objA967.openCursor().onsuccess = function(event3) {
															var cursorA967 = event3.target.result;

															if (cursorA967) {

																if (cursorA967.value.konda === oItemPedido.konda) {

																	oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																	console.log("Registro de condição :" + oItemPedido.knumh);
																}

																cursorA967.continue();

															} else {

																//Buscando Familia de desconto extra

																var objA962 = db.transaction("A962").objectStore("A962");
																objA962.openCursor().onsuccess = function(event) {

																	var cursor = event.target.result;

																	if (cursor) {
																		if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

																			vetorAuxFamiliasExtra.push(cursor.value);
																			console.log("Familia Extra: " + cursor.value.kondm + " para o Item: " + cursor.value.matnr);
																		}

																		cursor.continue();

																	} else {

																		var objA968 = db.transaction("A968").objectStore("A968");
																		objA968.openCursor().onsuccess = function(event2) {
																			cursor2 = event2.target.result;

																			if (cursor2) {
																				for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																					if (cursor2.value.kondm === vetorAuxFamiliasExtra[i].kondm && cursor2.value.pltyp === tabPreco) {

																						oItemPedido.kondmExtra = cursor2.value.kondm; //Código Familia Extra
																						oItemPedido.kondaExtra = cursor2.value.konda; //Grupo de preço Extra
																						console.log("Grupo de Preço Extra:" + oItemPedido.kondaExtra + " do grupo da familia Extra: " +
																							oItemPedido.kondmExtra);
																					}
																				}
																				cursor2.continue();

																			} else {

																				var objA969 = db.transaction("A969").objectStore("A969");
																				objA969.openCursor().onsuccess = function(event3) {
																					var cursorA969 = event3.target.result;

																					if (cursorA969) {

																						if (cursorA969.value.konda === oItemPedido.kondaExtra) {

																							oItemPedido.knumhExtra = cursorA969.value.knumh; // Registro de condição 

																							console.log("Registro de condição :" + oItemPedido.knumhExtra);
																						}

																						cursorA969.continue();

																					} else {

																						that.calculaPrecoItem();
																						that.popularCamposItemPedido();

																						sap.ui.getCore().byId("idQuantidade").focus();
																						oPanel.setBusy(false);
																					}
																				};

																			}
																		};
																	}
																};
															}
														};
													}
												};
											}
										};
									}
								};

							} else {
								MessageBox.show("Produto: " + codItem + " já inserido na lista de itens!", {
									icon: MessageBox.Icon.ERROR,
									title: "Produto já inserido.",
									actions: [MessageBox.Action.YES],
									onClose: function() {

										that.onResetaCamposDialog();
										sap.ui.getCore().byId("idItemPedido").focus();
										oPanel.setBusy(false);

									}
								});
							}
						}
					};
				} else {

					oPanel.setBusy(false);
					that.onResetaCamposDialog();
				}

			};
		},

		onCriarIndexItemPedido: function() {
			//Define o index do produto a ser inserido
			for (var i = 0; i < objItensPedidoTemplate.length; i++) {
				if (i === 0) {
					var aux = objItensPedidoTemplate[i].idItemPedido.split("/");
					indexItem = parseInt(aux[1]);

				} else if (i > 0) {
					aux = objItensPedidoTemplate[i].idItemPedido.split("/");

					if (indexItem < parseInt(aux[1])) {
						indexItem = parseInt(aux[1]);

					}
				}
			}
			if (objItensPedidoTemplate.length === 0) {
				indexItem = 1;
			} else {
				indexItem += 1;
			}

			return indexItem;
		},

		onItemChangeDiluicao: function(oEvent) {
			var that = this;
			var objAuxItem = {};
			var itemJaInseridoDiluicao = false;
			var itemEncontradoDiluicao = false;
			var oProduto = oEvent.getSource();
			var codItem = oProduto.getValue();
			var oPanel = sap.ui.getCore().byId("idDialog");
			var werks = this.getOwnerComponent().getModel("modelAux").getProperty("/Werks");
			var tabPreco = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco");

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

				if (codItem !== "") {
					oPanel.setBusy(true);

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(codItem);

					requestMaterial.onsuccess = function(e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + codItem, {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function() {
									that.onResetaCamposDialog();
									sap.ui.getCore().byId("idItemPedido").focus();
								}
							});

						} else {

							oItemPedido.zzQnt = 1;
							oItemPedido.matnr = oMaterial.matnr;
							oItemPedido.maktx = oMaterial.maktx;
							oItemPedido.ntgew = oMaterial.ntgew;
							oItemPedido.knumh = 0;
							oItemPedido.konda = 0;
							oItemPedido.kondm = 0;
							oItemPedido.knumhExtra = 0;
							oItemPedido.kondaExtra = 0;
							oItemPedido.kondmExtra = 0;

							for (var i = 0; i < objItensPedidoTemplate.length; i++) {
								if (objItensPedidoTemplate[i].matnr === codItem && objItensPedidoTemplate[i].tipoItem === "Normal") {

									objAuxItem = {
										idItemPedido: "",
										index: "",
										knumh: objItensPedidoTemplate[i].knumh,
										kondm: objItensPedidoTemplate[i].kondm,
										konda: objItensPedidoTemplate[i].konda,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										kondmExtra: objItensPedidoTemplate[i].kondmExtra,
										kondaExtra: objItensPedidoTemplate[i].kondaExtra,
										maktx: objItensPedidoTemplate[i].maktx,
										matnr: objItensPedidoTemplate[i].matnr,
										nrPedCli: objItensPedidoTemplate[i].nrPedCli,
										tipoItem: objItensPedidoTemplate[i].tipoItem,
										zzDesext: objItensPedidoTemplate[i].zzDesext,
										zzDesitem: objItensPedidoTemplate[i].zzDesitem,
										zzPercom: objItensPedidoTemplate[i].zzPercom,
										zzPervm: objItensPedidoTemplate[i].zzPervm,
										zzQnt: objItensPedidoTemplate[i].zzQnt,
										zzVprod: objItensPedidoTemplate[i].zzVprod,
										zzVprodDesc: objItensPedidoTemplate[i].zzVprodDesc,
										zzVprodDescTotal: objItensPedidoTemplate[i].zzVprodDescTotal,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal,
										zzPercDescDiluicao: 0,
										ntgew: objItensPedidoTemplate[i].ntgew

									};

									itemEncontradoDiluicao = true;
								}
								if (objItensPedidoTemplate[i].matnr === codItem && objItensPedidoTemplate[i].tipoItem === "Diluicao") {
									itemJaInseridoDiluicao = true;
									break;
								}
							}

							if (itemJaInseridoDiluicao == true) {

								MessageBox.show("Item de diluição já inserido!", {
									icon: MessageBox.Icon.ERROR,
									title: "Item inválido.",
									actions: [MessageBox.Action.OK],
									onClose: function() {
										oPanel.setBusy(false);
										sap.ui.getCore().byId("idItemPedido").focus();
										itemJaInseridoDiluicao = false;
									}
								});

							} else if (itemEncontradoDiluicao == true) {
								oItemPedido = objAuxItem;
								oItemPedido.tipoItem = "Diluicao";
								that.popularCamposItemPedido();
								itemJaInseridoDiluicao = false;
								itemEncontradoDiluicao = true;

							} else if (itemEncontradoDiluicao == false) {

								//REGRA DILUIÇÃO - > SENÃO EXISTIR ITEM NA GRID  .. ACHAR O VALOR MINIMO DO ITEM
								var storeA960 = db.transaction("A960", "readwrite");
								var objA960 = storeA960.objectStore("A960");

								var idA960 = werks + "." + tabPreco + "." + oMaterial.matnr;

								var requesA960 = objA960.get(idA960);

								requesA960.onsuccess = function(e) {
									var oA960 = e.target.result;

									if (oA960 == undefined) {
										oPanel.setBusy(false);

										MessageBox.show("Não existe preço para o produto: " + codItem + " de acordo com a tabela de preço: " +
											that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"), {
												icon: MessageBox.Icon.ERROR,
												title: "Preço do produto não encontrado.",
												actions: [MessageBox.Action.YES],
												onClose: function() {
													that.onResetaCamposDialog();
												}
											});

									} else {

										if (oA960.zzPervm !== "" || oA960.zzPervm !== undefined) {
											oA960.zzPervm = parseFloat(oA960.zzPervm);
										}
										if (oA960.zzPercom !== "" || oA960.zzPercom !== undefined) {
											oA960.zzPercom = parseFloat(oA960.zzPercom);
										}
										if (oA960.zzVprod !== "" || oA960.zzVprod !== undefined) {
											oA960.zzVprod = parseFloat(oA960.zzVprod);
										}

										// Desconto Extra aplicado depois do dento digitado no item
										oItemPedido.zzDesext = 0;
										oItemPedido.zzPervm = oA960.zzPervm; //Verba
										oItemPedido.zzPercom = oA960.zzPercom; //Comissão
										oItemPedido.zzVprod = oA960.zzVprod;
										oItemPedido.knumh = 0;
										oItemPedido.konda = 0;
										oItemPedido.kondm = 0;

										oItemPedido.knumhExtra = 0;
										oItemPedido.kondaExtra = 0;
										oItemPedido.kondmExtra = 0;

										oItemPedido.zzDesitem = 0;
										oItemPedido.zzPercDescTotal = 0;
										oItemPedido.zzPercDescDiluicao = 0;
										oItemPedido.tipoItem = "Diluicao";
										//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA OS DESCONTOS
										oItemPedido.zzVprodDesc = oItemPedido.zzVprod;

										var vetorAuxFamilias = [];
										var vetorAuxFamiliasExtra = [];
										var objA965 = db.transaction("A965").objectStore("A965");
										objA965.openCursor().onsuccess = function(event) {

											var cursor = event.target.result;

											if (cursor) {
												if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

													vetorAuxFamilias.push(cursor.value);
													console.log("Familia: " + cursor.value.kondm + " para o Item: " + cursor.value.matnr);
												}

												cursor.continue();

											} else {

												var objA966 = db.transaction("A966").objectStore("A966");
												objA966.openCursor().onsuccess = function(event2) {
													var cursor2 = event2.target.result;

													if (cursor2) {
														for (var i = 0; i < vetorAuxFamilias.length; i++) {

															if (cursor2.value.kondm === vetorAuxFamilias[i].kondm && cursor2.value.pltyp === tabPreco) {

																oItemPedido.kondm = cursor2.value.kondm; //Código Familia
																oItemPedido.konda = cursor2.value.konda; //Grupo de preço 
																console.log("Grupo de Preço:" + oItemPedido.konda + " do grupo da familia: " + cursor2.value.kondm);
															}
														}
														cursor2.continue();

													} else {
														// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
														var objA967 = db.transaction("A967").objectStore("A967");
														objA967.openCursor().onsuccess = function(event3) {
															var cursorA967 = event3.target.result;

															if (cursorA967) {

																if (cursorA967.value.konda === oItemPedido.konda) {

																	oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																	console.log("Registro de condição :" + oItemPedido.knumh);
																}

																cursorA967.continue();

															} else {

																var auxRangeQuant = 0;
																var objKonm = db.transaction("Konm").objectStore("Konm");
																objKonm.openCursor().onsuccess = function(event2) {
																	var cursor3 = event2.target.result;

																	if (cursor3) {

																		if (cursor3.value.knumh === oItemPedido.knumh && auxRangeQuant < parseFloat(cursor3.value.kbetr)) {

																			auxRangeQuant = parseFloat(cursor3.value.kbetr); //Desconto total a aplicar

																		}

																		cursor3.continue();

																	} else {

																		oItemPedido.kbetr = auxRangeQuant;
																		console.log("Percentual de Desconto Normal: " + oItemPedido.kbetr);

																		//Buscando Familia de desconto extra

																		var objA962 = db.transaction("A962").objectStore("A962");
																		objA962.openCursor().onsuccess = function(event) {

																			var cursor = event.target.result;

																			if (cursor) {
																				if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

																					vetorAuxFamiliasExtra.push(cursor.value);
																					console.log("Familia Extra: " + cursor.value.kondm + " para o Item: " + cursor.value.matnr);
																				}

																				cursor.continue();

																			} else {

																				var objA968 = db.transaction("A968").objectStore("A968");
																				objA968.openCursor().onsuccess = function(event2) {
																					cursor2 = event2.target.result;

																					if (cursor2) {
																						for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																							if (cursor2.value.kondm === vetorAuxFamiliasExtra[i].kondm && cursor2.value.pltyp === tabPreco) {

																								oItemPedido.kondmExtra = cursor2.value.kondm; //Código Familia Extra
																								oItemPedido.kondaExtra = cursor2.value.konda; //Grupo de preço Extra
																								console.log("Grupo de Preço Extra:" + oItemPedido.kondaExtra + " do grupo da familia Extra: " +
																									oItemPedido.kondmExtra);
																							}
																						}
																						cursor2.continue();

																					} else {

																						var objA969 = db.transaction("A969").objectStore("A969");
																						objA969.openCursor().onsuccess = function(event3) {
																							var cursorA969 = event3.target.result;

																							if (cursorA969) {

																								if (cursorA969.value.konda === oItemPedido.kondaExtra) {

																									oItemPedido.knumhExtra = cursorA969.value.knumh; // Registro de condição 

																									console.log("Registro de condição :" + oItemPedido.knumhExtra);
																								}

																								cursorA969.continue();

																							} else {
																								that.calculaPrecoItem();
																								that.popularCamposItemPedido();

																								sap.ui.getCore().byId("idQuantidade").focus();
																								oPanel.setBusy(false);
																							}
																						};
																					}
																				};
																			}
																		};
																	}
																};
															}
														};
													}
												};
											}
										};
									}
								};
							}
						}
					};
				}
			};
		},

		onResetaCamposDialog: function() {
			oItemPedido = [];
			sap.ui.getCore().byId("idItemPedido").setValue();
			sap.ui.getCore().byId("idDesconto").setValue();
			sap.ui.getCore().byId("idPrecoCheio").setValue();
			sap.ui.getCore().byId("idPrecoDesconto").setValue();
			sap.ui.getCore().byId("idVerba").setValue();
			sap.ui.getCore().byId("idDescricao").setValue();
			sap.ui.getCore().byId("idQuantidade").setValue();
			sap.ui.getCore().byId("idComissao").setValue();

		},

		onQuantidadeChange: function(evt) {
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

				var store = db.transaction("Materiais", "readwrite");
				var objMaterial = store.objectStore("Materiais");

				var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

				requestMaterial.onsuccess = function(e) {
					var oMaterial = e.target.result;

					if (oMaterial == undefined) {

						MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
							icon: MessageBox.Icon.ERROR,
							title: "Produto não encontrado.",
							actions: [MessageBox.Action.YES],
							onClose: function() {
								that.onResetaCamposDialog();
								sap.ui.getCore().byId("idItemPedido").focus();
							}
						});

					} else {
						var quantidade = sap.ui.getCore().byId("idQuantidade").getValue();

						if (sap.ui.getCore().byId("idQuantidade").getValue() > 0) {

							oItemPedido.zzQnt = parseInt(quantidade);
							that.calculaPrecoItem();
							that.popularCamposItemPedido();

						} else {
							MessageBox.show("Quantidade deve ser maior que 0.", {
								icon: MessageBox.Icon.ERROR,
								title: "Quantidade inválida.",
								actions: [MessageBox.Action.OK],
								onClose: function() {
									sap.ui.getCore().byId("idQuantidade").setValue(1);
									sap.ui.getCore().byId("idQuantidade").focus();

								}
							});
						}
					}
				};
			};
		},

		onFocusQnt: function() {
			sap.ui.getCore().byId("idDesconto").focus();
		},

		onDescontoChange: function() {
			var desconto = sap.ui.getCore().byId("idDesconto").getValue();
			if (desconto === "") {
				desconto = 0;
			}

			if (desconto >= 0) {

				oItemPedido.zzDesitem = parseFloat(desconto);
				this.calculaPrecoItem();
				this.popularCamposItemPedido();

			} else {
				MessageBox.show("O desconto não pode ser negativo.", {
					icon: MessageBox.Icon.ERROR,
					title: "Desconto inválida.",
					actions: [MessageBox.Action.OK],
					onClose: function() {

					}
				});
			}
		},

		calculaPrecoItem: function() {
			oItemPedido.zzPercDescTotal = 0;

			if (oItemPedido.tipoItem === "Diluicao" && oItemPedido.kbetr > 0) {

				oItemPedido.zzVprodDesc = oItemPedido.zzVprod - (oItemPedido.zzVprod * oItemPedido.kbetr / 100);
				oItemPedido.zzPercDescTotal = oItemPedido.kbetr + oItemPedido.zzPercDescDiluicao;

			} else {

				//Inicialmente o valor cheio do produto é atribuido para o valor com desconto.
				// 1º Aplicar - Preco Cheio do produto - tabela (avista -5%) a prazo sem desconto.
				//Senão for desconto avista, criar o campo zzPercDescTotal do item do pedido com desconto zerado. 
				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

					oItemPedido.zzVprodDesc = (oItemPedido.zzVprod) - ((oItemPedido.zzVprod) * (5 / 100));

				}

				//2º Aplicar o Desconto digitado na tela de digitação dos itens
				oItemPedido.zzVprodDesc = oItemPedido.zzVprodDesc - ((oItemPedido.zzVprodDesc) * (oItemPedido.zzDesitem / 100));

				// 3º Aplicar o desconto extra do item cadastrado na tabela (TabPrecoItem - zzDesext).
				// oItemPedido.zzVprodDesc = oItemPedido.zzVprodDesc - ((oItemPedido.zzVprodDesc) * (oItemPedido.zzDesext / 100));
				// oItemPedido.zzVprodDesc = Math.round(parseFloat(oItemPedido.zzVprodDesc * 100)) / 100;

				//SOMA TODOS OS DESCONTOS APLICADO NOS ITENS.

				oItemPedido.zzPercDescTotal += oItemPedido.zzDesitem + oItemPedido.zzPercDescDiluicao;
			}

			//calcula a multiplicação pela quantidade depois que o valor unitário está calculado.
			oItemPedido.zzVprodDescTotal = oItemPedido.zzVprodDesc * oItemPedido.zzQnt;
			oItemPedido.zzVprodDescTotal = Math.round(parseFloat(oItemPedido.zzVprodDescTotal * 100)) / 100;
		},

		calculaTotalPedido: function() {
			var TotalDesc = 0;
			var Total = 0;
			var Qnt = 0;
			var QntProdutos = 0;
			var Ntgew = 0;

			for (var i = 0; i < objItensPedidoTemplate.length; i++) {
				if (objItensPedidoTemplate[i].tipoItem !== "Diluicao") {

					TotalDesc += objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt;
					Total += objItensPedidoTemplate[i].zzVprod * objItensPedidoTemplate[i].zzQnt;
					Qnt += objItensPedidoTemplate[i].zzQnt;
					QntProdutos += 1;

					if (objItensPedidoTemplate[i].ntgew > 0) {
						Ntgew += objItensPedidoTemplate[i].ntgew * objItensPedidoTemplate[i].zzQnt;
					}

				}
			}
			//Calculando total de desconto dado.
			TotalDesc = Math.round(parseFloat(TotalDesc * 100)) / 100;

			var descontoTotal = Total - TotalDesc;
			descontoTotal = Math.round(parseFloat(descontoTotal * 100)) / 100;

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", QntProdutos);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", TotalDesc);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Ntgew", Ntgew);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", descontoTotal);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", 0);

			console.log("Dados Totais atualizados para itens Normais. (Diluição não entra na soma)");
		},

		onCalculaDiluicaoItem: function() {
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
				var NrPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
				var store = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
				store.openCursor().onsuccess = function(event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.nrPedCli === NrPedido) {

							var store2 = db.transaction("ItensPedido", "readwrite");
							var objItemPedido = store2.objectStore("ItensPedido");

							var request = objItemPedido.delete(cursor.key);

							request.onsuccess = function() {
								console.log("Itens Pedido deletado(s)!");
							};
							request.onerror = function() {
								console.log("Itens Pedido não foi deletado(s)!");
							};
						}
						cursor.continue();
					} else {

						var TotalNormal = 0;
						var TotalDiluicao = 0;
						var PercDescDiluicao = 0;
						var vetorAuxObjetos = [];
						var vetorAux = [];
						var existeItem = false;

						var inseridoAux = false;
						var inseridoAuxDiluicao = false;

						//ACHA O PERCENTUAL DE DESCONTO
						for (var i = 0; i < objItensPedidoTemplate.length; i++) {
							inseridoAux = false;
							inseridoAuxDiluicao = false;

							if (objItensPedidoTemplate[i].tipoItem === "Normal") {
								TotalNormal += objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt;

								//Regra para totalizar o total do pedido.
								if (vetorAux.length == 0) {

									var objAuxItem = {
										idItemPedido: objItensPedidoTemplate[i].idItemPedido,
										index: objItensPedidoTemplate[i].index,
										knumh: objItensPedidoTemplate[i].knumh,
										konda: objItensPedidoTemplate[i].konda,
										kondm: objItensPedidoTemplate[i].kondm,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										kondaExtra: objItensPedidoTemplate[i].kondaExtra,
										kondmExtra: objItensPedidoTemplate[i].kondmExtra,
										maktx: objItensPedidoTemplate[i].maktx,
										matnr: objItensPedidoTemplate[i].matnr,
										nrPedCli: objItensPedidoTemplate[i].nrPedCli,
										tipoItem: "Diluido",
										ntgew: objItensPedidoTemplate[i].ntgew,
										zzDesext: objItensPedidoTemplate[i].zzDesext,
										zzDesitem: objItensPedidoTemplate[i].zzDesitem,
										zzPercom: objItensPedidoTemplate[i].zzPercom,
										zzPervm: objItensPedidoTemplate[i].zzPervm,
										zzQnt: 0,
										zzVprod: objItensPedidoTemplate[i].zzVprod,
										zzVprodDesc: objItensPedidoTemplate[i].zzVprodDesc,
										zzPercDescDiluicao: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal + PercDescDiluicao,
										zzVprodDescTotal: objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt

									};

									vetorAux.push(objAuxItem);
								}

								for (var t = 0; t < vetorAux.length; t++) {

									if (vetorAux[t].matnr == objItensPedidoTemplate[i].matnr) {
										inseridoAux = true;
									}
								}

								if (inseridoAux == false) {

									var objAuxItem1 = {
										idItemPedido: objItensPedidoTemplate[i].idItemPedido,
										index: objItensPedidoTemplate[i].index,
										knumh: objItensPedidoTemplate[i].knumh,
										konda: objItensPedidoTemplate[i].konda,
										kondm: objItensPedidoTemplate[i].kondm,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										kondaExtra: objItensPedidoTemplate[i].kondaExtra,
										kondmExtra: objItensPedidoTemplate[i].kondmExtra,
										maktx: objItensPedidoTemplate[i].maktx,
										matnr: objItensPedidoTemplate[i].matnr,
										nrPedCli: objItensPedidoTemplate[i].nrPedCli,
										tipoItem: "Diluido",
										ntgew: objItensPedidoTemplate[i].ntgew,
										zzDesext: objItensPedidoTemplate[i].zzDesext,
										zzDesitem: objItensPedidoTemplate[i].zzDesitem,
										zzPercom: objItensPedidoTemplate[i].zzPercom,
										zzPervm: objItensPedidoTemplate[i].zzPervm,
										zzQnt: 0,
										zzVprod: objItensPedidoTemplate[i].zzVprod,
										zzVprodDesc: objItensPedidoTemplate[i].zzVprodDesc,
										zzPercDescDiluicao: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal + PercDescDiluicao,
										zzVprodDescTotal: objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt
									};

									vetorAux.push(objAuxItem1);
								}

							} else if (objItensPedidoTemplate[i].tipoItem === "Diluicao") {
								TotalDiluicao += objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt;

								for (t = 0; t < vetorAux.length; t++) {

									if (vetorAux[t].matnr == objItensPedidoTemplate[i].matnr) {
										inseridoAuxDiluicao = true;
									}
								}

								if (inseridoAuxDiluicao == false) {

									var objAuxItem2 = {
										idItemPedido: objItensPedidoTemplate[i].idItemPedido,
										index: objItensPedidoTemplate[i].index,
										knumh: objItensPedidoTemplate[i].knumh,
										konda: objItensPedidoTemplate[i].konda,
										kondm: objItensPedidoTemplate[i].kondm,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										kondaExtra: objItensPedidoTemplate[i].kondaExtra,
										kondmExtra: objItensPedidoTemplate[i].kondmExtra,
										maktx: objItensPedidoTemplate[i].maktx,
										matnr: objItensPedidoTemplate[i].matnr,
										nrPedCli: objItensPedidoTemplate[i].nrPedCli,
										tipoItem: "Diluido",
										ntgew: objItensPedidoTemplate[i].ntgew,
										zzDesext: objItensPedidoTemplate[i].zzDesext,
										zzDesitem: objItensPedidoTemplate[i].zzDesitem,
										zzPercom: objItensPedidoTemplate[i].zzPercom,
										zzPervm: objItensPedidoTemplate[i].zzPervm,
										zzQnt: 0,
										zzVprod: objItensPedidoTemplate[i].zzVprod,
										zzVprodDesc: objItensPedidoTemplate[i].zzVprodDesc,
										zzPercDescDiluicao: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal + PercDescDiluicao,
										zzVprodDescTotal: objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt
									};

									vetorAux.push(objAuxItem2);
								}
							}
						}

						PercDescDiluicao = TotalNormal / (TotalNormal + TotalDiluicao);
						PercDescDiluicao = parseFloat((1 - PercDescDiluicao) * 100);

						console.log("Perc. de desconto para ser aplicado nos itens na regra de Diluição " + PercDescDiluicao);

						//APLICA O DESCONTO
						// for (var j = 0; j < objItensPedidoTemplate.length; j++) {

						// 	oItemPedido.zzVprodDesc = oItemPedido.zzVprodDesc - ((oItemPedido.zzVprodDesc) * (PercDescDiluicao / 100));
						// 	oItemPedido.zzVprodDesc = Math.round(parseFloat(oItemPedido.zzVprodDesc * 100)) / 100;

						// }

						for (var j = 0; j < vetorAux.length; j++) {

							vetorAux[j].zzVprodDesc = vetorAux[j].zzVprodDesc - ((vetorAux[j].zzVprodDesc) * (PercDescDiluicao / 100));
							// vetorAux[j].zzVprodDesc = Math.round(parseFloat(vetorAux[j].zzVprodDesc * 100)) / 100;

						}
						for (var l = 0; l < objItensPedidoTemplate.length; l++) {
							for (var m = 0; m < vetorAux.length; m++) {
								if (vetorAux[m].matnr === objItensPedidoTemplate[l].matnr) {
									vetorAux[m].zzQnt += objItensPedidoTemplate[l].zzQnt;
									vetorAux[m].zzVprodDescTotal = vetorAux[m].zzVprodDesc * vetorAux[m].zzQnt;
									vetorAux[m].zzVprodDesc = vetorAux[m].zzVprodDesc;
								}
							}
						}

						for (m = 0; m < vetorAux.length; m++) {
							vetorAux[m].zzVprodDescTotal = Math.round(parseFloat((vetorAux[m].zzVprodDescTotal) * 100)) / 100;
							vetorAux[m].zzVprodDesc = Math.round(parseFloat(vetorAux[m].zzVprodDesc * 100)) / 100;
							vetorAux[m].zzPercDescTotal = Math.round(parseFloat(vetorAux[m].zzPercDescTotal + PercDescDiluicao) * 100) / 100;
						}

						objItensPedidoTemplate = [];
						objItensPedidoTemplate = vetorAux;
						var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");

						console.log("Resultado dos itens da regra de Diluição");
						console.log(vetorAuxObjetos);

						var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
						var objItensPedido = storeItensPedido.objectStore("ItensPedido");

						for (var p = 0; p < objItensPedidoTemplate.length; p++) {

							var requestADDItem = objItensPedido.add(objItensPedidoTemplate[p]);

							requestADDItem.onsuccess = function(e3) {
								console.log("Item adicionado com sucesso");

							};
							requestADDItem.onerror = function(e3) {
								console.log("Falha ao adicionar o Item");
							};

						}

						that.calculaTotalPedido();
						that.setaCompleto(db, "Não");

						that.byId("idDiluirItens").setEnabled(false);
						that.byId("idInserirItemDiluicao").setEnabled(false);
						that.byId("idInserirItem").setEnabled(false);

						that.byId("idTipoNegociacao").setProperty("enabled", false);
						that.byId("idTabelaPreco").setProperty("enabled", false);
						that.byId("idTipoTransporte").setProperty("enabled", false);
						that.byId("idPrimeiraParcela").setProperty("enabled", false);
						that.byId("idQuantParcelas").setProperty("enabled", false);
						that.byId("idIntervaloParcelas").setProperty("enabled", false);

						oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");
					}
				};
			};
		},

		onCalculaBalancoVenda: function() {
			//buscar os campos zzPrzmax/ zzPrzmin/ zzVlrPedMin na tabela de preço
			var that = this;
			var vetorRange = [];
			var percJuros = 0;
			var percJurosDia = 0;
			var prazoMaxAprazo = 0;
			var prazoMaxAprazo = 0;
			var prazoMaxAprazo = 0;
			var prazoMaxAprazo = 0;
			var prazoMaxAprazo = 0;

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

				var transaction = db.transaction("Konm", "readonly");
				var objectStore = transaction.objectStore("Konm");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function(event) {

						that.vetorRange = event.target.result;

						var transaction1 = db.transaction("A964", "readonly");
						var objectStore1 = transaction1.objectStore("A964");

						if ("getAll" in objectStore1) {
							objectStore1.getAll().onsuccess = function(event) {

								var vetorPerc = event.target.result;

								that.percJuros = parseFloat(vetorPerc[0].zzPerjur);
								that.percJurosDia = that.percJuros / 30;

								var transaction2 = db.transaction("A960", "readonly");
								var objectStore2 = transaction2.objectStore("A960");

								if ("getAll" in objectStore2) {
									objectStore2.getAll().onsuccess = function(event) {

										var perc = event.target.result;

										that.prazoMaxAprazo = parseFloat(perc[0].zzPrzmaxap);
										that.prazoMinAprazo = parseFloat(perc[0].zzPrzminap);
										that.prazoMaxAvista = parseFloat(perc[0].zzPrzmaxav);
										that.prazoMinAvista = parseFloat(perc[0].zzPrzminav);
										that.valorPedMin = parseFloat(perc[0].zzVlrPedMin);

										var vetorParametros = [that.prazoMaxAvista, that.prazoMaxAprazo, that.prazoMinAprazo,
											that.prazoMinAvista, that.valorPedMin, that.percJuros, that.percJurosDia
										];

										//Quando termina de carregar as tabelas usadas .. chamar as funções
										//usa apenas vetorRange
										that.onDefineFamilias(that.vetorRange, "Normal");
										that.onDefineFamilias(that.vetorRange, "Extra");
										that.onCalculaPrazoMedio(vetorParametros);

									};
								}
							};
						}
					};
				}
			};
		},

		onDefineFamilias: function(vetorRange, tipoDesconto) {
			var vetorGeral = objItensPedidoTemplate;
			var vetorGeralExtra = objItensPedidoTemplate;
			var vetorFamilia = [];
			var proximoItemDiferente = false;
			var percDescPermitido = 0;

			if (tipoDesconto == "Normal") {
				
				//Ordenando para desconto Familia normal
				vetorGeral.sort(function(a, b) {
					return parseInt(a.kondm) - parseInt(b.kondm);
				});

				for (var o = 0; o < vetorGeral.length; o++) {

					if (proximoItemDiferente == true) {
						proximoItemDiferente = false;
						percDescPermitido = 0;
						vetorFamilia = [];
					}

					if (vetorFamilia.length == 0 && vetorGeral.length == 1) {

						vetorFamilia.push(vetorGeral[o]);
						this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);

					} else if (vetorGeral.length > 1 && (o + 1) < vetorGeral.length) {

						if (vetorGeral[o].kondm == vetorGeral[o + 1].kondm) {

							proximoItemDiferente = false;
							vetorFamilia.push(vetorGeral[o]);

						} else {
							//Nesse momento tenho os itens daquela familia.. tendo os itens da familia .. somar as quantidades
							// e verificar se o desconto aplicado é maior que o permitido.
							//fazendo ( preço cheio - preço de venda )
							vetorFamilia.push(vetorGeral[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange);
							proximoItemDiferente = true;
						}

					} 
					else if ((o + 1) == vetorGeral.length) {

						//sinal proximoItemDiferente = true e limpou
						if (vetorFamilia.length > 0) {

							vetorFamilia.push(vetorGeral[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);

						} else {
							//ultimo item e é diferente do antepenultimo
							vetorFamilia.push(vetorGeral[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);
						}
					}
				}
				console.log(objItensPedidoTemplate);
			} else if (tipoDesconto == "Extra") {
				
				//Ordenando para desconto Familia normal
				vetorGeralExtra.sort(function(a, b) {
					return a.kondmExtra - b.kondmExtra;
				});

				for (o = 0; o < vetorGeralExtra.length; o++) {

					if (proximoItemDiferente == true) {
						proximoItemDiferente = false;
						percDescPermitido = 0;
						vetorFamilia = [];
					}

					if (vetorFamilia.length == 0 && vetorGeralExtra.length == 1) {

						vetorFamilia.push(vetorGeralExtra[o]);
						this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);

					} else if (vetorGeralExtra.length > 1 && (o + 1) < vetorGeralExtra.length) {

						if (vetorGeralExtra[o].kondm == vetorGeralExtra[o + 1].kondm) {

							proximoItemDiferente = false;
							vetorFamilia.push(vetorGeralExtra[o]);

						} else {
							//Nesse momento tenho os itens daquela familia.. tendo os itens da familia .. somar as quantidades
							// e verificar se o desconto aplicado é maior que o permitido.
							//fazendo ( preço cheio - preço de venda )
							vetorFamilia.push(vetorGeralExtra[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange);
							proximoItemDiferente = true;
						}

					} else if ((o + 1) == vetorGeralExtra.length) {

						//sinal proximoItemDiferente = true e limpou
						if (vetorFamilia.length > 0) {

							vetorFamilia.push(vetorGeralExtra[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);

						} else {
							//ultimo item e é diferente do antepenultimo
							vetorFamilia.push(vetorGeralExtra[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);
						}
					}
				}
				console.log(objItensPedidoTemplate);
			}
		},

		//Calcula se o item entra no desconto extra e calcula o desconto normal
		onBuscaPorcentagem: function(vetorFamilia, vetorDescontos, tipoDesconto) {

			var auxRangeQuant = 0;
			var auxRangeQuantExtra = 0;
			var knumh = "";
			var knumhExtra = "";
			var vetorAuxFamilia = [];
			var percDescPermitido = 0;
			var percDescPermitidoExtra = 0;

			if (tipoDesconto == "Normal") {
				for (var u = 0; u < vetorFamilia.length; u++) {
					auxRangeQuant += vetorFamilia[u].zzQnt;
					knumh = vetorFamilia[u].knumh;
				}

				for (var v = 0; v < vetorDescontos.length; v++) {
					if (vetorDescontos[v].knumh === knumh) {
						vetorAuxFamilia.push(vetorDescontos[v]);
					}
				}

				vetorAuxFamilia.sort(function(a, b) {
					return a.kondm - b.kondm;
				});

				//Vetor da familia ordenado pela quantidade (menor primeiro), se o kra for menor (break) e usa o desconto.
				//Depois verificar com cada item da do vetorFamilia se o desconto aplicado ultrapassou;
				for (var e = 0; e < vetorAuxFamilia.length; e++) {

					if (auxRangeQuant <= vetorAuxFamilia[e].kstbm) {
						percDescPermitido = vetorAuxFamilia[e].kbetr;
						break;

					} else if (auxRangeQuant > vetorAuxFamilia[e].kstbm) {
						percDescPermitido = vetorAuxFamilia[e].kbetr;
					}
				}

				oItemPedido.kbetr = auxRangeQuant;
				console.log("Percentual de Desconto Permitido : " + percDescPermitido + ", Quantidade: " + auxRangeQuant);

				for (u = 0; u < vetorFamilia.length; u++) {
					vetorFamilia[u].maxDescPermitido = percDescPermitido;
				}
				
				return vetorFamilia;

			} else if (tipoDesconto == "Extra") {

				for (u = 0; u < vetorFamilia.length; u++) {
					auxRangeQuantExtra += vetorFamilia[u].zzQnt;
					knumhExtra = vetorFamilia[u].knumhExtra;
				}

				for (v = 0; v < vetorDescontos.length; v++) {
					if (vetorDescontos[v].knumh === knumhExtra) {
						vetorAuxFamilia.push(vetorDescontos[v]);
					}
				}

				vetorAuxFamilia.sort(function(a, b) {
					return a.kondm - b.kondm;
				});

				//Vetor da familia ordenado pela quantidade (menor primeiro), se o kra for menor (break) e usa o desconto.
				//Depois verificar com cada item da do vetorFamilia se o desconto aplicado ultrapassou;
				for (e = 0; e < vetorAuxFamilia.length; e++) {

					if (auxRangeQuantExtra <= vetorAuxFamilia[e].kstbm) {
						percDescPermitidoExtra = vetorAuxFamilia[e].kbetr;
						break;

					} else if (auxRangeQuant > vetorAuxFamilia[e].kstbm) {
						percDescPermitidoExtra = vetorAuxFamilia[e].kbetr;
					}
				}

				oItemPedido.kbetr = auxRangeQuantExtra;
				console.log("Percentual de Desconto Extra: " + percDescPermitidoExtra + ", Quantidade: " + auxRangeQuantExtra);

				for (u = 0; u < vetorFamilia.length; u++) {
					vetorFamilia[u].maxDescPermitidoExtra = percDescPermitidoExtra;
				}
				
				return vetorFamilia;
			}
		},

		onCalculaPrazoMedio: function(vetorParametros) {

			//pre requisito ter executado total do pedido antes de executar essa função
			//Parâmetros pegos do banco antes de executar a função 

			var that = this;
			var diasExcedente = 0;
			var percExcedentePrazoMed = 0;
			var somatoriaParcelas = 0;
			var valorDasparcelas = 0;
			var mediaPonderada = 0;
			var existeEntrada = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ExisteEntradaPedido");
			var intervaloParcelas = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IntervaloParcelas"));
			var quantidadeParcelas = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/QuantParcelas"));
			var diasPrimeiraParcela = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DiasPrimeiraParcela"));
			var valorEntradaPedido = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido"));
			var percEntradaPedido = parseFloat(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido"));
			var valTotPed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotPed");
			var prazoMaxAvista = vetorParametros[0]; //prazoMaxAvista;
			var prazoMaxAprazo = vetorParametros[1]; //prazoMaxAprazo;
			var prazoMinAprazo = vetorParametros[2]; //prazoMinAprazo;
			var prazoMinAvista = vetorParametros[3]; //prazoMinAvista;
			var valorPedMin = vetorParametros[4]; //valorPedMin;
			var percJuros = vetorParametros[5]; //percJuros;
			var percJurosDia = vetorParametros[6]; //percJurosDia;

			if (existeEntrada === false || existeEntrada == "") {
				//Calculo prazo medio normal
				var prazoMedio = Math.round((parseInt(intervaloParcelas) * parseInt(quantidadeParcelas) + parseInt(diasPrimeiraParcela)) /
					parseInt(
						quantidadeParcelas) * 100) / 100;
				if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {
					if (valTotPed < valorPedMin && prazoMedio >= prazoMinAvista) {

						diasExcedente = prazoMedio - prazoMinAvista;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed < valorPedMin && prazoMedio < prazoMinAvista) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed >= valorPedMin && prazoMedio >= prazoMaxAvista) {

						diasExcedente = prazoMedio - prazoMaxAvista;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed >= valorPedMin && prazoMedio < prazoMaxAvista) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
					}

				} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
					if (valTotPed < valorPedMin && prazoMedio >= prazoMinAprazo) {

						diasExcedente = prazoMedio - prazoMinAprazo;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed < valorPedMin && prazoMedio < prazoMinAprazo) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed >= valorPedMin && prazoMedio >= prazoMaxAprazo) {

						diasExcedente = prazoMedio - prazoMaxAprazo;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					} else if (valTotPed >= valorPedMin && prazoMedio < prazoMaxAprazo) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

					}
				}
			}
			//Quando existe entrada
			else if (existeEntrada === true) {

				if (valorEntradaPedido > 0 || valorEntradaPedido != null || valorEntradaPedido != undefined) {

					valorDasparcelas = Math.round(parseFloat((valTotPed - valorEntradaPedido) / quantidadeParcelas) * 100) / 100;

					//COMEÇA EM 1 POR QUE A PRIMEIRA PARCELA É DEFINIDO.
					for (var i = 1; i < quantidadeParcelas; i++) {
						somatoriaParcelas = (valorDasparcelas * intervaloParcelas);
					}

					mediaPonderada = ((diasPrimeiraParcela * valorDasparcelas) + somatoriaParcelas) / valTotPed * quantidadeParcelas;
					mediaPonderada = Math.round(mediaPonderada * 100) / 100;

					if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAvista) {

							diasExcedente = mediaPonderada - prazoMinAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAvista) {
							//Não gera excedente.
							console.log("Não gerou excedente 1");

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAvista) {

							diasExcedente = mediaPonderada - prazoMaxAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAvista) {
							//Não gera excedente.
							console.log("Não gerou excedente 2");
						}

					} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAprazo) {

							diasExcedente = mediaPonderada - prazoMinAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAprazo) {
							//Não gera excedente.
							console.log("Não gerou excedente 3");

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAprazo) {

							diasExcedente = mediaPonderada - prazoMaxAprazo;
							percExcedentePrazoMed = Math.round((Math.round((diasExcedente * (percJurosDia)) * 100) / 100) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAprazo) {
							//Não gera excedente.
							console.log("Não gerou excedente 4");
						}
					}
				} else if (percEntradaPedido > 0 || percEntradaPedido != null || percEntradaPedido != undefined) {

					valorDasparcelas = (valTotPed - (percEntradaPedido * valTotPed)) / quantidadeParcelas;

					//COMEÇA EM 1 POR QUE A PRIMEIRA PARCELA É DEFINIDO.
					for (i = 1; i < quantidadeParcelas; i++) {
						somatoriaParcelas = (valorDasparcelas * intervaloParcelas);
					}

					mediaPonderada = ((diasPrimeiraParcela * valorDasparcelas) + somatoriaParcelas) / valTotPed * quantidadeParcelas;
					mediaPonderada = Math.round(mediaPonderada * 100) / 100;

					if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAvista) {

							diasExcedente = mediaPonderada - prazoMinAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAvista) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAvista) {

							diasExcedente = mediaPonderada - prazoMaxAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAvista) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						}

					} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAprazo) {

							diasExcedente = mediaPonderada - prazoMinAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAprazo) {
							//Não gera excedente.

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAprazo) {

							diasExcedente = mediaPonderada - prazoMaxAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAprazo) {
							//Não gera excedente.

						}
					}
				}
			}

		},

		onNavegaBalancoVenda: function() {

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab6");

		},

		popularCamposItemPedido: function() {

			sap.ui.getCore().byId("idItemPedido").setValue(oItemPedido.matnr);
			sap.ui.getCore().byId("idDescricao").setValue(oItemPedido.maktx);
			sap.ui.getCore().byId("idQuantidade").setValue(oItemPedido.zzQnt);
			sap.ui.getCore().byId("idVerba").setValue(oItemPedido.zzPervm);
			sap.ui.getCore().byId("idComissao").setValue(oItemPedido.zzPercom);
			sap.ui.getCore().byId("idPrecoCheio").setValue(oItemPedido.zzVprod);
			sap.ui.getCore().byId("idDesconto").setValue(oItemPedido.zzDesitem);
			sap.ui.getCore().byId("idPrecoDesconto").setValue(oItemPedido.zzVprodDescTotal);

			var oPanel = sap.ui.getCore().byId("idDialog");
			oPanel.setBusy(false);

		},

		_handleValueHelpSearch: function(evt) {
			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, sValue), new sap.ui.model.Filter(
				"maktx", sap.ui.model.FilterOperator.Contains, sValue)];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			sap.ui.getCore().byId("idItemPedido").getBinding("suggestionItems").filter(aFilters);
			sap.ui.getCore().byId("idItemPedido").suggest();
		},

		onDialogCancelButton: function() {
			var that = this;
			oItemTemplateTotal = [];

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function() {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function() {
				objItensPedidoTemplate = [];
				var db = open.result;
				var numeroPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

				var store = db.transaction("ItensPedido").objectStore("ItensPedido");
				store.openCursor().onsuccess = function(event1) {
					var cursor = event1.target.result;

					if (cursor) {
						if (cursor.value.nrPedCli === numeroPedido) {
							objItensPedidoTemplate.push(cursor.value);
						}
						cursor.continue();
					} else {

						var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");

						that.calculaTotalPedido();

						//Clicou no editar item .. mas cancelou .. dai tem que resetar a variavel que identifica que é um edit
						that.getOwnerComponent().getModel("modelAux").setProperty("/EditarIndexItem", 0);
					}
				};
			};
		},

		onDialogSubmitButton: function() {

			var that = this;
			var aux = [];
			var indexEdit = that.getOwnerComponent().getModel("modelAux").getProperty("/EditarIndexItem");
			var nrPedCli = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
			var oPanel = sap.ui.getCore().byId("idDialog");
			var oButtonSalvar = sap.ui.getCore().byId("idButtonSalvarDialog");
			oButtonSalvar.setEnabled(false);

			//Define o index do produto a ser inserido
			for (var i = 0; i < objItensPedidoTemplate.length; i++) {
				if (i == 0) {
					aux = objItensPedidoTemplate[i].idItemPedido.split("/");
					indexItem = parseInt(aux[1]);

				} else if (i > 0) {
					aux = objItensPedidoTemplate[i].idItemPedido.split("/");

					if (indexItem < parseInt(aux[1])) {
						indexItem = parseInt(aux[1]);

					}
				}
			}
			if (objItensPedidoTemplate.length === 0) {
				indexItem = 1;
			} else {
				indexItem += 1;
			}

			// if(indexEdit !== "" && indexEdit !== undefined){
			// 	indexItem = indexEdit;
			// }

			if (sap.ui.getCore().byId("idItemPedido").getValue() === "") {
				MessageBox.show("Selecione um produto.", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao inserir",
					actions: [MessageBox.Action.OK],
					onClose: function() {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
					}
				});
			} else if (sap.ui.getCore().byId("idQuantidade").getValue() === "" || sap.ui.getCore().byId("idQuantidade").getValue() === 0) {

				MessageBox.show("Digite uma quantidade acima de 0.", {
					icon: MessageBox.Icon.ERROR,
					title: "Campo Inválido.",
					actions: [MessageBox.Action.OK],
					onClose: function() {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
						sap.ui.getCore().byId("idQuantidade").setValue(oItemTemplate.QtdPedida);

					}
				});

			} else {
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function() {
					oButtonSalvar.setEnabled(true);
					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function() {
					var db = open.result;

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

					requestMaterial.onsuccess = function(e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function() {
									that.onResetaCamposDialog();
									sap.ui.getCore().byId("idItemPedido").focus();
									oButtonSalvar.setEnabled(true);
								}
							});

						} else {

							var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
							var objItensPedido = storeItensPedido.objectStore("ItensPedido");

							// indexEdit inicia com 0, só é populado quando clica para editar 1 item. Senão sempre vai adicionar novo item
							var request = objItensPedido.get(indexEdit);

							request.onsuccess = function(e3) {
								var result2 = e3.target.result;
								//preparar o obj a ser adicionado ou editado
								if (result2 == undefined) {

									that.getOwnerComponent().getModel("modelAux").setProperty("/UltimoIndexItem", nrPedCli + "/" + (indexItem));
									oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/UltimoIndexItem");
									oItemPedido.index = indexItem;
									oItemPedido.nrPedCli = nrPedCli;
									var requestADDItem = objItensPedido.add(oItemPedido);
									requestADDItem.onsuccess = function(e3) {

										objItensPedidoTemplate.push(oItemPedido);
										// indexItem = indexItem + 1;
										that.setaCompleto(db, "Não");

										var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
										that.getView().setModel(oModel, "ItensPedidoGrid");

										console.log("Item: " + oItemPedido.index + " adicionado com sucesso");

										that.calculaTotalPedido();

									};
									requestADDItem.onerror = function(e3) {
										oButtonSalvar.setEnabled(true);
										console.log("Falha ao adicionar o Item: " + oItemPedido.index);
									};

									if (that._ItemDialog) {
										that._ItemDialog.destroy(true);
										oButtonSalvar.setEnabled(true);
									}
								} else {
									//OBJ ENCONTRADO NO BANCO... ATUALIZA ELE.
									oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/EditarIndexItem");

									var requestPutItens = objItensPedido.put(oItemPedido);
									requestPutItens.onsuccess = function() {
										for (var j = 0; j < objItensPedidoTemplate.length; j++) {
											if (objItensPedidoTemplate[j].idItemPedido === oItemPedido.idItemPedido) {
												objItensPedidoTemplate[j] = oItemPedido;
											}
										}

										that.setaCompleto(db, "Não");

										that.calculaTotalPedido();

										oItemTemplate = [];

										if (that._ItemDialog) {
											that._ItemDialog.destroy(true);
										}
										oButtonSalvar.setEnabled(true);

										that.getOwnerComponent().getModel("modelAux").setProperty("/EditarIndexItem", 0);
										var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
										that.getView().setModel(oModel, "ItensPedidoGrid");

										console.log("Item: " + oItemPedido.index + " foi Atualizado");

									};
									requestPutItens.onerror = function(event) {
										console.log(" Dados itensPedido não foram inseridos");

										oButtonSalvar.setEnabled(true);

										if (that._ItemDialog) {
											that._ItemDialog.destroy(true);
										}
									};
								}
							};
						}
					};
				};
			}
		},

		onDialogDiluicaoSubmitButton: function() {

			var that = this;
			var nrPedCli = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
			var oPanel = sap.ui.getCore().byId("idDialog");
			var oButtonSalvar = sap.ui.getCore().byId("idButtonSalvarDiluicaoDialog");
			oButtonSalvar.setEnabled(false);

			indexItem = this.onCriarIndexItemPedido();

			if (sap.ui.getCore().byId("idItemPedido").getValue() === "") {
				MessageBox.show("Selecione um produto.", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao inserir",
					actions: [MessageBox.Action.OK],
					onClose: function() {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
					}
				});
			} else if (sap.ui.getCore().byId("idQuantidade").getValue() === "" || sap.ui.getCore().byId("idQuantidade").getValue() === 0) {

				MessageBox.show("Digite uma quantidade acima de 0.", {
					icon: MessageBox.Icon.ERROR,
					title: "Campo Inválido.",
					actions: [MessageBox.Action.OK],
					onClose: function() {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
						sap.ui.getCore().byId("idQuantidade").setValue(oItemTemplate.QtdPedida);

					}
				});

			} else {
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function() {

					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							oButtonSalvar.setEnabled(true);
						}
					});
				};

				open.onsuccess = function() {
					var db = open.result;

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

					requestMaterial.onsuccess = function(e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function() {
									that.onResetaCamposDialog();
									sap.ui.getCore().byId("idItemPedido").focus();
									oButtonSalvar.setEnabled(true);
								}
							});

						} else {

							var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
							var objItensPedido = storeItensPedido.objectStore("ItensPedido");

							that.getOwnerComponent().getModel("modelAux").setProperty("/UltimoIndexItem", nrPedCli + "/" + (indexItem));
							oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/UltimoIndexItem");
							oItemPedido.index = indexItem;
							oItemPedido.nrPedCli = nrPedCli;
							var requestADDItem = objItensPedido.add(oItemPedido);
							requestADDItem.onsuccess = function(e3) {

								objItensPedidoTemplate.push(oItemPedido);
								// indexItem = indexItem + 1;
								that.setaCompleto(db, "Não");

								var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
								that.getView().setModel(oModel, "ItensPedidoGrid");

								that.byId("idDiluirItens").setEnabled(true);

								console.log("Item: " + oItemPedido.index + " adicionado com sucesso, tipo Item: " + oItemPedido.tipoItem);

								that.calculaTotalPedido();

							};
							requestADDItem.onerror = function(e3) {
								oButtonSalvar.setEnabled(true);
								console.log("Falha ao adicionar o Item: " + oItemPedido.index);
							};

							if (that._ItemDialog) {
								that._ItemDialog.destroy(true);
								oButtonSalvar.setEnabled(true);
							}
						}
					};
				};
			}
		},

		// FIM DOS DADOS FRAGMENTO

		// EVENTOS DA TABLE 						<<<<<<<<<<<<
		onNovoItem: function() {
			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/idSituacaoDadosPedido");
			oItemPedido = [];

			if (statusPedido > 2) {
				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});
			} else {
				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}

				if (!this._CreateMaterialFragment) {
					this._ItemDialog = sap.ui.xmlfragment(
						"testeui5.view.ItemDialog",
						this
					);
					this.getView().addDependent(this._ItemDialog);
				}

				this._ItemDialog.open();
				sap.ui.getCore().byId("idItemPedido").focus();
			}
		},

		onNovoItemDiluicao: function() {
			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/idSituacaoDadosPedido");
			oItemPedido = [];

			if (statusPedido > 2) {
				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});
			} else {
				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}

				if (!this._CreateMaterialFragment) {
					this._ItemDialog = sap.ui.xmlfragment(
						"testeui5.view.ItemDiluicaoDialog",
						this
					);
					this.getView().addDependent(this._ItemDialog);
				}

				this._ItemDialog.open();
				this.getOwnerComponent().getModel("modelAux").setProperty("/IserirDiluicao", true);
				sap.ui.getCore().byId("idItemPedido").focus();
			}
		},

		onEditarItemPress: function(oEvent) {

			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

			//VARIAVEL QUE MOSTRA UM ITEM ESTÁ SENDO EDITADO
			var itemPedido = oItem.getBindingContext("ItensPedidoGrid").getProperty("idItemPedido");
			that.getOwnerComponent().getModel("modelAux").setProperty("/EditarIndexItem", itemPedido);

			//TODO SETAR TODOS OS CAMPOS COM OS DADOS DO oItemTemplate  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
			for (var i = 0; i < objItensPedidoTemplate.length; i++) {

				if (objItensPedidoTemplate[i].idItemPedido === itemPedido) {
					oItemPedido = objItensPedidoTemplate[i];
				}
			}

			if (that._ItemDialog) {
				that._ItemDialog.destroy(true);
			}

			that._ItemDialog = sap.ui.xmlfragment(
				"testeui5.view.ItemDialog",
				that
			);
			that.getView().addDependent(that._ItemDialog);

			that._ItemDialog.open();
			that.popularCamposItemPedido();
			sap.ui.getCore().byId("idItemPedido").setEnabled(false);
		},

		onDeletarItemPedido: function(oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var idItemPedido = oItem.getBindingContext("ItensPedidoGrid").getProperty("idItemPedido");
			var idItem = oItem.getBindingContext("ItensPedidoGrid").getProperty("matnr");
			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/idSituacaoDadosPedido");
			if (statusPedido > 2) {
				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});
			} else {
				var that = this;
				MessageBox.show("Deseja excluir o item " + idItem + "?", {
					icon: MessageBox.Icon.WARNING,
					title: "Exclusão de Item!",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {

							for (var i = 0; i < objItensPedidoTemplate.length; i++) {
								if (objItensPedidoTemplate[i].idItemPedido === idItemPedido) {

									objItensPedidoTemplate.splice(i, 1);

									if (objItensPedidoTemplate.length === 0) {

										that.byId("idTipoNegociacao").setProperty("enabled", true);
										that.byId("idTabelaPreco").setProperty("enabled", true);
										that.byId("idTipoTransporte").setProperty("enabled", true);
										that.byId("idPrimeiraParcela").setProperty("enabled", true);
										that.byId("idQuantParcelas").setProperty("enabled", true);
										that.byId("idIntervaloParcelas").setProperty("enabled", true);

										that.byId("idDiluirItens").setEnabled(false);
										that.byId("idInserirItemDiluicao").setEnabled(true);
										that.byId("idInserirItem").setEnabled(true);

									}
								}
							}
							var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");

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

								that.setaCompleto(db, "Não");
								that.calculaTotalPedido();

								var store1 = db.transaction("ItensPedido", "readwrite");
								var objPedido = store1.objectStore("ItensPedido");

								var request = objPedido.delete(idItemPedido);
								request.onsuccess = function() {
									console.log("Item com ID: " + idItemPedido + " foi deletado!");
								};
								request.onerror = function() {
									console.log("ERRO!! Item: " + idItemPedido + "Não foi deletado!");
								};
							};
						}
					}
				});
			}
		},

		// FIM EVENTOS DA TABLe

		// EVENTOS DOS BOTÕES 						<<<<<<<<<<<<

		onFinalizarPedido: function() {

			//Percorre os itens do pedido para fazer uma verificação se realmente não tem produto repetido.
			var i = 0;
			var results = [];
			var itemDuplicado = false;
			var vetorAux = oItemTemplateTotal.slice().sort(); // Copia o vetor e já ordena ele.

			for (i = 0; i < vetorAux.length - 1; i++) {
				if (vetorAux[i + 1].ItCodigo == vetorAux[i].ItCodigo) {
					results.push(vetorAux[i]);
				}
			}

			if (results.length > 0 && typeof results != null && typeof results != undefined) {

				itemDuplicado = true;

			} else {

				itemDuplicado = false;

			}

			var that = this;
			//HRIMP E DATIMP
			var data = this.onDataAtualizacao();
			var horario = data[1];

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/situacaoDadosPedido", "PEN");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/idSituacaoDadosPedido", 2);

			var totalItens = that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/totalItens");
			var codMotivoDesconto = that.getOwnerComponent().getModel("modelDescontos").getProperty("/idDescontoPedido");
			var completoPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo");

			if (totalItens <= 0 || totalItens === undefined) {
				MessageBox.show("O pedido deve conter no mínimo 1 item.", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao Completar Pedido.",
					actions: [MessageBox.Action.OK]
				});
			} else if (itemDuplicado == true) {
				MessageBox.show("O pedido possui itens duplicados. Favor rever sua lista de itens!", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao Completar Pedido.",
					actions: [MessageBox.Action.OK]
				});
			} else {
				//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Atualizando o PrePedido PEDIDO NO BANCO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function() {
					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Falha ao abrir o banco para inserir os dados do pedido!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function() {
					var db = open.result;

					if (completoPedido == "Não") {

						var objBancoPrePedido = {
							NomeAbrev: that.getOwnerComponent().getModel("modelCliente").getProperty("/nomeAbrevCliente"),
							IdBase: that.getOwnerComponent().getModel("modelAux").getProperty("/IdBase"),
							NrPedcli: that.getOwnerComponent().getModel("modelAux").getProperty("/numeroPedido"),
							NrPedCliDTS: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/NrPedCliDTS"),
							CodEstabel: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/estabelecimentoDadosPedido"),
							Estado: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/estadoEstabelDadosPedido"),
							ValTotPed: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/totalPedido")),
							TipoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/tipoDadosPedido"),
							ValDescontoTotal: 0,
							ValDescontoDisp: parseFloat(that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoDisponivel")),
							ValDescontoInform: that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoAplicar"),
							ValLiqPed: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/totalLiquidoPedido")),
							idStatus: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/idSituacaoDadosPedido")),
							DescStatus: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/situacaoDadosPedido"),
							CodCliente: parseInt(that.getOwnerComponent().getModel("modelAux").getProperty("/CodCliente")),
							CodCondPag1: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/vencimento1DadosPedido"),
							CodCondPag2: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/vencimento2DadosPedido"),
							CodCondPag3: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/vencimento3DadosPedido"),
							DatEntrega: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/dataEntregaDadosPedido"),
							DatLimFat: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/dataLimiteFaturamentoDadosPedido"),
							CodEntrega: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/localEntregaDadosPedido"),
							NrTabpre: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/tabelaPrecoDadosPedido"),
							LogCotacao: "",
							ValVerbaPedido: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/verbaGasta")),
							PesoLiquido: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/pesoLiquido")),
							PesoBruto: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/pesoBruto")),
							ValTotIpi: 0,
							ValTotSt: parseFloat(that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/totalComSTPedido")),
							ValTotIpiSt: 0,
							CodRep: parseInt(that.getOwnerComponent().getModel("modelCliente").getProperty("/codigoRepresentante")),
							TabIndFin: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/indiceDadosPedido")),
							ValPctDescontoCanal: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValPctDescontoCanalDadosPedido")),
							PercAcresc: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercAcrescDadosPedido")),
							PercReduc: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercReducDadosPedido")),
							PercFator: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercFatorDadosPedido")),
							ValPctDescontoValor: that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoAplicar"),
							ValPctDescontoTotal: parseFloat(that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoDisponivel")),
							CodMotivDesconto: that.getOwnerComponent().getModel("modelDescontos").getProperty("/idDesconto"),
							Completo: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo"),
							ValMinPed: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/valorMinimoDadosPedido")),
							PedidoOrigem: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/pedidoOrigemClienteDadosPedido"),
							UserImpl: that.getOwnerComponent().getModel("modelAux").getProperty("/userID"),
							DatImpl: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/dataDadosPedido"),
							HraImpl: horario,
							ValCustoFixo: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCustoFixoDadosPedido")),
							ValCpmf: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCpmfDadosPedido")),
							ValIr: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValIrDadosPedido")),
							ValFrete: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValFreteDadosPedido")),
							ValComissao: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoDadosPedido")),
							ValContrato: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValContratoDadosPedido")),
							ValLucro: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValLucroDadosPedido")),
							PercIcms: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercIcmsDadosPedido")),
							PercPis: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercPisDadosPedido")),
							PercCofins: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercCofinsDadosPedido")),
							PercCpmf: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercCpmfDadosPedido")),
							PercIr: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercIrDadosPedido")),
							PercFrete: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercFreteDadosPedido")),
							PercComissao: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercComissaoDadosPedido")),
							PercContrato: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercContratoDadosPedido")),
							ValRoyalties: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValRoyaltiesDadosPedido")),
							PercRoyalties: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercRoyaltiesDadosPedido")),
							PercGanho: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercGanhoDadosPedido")),
							ValGanho: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValGanhoDadosPedido")),
							ValPrecoBase: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValPrecoBaseDadosPedido")),
							PercPromo: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercPromoDadosPedido")),
							ValPromocao: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValPromocaoDadosPedido")),
							PercCustoFixo: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercCustoFixoDadosPedido")),
							PercLucro: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercLucroDadosPedido")),
							ValIcms: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValIcmsDadosPedido")),
							ValFinsocial: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValFinsocialDadosPedido")),
							ValPis: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValPisDadosPedido")),
							PercRedIcm: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercRedIcmDadosPedido")),
							NrMesina: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/NrMesinaDadosPedido")),
							PercIncent: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercIncentDadosPedido")),
							DescJustificativa: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/observacoesDadosPedido"),
							CodMensagem1: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/mensagem1DadosPedido")),
							CodMensagem2: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/mensagem2DadosPedido")),
							CodMensagem3: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/mensagem3DadosPedido")),
							TipoTransporte: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/tipoTransporteDadosPedido"),
							CodEmpresa: parseInt(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/CodEmpresaDadosPedido")),
							LogItUnidNegoc: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/LogItUnidNegocDadosPedido"),
							PercRentNeg: parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercRentNegDadosPedido")),
							LogVerbaRentNeg: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/LogVerbaRentNegDadosPedido"),
							LogEnviaEmailCliente: that.byId("idCheckEmailCliente").getSelected(),
							LogEnviaEmailRepres: that.byId("idCheckEmailRepres").getSelected(),
							EmailCliente: that.byId("idEmailCliente").getValue(),
							EmailRepres: that.byId("idEmailRepres").getValue(),
							CodMotivDescCamp: that.getOwnerComponent().getModel("modelDescontos").getProperty("/idDescontoCamp"),
							ValDescCampDisp: that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoDisponivelCamp"),
							ValDescCampInform: that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoAplicarCamp"),
							rentabilidadeTotalImg: that.getOwnerComponent().getModel("modelTotalPedido").getProperty("/rentabilidadeTotalImg"),
							TipoIntegrBol: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoIntegrBol"),
							ValDescBoletoInform: that.getOwnerComponent().getModel("modelDescontos").getProperty("/descontoAplicarBoleto"),
							CodMotivDescBoleto: that.getOwnerComponent().getModel("modelDescontos").getProperty("/idDescontoBoleto")
						};

						var store1 = db.transaction("PrePedidos", "readwrite");
						var objPedido = store1.objectStore("PrePedidos");
						var request = objPedido.put(objBancoPrePedido);

						request.onsuccess = function() {
							// that.atualizaMovtoVerba(db);
							that.setaCompleto(db, "Sim");
							that.resetarCamposPrePedido();
							oItemTemplate = [];
							oItemTemplateTotal = [];
						};

						request.onerror = function() {
							console.log("Pedido não foi Inserido!");
						};
					}

					MessageBox.show("Deseja enviar o pedido agora ?", {
						icon: MessageBox.Icon.ERROR,
						title: "Atenção",
						actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function(oAction) {
							if (oAction == sap.m.MessageBox.Action.YES) {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("enviarPedidos");
								that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
							}
							if (oAction == sap.m.MessageBox.Action.NO) {
								sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
								that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
							}
						}
					});
				};
			}
		},

		onLiberarItensPedido: function() {
			var that = this;

			// var dataEntrega = this.byId("idDataEntrega").getValue();
			// var tamanhoDataEntrega = dataEntrega.length;
			// var dataEntregaSplit = dataEntrega.split("/");
			// var dataSplit = parseInt(String(dataEntregaSplit[2]) + String(dataEntregaSplit[1]) + String(dataEntregaSplit[0]));
			// var dataSplitDia = dataEntregaSplit[0];
			// var dataSplitMes = dataEntregaSplit[1];
			// var dataSplitAno = dataEntregaSplit[2];

			var date = new Date();

			var dia = String(date.getDate());
			var tamanhoDia = parseInt(dia.length);
			if (tamanhoDia == 1) {
				dia = String("0" + dia);
			}

			var mes = String(date.getMonth() + 1);
			var tamanhoMes = parseInt(mes.length);

			if (tamanhoMes == 1) {
				mes = String("0" + mes);
			}

			var ano = String(date.getFullYear());
			var dataAtual = parseInt(ano + mes + dia);

			if (this.byId("idTipoPedido").getSelectedKey() == "" || this.byId("idTipoPedido").getSelectedKey() == undefined) {
				MessageBox.show("Preencher o tipo do pedido!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else if (this.byId("idTabelaPreco").getSelectedKey() == "" || this.byId("idTabelaPreco").getSelectedKey() == undefined) {
				MessageBox.show("Preencher a tabela de preço!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else if (this.byId("idTipoNegociacao").getSelectedKey() == "" || this.byId("idTipoNegociacao").getSelectedKey() == undefined) {
				MessageBox.show("Preencher o tipo do negociação!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else if (this.byId("idTipoTransporte").getSelectedKey() == "" || this.byId("idTipoTransporte").getSelectedKey() == undefined) {
				MessageBox.show("Preencher o tipo de transporte!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			}
			// else if (dataEntrega.indexOf("/") == -1) {
			// 	MessageBox.show("Data Entrega inválida. Informe a data no seguinte formato : dd/MM/aaaa", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// }
			// else if (tamanhoDataEntrega < 10 || tamanhoDataEntrega > 10) {
			// 	MessageBox.show("Data Entrega inválida. Informe a data no seguinte formato : dd/MM/aaaa", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			// else if (dataSplitDia > 31 || dataSplitDia <= 0) {
			// 	MessageBox.show("Dia Entrega informado inválido.", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			// else if (dataSplitMes > 12 || dataSplitMes < 1) {
			// 	MessageBox.show("Mês Entrega informado inválido.", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			// else if (dataSplitAno > 2100 || dataSplitAno < 2000) {
			// 	MessageBox.show("Ano Entrega informado inválido.", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			// else if (dataAtual > dataSplit) {
			// 	MessageBox.show("Data Entrega é menor que a data Atual!", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			else if (this.byId("idPrimeiraParcela").getValue() == "" || this.byId("idPrimeiraParcela").getValue() == undefined) {
				MessageBox.show("Preencher a primeira parcela do pedido!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else if (this.byId("idQuantParcelas").getValue() == "" || this.byId("idPrimeiraParcela").getValue() == undefined) {
				MessageBox.show("Preencher a quantidade de parcelas do pedido!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else if (this.byId("idIntervaloParcelas").getValue() == "" || this.byId("idIntervaloParcelas").getValue() == undefined) {
				MessageBox.show("Preencher o intervalo entre as parcelas!", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			} else {
				// objItensPedidoTemplate = [];
				// var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
				// this.getView().setModel(oModel, "ItensPedidoGrid");

				this.byId("tabItensPedidoStep").setProperty("enabled", true);
				this.byId("tabBalancoVerbaStep").setProperty("enabled", true);
				this.byId("tabTotalStep").setProperty("enabled", true);
				// this.byId("tabItensDiluicaoPedidoStep").setProperty("enabled", true);

				var open = indexedDB.open("VB_DataBase");
				open.onerror = function(hxr) {
					console.log("falha abrir tabela PrePedido as tabelas");
				};
				//Load tables
				open.onsuccess = function() {
					var db = open.result;

					var tx = db.transaction("PrePedidos", "readwrite");
					var objPrePedido = tx.objectStore("PrePedidos");

					var request = objPrePedido.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

					request.onsuccess = function(e) {
						var result = e.target.result;

						var objBancoPrePedido = {
							nrPedCli: that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"),
							kunnr: that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr"),
							werks: that.getOwnerComponent().getModel("modelAux").getProperty("/Werks"),
							codRepres: that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres"),
							tipoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido"),
							idStatus: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido"),
							situacaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/SituacaoPedido"),
							dataEntrega: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DataEntrega"),
							localEntrega: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/LocalEntrega"),
							tabPreco: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"),
							completo: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo"),
							valMinPed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValMinPedido"),
							dataPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DataPedido"),
							dataImpl: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DataImpl"),
							valComissao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissao"),
							observacaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ObservacaoPedido"),
							observacaoAuditoriaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ObservacaoAuditoriaPedido"),
							existeEntradaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ExisteEntradaPedido"),
							percEntradaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido"),
							valorEntradaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido"),
							tipoTransporte: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoTransporte"),
							diasPrimeiraParcela: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DiasPrimeiraParcela"),
							quantParcelas: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/QuantParcelas"),
							intervaloParcelas: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IntervaloParcelas"),
							tipoNegociacao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao"),
							valTotPed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotPed"),
							valDescontoTotal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValDescontoTotal"),
							valDescontoDisp: 0,
							valDescontoInform: 0,
							ntgew: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Ntgew"),
							valLiqPed: 0,
							valVerbaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaPedido"),
							valComissaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoPedido"),
							pesoBruto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PesoBruto"),
							valPctDescontoValor: 0,
							valPctDescontoTotal: 0,
							valCustoFixo: 0
						};

						//ADICIONAR O OBJ .. QND FOR UNDEFINED, POIS O OBJ NÃO FOI ENCONTRADO, ESTÁ VAZIO.
						if (result == undefined || result == null) {

							var request1 = objPrePedido.add(objBancoPrePedido);

							objBancoPrePedido = {
								nrPedCli: "",
								kunnr: "",
								werks: "",
								codRepres: "",
								tipoPedido: "",
								idStatus: "",
								situacaoPedido: "",
								dataEntrega: "",
								localEntrega: "",
								tabPreco: "",
								completo: "",
								valMinPed: "",
								dataPedido: "",
								dataImpl: "",
								valComissao: "",
								observacaoPedido: "",
								observacaoAuditoriaPedido: "",
								existeEntradaPedido: "",
								percEntradaPedido: "",
								valorEntradaPedido: "",
								tipoTransporte: "",
								diasPrimeiraParcela: "",
								quantParcelas: "",
								intervaloParcelas: "",
								tipoNegociacao: "",
								valTotPed: "",
								valDescontoTotal: "",
								valDescontoDisp: "",
								valDescontoInform: "",
								ntgew: "",
								valLiqPed: "",
								valVerbaPedido: "",
								valComissaoPedido: "",
								pesoLiquido: "",
								pesoBruto: "",
								valPctDescontoValor: "",
								valPctDescontoTotal: "",
								valCustoFixo: ""
							};

							request1.onsuccess = function() {
								MessageBox.show("Inclusão Efetivada com Sucesso!", {
									icon: MessageBox.Icon.SUCCESS,
									title: "Confirmação",
									actions: [MessageBox.Action.OK],
									onClose: function() {
										that.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
										console.log("Dados PrePedido inseridos");
									}
								});

							};

							request1.onerror = function(event) {
								console.log("Dados PrePedido não foram inseridos :" + event.Message);
							};

						} else {

							// TODO: VERIFICAR METODO DE ATUALIZAR O PEDIDO JA CRIADO

							request1 = objPrePedido.put(objBancoPrePedido);

							objBancoPrePedido = {
								nrPedCli: "",
								kunnr: "",
								werks: "",
								codRepres: "",
								tipoPedido: "",
								idStatus: "",
								situacaoPedido: "",
								dataEntrega: "",
								localEntrega: "",
								tabPreco: "",
								completo: "",
								valMinPed: "",
								dataPedido: "",
								dataImpl: "",
								valComissao: "",
								observacaoPedido: "",
								observacaoAuditoriaPedido: "",
								existeEntradaPedido: "",
								percEntradaPedido: "",
								valorEntradaPedido: "",
								tipoTransporte: "",
								diasPrimeiraParcela: "",
								quantParcelas: "",
								intervaloParcelas: "",
								tipoNegociacao: "",
								valTotPed: "",
								valDescontoTotal: "",
								valDescontoDisp: "",
								valDescontoInform: "",
								ntgew: "",
								valLiqPed: "",
								valVerbaPedido: "",
								valComissaoPedido: "",
								pesoLiquido: "",
								pesoBruto: "",
								valPctDescontoValor: "",
								valPctDescontoTotal: "",
								valCustoFixo: ""
							};

							request1.onsuccess = function() {
								MessageBox.show("Cabeçalho atualizado com Sucesso!", {
									icon: MessageBox.Icon.SUCCESS,
									title: "Concluido!",
									actions: [MessageBox.Action.OK],
									onClose: function() {
										that.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
										console.log("Dados PrePedido Atualizados");
									}
								});
							};

							request1.onerror = function(event) {
								console.log("Dados PrePedido não foram Atualizados :" + event.Message);
							};
						}
					};

					request.onerror = function(e) {
						console.log("Error");
						console.dir(e);
					};
				};
			}
		},

		onCancelarPedido: function() {
			this.resetarCamposPrePedido();
			oItemTemplate = [];
			oItemTemplateTotal = [];
			this.getOwnerComponent().getModel("modelAux").setProperty("/numeroPedido", "");
			this.getOwnerComponent().getModel("modelDescontos").setProperty("/descontoAplicar", 0);
			this.getOwnerComponent().getModel("modelDescontos").setProperty("/descontoDisponivel", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/idDesconto", "");

			this.getOwnerComponent().getModel("modelDescontos").setProperty("/descontoDisponivel", 0);
			this.getOwnerComponent().getModel("modelDescontos").setProperty("/descontoAplicar", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/totalPedido", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/totalLiquidoPedido", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/totalComSTPedido", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/totalItens", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/pesoBruto", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/pesoLiquido", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/verbaGasta", 0);
			this.getOwnerComponent().getModel("modelTotalPedido").setProperty("/rentabilidadeTotal", 0);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
		},

		// FIM EVENTOS DOS BOTÕES 					

		setaCompleto: function(db, completo) {
			var that = this;
			var objSetaCompletoPedido = [];
			that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", completo);

			var tx = db.transaction("PrePedidos", "readwrite");
			var objPrePedido = tx.objectStore("PrePedidos");

			var request = objPrePedido.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

			request.onsuccess = function(e) {
				var result = e.target.result;
				objSetaCompletoPedido = result;
				objSetaCompletoPedido.completo = completo;

				var store1 = db.transaction("PrePedidos", "readwrite");
				var objPedido = store1.objectStore("PrePedidos");
				var request1 = objPedido.put(objSetaCompletoPedido);

				request1.onsuccess = function() {
					console.log("O campo completo foi atualizado para > " + completo);
				};
				request1.onerror = function() {
					console.log("Erro ao abrir o Pedido > " + that.getOwnerComponent().getModel("modelAux").getProperty("/nrPedCli"));
				};
			};
		},

		onAddOV: function() {

			var oModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: "/sap/opu/odata/sap/zforca_vendas_srv/",
				user: "rcardilo",
				password: "sap123"
			});

			var ordemVenda = {
				DocType: "",
				SalesOrg: "",
				DistrChan: "",
				Division: "",
				ItmNumber: "",
				TextLine: "",
				ReqQty: "",
				PartnRole: "",
				PartnNumb: "",
				Material: "",
				TargetQty: "",
				Plant: ""
			};

			oModel.create("/OrdemVendas", ordemVenda, {
				success: function(data) {

					MessageBox.show("Ordem de Venda: " + data.Salesdocumentin + " criada com sucesso!", {
						icon: MessageBox.Icon.SUCCESS,
						title: "Ordem de Venda CRIADA!",
						actions: [MessageBox.Action.OK],
						onClose: function() {

						}
					});

				},
				error: function(error) {

					console.log(error);

					MessageBox.show("Erro ao criar Ordem de Venda!", {
						icon: MessageBox.Icon.ERROR,
						title: "Não encontrado!",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							console.log(error.response);

						}
					});
				}
			});
		}

	});
});