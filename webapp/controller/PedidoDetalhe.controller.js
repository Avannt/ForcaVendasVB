/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"testeui5/model/formatter"

], function (BaseController, JSONModel, MessageBox, formatter) {
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

		onInit: function () {
			this.getRouter().getRoute("pedidoDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {
			var that = this;
			this.getView().setModel(this.getView().getModel("modelCliente"));
			this.getView().setModel(this.getView().getModel("modelAux"));

			that.onCarregaCliente();
			this.byId("tabItensPedidoStep").setProperty("enabled", false);
			this.byId("tabBalancoVerbaStep").setProperty("enabled", false);
			this.byId("tabTotalStep").setProperty("enabled", false);
			// this.byId("tabItensDiluicaoPedidoStep").setProperty("enabled", false);

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

				var promise = new Promise(function (resolve, reject) {
					that.onCarregaCampos(db);
					resolve();
				});

				promise.then(function (value) {
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

		onCarregaCliente: function () {

			this.byId("idCodCliente").setValue(this.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr") + "-" +
				this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres"));
			this.byId("idNome").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Name1"));
			this.byId("idCNPJ").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stcd1"));
			this.byId("idEndereco").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stras"));
			this.byId("idCidade").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Ort01") + "-" +
				this.getOwnerComponent().getModel("modelCliente").getProperty("/Regio"));
			this.byId("idFone").setValue();
		},

		onResetaCamposPrePedido: function () {
			//*modelDadosPedido
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", "");
			// this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/LocalEntrega", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", 1);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", false);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", "CIF");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", "");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValMinPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampGlobal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampEnxoval", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAcresPrazoMed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteDesconto", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Ntgew", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoDesconto", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoComissao", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoVerba", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampGlobal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampGlobal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampEnxoval", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampEnxoval", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampProdutoAcabado", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampProdutoAcabado", 0);

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", 0);

			this.byId("idTabelaPreco").setSelectedKey();
			this.byId("idTipoTransporte").setSelectedKey();
			this.byId("idTipoNegociacao").setSelectedKey();
			this.byId("idTipoPedido").setSelectedKey();

			objItensPedidoTemplate = [];
			var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
			this.getView().setModel(oModel, "ItensPedidoGrid");

			this.onBloqueiaPrePedido();
		},

		//CARREGA OS CAMPOS, POPULANDO OS COMBO BOX
		onCarregaCampos: function (db, resolve, reject) {
			var that = this;
			oVetorTabPreco = [];
			oVetorMateriais = [];
			oVetorTipoTransporte = [];
			oVetorTipoNegociacao = [];
			objItensPedidoTemplate = [];

			var data = this.onDataAtualizacao();

			var Kunnr = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			//Inicialização de Variáveis. *modelDadosPedido
			this.onResetaCamposPrePedido();

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "EM DIGITAÇÃO");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", 1);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", data[0] + "-" + data[1]);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", data[0]);

			//CARREGA OS MATERIAIS
			var transaction = db.transaction("Materiais", "readonly");
			var objectStore = transaction.objectStore("Materiais");

			if ("getAll" in objectStore) {
				objectStore.getAll().onsuccess = function (event) {
					oVetorMateriais = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(oVetorMateriais);
					that.getView().setModel(oModel, "materiaisCadastrados");
				};
			}

			//Tipos Pedidos
			var transactionTiposPedidos = db.transaction("TiposPedidos", "readonly");
			var objectStoreTiposPedidos = transactionTiposPedidos.objectStore("TiposPedidos");

			if ("getAll" in objectStore) {
				objectStoreTiposPedidos.getAll().onsuccess = function (event) {
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

			objectStoreA961.openCursor().onsuccess = function (event) {
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

						objectStoreA963.openCursor().onsuccess = function (event) {
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

		onCriarNumeroPedido: function () {
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

		onCarregaDadosPedido: function (db) {
			var that = this;
			objItensPedidoTemplate = [];
			var vetorAux = [];

			this.byId("tabItensPedidoStep").setProperty("enabled", true);
			this.byId("tabBalancoVerbaStep").setProperty("enabled", true);
			this.byId("tabTotalStep").setProperty("enabled", true);
			// this.byId("tabItensDiluicaoPedidoStep").setProperty("enabled", true);

			var store = db.transaction("PrePedidos", "readwrite");
			var objPrePedidos = store.objectStore("PrePedidos");

			var requestPrePedidos = objPrePedidos.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

			requestPrePedidos.onsuccess = function (e) {
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
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", oPrePedido.diasPrimeiraParcela);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", oPrePedido.quantParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", oPrePedido.intervaloParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", oPrePedido.observacaoPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", oPrePedido.observacaoAuditoriaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", oPrePedido.existeEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", oPrePedido.percEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", oPrePedido.valorEntradaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValMinPedido", oPrePedido.valMinPedido);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", oPrePedido.tipoNegociacao);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Ntgew", oPrePedido.ntgew);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", oPrePedido.valTotPed);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", oPrePedido.valDescontoTotal);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedentePrazoMed", oPrePedido.valTotalExcedentePrazoMed);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteDesconto", oPrePedido.valTotalExcedenteDesconto);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", oPrePedido.totalItensPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampEnxoval", oPrePedido.valCampEnxoval);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampBrinde", oPrePedido.valCampBrinde);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampGlobal", oPrePedido.valCampGlobal);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", oPrePedido.valVerbaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", oPrePedido.valComissaoPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", oPrePedido.completo);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissao", oPrePedido.valComissao);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", oPrePedido.valComissaoUtilizadaDesconto);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", oPrePedido.valVerbaUtilizadaDesconto);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", oPrePedido.valUtilizadoComissaoPrazoMed);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoDesconto", oPrePedido.valTotalExcedenteNaoDirecionadoDesconto);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed", oPrePedido.valTotalExcedenteNaoDirecionadoPrazoMed);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoComissao", oPrePedido.valTotalAbatidoComissao);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoVerba", oPrePedido.valTotalAbatidoVerba);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampGlobal", oPrePedido.valTotalCampGlobal);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampBrinde", oPrePedido.valUtilizadoCampBrinde);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampGlobal", oPrePedido.valUtilizadoCampGlobal);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampEnxoval", oPrePedido.valTotalCampEnxoval);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampEnxoval", oPrePedido.valUtilizadoCampEnxoval);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalCampProdutoAcabado", oPrePedido.valTotalCampProdutoAcabado);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampProdutoAcabado", oPrePedido.valUtilizadoCampProdutoAcabado);
					
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBrinde", oPrePedido.valTotalExcedenteBrinde);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", oPrePedido.valUtilizadoVerbaBrinde);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", oPrePedido.valUtilizadoComissaoBrinde);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteAmostra", oPrePedido.valTotalExcedenteAmostra);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", oPrePedido.valUtilizadoVerbaAmostra);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", oPrePedido.valUtilizadoComissaoAmostra);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", oPrePedido.valTotalExcedenteBonif);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", oPrePedido.valUtilizadoVerbaBonif);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", oPrePedido.valUtilizadoComissaoBonif);

					//Tela cabeçalho (2º aba)
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", oPrePedido.tipoTransporte);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", oPrePedido.tabPreco);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", oPrePedido.tipoNegociacao);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", oPrePedido.tipoPedido);

					//Seleciona o valor do combo
					that.byId("idTabelaPreco").setSelectedKey(oPrePedido.tabPreco);
					that.byId("idTipoTransporte").setSelectedKey(oPrePedido.tipoTransporte);
					that.byId("idTipoNegociacao").setSelectedKey(oPrePedido.tipoNegociacao);
					that.byId("idTipoPedido").setSelectedKey(oPrePedido.tipoPedido);

					//FILTRA ITENS PARA APARECER NO COMBO PARA SELECIONAR DE ACORDO COM O TIPO DE PEDIDO JÁ EXISTENTE.
					//AMOSTRA
					if (oPrePedido.tipoPedido == "06") {
						for (var i = 0; i < oVetorMateriais.length; i++) {
							if (oVetorMateriais[i].mtpos == "YAMO") {
								vetorAux.push(oVetorMateriais[i]);
							}
						}

						oVetorMateriais = vetorAux;

					}
					//BRINDES
					if (oPrePedido.tipoPedido == "07") {
						for (i = 0; i < oVetorMateriais.length; i++) {
							if (oVetorMateriais[i].mtpos == "YBRI") {
								vetorAux.push(oVetorMateriais[i]);
							}
						}

						oVetorMateriais = vetorAux;

					}

					var oModel = new sap.ui.model.json.JSONModel(oVetorMateriais);
					that.getView().setModel(oModel, "materiaisCadastrados");

					var storeItensPedido = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
					storeItensPedido.openCursor().onsuccess = function (event) {
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

							that.onBloqueiaPrePedido();
							that.calculaTotalPedido();
						}
					};
				}
			};
		},

		onDataAtualizacao: function () {
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

		myFormatterRentabilidade: function (Value) {
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

		myFormatterRentabilidadePorcentagem: function (Value) {
			// var rentabilidade = sap.ui.getCore().byId("idRentabilidade").getValue();

			if (Value > -3) {

				this.byId("idRentabilidadePedido").setVisible(false);
				return "";

			} else {
				this.byId("idRentabilidadePedido").setVisible(true);
				return Value;
			}
		},

		carregarItensPedido: function (db) {
			var that = this;
			db = open.result;

			var store = db.transaction("ItensPedido").objectStore("ItensPedido");
			//CARREGA TODOS OS ITENS DE UM DETERMINADO PEDIDO
			store.openCursor().onsuccess = function (event) {
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

		onAfterRendering: function () {},

		onBeforerRendering: function () {},

		onExit: function () {

		},

		///  FIM EVENTOS STANDARD  APLICAÇÃO

		/// EVENTOS CAMPOS							<<<<<<<<<<<<

		onChangeTipoPedido: function (evt) {
			var that = this;
			var tipoPedido = "";
			var vetorAux = [];

			var oSource = evt.getSource();
			tipoPedido = oSource.getSelectedKey();

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", tipoPedido);

			if (oSource.getSelectedKey() == "03") {
				this.byId("idFormParcelamento").setVisible(false);
			} else {
				this.byId("idFormParcelamento").setVisible(true);
			}

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

				var transaction = db.transaction("Materiais", "readonly");
				var objectStore = transaction.objectStore("Materiais");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function (event) {

						oVetorMateriais = event.target.result;
						//AMOSTRA
						if (tipoPedido == "06") {
							for (var i = 0; i < oVetorMateriais.length; i++) {
								if (oVetorMateriais[i].mtpos == "YAMO") {
									vetorAux.push(oVetorMateriais[i]);
								}
							}

							oVetorMateriais = vetorAux;
						}

						//BRINDES
						if (tipoPedido == "07") {
							for (i = 0; i < oVetorMateriais.length; i++) {
								if (oVetorMateriais[i].mtpos == "YBRI") {
									vetorAux.push(oVetorMateriais[i]);
								}
							}
							oVetorMateriais = vetorAux;
						}

						var oModel = new sap.ui.model.json.JSONModel(oVetorMateriais);
						that.getView().setModel(oModel, "materiaisCadastrados");
					};
				}
			};

		},

		onExisteEntrada: function (evt) {

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

		onBloqueiaPercEntrada: function (evt) {
			var percEntrada = evt.getSource();

			if (percEntrada.getValue() > 0) {
				this.byId("idPercEntrada").setEnabled(false);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", parseFloat(percEntrada.getValue()));
			} else {
				this.byId("idPercEntrada").setEnabled(true);
			}

		},

		onBloqueiaValorEntrada: function (evt) {

			var vlrEntrada = evt.getSource();

			if (vlrEntrada.getValue() > 0) {
				this.byId("idValorEntrada").setEnabled(false);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", vlrEntrada.getValue());
			} else {
				this.byId("idValorEntrada").setEnabled(true);
			}
		},

		onChangeTipoNegociacao: function (evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", oSource.getSelectedKey());
		},

		onChangeTabelaPreco: function (evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", oSource.getSelectedKey());
		},

		onChangeTipoTransporte: function (evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", oSource.getSelectedKey());
		},

		onChangeDataPedido: function () {
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", this.byId("idDataPedido").getValue());
		},

		onChangeObservacoes: function (evt) {
			var oObservacoes = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", oObservacoes.getValue());
		},

		onChangeAuditoriaObservacoes: function (evt) {
			var oObservacoes = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", oObservacoes.getValue());
		},

		/// FIM EVENTOS CAMPOS

		/// EVENTOS UTILITARIOS						<<<<<<<<<<<<

		bloquearCampos: function () {

			this.byId("idEstabelecimento").setProperty("enabled", false);
			this.byId("idTipoPedido").setProperty("enabled", false);
			this.byId("idVencimento1").setProperty("enabled", false);
			this.byId("idVencimento2").setProperty("enabled", false);
			this.byId("idVencimento3").setProperty("enabled", false);
			this.byId("idTabelaPreco").setProperty("enabled", false);
			this.byId("idTipoTransporte").setProperty("enabled", false);

		},

		desbloquearCampos: function () {
			this.byId("idEstabelecimento").setProperty("enabled", true);
			this.byId("idTipoPedido").setProperty("enabled", true);
			this.byId("idVencimento1").setProperty("enabled", true);
			this.byId("idVencimento2").setProperty("enabled", true);
			this.byId("idVencimento3").setProperty("enabled", true);
			this.byId("idTabelaPreco").setProperty("enabled", true);
			this.byId("idTipoTransporte").setProperty("enabled", true);

		},

		resetarCamposTela: function () {

			this.byId("idNumeroPedido").setValue("");
			this.byId("idSituacao").setValue("");
			this.byId("idDataPedido").setValue("");
			this.byId("idTipoPedido").setSelectedKey("");
			this.byId("idTipoNegociacao").setSelectedKey("");
			this.byId("idTabelaPreco").setSelectedKey("");
			this.byId("idTipoTransporte").setSelectedKey("");
			// this.byId("idDataEntrega").setSelectedKey("");
			// this.byId("idLocalEntrega").setSelectedKey("");
			this.byId("idPrimeiraParcela").setValue("");
			this.byId("idQuantParcelas").setValue("");
			this.byId("idIntervaloParcelas").setValue("");
			this.byId("idValorMinimoPedido").setValue("");
			this.byId("idObservacoes").setText("");

		},

		onNavBack: function () {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			this.onResetaCamposPrePedido();

		},

		/// FIM EVENTOS UTILITARIOS

		// EVENTOS DO FRAGMENTO 					<<<<<<<<<<<<

		onItemChange: function (oEvent) {
			var that = this;
			var itemExistente = false;
			var oProduto = oEvent.getSource();
			var codItem = oProduto.getValue();
			var oPanel = sap.ui.getCore().byId("idDialog");
			oPanel.setBusy(true);
			var werks = this.getOwnerComponent().getModel("modelAux").getProperty("/Werks");
			var tabPreco = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco");

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				oPanel.setBusy(true);

				if (codItem !== "") {

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(codItem);

					requestMaterial.onsuccess = function (e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + codItem, {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function () {
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
							oItemPedido.zzRegra = 0;
							oItemPedido.zzGrpmat = 0;
							oItemPedido.knumhExtra = 0;
							oItemPedido.zzRegraExtra = 0;
							oItemPedido.zzGrpmatExtra = 0;
							oItemPedido.tipoItem = "Normal";
							oItemPedido.zzPercDescDiluicao = 0;

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

								requesA960.onsuccess = function (e) {
									var oA960 = e.target.result;

									if (oA960 == undefined) {
										oPanel.setBusy(false);

										MessageBox.show("Não existe preço para o produto: " + codItem + " de acordo com a tabela de preço: " +
											that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"), {
												icon: MessageBox.Icon.ERROR,
												title: "Preço do produto não encontrado.",
												actions: [MessageBox.Action.YES],
												onClose: function () {
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
										oItemPedido.zzVprodMinPermitido = 0;
										//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA OS DESCONTOS
										oItemPedido.zzVprodDesc = oItemPedido.zzVprod;

										var vetorAuxFamilias = [];
										var vetorAuxFamiliasExtra = [];
										//Buscando informações da FAMILIA de desconto normal
										var objA965 = db.transaction("A965").objectStore("A965");
										objA965.openCursor().onsuccess = function (event) {

											var cursor = event.target.result;

											if (cursor) {
												if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

													vetorAuxFamilias.push(cursor.value);
													console.log("Familia: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
												}

												cursor.continue();

											} else {

												var objA966 = db.transaction("A966").objectStore("A966");
												objA966.openCursor().onsuccess = function (event2) {
													var cursor2 = event2.target.result;

													if (cursor2) {
														for (var i = 0; i < vetorAuxFamilias.length; i++) {

															if (cursor2.value.zzGrpmat === vetorAuxFamilias[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																oItemPedido.zzGrpmat = cursor2.value.zzGrpmat; //Código Familia
																oItemPedido.zzRegra = cursor2.value.zzRegra; //Grupo de preço 
																console.log("Grupo de Preço:" + oItemPedido.zzRegra + " do grupo da familia: " + cursor2.value.zzGrpmat);
															}
														}
														cursor2.continue();

													} else {

														var objA967 = db.transaction("A967").objectStore("A967");
														objA967.openCursor().onsuccess = function (event3) {
															var cursorA967 = event3.target.result;

															if (cursorA967) {

																if (cursorA967.value.zzRegra === oItemPedido.zzRegra) {

																	oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																	console.log("Registro de condição :" + oItemPedido.knumh);
																}

																cursorA967.continue();

															} else {

																//Buscando Familia de desconto extra

																var objA962 = db.transaction("A962").objectStore("A962");
																objA962.openCursor().onsuccess = function (event) {

																	var cursor = event.target.result;

																	if (cursor) {
																		if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

																			vetorAuxFamiliasExtra.push(cursor.value);
																			console.log("Familia Extra: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
																		}

																		cursor.continue();

																	} else {

																		var objA968 = db.transaction("A968").objectStore("A968");
																		objA968.openCursor().onsuccess = function (event2) {
																			cursor2 = event2.target.result;

																			if (cursor2) {
																				for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																					if (cursor2.value.zzGrpmat === vetorAuxFamiliasExtra[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																						oItemPedido.zzGrpmatExtra = cursor2.value.zzGrpmat; //Código Familia Extra
																						oItemPedido.zzRegraExtra = cursor2.value.zzRegra; //Grupo de preço Extra
																						console.log("Grupo de Preço Extra:" + oItemPedido.zzRegraExtra + " do grupo da familia Extra: " +
																							oItemPedido.zzGrpmatExtra);
																					}
																				}
																				cursor2.continue();

																			} else {

																				var objA969 = db.transaction("A969").objectStore("A969");
																				objA969.openCursor().onsuccess = function (event3) {
																					var cursorA969 = event3.target.result;

																					if (cursorA969) {

																						if (cursorA969.value.zzRegra === oItemPedido.zzRegraExtra) {

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
									onClose: function () {

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

		onCriarIndexItemPedido: function () {
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

		onItemChangeDiluicao: function (oEvent) {
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

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				if (codItem !== "") {
					oPanel.setBusy(true);

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(codItem);

					requestMaterial.onsuccess = function (e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + codItem, {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function () {
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
							oItemPedido.zzRegra = 0;
							oItemPedido.zzGrpmat = 0;
							oItemPedido.knumhExtra = 0;
							oItemPedido.zzRegraExtra = 0;
							oItemPedido.zzGrpmatExtra = 0;
							oItemPedido.zzPercDescDiluicao = 0;

							for (var i = 0; i < objItensPedidoTemplate.length; i++) {
								if (objItensPedidoTemplate[i].matnr === codItem && objItensPedidoTemplate[i].tipoItem === "Normal") {

									objAuxItem = {
										idItemPedido: "",
										index: "",
										knumh: objItensPedidoTemplate[i].knumh,
										zzGrpmat: objItensPedidoTemplate[i].zzGrpmat,
										zzRegra: objItensPedidoTemplate[i].zzRegra,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										zzGrpmatExtra: objItensPedidoTemplate[i].zzGrpmatExtra,
										zzRegraExtra: objItensPedidoTemplate[i].zzRegraExtra,
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
										zzVprodMinPermitido: 0,
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
									onClose: function () {
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

								requesA960.onsuccess = function (e) {
									var oA960 = e.target.result;

									if (oA960 == undefined) {
										oPanel.setBusy(false);

										MessageBox.show("Não existe preço para o produto: " + codItem + " de acordo com a tabela de preço: " +
											that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"), {
												icon: MessageBox.Icon.ERROR,
												title: "Preço do produto não encontrado.",
												actions: [MessageBox.Action.YES],
												onClose: function () {
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
										oItemPedido.zzRegra = 0;
										oItemPedido.zzGrpmat = 0;

										oItemPedido.knumhExtra = 0;
										oItemPedido.zzRegraExtra = 0;
										oItemPedido.zzGrpmatExtra = 0;

										oItemPedido.zzDesitem = 0;
										oItemPedido.zzPercDescTotal = 0;
										oItemPedido.zzVprodMinPermitido = 0;
										oItemPedido.tipoItem = "Diluicao";
										//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA OS DESCONTOS
										oItemPedido.zzVprodDesc = oItemPedido.zzVprod;

										var vetorAuxFamilias = [];
										var vetorAuxFamiliasExtra = [];
										var objA965 = db.transaction("A965").objectStore("A965");
										objA965.openCursor().onsuccess = function (event) {

											var cursor = event.target.result;

											if (cursor) {
												if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

													vetorAuxFamilias.push(cursor.value);
													console.log("Familia: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
												}

												cursor.continue();

											} else {

												var objA966 = db.transaction("A966").objectStore("A966");
												objA966.openCursor().onsuccess = function (event2) {
													var cursor2 = event2.target.result;

													if (cursor2) {
														for (var i = 0; i < vetorAuxFamilias.length; i++) {

															if (cursor2.value.zzGrpmat === vetorAuxFamilias[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																oItemPedido.zzGrpmat = cursor2.value.zzGrpmat; //Código Familia
																oItemPedido.zzRegra = cursor2.value.zzRegra; //Grupo de preço 
																console.log("Grupo de Preço:" + oItemPedido.zzRegra + " do grupo da familia: " + cursor2.value.zzGrpmat);
															}
														}
														cursor2.continue();

													} else {
														// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
														var objA967 = db.transaction("A967").objectStore("A967");
														objA967.openCursor().onsuccess = function (event3) {
															var cursorA967 = event3.target.result;

															if (cursorA967) {

																if (cursorA967.value.zzRegra === oItemPedido.zzRegra) {

																	oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																	console.log("Registro de condição :" + oItemPedido.knumh);
																}

																cursorA967.continue();

															} else {

																var auxRangeQuant = 0;
																var objKonm = db.transaction("Konm").objectStore("Konm");
																objKonm.openCursor().onsuccess = function (event2) {
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
																		objA962.openCursor().onsuccess = function (event) {

																			var cursor = event.target.result;

																			if (cursor) {
																				if (cursor.value.matnr === oItemPedido.matnr && cursor.value.werks === werks) {

																					vetorAuxFamiliasExtra.push(cursor.value);
																					console.log("Familia Extra: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
																				}

																				cursor.continue();

																			} else {

																				var objA968 = db.transaction("A968").objectStore("A968");
																				objA968.openCursor().onsuccess = function (event2) {
																					cursor2 = event2.target.result;

																					if (cursor2) {
																						for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																							if (cursor2.value.zzGrpmat === vetorAuxFamiliasExtra[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																								oItemPedido.zzGrpmatExtra = cursor2.value.zzGrpmat; //Código Familia Extra
																								oItemPedido.zzRegraExtra = cursor2.value.zzRegra; //Grupo de preço Extra
																								console.log("Grupo de Preço Extra:" + oItemPedido.zzRegraExtra + " do grupo da familia Extra: " +
																									oItemPedido.zzGrpmatExtra);
																							}
																						}
																						cursor2.continue();

																					} else {

																						var objA969 = db.transaction("A969").objectStore("A969");
																						objA969.openCursor().onsuccess = function (event3) {
																							var cursorA969 = event3.target.result;

																							if (cursorA969) {

																								if (cursorA969.value.zzRegra === oItemPedido.zzRegraExtra) {

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

		onResetaCamposDialog: function () {
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

		onQuantidadeChange: function (evt) {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				var store = db.transaction("Materiais", "readwrite");
				var objMaterial = store.objectStore("Materiais");

				var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

				requestMaterial.onsuccess = function (e) {
					var oMaterial = e.target.result;

					if (oMaterial == undefined) {

						MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
							icon: MessageBox.Icon.ERROR,
							title: "Produto não encontrado.",
							actions: [MessageBox.Action.YES],
							onClose: function () {
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
								onClose: function () {
									sap.ui.getCore().byId("idQuantidade").setValue(1);
									sap.ui.getCore().byId("idQuantidade").focus();

								}
							});
						}
					}
				};
			};
		},

		onFocusQnt: function () {
			sap.ui.getCore().byId("idDesconto").focus();
		},

		onDescontoChange: function () {
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
					onClose: function () {

					}
				});
			}
		},

		calculaPrecoItem: function () {
			oItemPedido.zzPercDescTotal = 0;

			if (oItemPedido.tipoItem === "Diluicao" && oItemPedido.kbetr > 0) {

				oItemPedido.zzVprodDesc = Math.round(oItemPedido.zzVprod - (oItemPedido.zzVprod * oItemPedido.kbetr / 100));
				oItemPedido.zzPercDescTotal = oItemPedido.kbetr;

			} else {

				//Inicialmente o valor cheio do produto é atribuido para o valor com desconto.
				// 1º Aplicar - Preco Cheio do produto - tabela (avista -5%) a prazo sem desconto.
				//Senão for desconto avista, criar o campo zzPercDescTotal do item do pedido com desconto zerado. 
				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

					oItemPedido.zzVprodDesc = (oItemPedido.zzVprod) - ((oItemPedido.zzVprod) * (5 / 100));

				} else if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {

					oItemPedido.zzVprodDesc = oItemPedido.zzVprod;

				}

				//2º Aplicar o Desconto digitado na tela de digitação dos itens
				oItemPedido.zzVprodDesc = oItemPedido.zzVprodDesc - (oItemPedido.zzVprodDesc) * (oItemPedido.zzDesitem / 100);

				// 3º Aplicar o desconto extra do item cadastrado na tabela (TabPrecoItem - zzDesext).
				// oItemPedido.zzVprodDesc = oItemPedido.zzVprodDesc - ((oItemPedido.zzVprodDesc) * (oItemPedido.zzDesext / 100));
				// oItemPedido.zzVprodDesc = Math.round(parseFloat(oItemPedido.zzVprodDesc * 100)) / 100;

				//SOMA TODOS OS DESCONTOS APLICADO NOS ITENS.

				oItemPedido.zzPercDescTotal += oItemPedido.zzDesitem;
			}

			//calcula a multiplicação pela quantidade depois que o valor unitário está calculado.
			oItemPedido.zzVprodDescTotal = oItemPedido.zzVprodDesc * oItemPedido.zzQnt;
			oItemPedido.zzVprodDescTotal = Math.round(parseFloat(oItemPedido.zzVprodDescTotal * 100)) / 100;

			oItemPedido.zzVprodDesc = Math.round(oItemPedido.zzVprodDesc * 100) / 100;
		},

		calculaTotalPedido: function () {
			var Qnt = 0;
			var that = this;
			var Total = 0;
			var Ntgew = 0;
			var QntProdutos = 0;
			var valorParcelas = 0;
			var difProdDiluicao = 0;
			var TotalPedidoDesc = 0;
			var valorCampBrinde = 0;
			var valorCampGlobal = 0;
			var valorCampEnxoval = 0;
			var totalVerbaGerada = 0;
			var percAcresPrazoMed = 0;
			var totalComissaoGerada = 0;
			var totalVerbaUtilizada = 0;
			var verbaUtilizadaDesconto = 0;
			var totalComissaoUtilizada = 0;
			var totalExcedenteDescontos = 0;
			var valorTotalAcresPrazoMed = 0;
			var comissaoUtilizadaDesconto = 0;
			var comissaoUtilizadaPrazoMed = 0;
			var valorNaoDirecionadoDesconto = 0;
			var valorNaoDirecionadoPrazoMed = 0;
			var existeParcelas = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ExisteEntradaPedido");
			var valorEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido");
			var percEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido");
			var quantidadeParcelas = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/QuantParcelas"));

			for (var i = 0; i < objItensPedidoTemplate.length; i++) {
				if (objItensPedidoTemplate[i].tipoItem !== "Diluicao") {

					TotalPedidoDesc += objItensPedidoTemplate[i].zzVprodDesc * objItensPedidoTemplate[i].zzQnt;
					Total += objItensPedidoTemplate[i].zzVprod * objItensPedidoTemplate[i].zzQnt;
					Qnt += objItensPedidoTemplate[i].zzQnt;
					QntProdutos += 1;

					if (objItensPedidoTemplate[i].ntgew > 0) {
						Ntgew += objItensPedidoTemplate[i].ntgew * objItensPedidoTemplate[i].zzQnt;
					}
					//VALOR DE COMISSÃO GERADA NO PEDIDO
					totalComissaoGerada += objItensPedidoTemplate[i].zzVprodDesc * (objItensPedidoTemplate[i].zzPercom / 100) *
						objItensPedidoTemplate[i].zzQnt;

					//VALOR DE VERBA GERADA NO PEDIDO
					totalVerbaGerada += objItensPedidoTemplate[i].zzVprodDesc * (objItensPedidoTemplate[i].zzPervm / 100) * objItensPedidoTemplate[i]
						.zzQnt;

					//Calculando o valor total da excessão por bloco:
					//VALOR EXCEDIDO DO PERCENTUAL DE DESCONTO.
					if (objItensPedidoTemplate[i].tipoItem == "Normal") {
						var valorExcedido = Math.round((objItensPedidoTemplate[i].zzVprodDesc - objItensPedidoTemplate[i].zzVprodMinPermitido) * 100) /
							100;
						objItensPedidoTemplate[i].zzValExcedidoItem = valorExcedido;

						if (objItensPedidoTemplate[i].zzValExcedidoItem < 0) {
							//Negatvo .. excedeu o valor.
							console.log("Produto: " + objItensPedidoTemplate[i].matnr + " excedeu: " + objItensPedidoTemplate[i].zzValExcedidoItem);
							totalExcedenteDescontos += objItensPedidoTemplate[i].zzValExcedidoItem * objItensPedidoTemplate[i].zzQnt;
						}

					} else if (objItensPedidoTemplate[i].tipoItem == "Diluido") {

						//zzVprodMinPermitido = Valor minimo que o produto pode ser vendido 
						difProdDiluicao = objItensPedidoTemplate[i].zzVprodMinPermitido - objItensPedidoTemplate[i].zzVprodDesc;
						console.log("Produto: " + objItensPedidoTemplate[i].matnr + " excedeu: " + difProdDiluicao);
						totalExcedenteDescontos += difProdDiluicao * objItensPedidoTemplate[i].zzQnt;

					}
				}
			}

			console.log("CALCULO DADOS GERAIS");

			totalVerbaGerada = Math.round(totalVerbaGerada * 100) / 100;
			totalComissaoGerada = Math.round(totalComissaoGerada * 100) / 100;

			//Calculo do acréscimo de prazo médio .
			percAcresPrazoMed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercExcedentePrazoMed");
			valorTotalAcresPrazoMed = Math.round(parseFloat(TotalPedidoDesc * (percAcresPrazoMed / 100) * 100)) / 100;

			//Calculando total de desconto dado.
			TotalPedidoDesc = Math.round(parseFloat(TotalPedidoDesc * 100)) / 100;

			var descontoTotal = Total - TotalPedidoDesc;
			descontoTotal = Math.round(parseFloat(descontoTotal * 100)) / 100;

			console.log(totalExcedenteDescontos);
			totalExcedenteDescontos = Math.abs(Math.round(totalExcedenteDescontos * 100) / 100);

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedentePrazoMed", valorTotalAcresPrazoMed);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteDesconto", totalExcedenteDescontos);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", totalVerbaGerada);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", totalComissaoGerada);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", Qnt);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", TotalPedidoDesc);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Ntgew", Ntgew);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", descontoTotal);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampEnxoval", valorCampEnxoval);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampBrinde", valorCampBrinde);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampGlobal", valorCampGlobal);

			// TODO: Precisa ser feito a comparação da verba que o kra tem pra ver se ele ele excedeu o tanto de verba que ele tem.
			// TODO: A comissão precisa ser travada apenas se o total do valor gerado de comissão no proprio pedido for menor que o valor destiando para descontar.

			//Valores utilizados para abater de verbas e comissões.
			verbaUtilizadaDesconto = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto");
			comissaoUtilizadaDesconto = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoUtilizadaDesconto");
			comissaoUtilizadaPrazoMed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoPrazoMed");

			console.log("Verba: " + verbaUtilizadaDesconto + ". Comissão: " + comissaoUtilizadaDesconto + ". Comissão PM: " +
				comissaoUtilizadaPrazoMed);

			//VALOR NAO DIRECIONADO NO BALANÇO DE VERBAS. UMA VEZ QUE GEROU UMA DIFERENÇA.. GERARÁ WORKFLOW DE APROVAÇÃO;
			console.log("VALOR NÃO DIRECIONADO DESCONTOS.");
			valorNaoDirecionadoDesconto = Math.round((totalExcedenteDescontos - (verbaUtilizadaDesconto + comissaoUtilizadaDesconto)) * 100) /
				100;

			console.log("VALOR NÃO DIRECIONADO PRAZO MÉDIO.");
			valorNaoDirecionadoPrazoMed = valorTotalAcresPrazoMed - comissaoUtilizadaPrazoMed;

			console.log("TOTAL VERBA UTILIZADA.");
			//Será a propria verba destinada para descontos : verbaUtilizadaDesconto
			totalVerbaUtilizada = verbaUtilizadaDesconto;

			console.log("TOTAL COMISSÃO UTILIZADA.");
			totalComissaoUtilizada = comissaoUtilizadaDesconto + comissaoUtilizadaPrazoMed;

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoComissao", totalComissaoUtilizada);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoVerba", totalVerbaUtilizada);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoDesconto",
				valorNaoDirecionadoDesconto);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed",
				valorNaoDirecionadoPrazoMed);

			console.log("VALORES UTILIZADOS CAMPANHA");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampGlobal", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampEnxoval", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampProdutoAcabado", 0);

			console.log("CALCULO PARCELAMENTO");

			var valorEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido");
			var percEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido");

			if (existeParcelas == false) {

				valorParcelas = TotalPedidoDesc / quantidadeParcelas;
				valorParcelas = Math.round(valorParcelas * 100) / 100;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", quantidadeParcelas + "x " + valorParcelas);

			} else if (existeParcelas == true) {

				if (valorEntradaPedido == 0) {

					var aux = TotalPedidoDesc - (percEntradaPedido * TotalPedidoDesc) / 100;
					valorParcelas = aux / quantidadeParcelas;
					valorParcelas = Math.round(valorParcelas * 100) / 100;
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", "Entrada: " + percEntradaPedido + "% + " +
						quantidadeParcelas + "x " + valorParcelas);

				} else if (percEntradaPedido == 0) {

					aux = (TotalPedidoDesc - valorEntradaPedido);
					valorParcelas = aux / quantidadeParcelas;
					valorParcelas = Math.round(valorParcelas * 100) / 100;

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", "Entrada: R$: " + valorEntradaPedido +
						" + " + quantidadeParcelas + "x " + valorParcelas);

				}
			}

			console.log("INICIO DAS VALIDAÇÕES DO BALANÇO DE EXCEDENTES.");
			//Tratativa se o kra excedeu o total de desconto direcionado na comissão do valor que ele gerou no pedido.
			if ((comissaoUtilizadaDesconto + verbaUtilizadaDesconto) > totalExcedenteDescontos) {

				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
				that.byId("idComissaoUtilizadaDesconto").setValueState("Error");
				that.byId("idComissaoUtilizadaDesconto").setValueStateText(
					"Valor destinado para abater o excedente de descontos ultrapassou o valor total necessário. Desconto Excedente (" +
					totalExcedenteDescontos + ")");
				that.byId("idVerbaUtilizadaDesconto").setValueState("Error");
				that.byId("idVerbaUtilizadaDesconto").setValueStateText(
					"Valor destinado para abater o excedente de descontos ultrapassou o valor total necessário. Desconto Excedente (" +
					totalExcedenteDescontos + ")");
				that.byId("idVerbaUtilizadaDesconto").focus();

			} else {

				that.byId("idVerbaUtilizadaDesconto").setValueState("None");
				that.byId("idVerbaUtilizadaDesconto").setValueStateText("");

				that.byId("idComissaoUtilizadaDesconto").setValueState("None");
				that.byId("idComissaoUtilizadaDesconto").setValueStateText("");
			}

			if ((comissaoUtilizadaPrazoMed) > valorTotalAcresPrazoMed) {

				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
				that.byId("idComissaoUtilizadaPrazo").setValueState("Error");
				that.byId("idComissaoUtilizadaPrazo").setValueStateText(
					"Valor destinado para abater da comissão ultrapassou o valor total necessário. Excedente Prazo Médio (" +
					valorTotalAcresPrazoMed + ")");
				that.byId("idComissaoUtilizadaPrazo").focus();

			} else {

				that.byId("idComissaoUtilizadaPrazo").setValueState("None");
				that.byId("idComissaoUtilizadaPrazo").setValueStateText("");
			}
		},

		onCalculaDiluicaoItem: function () {
			var that = this;
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;
				var NrPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
				var store = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
				store.openCursor().onsuccess = function (event) {
					// consulta resultado do event
					var cursor = event.target.result;
					if (cursor) {
						if (cursor.value.nrPedCli === NrPedido) {

							var store2 = db.transaction("ItensPedido", "readwrite");
							var objItemPedido = store2.objectStore("ItensPedido");

							var request = objItemPedido.delete(cursor.key);

							request.onsuccess = function () {
								console.log("Itens Pedido deletado(s)!");
							};
							request.onerror = function () {
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
										zzRegra: objItensPedidoTemplate[i].zzRegra,
										zzGrpmat: objItensPedidoTemplate[i].zzGrpmat,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										zzRegraExtra: objItensPedidoTemplate[i].zzRegraExtra,
										zzGrpmatExtra: objItensPedidoTemplate[i].zzGrpmatExtra,
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
										zzVprodMinPermitido: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal,
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
										zzRegra: objItensPedidoTemplate[i].zzRegra,
										zzGrpmat: objItensPedidoTemplate[i].zzGrpmat,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										zzRegraExtra: objItensPedidoTemplate[i].zzRegraExtra,
										zzGrpmatExtra: objItensPedidoTemplate[i].zzGrpmatExtra,
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
										zzVprodMinPermitido: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal,
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
										zzRegra: objItensPedidoTemplate[i].zzRegra,
										zzGrpmat: objItensPedidoTemplate[i].zzGrpmat,
										knumhExtra: objItensPedidoTemplate[i].knumhExtra,
										zzRegraExtra: objItensPedidoTemplate[i].zzRegraExtra,
										zzGrpmatExtra: objItensPedidoTemplate[i].zzGrpmatExtra,
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
										zzVprodMinPermitido: PercDescDiluicao,
										zzPercDescTotal: objItensPedidoTemplate[i].zzPercDescTotal,
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
							//Calcula percentual dado
							vetorAux[m].zzPercDescTotal = Math.round((1 - (vetorAux[m].zzVprodDesc / vetorAux[m].zzVprod)) * 10000) / 100;

							//Arredondamento
							vetorAux[m].zzVprodDescTotal = Math.round(parseFloat((vetorAux[m].zzVprodDescTotal) * 100)) / 100;
							vetorAux[m].zzVprodDesc = Math.round(parseFloat(vetorAux[m].zzVprodDesc * 100)) / 100;

							//Calculo do percentual Desc Dado
						}

						objItensPedidoTemplate = [];
						objItensPedidoTemplate = vetorAux;
						var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");

						that.onBloqueiaPrePedido();

						console.log("Resultado dos itens da regra de Diluição");
						console.log(vetorAux);

						var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
						var objItensPedido = storeItensPedido.objectStore("ItensPedido");

						for (var p = 0; p < objItensPedidoTemplate.length; p++) {

							var requestADDItem = objItensPedido.put(objItensPedidoTemplate[p]);

							requestADDItem.onsuccess = function (e3) {
								console.log("Item adicionado com sucesso");

							};
							requestADDItem.onerror = function (e3) {
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

		onInicioBalancoVerbas: function (resolve, reject) {
			//Carrega as tabelas necessarias para fazer os calculos dos excedentes.
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
			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;

				var transaction = db.transaction("Konm", "readonly");
				var objectStore = transaction.objectStore("Konm");

				if ("getAll" in objectStore) {
					objectStore.getAll().onsuccess = function (event) {

						that.vetorRange = event.target.result;

						var transaction1 = db.transaction("A964", "readonly");
						var objectStore1 = transaction1.objectStore("A964");

						if ("getAll" in objectStore1) {
							objectStore1.getAll().onsuccess = function (event) {

								var vetorPerc = event.target.result;

								that.percJuros = parseFloat(vetorPerc[0].zzPerjur);
								that.percJurosDia = that.percJuros / 30;

								var transaction2 = db.transaction("A959", "readonly");
								var objectStore2 = transaction2.objectStore("A959");

								if ("getAll" in objectStore2) {
									objectStore2.getAll().onsuccess = function (event) {

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

										//Fazer o calculo do que foi excedido
										//Neste momento tenho os percentuais do max permitido de cada item de acordo com as familias cadastradas
										that.onPrecoMinPermitido(objItensPedidoTemplate);
										resolve();
										console.log("resolve Perc Descontos");

									};
								}
							};
						}
					};
				}
			};
		},

		onPrecoMinPermitido: function (objItensPedidoTemplate) {

			for (var i = 0; i < objItensPedidoTemplate.length; i++) {
				var valorProdutoCheio = objItensPedidoTemplate[i].zzVprod;

				//VALOR DO PRODUTO INICIAL É DESCONTADO O PERCENTUAL DA TABELA AVISTA QUANDO TIVER
				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

					valorProdutoCheio = valorProdutoCheio - (valorProdutoCheio * 5 / 100);

				}

				var valorMinPermitido = valorProdutoCheio - (valorProdutoCheio * parseFloat(objItensPedidoTemplate[i].maxDescPermitido) / 100);
				valorMinPermitido = valorMinPermitido - (valorMinPermitido * parseFloat(objItensPedidoTemplate[i].maxDescPermitidoExtra) / 100);

				objItensPedidoTemplate[i].zzVprodMinPermitido = valorMinPermitido;
				console.log("Item :" + objItensPedidoTemplate[i].matnr + ", Min Permitido: " + objItensPedidoTemplate[i].zzVprodMinPermitido);

			}
		},

		onTablFilterEvent: function (evt) {
			var that = this;
			var item = evt.getParameters();
			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {

				var promise = new Promise(function (resolve, reject) {
					that.onInicioBalancoVerbas(resolve, reject);
				});

				promise.then(function () {
					that.calculaTotalPedido();
				});
			}

		},

		onDefineFamilias: function (vetorRange, tipoDesconto) {
			var vetorGeral = objItensPedidoTemplate;
			var vetorGeralExtra = objItensPedidoTemplate;
			var vetorFamilia = [];
			var proximoItemDiferente = false;
			var percDescPermitido = 0;

			if (tipoDesconto == "Normal") {

				//Ordenando para desconto Familia normal
				vetorGeral.sort(function (a, b) {
					return parseInt(a.zzGrpmat) - parseInt(b.zzGrpmat);
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

						if (vetorGeral[o].zzGrpmat == vetorGeral[o + 1].zzGrpmat) {

							proximoItemDiferente = false;
							vetorFamilia.push(vetorGeral[o]);

						} else {
							//Nesse momento tenho os itens daquela familia.. tendo os itens da familia .. somar as quantidades
							// e verificar se o desconto aplicado é maior que o permitido.
							//fazendo ( preço cheio - preço de venda )
							vetorFamilia.push(vetorGeral[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);
							proximoItemDiferente = true;
						}

					} else if ((o + 1) == vetorGeral.length) {

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
				vetorGeralExtra.sort(function (a, b) {
					return a.zzGrpmatExtra - b.zzGrpmatExtra;
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

						if (vetorGeralExtra[o].zzGrpmat == vetorGeralExtra[o + 1].zzGrpmat) {

							proximoItemDiferente = false;
							vetorFamilia.push(vetorGeralExtra[o]);

						} else {
							//Nesse momento tenho os itens daquela familia.. tendo os itens da familia .. somar as quantidades
							// e verificar se o desconto aplicado é maior que o permitido.
							//fazendo ( preço cheio - preço de venda )
							vetorFamilia.push(vetorGeralExtra[o]);
							this.onBuscaPorcentagem(vetorFamilia, vetorRange, tipoDesconto);
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
		onBuscaPorcentagem: function (vetorFamilia, vetorDescontos, tipoDesconto) {

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

				vetorAuxFamilia.sort(function (a, b) {
					return a.zzGrpmat - b.zzGrpmat;
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

				vetorAuxFamilia.sort(function (a, b) {
					return a.zzGrpmat - b.zzGrpmat;
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

		onCalculaPrazoMedio: function (vetorParametros) {

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
				var valorTot = 0;
				var valorAux = 0;

				for (var i = 1; i <= quantidadeParcelas; i++) {
					if (i == 1) {
						var base = diasPrimeiraParcela;
					}
					valorTot += intervaloParcelas * i;
				}

				var prazoMedio = valorTot / quantidadeParcelas;

				if (diasPrimeiraParcela < intervaloParcelas) {
					valorAux = intervaloParcelas - diasPrimeiraParcela;
					prazoMedio = prazoMedio - valorAux;
				} else if (diasPrimeiraParcela > intervaloParcelas) {
					valorAux = diasPrimeiraParcela - intervaloParcelas;
					prazoMedio = prazoMedio + valorAux;
				}

				// var prazoMedio = Math.round((parseInt(intervaloParcelas) * parseInt(quantidadeParcelas) + parseInt(diasPrimeiraParcela)) /
				// 	parseInt(quantidadeParcelas) * 100) / 100;
				if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {
					if (valTotPed < valorPedMin && prazoMedio >= prazoMinAvista) {

						diasExcedente = prazoMedio - prazoMinAvista;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed < valorPedMin && prazoMedio < prazoMinAvista) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed >= valorPedMin && prazoMedio >= prazoMaxAvista) {

						diasExcedente = prazoMedio - prazoMaxAvista;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed >= valorPedMin && prazoMedio < prazoMaxAvista) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);
					}

				} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
					if (valTotPed < valorPedMin && prazoMedio >= prazoMinAprazo) {

						diasExcedente = prazoMedio - prazoMinAprazo;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed < valorPedMin && prazoMedio < prazoMinAprazo) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed >= valorPedMin && prazoMedio >= prazoMaxAprazo) {

						diasExcedente = prazoMedio - prazoMaxAprazo;
						percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

					} else if (valTotPed >= valorPedMin && prazoMedio < prazoMaxAprazo) {
						//Não gera excedente.
						console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
						this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

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
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAvista) {
							//Não gera excedente.
							console.log("Não gerou excedente 1");
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAvista) {

							diasExcedente = mediaPonderada - prazoMaxAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAvista) {
							//Não gera excedente.
							console.log("Não gerou excedente 2");
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);
						}

					} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAprazo) {

							diasExcedente = mediaPonderada - prazoMinAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAprazo) {
							//Não gera excedente.
							console.log("Não gerou excedente 3");
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAprazo) {

							diasExcedente = mediaPonderada - prazoMaxAprazo;
							percExcedentePrazoMed = Math.round((Math.round((diasExcedente * (percJurosDia)) * 100) / 100) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAprazo) {
							//Não gera excedente.
							console.log("Não gerou excedente 4");
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);
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
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAvista) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAvista) {

							diasExcedente = mediaPonderada - prazoMaxAvista;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAvista) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);
						}

					} else if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {
						if (valTotPed < valorPedMin && mediaPonderada >= prazoMinAprazo) {

							diasExcedente = mediaPonderada - prazoMinAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed < valorPedMin && mediaPonderada < prazoMinAprazo) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);

						} else if (valTotPed >= valorPedMin && mediaPonderada >= prazoMaxAprazo) {

							diasExcedente = mediaPonderada - prazoMaxAprazo;
							percExcedentePrazoMed = Math.round((diasExcedente * (percJurosDia)) * 100) / 100;
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", percExcedentePrazoMed);

						} else if (valTotPed >= valorPedMin && mediaPonderada < prazoMaxAprazo) {
							//Não gera excedente.
							console.log("Perc Excedente: " + percExcedentePrazoMed + ", Dias Excedidos: " + diasExcedente);
							this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercExcedentePrazoMed", 0);

						}
					}
				}
			}

		},

		onNavegaBalancoVenda: function () {

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab6");

		},

		popularCamposItemPedido: function () {

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

		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, sValue), new sap.ui.model.Filter(
				"maktx", sap.ui.model.FilterOperator.Contains, sValue)];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			sap.ui.getCore().byId("idItemPedido").getBinding("suggestionItems").filter(aFilters);
			sap.ui.getCore().byId("idItemPedido").suggest();
		},

		onDialogCancelButton: function () {
			var that = this;
			oItemTemplateTotal = [];

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				objItensPedidoTemplate = [];
				var db = open.result;
				var numeroPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

				var store = db.transaction("ItensPedido").objectStore("ItensPedido");
				store.openCursor().onsuccess = function (event1) {
					var cursor = event1.target.result;

					if (cursor) {
						if (cursor.value.nrPedCli === numeroPedido) {
							objItensPedidoTemplate.push(cursor.value);
						}
						cursor.continue();
					} else {

						var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");

						that.onBloqueiaPrePedido();
						that.calculaTotalPedido();

						//Clicou no editar item .. mas cancelou .. dai tem que resetar a variavel que identifica que é um edit
						that.getOwnerComponent().getModel("modelAux").setProperty("/EditarIndexItem", 0);
					}
				};
			};
		},

		onDialogSubmitButton: function () {

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
					onClose: function () {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
					}
				});
			} else if (sap.ui.getCore().byId("idQuantidade").getValue() === "" || sap.ui.getCore().byId("idQuantidade").getValue() === 0) {

				MessageBox.show("Digite uma quantidade acima de 0.", {
					icon: MessageBox.Icon.ERROR,
					title: "Campo Inválido.",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
						sap.ui.getCore().byId("idQuantidade").setValue(oItemTemplate.QtdPedida);

					}
				});

			} else {
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function () {
					oButtonSalvar.setEnabled(true);
					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function () {
					var db = open.result;

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

					requestMaterial.onsuccess = function (e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function () {
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

							request.onsuccess = function (e3) {
								var result2 = e3.target.result;
								//preparar o obj a ser adicionado ou editado
								if (result2 == undefined) {

									that.getOwnerComponent().getModel("modelAux").setProperty("/UltimoIndexItem", nrPedCli + "/" + (indexItem));
									oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/UltimoIndexItem");
									oItemPedido.index = indexItem;
									oItemPedido.nrPedCli = nrPedCli;
									var requestADDItem = objItensPedido.add(oItemPedido);
									requestADDItem.onsuccess = function (e3) {

										objItensPedidoTemplate.push(oItemPedido);
										// indexItem = indexItem + 1;
										that.setaCompleto(db, "Não");

										var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
										that.getView().setModel(oModel, "ItensPedidoGrid");

										that.onBloqueiaPrePedido();

										console.log("Item: " + oItemPedido.index + " adicionado com sucesso");

										that.calculaTotalPedido();

									};
									requestADDItem.onerror = function (e3) {
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
									requestPutItens.onsuccess = function () {
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

										that.onBloqueiaPrePedido();

										console.log("Item: " + oItemPedido.index + " foi Atualizado");

									};
									requestPutItens.onerror = function (event) {
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

		onDialogDiluicaoSubmitButton: function () {

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
					onClose: function () {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
					}
				});
			} else if (sap.ui.getCore().byId("idQuantidade").getValue() === "" || sap.ui.getCore().byId("idQuantidade").getValue() === 0) {

				MessageBox.show("Digite uma quantidade acima de 0.", {
					icon: MessageBox.Icon.ERROR,
					title: "Campo Inválido.",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						oPanel.setBusy(false);
						oButtonSalvar.setEnabled(true);
						sap.ui.getCore().byId("idQuantidade").setValue(oItemTemplate.QtdPedida);

					}
				});

			} else {
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function () {

					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Banco não encontrado!",
						actions: [MessageBox.Action.OK],
						onClose: function () {
							oButtonSalvar.setEnabled(true);
						}
					});
				};

				open.onsuccess = function () {
					var db = open.result;

					var store = db.transaction("Materiais", "readwrite");
					var objMaterial = store.objectStore("Materiais");

					var requestMaterial = objMaterial.get(sap.ui.getCore().byId("idItemPedido").getValue());

					requestMaterial.onsuccess = function (e) {
						var oMaterial = e.target.result;

						if (oMaterial == undefined) {
							oPanel.setBusy(false);

							MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
								icon: MessageBox.Icon.ERROR,
								title: "Produto não encontrado.",
								actions: [MessageBox.Action.YES],
								onClose: function () {
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
							requestADDItem.onsuccess = function (e3) {

								objItensPedidoTemplate.push(oItemPedido);
								// indexItem = indexItem + 1;
								that.setaCompleto(db, "Não");

								var oModel = new sap.ui.model.json.JSONModel(objItensPedidoTemplate);
								that.getView().setModel(oModel, "ItensPedidoGrid");

								that.onBloqueiaPrePedido();

								that.byId("idDiluirItens").setEnabled(true);

								console.log("Item: " + oItemPedido.index + " adicionado com sucesso, tipo Item: " + oItemPedido.tipoItem);

								that.calculaTotalPedido();

							};
							requestADDItem.onerror = function (e3) {
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
		onNovoItem: function () {
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

		onNovoItemDiluicao: function () {
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

		onEditarItemPress: function (oEvent) {

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

		onDeletarItemPedido: function (oEvent) {
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
					onClose: function (oAction) {
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

							that.onBloqueiaPrePedido();

							var open = indexedDB.open("VB_DataBase");
							open.onerror = function () {
								MessageBox.show(open.error.mensage, {
									icon: MessageBox.Icon.ERROR,
									title: "Banco não encontrado!",
									actions: [MessageBox.Action.OK]
								});
							};

							open.onsuccess = function () {
								var db = open.result;

								that.setaCompleto(db, "Não");
								that.calculaTotalPedido();

								var store1 = db.transaction("ItensPedido", "readwrite");
								var objPedido = store1.objectStore("ItensPedido");

								var request = objPedido.delete(idItemPedido);
								request.onsuccess = function () {
									console.log("Item com ID: " + idItemPedido + " foi deletado!");
								};
								request.onerror = function () {
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

		onFinalizarPedido: function () {

			//Percorre os itens do pedido para fazer uma verificação se realmente não tem produto repetido.
			var i = 0;

			var that = this;
			//HRIMP E DATIMP
			var data = this.onDataAtualizacao();
			var horario = data[1];

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "PEN");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", 2);

			var totalItens = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TotalItensPedido");
			var completoPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo");

			if (totalItens <= 0 || totalItens === undefined) {
				MessageBox.show("O pedido deve conter no mínimo 1 item.", {
					icon: MessageBox.Icon.ERROR,
					title: "Falha ao Completar Pedido.",
					actions: [MessageBox.Action.OK]
				});
			}
			// else if (itemDuplicado == true) {
			// 	MessageBox.show("O pedido possui itens duplicados. Favor rever sua lista de itens!", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Falha ao Completar Pedido.",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			else {
				//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Atualizando o PrePedido PEDIDO NO BANCO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
				var open = indexedDB.open("VB_DataBase");

				open.onerror = function () {
					MessageBox.show(open.error.mensage, {
						icon: MessageBox.Icon.ERROR,
						title: "Falha ao abrir o banco para inserir os dados do pedido!",
						actions: [MessageBox.Action.OK]
					});
				};

				open.onsuccess = function () {
					var db = open.result;

					if (completoPedido == "Não") {

						var objBancoPrePedido = {
							nrPedCli: that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"),
							kunnr: that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr"),
							werks: that.getOwnerComponent().getModel("modelAux").getProperty("/Werks"),
							codRepres: that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres"),
							tipoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido"),
							idStatusPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido"),
							situacaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/SituacaoPedido"),
							tabPreco: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"),
							completo: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo"),
							valMinPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValMinPedido"),
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
							ntgew: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Ntgew"),
							valTotPed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotPed"),
							valDescontoTotal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValDescontoTotal"),
							valTotalExcedentePrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedentePrazoMed"),
							valTotalExcedenteDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteDesconto"),
							totalItensPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TotalItensPedido"),
							valCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampEnxoval"),
							valCampBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampBrinde"),
							valCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampGlobal"),
							valVerbaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaPedido"),
							valComissaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoPedido"),
							valComissaoUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValComissaoUtilizadaDesconto"),
							valVerbaUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto"),
							valUtilizadoComissaoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValUtilizadoComissaoPrazoMed"),
							valTotalExcedenteNaoDirecionadoDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValTotalExcedenteNaoDirecionadoDesconto"),
							valTotalExcedenteNaoDirecionadoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValTotalExcedenteNaoDirecionadoPrazoMed"),
							valTotalAbatidoComissao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalAbatidoComissao"),
							valTotalAbatidoVerba: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalAbatidoVerba"),
							valTotalCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampGlobal"),
							valUtilizadoCampBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampBrinde"),
							valUtilizadoCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampGlobal"),
							valTotalCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampEnxoval"),
							valUtilizadoCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampEnxoval"),
							valTotalCampProdutoAcabado: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampProdutoAcabado"),
							valUtilizadoCampProdutoAcabado: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampProdutoAcabado"),
							valTotalExcedenteBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBrinde"),
							valUtilizadoVerbaBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBrinde"),
							valUtilizadoComissaoBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBrinde"),
							valTotalExcedenteAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteAmostra"),
							valUtilizadoVerbaAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaAmostra"),
							valUtilizadoComissaoAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoAmostra"),
							valTotalExcedenteBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"),
							valUtilizadoVerbaBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBonif"),
							valUtilizadoComissaoBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBonif")
						};

						var store1 = db.transaction("PrePedidos", "readwrite");
						var objPedido = store1.objectStore("PrePedidos");
						var request = objPedido.put(objBancoPrePedido);

						request.onsuccess = function () {
							// that.atualizaMovtoVerba(db);
							that.setaCompleto(db, "Sim");
							that.onResetarCamposPrePedido();
							oItemTemplate = [];
							oItemTemplateTotal = [];
							console.log("Pedido inserido");
						};

						request.onerror = function () {
							console.log("Pedido não foi Inserido!");
						};
					}

					MessageBox.show("Deseja enviar o pedido agora ?", {
						icon: MessageBox.Icon.ERROR,
						title: "Atenção",
						actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (oAction) {
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

		onLiberarItensPedido: function () {
			var that = this;

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
			}
			// else if (this.byId("idTipoTransporte").getSelectedKey() == "" || this.byId("idTipoTransporte").getSelectedKey() == undefined) {
			// 	MessageBox.show("Preencher o tipo de transporte!", {
			// 		icon: MessageBox.Icon.ERROR,
			// 		title: "Corrigir o campo!",
			// 		actions: [MessageBox.Action.OK]
			// 	});
			// } 
			else if (this.byId("idQuantParcelas").getValue() <= 0) {
				MessageBox.show("Quantidade de parcelas deve ser maior que 0.", {
					icon: MessageBox.Icon.ERROR,
					title: "Corrigir o campo!",
					actions: [MessageBox.Action.OK]
				});
			}
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
				open.onerror = function (hxr) {
					console.log("falha abrir tabela PrePedido as tabelas");
				};
				//Load tables
				open.onsuccess = function () {
					var db = open.result;

					var tx = db.transaction("PrePedidos", "readwrite");
					var objPrePedido = tx.objectStore("PrePedidos");

					var request = objPrePedido.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

					request.onsuccess = function (e) {
						var result = e.target.result;

						var objBancoPrePedido = {
							nrPedCli: that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"),
							kunnr: that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr"),
							werks: that.getOwnerComponent().getModel("modelAux").getProperty("/Werks"),
							codRepres: that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres"),
							tipoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido"),
							idStatusPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido"),
							situacaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/SituacaoPedido"),
							tabPreco: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"),
							completo: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo"),
							valMinPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValMinPedido"),
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
							ntgew: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Ntgew"),
							valTotPed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotPed"),
							valDescontoTotal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValDescontoTotal"),
							valTotalExcedentePrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedentePrazoMed"),
							valTotalExcedenteDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteDesconto"),
							totalItensPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TotalItensPedido"),
							valCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampEnxoval"),
							valCampBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampBrinde"),
							valCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValCampGlobal"),
							valVerbaPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaPedido"),
							valComissaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoPedido"),
							valComissaoUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValComissaoUtilizadaDesconto"),
							valVerbaUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto"),
							valUtilizadoComissaoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValUtilizadoComissaoPrazoMed"),
							valTotalExcedenteNaoDirecionadoDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValTotalExcedenteNaoDirecionadoDesconto"),
							valTotalExcedenteNaoDirecionadoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValTotalExcedenteNaoDirecionadoPrazoMed"),
							valTotalAbatidoComissao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalAbatidoComissao"),
							valTotalAbatidoVerba: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalAbatidoVerba"),
							valTotalCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampGlobal"),
							valUtilizadoCampBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampBrinde"),
							valUtilizadoCampGlobal: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampGlobal"),
							valTotalCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampEnxoval"),
							valUtilizadoCampEnxoval: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoCampEnxoval"),
							valTotalCampProdutoAcabado: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalCampProdutoAcabado"),
							valUtilizadoCampProdutoAcabado: that.getOwnerComponent().getModel("modelDadosPedido").getProperty(
								"/ValUtilizadoCampProdutoAcabado"),
							valTotalExcedenteBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBrinde"),
							valUtilizadoVerbaBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBrinde"),
							valUtilizadoComissaoBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBrinde"),
							valTotalExcedenteAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteAmostra"),
							valUtilizadoVerbaAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaAmostra"),
							valUtilizadoComissaoAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoAmostra"),
							valTotalExcedenteBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"),
							valUtilizadoVerbaBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBonif"),
							valUtilizadoComissaoBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBonif")
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
								idStatusPedido: "",
								situacaoPedido: "",
								tabPreco: "",
								completo: "",
								valMinPedido: "",
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
								ntgew: "",
								valTotPed: "",
								valDescontoTotal: "",
								valTotalExcedentePrazoMed: "",
								valTotalExcedenteDesconto: "",
								totalItensPedido: "",
								valCampEnxoval: "",
								valCampBrinde: "",
								valCampGlobal: "",
								valVerbaPedido: "",
								valComissaoPedido: "",
								valComissaoUtilizadaDesconto: "",
								valVerbaUtilizadaDesconto: "",
								valUtilizadoComissaoPrazoMed: "",
								valTotalExcedenteNaoDirecionadoDesconto: "",
								valTotalExcedenteNaoDirecionadoPrazoMed: "",
								valTotalAbatidoComissao: "",
								valTotalAbatidoVerba: "",
								valTotalCampGlobal: "",
								valUtilizadoCampBrinde: "",
								valUtilizadoCampGlobal: "",
								valTotalCampEnxoval: "",
								valUtilizadoCampEnxoval: "",
								valTotalCampProdutoAcabado: "",
								valUtilizadoCampProdutoAcabado: "",
								valTotalExcedenteBrinde: "",
								valUtilizadoVerbaBrinde: "",
								valUtilizadoComissaoBrinde: "",
								valTotalExcedenteAmostra: "",
								valUtilizadoVerbaAmostra: "",
								valUtilizadoComissaoAmostra: "",
								valTotalExcedenteBonif: "",
								valUtilizadoVerbaBonif: "",
								valUtilizadoComissaoBonif: ""
							};

							request1.onsuccess = function () {

								that.setaCompleto(db, "Não");

								MessageBox.show("Inclusão Efetivada com Sucesso!", {
									icon: MessageBox.Icon.SUCCESS,
									title: "Confirmação",
									actions: [MessageBox.Action.OK],
									onClose: function () {
										that.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
										console.log("Dados PrePedido inseridos");
									}
								});

							};

							request1.onerror = function (event) {
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
								idStatusPedido: "",
								situacaoPedido: "",
								tabPreco: "",
								completo: "",
								valMinPedido: "",
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
								ntgew: "",
								valTotPed: "",
								valDescontoTotal: "",
								valTotalExcedentePrazoMed: "",
								valTotalExcedenteDesconto: "",
								totalItensPedido: "",
								valCampEnxoval: "",
								valCampBrinde: "",
								valCampGlobal: "",
								valVerbaPedido: "",
								valComissaoPedido: "",
								valComissaoUtilizadaDesconto: "",
								valVerbaUtilizadaDesconto: "",
								valUtilizadoComissaoPrazoMed: "",
								valTotalExcedenteNaoDirecionadoDesconto: "",
								valTotalExcedenteNaoDirecionadoPrazoMed: "",
								valTotalAbatidoComissao: "",
								valTotalAbatidoVerba: "",
								valTotalCampGlobal: "",
								valUtilizadoCampBrinde: "",
								valUtilizadoCampGlobal: "",
								valTotalCampEnxoval: "",
								valUtilizadoCampEnxoval: "",
								valTotalCampProdutoAcabado: "",
								valUtilizadoCampProdutoAcabado: "",
								valTotalExcedenteBrinde: "",
								valUtilizadoVerbaBrinde: "",
								valUtilizadoComissaoBrinde: "",
								valTotalExcedenteAmostra: "",
								valUtilizadoVerbaAmostra: "",
								valUtilizadoComissaoAmostra: "",
								valTotalExcedenteBonif: "",
								valUtilizadoVerbaBonif: "",
								valUtilizadoComissaoBonif: ""
							};

							request1.onsuccess = function () {
								that.setaCompleto(db, "Não");
								MessageBox.show("Cabeçalho atualizado com Sucesso!", {
									icon: MessageBox.Icon.SUCCESS,
									title: "Concluido!",
									actions: [MessageBox.Action.OK],
									onClose: function () {
										that.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
										console.log("Dados PrePedido Atualizados");
									}
								});
							};

							request1.onerror = function (event) {
								console.log("Dados PrePedido não foram Atualizados :" + event.Message);
							};
						}
					};

					request.onerror = function (e) {
						console.log("Error");
						console.dir(e);
					};
				};
			}
		},

		onResetarCamposPrePedido: function () {

			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", "");

			this.onResetaCamposPrePedido();
		},

		onCancelarPedido: function () {
			this.onResetarCamposPrePedido();
			oItemTemplate = [];
			oItemTemplateTotal = [];

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
		},

		onBloqueiaPrePedido: function () {

			if (objItensPedidoTemplate.length > 0) {

				this.byId("idTabelaPreco").setEnabled(false);
				this.byId("idTipoTransporte").setEnabled(false);
				this.byId("idTipoNegociacao").setEnabled(false);
				this.byId("idTipoPedido").setEnabled(false);

			} else {

				this.byId("idTabelaPreco").setEnabled(true);
				this.byId("idTipoTransporte").setEnabled(true);
				this.byId("idTipoNegociacao").setEnabled(true);
				this.byId("idTipoPedido").setEnabled(true);
			}
		},

		// FIM EVENTOS DOS BOTÕES 					

		setaCompleto: function (db, completo) {
			var that = this;
			var objSetaCompletoPedido = [];
			that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", completo);

			var tx = db.transaction("PrePedidos", "readwrite");
			var objPrePedido = tx.objectStore("PrePedidos");

			var request = objPrePedido.get(that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli"));

			request.onsuccess = function (e) {
				var result = e.target.result;
				objSetaCompletoPedido = result;
				objSetaCompletoPedido.completo = completo;

				var store1 = db.transaction("PrePedidos", "readwrite");
				var objPedido = store1.objectStore("PrePedidos");
				var request1 = objPedido.put(objSetaCompletoPedido);

				request1.onsuccess = function () {
					console.log("O campo completo foi atualizado para > " + completo);
				};
				request1.onerror = function () {
					console.log("Erro ao abrir o Pedido > " + that.getOwnerComponent().getModel("modelAux").getProperty("/nrPedCli"));
				};
			};
		},

		onValidaComissaoUtilizadaDesconto: function (evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor > 0 || valor == "") {
				if (valor > 0) {

					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", parseFloat(valor));
				} else {
					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", 0);
				}
			} else {
				oSource.setValue(0);
			}
		},

		onValidaComissaoUtilizadaPrazoMedio: function (evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor > 0 || valor == "") {
				if (valor > 0) {

					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", parseFloat(valor));
				} else {
					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", 0);
				}
			} else {
				oSource.setValue(0);
			}
		},

		onValidaNumeroPositivo: function (evt) {

			var oSource = evt.getSource();

			var valor = oSource.getValue();

			if (valor < 0) {

				oSource.setValue(0);
			}
		},

		onValidaVerbaUtilizadaDesconto: function (evt) {

			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor > 0 || valor == "") {
				if (valor > 0) {

					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", parseFloat(valor));
				} else {
					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", 0);
				}
			} else {
				oSource.setValue(0);
			}

		},

		onAddOV: function () {

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
				success: function (data) {

					MessageBox.show("Ordem de Venda: " + data.Salesdocumentin + " criada com sucesso!", {
						icon: MessageBox.Icon.SUCCESS,
						title: "Ordem de Venda CRIADA!",
						actions: [MessageBox.Action.OK],
						onClose: function () {

						}
					});

				},
				error: function (error) {

					console.log(error);

					MessageBox.show("Erro ao criar Ordem de Venda!", {
						icon: MessageBox.Icon.ERROR,
						title: "Não encontrado!",
						actions: [MessageBox.Action.OK],
						onClose: function () {
							console.log(error.response);

						}
					});
				}
			});
		}

	});
});