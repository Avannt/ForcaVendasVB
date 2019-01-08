/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"testeui5/model/formatter",
	"testeui5/controller/PedidoDetalheEnxoval.controller",
	"testeui5/controller/PedidoDetalheGlobal.controller"

], function(BaseController, JSONModel, MessageBox, formatter) {
	"use strict";
	//variavel para salvar o obj ATUAL do item do pedido E obj pra salvar TODOS os items do pedido

	return BaseController.extend("testeui5.controller.PedidoDetalhe", {

		formatter: formatter,

		_data: {
			"precoVendas": ["99"]
		},

		onInit: function() {
			this.getRouter().getRoute("pedidoDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function() {
			var that = this;

			this.pedidoDetalheEnxoval = new testeui5.controller.PedidoDetalheEnxoval(that);
			//this.pedidoDetalheGlobal   = new testeui5.controller.PedidoDetalheGlobal(that);

			that.oItemTemplate = [];
			that.oVetorMateriais = [];
			that.indexItem = 0;
			that.oVetorTabPreco = [];
			that.oVetorTipoTransporte = [];
			that.oVetorFormasPagamentos = [];
			that.oVetorTipoNegociacao = [];
			that.oVetorTiposPedidos = [];
			that.objItensPedidoTemplate = [];
			that.oItemPedido = [];

			var aTemp = [];

			var oModel = new sap.ui.model.json.JSONModel(aTemp);
			this.getView().setModel(oModel);

			this.getView().setModel(this.getView().getModel("modelCliente"));
			this.getView().setModel(this.getView().getModel("modelAux"));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", false);

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

		formatNumber: function(value) {
			return value.toLocaleString("pt-BR");
		},

		onCarregaCliente: function() {

			// var sTipoUsuario = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");
			var sTipoUsuario = this.getOwnerComponent().getModel("modelAux").getProperty("/Tipousuario");

			/* Se o usuário conectado for representante (sTipoUsuario = 1), exibo o código do preposto que consta no pedido*/
			var codUsr = (sTipoUsuario == "1") ?
				this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/CodUsr") :
				/* Se o usuário conectado for preposto (sTipoUsuario = 2), exibo o código do usuário que está conectado no sistema*/
				this.getOwnerComponent().getModel("modelAux").getProperty("/CodUsr");

			/* Se o valor codUsr for undefined, significa que é um pedido novo, atribuo então o valor do usuário */
			codUsr = (codUsr == undefined) ? this.getOwnerComponent().getModel("modelAux").getProperty("/CodUsr") : codUsr;

			this.byId("idCodCliente").setValue(this.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr") + "-" +
				this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres") + "-" + codUsr);
			// this.byId("idNome").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Name1"));
			// this.byId("idCNPJ").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stcd1") + this.getOwnerComponent().getModel("modelCliente").getProperty("/Stcd2"));
			// this.byId("idEndereco").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Stras"));
			// this.byId("idCidade").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Ort01") + "-" +
			// 	this.getOwnerComponent().getModel("modelCliente").getProperty("/Regio"));
			// this.byId("idFone").setValue(this.getOwnerComponent().getModel("modelCliente").getProperty("/Telf1"));
		},

		onResetaCamposPrePedido: function() {
			var that = this;

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
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", 0);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/FormaPagamento", "");

			this.byId("idTabelaPreco").setSelectedKey();
			this.byId("idTipoTransporte").setSelectedKey();
			this.byId("idTipoNegociacao").setSelectedKey();
			this.byId("idTipoPedido").setSelectedKey();
			this.byId("idFormaPagamento").setSelectedKey();

			that.objItensPedidoTemplate = [];
			var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
			this.getView().setModel(oModel, "ItensPedidoGrid");

			this.onBloqueiaPrePedido();
		},

		//CARREGA OS CAMPOS, POPULANDO OS COMBO BOX
		onCarregaCampos: function(db, resolve, reject) {
			var that = this;
			that.oVetorTabPreco = [];
			that.oVetorMateriais = [];
			that.oVetorTipoTransporte = [];
			that.oVetorTipoNegociacao = [];
			that.objItensPedidoTemplate = [];
			that.oVetorFormasPagamentos = [];
			var tabbri = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
			var tabamo = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
			var tabbon = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;

			var data = this.onDataAtualizacao();

			var Kunnr = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			//Inicialização de Variáveis. *modelDadosPedido
			this.onResetaCamposPrePedido();

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "EM DIGITAÇÃO");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", 1);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataImpl", data[0] + "-" + data[1]);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DataPedido", data[0]);

			// //CARREGA OS MATERIAIS
			// var transaction = db.transaction("Materiais", "readonly");
			// var objectStore = transaction.objectStore("Materiais");

			// if ("getAll" in objectStore) {
			// 	objectStore.getAll().onsuccess = function(event) {
			// 		that.oVetorMateriais = event.target.result;

			// 		var oModel = new sap.ui.model.json.JSONModel(that.oVetorMateriais);
			// 		that.getView().setModel(oModel, "materiaisCadastrados");
			// 	};
			// }

			//Tipos Pedidos
			var transactionTiposPedidos = db.transaction("TiposPedidos", "readonly");
			var objectStoreTiposPedidos = transactionTiposPedidos.objectStore("TiposPedidos");

			if ("getAll" in objectStoreTiposPedidos) {
				objectStoreTiposPedidos.getAll().onsuccess = function(event) {
					that.oVetorTiposPedidos = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(that.oVetorTiposPedidos);
					that.getView().setModel(oModel, "tiposPedidos");
				};
			}

			//CARREGA NEGOCIOAÇÃO
			that.oVetorTipoNegociacao = [{
				idNegociacao: "01",
				descNegociacao: "À vista"
			}, {
				idNegociacao: "02",
				descNegociacao: "À prazo"
			}];

			var oModelNegociacao = new sap.ui.model.json.JSONModel(that.oVetorTipoNegociacao);
			that.getView().setModel(oModelNegociacao, "tipoNegociacao");

			//CARREGA TIPO DE TRANSPORTE
			that.oVetorTipoTransporte = [{
				idTransporte: "CIF"
			}, {
				idTransporte: "FOB"
			}];

			var transactionFormasPagamentos = db.transaction("FormasPagamentos", "readonly");
			var objectStoreFormasPagamentos = transactionFormasPagamentos.objectStore("FormasPagamentos");

			if ("getAll" in objectStoreFormasPagamentos) {
				objectStoreFormasPagamentos.getAll().onsuccess = function(event) {
					that.oVetorFormasPagamentos = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(that.oVetorFormasPagamentos);
					that.getView().setModel(oModel, "formasPagamentos");
				};
			}

			var oModel = new sap.ui.model.json.JSONModel(that.oVetorTipoTransporte);
			that.getView().setModel(oModel, "tipoTransporte");

			var transactionA961 = db.transaction(["A961"], "readonly");
			var objectStoreA961 = transactionA961.objectStore("A961");

			objectStoreA961.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					if (cursor.value.kunnr == Kunnr) {

						that.oVetorTabPreco.push(cursor.value);
					}

					cursor.continue();

				} else {

					var oModelTabPreco = new sap.ui.model.json.JSONModel(that.oVetorTabPreco);
					that.getView().setModel(oModelTabPreco, "tabPreco");

					if (that.oVetorTabPreco.length == 0) {

						var CodRepres = that.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

						var transactionA963 = db.transaction("A963", "readonly");
						var objectStoreA963 = transactionA963.objectStore("A963");

						if ("getAll" in objectStoreA963) {
							objectStoreA963.getAll().onsuccess = function(event) {

								for (var j = 0; j < event.target.result.length; j++) {
									if (event.target.result[j].pltyp != tabbon && event.target.result[j].pltyp != tabbri && event.target.result[j].pltyp != tabamo) {
										that.oVetorTabPreco.push(event.target.result[j]);
									}
								}

								oModelTabPreco = new sap.ui.model.json.JSONModel(that.oVetorTabPreco);
								that.getView().setModel(oModelTabPreco, "tabPreco");
							};
						}
					}
				}
			};
		},

		onCriarNumeroPedido: function() {
			var CodRepres = this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Completo", "Não");
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

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

			this.onCarregaCliente();
			this.onBloqueiaPrePedidoTotal(true);
		},

		onCarregaDadosPedido: function(db) {
			var that = this;
			that.objItensPedidoTemplate = [];
			var vetorAux = [];

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
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", oPrePedido.diasPrimeiraParcela);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", oPrePedido.quantParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", oPrePedido.intervaloParcelas);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoPedido", oPrePedido.observacaoPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ObservacaoAuditoriaPedido", oPrePedido.observacaoAuditoriaPedido);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", oPrePedido.existeEntradaPedido);
					that.byId("idCheckEntrada").setSelected(oPrePedido.existeEntradaPedido);
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
					// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissao", oPrePedido.valComissao);
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
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", oPrePedido.valUtilizadoVerbaPrazoMed);
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
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/CodUsr", oPrePedido.codUsr);
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/FormaPagamento", oPrePedido.zlsch);

					//Seleciona o valor do combo
					that.byId("idTabelaPreco").setSelectedKey(oPrePedido.tabPreco);
					that.byId("idTipoTransporte").setSelectedKey(oPrePedido.tipoTransporte);
					that.byId("idTipoNegociacao").setSelectedKey(oPrePedido.tipoNegociacao);
					that.byId("idTipoPedido").setSelectedKey(oPrePedido.tipoPedido);
					that.byId("idFormaPagamento").setSelectedKey(oPrePedido.zlsch);

					that.onBloqueioFormaPagamento(oPrePedido.tipoPedido);

					that.onCarregaCliente();

					var promise = new Promise(function(resolve, reject) {
						that.onCarregaMateriais(db, oPrePedido.tipoPedido, resolve, reject);
						console.log("Carrega materiais sem preço");
					});

					promise.then(function(resolve) {
						console.log("Carrega materiais com preço");
						that.onCarregaMateriaisComPreco(db, oPrePedido.tabPreco, that.oVetorMateriais);
					});

					//FILTRA ITENS PARA APARECER NO COMBO PARA SELECIONAR DE ACORDO COM O TIPO DE PEDIDO JÁ EXISTENTE.
					//AMOSTRA
					// if (oPrePedido.tipoPedido == "YBRI") {
					// 	for (var i = 0; i < that.oVetorMateriais.length; i++) {
					// 		if (that.oVetorMateriais[i].mtpos == "YAMO") {
					// 			vetorAux.push(that.oVetorMateriais[i]);
					// 		}
					// 	}
					// 	that.oVetorMateriais = vetorAux;
					// }
					// //BRINDES
					// if (oPrePedido.tipoPedido == "YBRI") {
					// 	for (i = 0; i < that.oVetorMateriais.length; i++) {
					// 		if (that.oVetorMateriais[i].mtpos == "YBRI") {
					// 			vetorAux.push(that.oVetorMateriais[i]);
					// 		}
					// 	}

					// 	that.oVetorMateriais = vetorAux;
					// }

					// var oModel = new sap.ui.model.json.JSONModel(that.oVetorMateriais);
					// that.getView().setModel(oModel, "materiaisCadastrados");

					var storeItensPedido = db.transaction("ItensPedido", "readwrite").objectStore("ItensPedido");
					storeItensPedido.openCursor().onsuccess = function(event) {
						// consulta resultado do event
						var cursor = event.target.result;
						if (cursor) {
							if (cursor.value.nrPedCli === that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli")) {

								that.objItensPedidoTemplate.push(cursor.value);

							}
							cursor.continue();
						} else {

							var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");

							if (oPrePedido.idStatusPedido == 3) {
								that.onBloqueiaPrePedidoTotal(false);
							} else {
								that.onBloqueiaPrePedido();
								that.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
							}
							// that.calculaTotalPedido();
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

		onBloqueioFormaPagamento: function(valor) {

			if (valor == "YAMO" || valor == "YBRI" || valor == "YTRO" || valor == "YBON") {

				this.byId("idFormParcelamento").setVisible(false);
				this.byId("idInserirItemDiluicao").setEnabled(false);
				this.byId("idFormaPagamento").setVisible(false);

				this.byId("idTipoNegociacao").setVisible(false);
				this.byId("idTipoNegociacao").setSelectedKey(this.oVetorTipoNegociacao[1].idNegociacao);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", this.oVetorTipoNegociacao[1].idNegociacao);

				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ExisteEntradaPedido", false);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IntervaloParcelas", 0);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantParcelas", 1);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/DiasPrimeiraParcela", 0);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValorEntradaPedido", 0);
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PercEntradaPedido", 0);

				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ExisteEntradaPedido") == true) {

					this.byId("idPercEntrada").setVisible(true);
					this.byId("idValorEntrada").setVisible(true);

				} else {

					this.byId("idPercEntrada").setVisible(false);
					this.byId("idValorEntrada").setVisible(false);

				}
			} else {

				if (valor == "YVEF") {

					this.byId("idTipoNegociacao").setVisible(false);
					this.byId("idTipoNegociacao").setSelectedKey(this.oVetorTipoNegociacao[1].idNegociacao);
					this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoNegociacao", this.oVetorTipoNegociacao[1].idNegociacao);

					this.byId("idFormParcelamento").setVisible(true);
					this.byId("idInserirItemDiluicao").setEnabled(true);
					this.byId("idFormaPagamento").setVisible(true);

				} else {

					this.byId("idTipoNegociacao").setVisible(true);
					this.byId("idFormParcelamento").setVisible(true);
					this.byId("idInserirItemDiluicao").setEnabled(true);
					this.byId("idFormaPagamento").setVisible(true);
				}

			}
		},

		onCarregaMateriais: function(db, tipoPedido, resolve, reject) {
			var that = this;

			if (tipoPedido == "YVEN" || tipoPedido == "YBON" || tipoPedido == "YTRO") {

				var filtro = "";

			} else if (tipoPedido == "YVEF") {

				filtro = "NORM";

			} else {

				filtro = tipoPedido;

			}

			var transaction = db.transaction("Materiais", "readonly");
			var objectStoreMaterial = transaction.objectStore("Materiais");

			var indexMtpos = objectStoreMaterial.index("mtpos");

			if (filtro != "") {

				var request = indexMtpos.getAll(filtro);

				request.onsuccess = function(event) {
					that.oVetorMateriais = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(that.oVetorMateriais);
					// that.getView().setModel(oModel, "materiaisCadastrados");

					console.log("Materiais carregados: mtpos: " + tipoPedido);
					resolve();
				};

			} else {
				objectStoreMaterial.getAll().onsuccess = function(event) {
					that.oVetorMateriais = event.target.result;

					var oModel = new sap.ui.model.json.JSONModel(that.oVetorMateriais);
					// that.getView().setModel(oModel, "materiaisCadastrados");
					resolve();
				};
			}
		},

		onCarregaMateriaisComPreco: function(db, tabPreco, vetorMateriais) {
			var vetorResultMateriais = [];
			var tabbri = this.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
			var tabamo = this.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
			var tabbon = this.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;

			var werks = this.getOwnerComponent().getModel("modelAux").getProperty("/Werks");
			var that = this;

			for (var i = 0; i < vetorMateriais.length; i++) {

				if (vetorMateriais[i].mtpos == "NORM") {

					var storeA960 = db.transaction("A960", "readwrite");
					var objA960 = storeA960.objectStore("A960");

					var idA960 = werks + "." + tabPreco + "." + vetorMateriais[i].matnr;
					var requesA960 = objA960.get(idA960);

					requesA960.onsuccess = function(e) {
						var oA960 = e.target.result;
						if (oA960 != undefined) {
							for (var j = 0; j < vetorMateriais.length; j++) {
								if (oA960.matnr == vetorMateriais[j].matnr) {
									vetorResultMateriais.push(vetorMateriais[j]);
									break;
								}
							}
						}
					};

				} else if (vetorMateriais[i].mtpos == "YAMO" || vetorMateriais[i].mtpos == "YBRI" || vetorMateriais[i].mtpos == "YBON") {
					var tabPrecoAB = "";

					if (vetorMateriais[i].mtpos == "YBRI") {
						tabPrecoAB = tabbri;
					} else if (vetorMateriais[i].mtpos == "YAMO") {
						tabPrecoAB = tabamo;
					} else if (vetorMateriais[i].mtpos == "YBON") {
						tabPrecoAB = tabbri;
					}

					storeA960 = db.transaction("A960", "readwrite");
					objA960 = storeA960.objectStore("A960");

					idA960 = werks + "." + tabPrecoAB + "." + vetorMateriais[i].matnr;
					var requesA963 = objA960.get(idA960);

					requesA963.onsuccess = function(e) {
						var oA960 = e.target.result;

						if (oA960 != undefined) {
							for (var j = 0; j < vetorMateriais.length; j++) {

								if (oA960.matnr == vetorMateriais[j].matnr) {
									vetorResultMateriais.push(vetorMateriais[j]);
									break;
								}
							}
						}
					};
				}
			}

			var oModel = new sap.ui.model.json.JSONModel(vetorResultMateriais);
			that.getView().setModel(oModel, "materiaisCadastrados");

		},
		/// EVENTOS CAMPOS							<<<<<<<<<<<<

		onChangeTipoPedido: function(evt) {

			//Toda vez tem que resetar a tabela de preço pra ativar novamente o evento e filtrar os materiais com preço.
			this.byId("idTabelaPreco").setSelectedKey();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", "");

			var that = this;
			var tipoPedido = "";
			var vetorAux = [];

			var oSource = evt.getSource();
			tipoPedido = oSource.getSelectedKey();

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoPedido", tipoPedido);

			this.onBloqueioFormaPagamento(tipoPedido);

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
					that.onCarregaMateriais(db, tipoPedido, resolve);
				});

			};
		},

		onBuscaGrupoCampanhaGlobal: function(db, oItem) {

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
			var that = this;
			var oSource = evt.getSource();
			var vetorResultMateriais = [];
			//PRECISA PREENCHER O TIPO DE PEDIDO ANTES, POIS O TIPO DE PEDIDO CARREGA OS MATERIAIS PARA CADA TIPO.
			//DEPOIS DISSO ESSE METODO IRÁ FILTRAR TODOS OS MATERIAIS COM PREÇO.

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

				var tipoPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");
				if (tipoPedido == "") {

					MessageBox.show("Selecione Tipo de pedido!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Pre-requisito!",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							oSource.setSelectedKey();
						}
					});

				} else {
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TabPreco", oSource.getSelectedKey());
					that.onCarregaMateriaisComPreco(db, oSource.getSelectedKey(), that.oVetorMateriais);
				}
			};
		},

		onChangeTipoTransporte: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TipoTransporte", oSource.getSelectedKey());
		},

		onChangeFormaPagamento: function(evt) {
			var oSource = evt.getSource();
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/FormaPagamento", oSource.getSelectedKey());
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
			this.byId("idFormaPagamento").setProperty("enabled", false);
			this.byId("idTipoTransporte").setProperty("enabled", false);

		},

		desbloquearCampos: function() {
			this.byId("idEstabelecimento").setProperty("enabled", true);
			this.byId("idTipoPedido").setProperty("enabled", true);
			this.byId("idVencimento1").setProperty("enabled", true);
			this.byId("idVencimento2").setProperty("enabled", true);
			this.byId("idVencimento3").setProperty("enabled", true);
			this.byId("idTabelaPreco").setProperty("enabled", true);
			this.byId("idFormaPagamento").setProperty("enabled", true);
			this.byId("idTipoTransporte").setProperty("enabled", true);

		},

		resetarCamposTela: function() {

			this.byId("idNumeroPedido").setValue("");
			this.byId("idSituacao").setValue("");
			this.byId("idDataPedido").setValue("");
			this.byId("idTipoPedido").setSelectedKey("");
			this.byId("idTipoNegociacao").setSelectedKey("");
			this.byId("idTabelaPreco").setSelectedKey("");
			this.byId("idFormaPagamento").setSelectedKey("");
			this.byId("idTipoTransporte").setSelectedKey("");
			// this.byId("idDataEntrega").setSelectedKey("");
			// this.byId("idLocalEntrega").setSelectedKey("");
			this.byId("idPrimeiraParcela").setValue("");
			this.byId("idQuantParcelas").setValue("");
			this.byId("idIntervaloParcelas").setValue("");
			this.byId("idValorMinimoPedido").setValue("");
			this.byId("idObservacoes").setText("");

		},

		onNavBack: function() {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", "");
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
			var tipoPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");

			var tabbri = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
			var tabamo = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
			var tabbon = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;

			var vetorAuxFamilias = [];
			var vetorAuxFamiliasExtra = [];

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

							that.oItemPedido.zzQnt = 1;
							that.oItemPedido.matnr = oMaterial.matnr;
							that.oItemPedido.maktx = oMaterial.maktx;
							that.oItemPedido.ntgew = parseFloat(oMaterial.ntgew);
							that.oItemPedido.aumng = parseInt(oMaterial.aumng, 10);
							that.oItemPedido.zzValExcedidoItem = 0;
							that.oItemPedido.kbetr = 0;
							that.oItemPedido.maxdescpermitido = 0;
							that.oItemPedido.maxdescpermitidoExtra = 0;
							that.oItemPedido.mtpos = oMaterial.mtpos;
							that.oItemPedido.knumh = 0;
							that.oItemPedido.zzRegra = 0;
							that.oItemPedido.zzGrpmat = 0;
							that.oItemPedido.knumhExtra = 0;
							that.oItemPedido.zzRegraExtra = 0;
							that.oItemPedido.zzGrpmatExtra = 0;
							that.oItemPedido.tipoItem = "Normal";
							that.oItemPedido.tipoItem2 = "Normal";
							that.oItemPedido.zzQntDiluicao = 0;
							that.oItemPedido.zzValorDiluido = 0;
							that.oItemPedido.zzPercDescDiluicao = 0;
							that.oItemPedido.zzVprodABB = 0;

							//VALOR DO ITEM QUE VAI SER DILUIDO , PARA JOGAR O VALOR DIRETAMENTE NO ITEM.
							that.oItemPedido.zzValorDiluido = 0;

							//Busca o preço do item
							var storeA960 = db.transaction("A960", "readwrite");
							var objA960 = storeA960.objectStore("A960");

							var idA960 = werks + "." + tabPreco + "." + oMaterial.matnr;

							var requesA960 = objA960.get(idA960);

							requesA960.onsuccess = function(e) {
								var oA960 = e.target.result;

								//validação feita para ver preço de brinde e amostra de acordo com uma tabela fixa cadastrado no login do usuário
								if (oA960 == undefined && that.oItemPedido.mtpos != "NORM") {

									oPanel.setBusy(false);

									sap.ui.getCore().byId("idItemPedido").setValue("");

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

									if (that.oItemPedido.mtpos == "YBRI" || that.oItemPedido.mtpos == "YAMO" || that.oItemPedido.mtpos == "YBON") {

										var tabPrecoAB = "";

										if (that.oItemPedido.mtpos == "YBRI") {

											tabPrecoAB = tabbri;

										} else if (that.oItemPedido.mtpos == "YAMO") {

											tabPrecoAB = tabamo;

										} else if (that.oItemPedido.mtpos == "YBON") {

											tabPrecoAB = tabbon;

										}

										storeA960 = db.transaction("A960", "readwrite");
										objA960 = storeA960.objectStore("A960");

										idA960 = werks + "." + tabPrecoAB + "." + oMaterial.matnr;

										requesA960 = objA960.get(idA960);

										requesA960.onsuccess = function(e) {
											var oA960AB = e.target.result;

											if (oA960AB.zzPervm !== "" || oA960AB.zzPervm !== undefined) {
												oA960AB.zzPervm = parseFloat(oA960AB.zzPervm);
											}
											if (oA960AB.zzPercom !== "" || oA960AB.zzPercom !== undefined) {
												oA960AB.zzPercom = parseFloat(oA960AB.zzPercom);
											}
											if (oA960AB.zzVprod !== "" || oA960AB.zzVprod !== undefined) {
												oA960AB.zzVprod = parseFloat(oA960AB.zzVprod);
											}

											// Desconto Extra aplicado depois do dento digitado no item
											that.oItemPedido.zzPervm = oA960AB.zzPervm; //Verba
											that.oItemPedido.zzPercom = oA960AB.zzPercom; //Comissão
											that.oItemPedido.zzVprod = oA960AB.zzVprod;
										};

									} else {

										//Pega os preços quando o mtpos for NORM
										if (oA960.zzPervm !== "" || oA960.zzPervm !== undefined) {
											oA960.zzPervm = parseFloat(oA960.zzPervm);
										}

										if (oA960.zzPercom !== "" || oA960.zzPercom !== undefined) {
											oA960.zzPercom = parseFloat(oA960.zzPercom);
										}

										if (oA960.zzVprod !== "" || oA960.zzVprod !== undefined) {
											oA960.zzVprod = parseFloat(oA960.zzVprod);

											// Desconto Extra aplicado depois do dento digitado no item
											that.oItemPedido.zzPervm = oA960.zzPervm; //Verba
											that.oItemPedido.zzPercom = oA960.zzPercom; //Comissão
											that.oItemPedido.zzVprod = oA960.zzVprod;
										}
									}

									that.oItemPedido.knumh = 0; //Desconto familia
									that.oItemPedido.zzDesext = 0;
									that.oItemPedido.zzDesitem = 0;
									that.oItemPedido.zzVprodMinPermitido = 0;
									//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA O DESCONTO DE DILUIÇÃO
									that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;
									//De inicio atribuir zzVprodDesc2 COM O VALOR CHEIO. DAI DIRECIONAR PARA O DESCONTO DE NORMAL
									that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

									var vetorAuxFamilias = [];
									var vetorAuxFamiliasExtra = [];
									//Buscando informações da FAMILIA de desconto normal
									var objA965 = db.transaction("A965").objectStore("A965");
									objA965.openCursor().onsuccess = function(event) {

										var cursor = event.target.result;

										if (cursor) {
											if (cursor.value.matnr === that.oItemPedido.matnr && cursor.value.werks === werks) {

												vetorAuxFamilias.push(cursor.value);
												console.log("Familia: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
											}

											cursor.continue();

										} else {

											var objA966 = db.transaction("A966").objectStore("A966");
											objA966.openCursor().onsuccess = function(event2) {
												var cursor2 = event2.target.result;

												if (cursor2) {
													for (var i = 0; i < vetorAuxFamilias.length; i++) {

														if (cursor2.value.zzGrpmat === vetorAuxFamilias[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

															that.oItemPedido.zzGrpmat = cursor2.value.zzGrpmat; //Código Familia
															that.oItemPedido.zzRegra = cursor2.value.zzRegra; //Grupo de preço 
															console.log("Grupo de Preço:" + that.oItemPedido.zzRegra + " do grupo da familia: " + cursor2.value.zzGrpmat);
														}
													}
													cursor2.continue();

												} else {

													var objA967 = db.transaction("A967").objectStore("A967");
													objA967.openCursor().onsuccess = function(event3) {
														var cursorA967 = event3.target.result;

														if (cursorA967) {

															if (cursorA967.value.zzRegra === that.oItemPedido.zzRegra) {

																that.oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																console.log("Registro de condição :" + that.oItemPedido.knumh);
															}

															cursorA967.continue();

														} else {

															//Buscando Familia de desconto extra

															var objA962 = db.transaction("A962").objectStore("A962");
															objA962.openCursor().onsuccess = function(event) {

																var cursor = event.target.result;

																if (cursor) {
																	if (cursor.value.matnr === that.oItemPedido.matnr && cursor.value.werks === werks) {

																		vetorAuxFamiliasExtra.push(cursor.value);
																		console.log("Familia Extra: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
																	}

																	cursor.continue();

																} else {

																	var objA968 = db.transaction("A968").objectStore("A968");
																	objA968.openCursor().onsuccess = function(event2) {
																		cursor2 = event2.target.result;

																		if (cursor2) {
																			for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																				if (cursor2.value.zzGrpmat === vetorAuxFamiliasExtra[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																					that.oItemPedido.zzGrpmatExtra = cursor2.value.zzGrpmat; //Código Familia Extra
																					that.oItemPedido.zzRegraExtra = cursor2.value.zzRegra; //Grupo de preço Extra
																					console.log("Grupo de Preço Extra:" + that.oItemPedido.zzRegraExtra + " do grupo da familia Extra: " +
																						that.oItemPedido.zzGrpmatExtra);
																				}
																			}
																			cursor2.continue();

																		} else {

																			var objA969 = db.transaction("A969").objectStore("A969");
																			objA969.openCursor().onsuccess = function(event3) {
																				var cursorA969 = event3.target.result;

																				if (cursorA969) {

																					if (cursorA969.value.zzRegra === that.oItemPedido.zzRegraExtra) {

																						that.oItemPedido.knumhExtra = cursorA969.value.knumh; // Registro de condição 

																						console.log("Registro de condição :" + that.oItemPedido.knumhExtra);
																					}

																					cursorA969.continue();

																				} else {
																					var auxRangeQuant = 0;
																					var objKonm = db.transaction("Konm").objectStore("Konm");
																					objKonm.openCursor().onsuccess = function(event2) {
																						var cursor3 = event2.target.result;

																						if (cursor3) {

																							if (cursor3.value.knumh === that.oItemPedido.knumh && auxRangeQuant < parseFloat(cursor3.value.kbetr)) {

																								auxRangeQuant = parseFloat(cursor3.value.kbetr); //Desconto total a aplicar

																							}

																							cursor3.continue();

																						} else {

																							that.oItemPedido.kbetr = auxRangeQuant;
																							console.log("Percentual de Desconto Permitido: " + that.oItemPedido.kbetr);

																							if (that.oItemPedido.mtpos == "YBRI") {

																								var tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
																								var idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;

																							} else if (that.oItemPedido.mtpos == "YAMO") {

																								tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
																								idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;

																							}

																							if (tipoPedido == "YBON") {

																								if (that.oItemPedido.mtpos == "NORM") {
																									tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;
																									idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;
																								}

																							} else {
																								idA960ABB = 0;
																							}

																							//verificação para definir o preço do brinde / amostra / bonificação para efeito de nota
																							var storeoA960ABB = db.transaction("A960", "readwrite");
																							var objA960ABB = storeoA960ABB.objectStore("A960");

																							var requesA960ABB = objA960ABB.get(idA960ABB);

																							requesA960ABB.onsuccess = function(e) {
																								var oA960ABB = e.target.result;

																								if (oA960ABB == undefined) {

																									that.oItemPedido.zzVprodABB = 0;
																									that.calculaPrecoItem();
																									that.popularCamposItemPedido();
																									sap.ui.getCore().byId("idQuantidade").focus();
																									oPanel.setBusy(false);

																								} else {

																									that.oItemPedido.zzVprodABB = parseFloat(oA960ABB.zzVprod);
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
							};
						}
					};
				} else {
					oPanel.setBusy(false);
					that.onResetaCamposDialog();
				}
			};
		},

		onCriarIndexItemPedido: function() {
			var that = this;

			//Define o index do produto a ser inserido
			for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
				if (i === 0) {
					var aux = that.objItensPedidoTemplate[i].idItemPedido.split("/");
					that.indexItem = parseInt(aux[1]);

				} else if (i > 0) {
					aux = that.objItensPedidoTemplate[i].idItemPedido.split("/");

					if (that.indexItem < parseInt(aux[1])) {
						that.indexItem = parseInt(aux[1]);

					}
				}
			}
			if (that.objItensPedidoTemplate.length === 0) {
				that.indexItem = 1;
			} else {
				that.indexItem += 1;
			}

			return that.indexItem;
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
			var tipoPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");
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

							that.oItemPedido.zzQnt = 1;
							that.oItemPedido.matnr = oMaterial.matnr;
							that.oItemPedido.maktx = oMaterial.maktx;
							that.oItemPedido.mtpos = oMaterial.mtpos;
							that.oItemPedido.ntgew = oMaterial.ntgew;
							that.oItemPedido.aumng = parseInt(oMaterial.aumng, 10);
							that.oItemPedido.knumh = 0;
							that.oItemPedido.zzRegra = 0;
							that.oItemPedido.zzGrpmat = 0;
							that.oItemPedido.knumhExtra = 0;
							that.oItemPedido.zzRegraExtra = 0;
							that.oItemPedido.zzGrpmatExtra = 0;
							that.oItemPedido.zzPercDescDiluicao = 0;

							for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
								if (that.objItensPedidoTemplate[i].matnr === codItem && that.objItensPedidoTemplate[i].tipoItem === "Normal") {

									objAuxItem = {
										idItemPedido: "",
										index: "",
										knumh: that.objItensPedidoTemplate[i].knumh,
										zzGrpmat: that.objItensPedidoTemplate[i].zzGrpmat,
										zzRegra: that.objItensPedidoTemplate[i].zzRegra,
										knumhExtra: that.objItensPedidoTemplate[i].knumhExtra,
										zzGrpmatExtra: that.objItensPedidoTemplate[i].zzGrpmatExtra,
										zzRegraExtra: that.objItensPedidoTemplate[i].zzRegraExtra,
										maktx: that.objItensPedidoTemplate[i].maktx,
										mtpos: that.objItensPedidoTemplate[i].mtpos,
										matnr: that.objItensPedidoTemplate[i].matnr,
										nrPedCli: that.objItensPedidoTemplate[i].nrPedCli,
										tipoItem: that.objItensPedidoTemplate[i].tipoItem,
										zzDesext: that.objItensPedidoTemplate[i].zzDesext,
										zzDesitem: that.objItensPedidoTemplate[i].zzDesitem,
										zzPercom: that.objItensPedidoTemplate[i].zzPercom,
										zzPervm: that.objItensPedidoTemplate[i].zzPervm,
										zzQnt: that.objItensPedidoTemplate[i].zzQnt,
										zzVprod: that.objItensPedidoTemplate[i].zzVprod,
										zzVprodDesc: that.objItensPedidoTemplate[i].zzVprodDesc,
										zzVprodDescTotal: that.objItensPedidoTemplate[i].zzVprodDescTotal,
										zzPercDescTotal: that.objItensPedidoTemplate[i].zzPercDescTotal,
										zzVprodMinPermitido: 0,
										ntgew: that.objItensPedidoTemplate[i].ntgew,
										//Desconto normal. *****
										zzVprodDesc2: that.objItensPedidoTemplate[i].zzVprodDesc,
										tipoItem2: "Diluicao",
										zzQntDiluicao: 0,
										zzValorDiluido: 0,
										zzVprodABB: 0
									};

									itemEncontradoDiluicao = true;
								}
							}

							//REGRA DILUIÇÃO - > SENÃO EXISTIR ITEM NA GRID  .. ACHAR O VALOR MINIMO DO ITEM
							var storeA960 = db.transaction("A960", "readwrite");
							var objA960 = storeA960.objectStore("A960");

							var idA960 = werks + "." + tabPreco + "." + oMaterial.matnr;

							var requesA960 = objA960.get(idA960);

							requesA960.onsuccess = function(e) {
								var oA960 = e.target.result;

								if (oA960 == undefined) {
									oPanel.setBusy(false);

									sap.ui.getCore().byId("idItemPedido").setValue("");

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
									that.oItemPedido.zzDesext = 0;
									that.oItemPedido.zzPervm = oA960.zzPervm; //Verba
									that.oItemPedido.zzPercom = oA960.zzPercom; //Comissão
									that.oItemPedido.zzVprod = oA960.zzVprod;
									that.oItemPedido.knumh = 0;
									that.oItemPedido.zzRegra = 0;
									that.oItemPedido.zzGrpmat = 0;

									that.oItemPedido.knumhExtra = 0;
									that.oItemPedido.zzRegraExtra = 0;
									that.oItemPedido.zzGrpmatExtra = 0;

									that.oItemPedido.zzDesitem = 0;
									that.oItemPedido.zzPercDescTotal = 0;
									that.oItemPedido.zzVprodMinPermitido = 0;
									that.oItemPedido.tipoItem = "Diluicao";

									//De inicio atribuir zzVprodDesc COM O VALOR CHEIO. DAI DIRECIONAR PARA OS DESCONTOS
									that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;

									//Desconto normal. *****
									that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

									that.oItemPedido.tipoItem2 = "Diluicao";
									that.oItemPedido.zzQntDiluicao = 0;
									that.oItemPedido.zzValorDiluido = 0;

									var vetorAuxFamilias = [];
									var vetorAuxFamiliasExtra = [];
									var objA965 = db.transaction("A965").objectStore("A965");
									objA965.openCursor().onsuccess = function(event) {

										var cursor = event.target.result;

										if (cursor) {
											if (cursor.value.matnr === that.oItemPedido.matnr && cursor.value.werks === werks) {

												vetorAuxFamilias.push(cursor.value);
												console.log("Familia: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
											}

											cursor.continue();

										} else {

											var objA966 = db.transaction("A966").objectStore("A966");
											objA966.openCursor().onsuccess = function(event2) {
												var cursor2 = event2.target.result;

												if (cursor2) {
													for (var i = 0; i < vetorAuxFamilias.length; i++) {

														if (cursor2.value.zzGrpmat === vetorAuxFamilias[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

															that.oItemPedido.zzGrpmat = cursor2.value.zzGrpmat; //Código Familia
															that.oItemPedido.zzRegra = cursor2.value.zzRegra; //Grupo de preço 
															console.log("Grupo de Preço:" + that.oItemPedido.zzRegra + " do grupo da familia: " + cursor2.value.zzGrpmat);
														}
													}
													cursor2.continue();

												} else {
													// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
													var objA967 = db.transaction("A967").objectStore("A967");
													objA967.openCursor().onsuccess = function(event3) {
														var cursorA967 = event3.target.result;

														if (cursorA967) {

															if (cursorA967.value.zzRegra === that.oItemPedido.zzRegra) {

																that.oItemPedido.knumh = cursorA967.value.knumh; // Registro de condição 

																console.log("Registro de condição :" + that.oItemPedido.knumh);
															}

															cursorA967.continue();

														} else {

															var auxRangeQuant = 0;
															var objKonm = db.transaction("Konm").objectStore("Konm");
															objKonm.openCursor().onsuccess = function(event2) {
																var cursor3 = event2.target.result;

																if (cursor3) {

																	if (cursor3.value.knumh === that.oItemPedido.knumh && auxRangeQuant < parseFloat(cursor3.value.kbetr)) {

																		auxRangeQuant = parseFloat(cursor3.value.kbetr); //Desconto total a aplicar

																	}

																	cursor3.continue();

																} else {

																	that.oItemPedido.kbetr = auxRangeQuant;
																	console.log("Percentual de Desconto Permitido: " + that.oItemPedido.kbetr);

																	//Buscando Familia de desconto extra

																	var objA962 = db.transaction("A962").objectStore("A962");
																	objA962.openCursor().onsuccess = function(event) {

																		var cursor = event.target.result;

																		if (cursor) {
																			if (cursor.value.matnr === that.oItemPedido.matnr && cursor.value.werks === werks) {

																				vetorAuxFamiliasExtra.push(cursor.value);
																				console.log("Familia Extra: " + cursor.value.zzGrpmat + " para o Item: " + cursor.value.matnr);
																			}

																			cursor.continue();

																		} else {

																			var objA968 = db.transaction("A968").objectStore("A968");
																			objA968.openCursor().onsuccess = function(event2) {
																				cursor2 = event2.target.result;

																				if (cursor2) {
																					for (i = 0; i < vetorAuxFamiliasExtra.length; i++) {

																						if (cursor2.value.zzGrpmat === vetorAuxFamiliasExtra[i].zzGrpmat && cursor2.value.pltyp === tabPreco) {

																							that.oItemPedido.zzGrpmatExtra = cursor2.value.zzGrpmat; //Código Familia Extra
																							that.oItemPedido.zzRegraExtra = cursor2.value.zzRegra; //Grupo de preço Extra
																							console.log("Grupo de Preço Extra:" + that.oItemPedido.zzRegraExtra + " do grupo da familia Extra: " +
																								that.oItemPedido.zzGrpmatExtra);
																						}
																					}
																					cursor2.continue();

																				} else {

																					var objA969 = db.transaction("A969").objectStore("A969");
																					objA969.openCursor().onsuccess = function(event3) {
																						var cursorA969 = event3.target.result;

																						if (cursorA969) {

																							if (cursorA969.value.zzRegra === that.oItemPedido.zzRegraExtra) {

																								that.oItemPedido.knumhExtra = cursorA969.value.knumh; // Registro de condição 

																								console.log("Registro de condição :" + that.oItemPedido.knumhExtra);
																							}

																							cursorA969.continue();

																						} else {

																							if (that.oItemPedido.mtpos == "YBRI") {

																								var tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbri;
																								var idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;

																							} else if (that.oItemPedido.mtpos == "YAMO") {

																								tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabamo;
																								idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;

																							}

																							if (tipoPedido == "YBON") {

																								if (that.oItemPedido.mtpos == "NORM") {

																									tabPreco2 = that.getOwnerComponent().getModel("modelAux").getProperty("/Usuario").tabbon;
																									idA960ABB = werks + "." + tabPreco2 + "." + oMaterial.matnr;

																								}
																							} else {
																								idA960ABB = 0;
																							}

																							//verificação para definir o preço do brinde / amostra / bonificação para efeito de nota
																							var storeoA960ABB = db.transaction("A960", "readwrite");
																							var objA960ABB = storeoA960ABB.objectStore("A960");

																							var requesA960ABB = objA960ABB.get(idA960ABB);

																							requesA960ABB.onsuccess = function(e) {
																								var oA960ABB = e.target.result;

																								if (oA960ABB == undefined) {

																									that.oItemPedido.zzVprodABB = 0;
																									that.calculaPrecoItem();
																									that.popularCamposItemPedido();

																									sap.ui.getCore().byId("idQuantidade").focus();
																									oPanel.setBusy(false);

																								} else {

																									that.oItemPedido.zzVprodABB = parseFloat(oA960ABB.zzVprod);
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
							};
						}
					};
				}
			};
		},

		onResetaCamposDialog: function() {
			var that = this;

			that.oItemPedido = [];
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

						sap.ui.getCore().byId("idItemPedido").setValue("");

						MessageBox.show("Não existe o produto: " + sap.ui.getCore().byId("idItemPedido").getValue(), {
							icon: MessageBox.Icon.ERROR,
							title: "Produto não encontrado.",
							actions: [MessageBox.Action.YES],
							onClose: function() {
								that.onResetaCamposDialog();
								// sap.ui.getCore().byId("idItemPedido").focus();
							}
						});

					} else {
						var quantidade = sap.ui.getCore().byId("idQuantidade").getValue();

						if (sap.ui.getCore().byId("idQuantidade").getValue() > 0) {

							that.oItemPedido.zzQnt = parseInt(quantidade);
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
			var that = this;

			var desconto = sap.ui.getCore().byId("idDesconto").getValue();
			if (desconto === "") {
				desconto = 0;
			}

			if (desconto >= 0) {

				that.oItemPedido.zzDesitem = parseFloat(desconto);
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
			var that = this;

			that.oItemPedido.zzPercDescTotal = 0;
			var tipoPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");

			//Preço cheio sem descontos
			if (that.oItemPedido.mtpos == "YBRI" || that.oItemPedido.mtpos == "YAMO" || tipoPedido == "YTRO") {

				that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;
				that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

			} else if (tipoPedido == "YBON") {

				that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod - (that.oItemPedido.zzVprod * that.oItemPedido.kbetr / 100);
				that.oItemPedido.zzPercDescTotal = that.oItemPedido.kbetr;
				that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

			} else if (that.oItemPedido.tipoItem === "Diluicao" && that.oItemPedido.kbetr >= 0) {

				that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod - (that.oItemPedido.zzVprod * that.oItemPedido.kbetr / 100);
				that.oItemPedido.zzPercDescTotal = that.oItemPedido.kbetr;

				that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;
				that.oItemPedido.zzQntDiluicao = that.oItemPedido.zzQnt;
				that.oItemPedido.zzValorDiluido = that.oItemPedido.zzQnt * that.oItemPedido.zzVprodDesc;

			} else {

				//Inicialmente o valor cheio do produto é atribuido para o valor com desconto.
				// 1º Aplicar - Preco Cheio do produto - tabela (avista -5%) a prazo sem desconto.
				//Senão for desconto avista, criar o campo zzPercDescTotal do item do pedido com desconto zerado. 
				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

					that.oItemPedido.zzVprodDesc = (that.oItemPedido.zzVprod) - ((that.oItemPedido.zzVprod) * (5 / 100));
					//Desconto normal. *****
					that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

				} else if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {

					that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;
					//Desconto normal. *****
					that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

				}

				//2º Aplicar o Desconto digitado na tela de digitação dos itens
				that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc - (that.oItemPedido.zzVprodDesc) * (that.oItemPedido.zzDesitem / 100);

				//Desconto normal. *****
				that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

				// 3º Aplicar o desconto extra do item cadastrado na tabela (TabPrecoItem - zzDesext).
				// that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc - ((that.oItemPedido.zzVprodDesc) * (that.oItemPedido.zzDesext / 100));
				// that.oItemPedido.zzVprodDesc = Math.round(parseFloat(that.oItemPedido.zzVprodDesc * 100)) / 100;

				//SOMA TODOS OS DESCONTOS APLICADO NOS ITENS.
				that.oItemPedido.zzPercDescTotal += that.oItemPedido.zzDesitem;
				that.oItemPedido.zzQntDiluicao = 0;
				that.oItemPedido.zzValorDiluido = 0;
			}

			that.oItemPedido.zzVprodDescTotal = that.oItemPedido.zzVprodDesc * that.oItemPedido.zzQnt;
			that.oItemPedido.zzVprodDescTotal = Math.round(parseFloat(that.oItemPedido.zzVprodDescTotal * 100)) / 100;

			// if (that.oItemPedido.mtpos != "YAMO") {
			// 	if (that.oItemPedido.tipoItem === "Diluicao" && that.oItemPedido.kbetr >= 0) {

			// 		that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod - (that.oItemPedido.zzVprod * that.oItemPedido.kbetr / 100);
			// 		that.oItemPedido.zzPercDescTotal = that.oItemPedido.kbetr;

			// 		that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;
			// 		that.oItemPedido.zzQntDiluicao = that.oItemPedido.zzQnt;
			// 		that.oItemPedido.zzValorDiluido = that.oItemPedido.zzQnt * that.oItemPedido.zzVprodDesc;

			// 	} else if (that.oItemPedido.tipoItem === "Diluicao") {

			// 		that.oItemPedido.zzQntDiluicao = that.oItemPedido.zzQnt;
			// 		that.oItemPedido.zzValorDiluido = that.oItemPedido.zzQnt * that.oItemPedido.zzVprodDesc;

			// 	} else if(that.oItemPedido.mtpos == "YBRI" || that.oItemPedido.mtpos == "YTRO" || that.oItemPedido.mtpos == "YAMO"){

			// 		that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;
			// 		that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

			// 	} else if (tipoPedido == "YBON"){

			// 		that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod - (that.oItemPedido.zzVprod * that.oItemPedido.kbetr / 100);
			// 		that.oItemPedido.zzPercDescTotal = that.oItemPedido.kbetr;
			// 		that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

			// 	} else {

			// 		//Inicialmente o valor cheio do produto é atribuido para o valor com desconto.
			// 		// 1º Aplicar - Preco Cheio do produto - tabela (avista -5%) a prazo sem desconto.
			// 		//Senão for desconto avista, criar o campo zzPercDescTotal do item do pedido com desconto zerado. 
			// 		if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

			// 			that.oItemPedido.zzVprodDesc = (that.oItemPedido.zzVprod) - ((that.oItemPedido.zzVprod) * (5 / 100));
			// 			//Desconto normal. *****
			// 			that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

			// 		} else if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "02") {

			// 			that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprod;
			// 			//Desconto normal. *****
			// 			that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprod;

			// 		}

			// 		//2º Aplicar o Desconto digitado na tela de digitação dos itens
			// 		that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc - (that.oItemPedido.zzVprodDesc) * (that.oItemPedido.zzDesitem / 100);

			// 		//Desconto normal. *****
			// 		that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;

			// 		// 3º Aplicar o desconto extra do item cadastrado na tabela (TabPrecoItem - zzDesext).
			// 		// that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc - ((that.oItemPedido.zzVprodDesc) * (that.oItemPedido.zzDesext / 100));
			// 		// that.oItemPedido.zzVprodDesc = Math.round(parseFloat(that.oItemPedido.zzVprodDesc * 100)) / 100;

			// 		//SOMA TODOS OS DESCONTOS APLICADO NOS ITENS.
			// 		that.oItemPedido.zzPercDescTotal += that.oItemPedido.zzDesitem;
			// 		that.oItemPedido.zzQntDiluicao = 0;
			// 		that.oItemPedido.zzValorDiluido = 0;
			// 	}
			// }

			//calcula a multiplicação pela quantidade depois que o valor unitário está calculado.
			// that.oItemPedido.zzVprodDescTotal = that.oItemPedido.zzVprodDesc * that.oItemPedido.zzQnt;
			// that.oItemPedido.zzVprodDescTotal = Math.round(parseFloat(that.oItemPedido.zzVprodDescTotal * 100)) / 100;

			// that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc;

			// //Desconto normal. *****
			// that.oItemPedido.zzVprodDesc2 = that.oItemPedido.zzVprodDesc;
		},

		calculaTotalPedido: function() {
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
			var totalComissaoUtilizada = 0;
			var totalExcedenteDescontos = 0;
			var valorTotalAcresPrazoMed = 0;
			var valorTotalAcresBonif = 0;
			var valorTotalAcresAmostra = 0;
			var valorTotalAcresBrinde = 0;
			var valorNaoDirecionadoDesconto = 0;
			var valorNaoDirecionadoPrazoMed = 0;
			var valorNaoDirecionadoAmostra = 0;
			var valorNaoDirecionadoBrinde = 0;
			var valorNaoDirecionadoBonificacao = 0;
			var existeParcelas = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ExisteEntradaPedido");
			var valorEntradaPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido");
			var percEntradaPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido");
			var quantidadeParcelas = parseInt(this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/QuantParcelas"));
			var tipoPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");
			var totalExcedenteDescontosDiluicao = 0;

			//Valores utilizados para abater de verbas e comissões.
			var verbaUtilizadaDesconto = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto");
			if (verbaUtilizadaDesconto === "") {
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", 0);
			} else {
				verbaUtilizadaDesconto = parseFloat(verbaUtilizadaDesconto);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", verbaUtilizadaDesconto);
			}

			var comissaoUtilizadaDesconto = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoUtilizadaDesconto");
			if (comissaoUtilizadaDesconto === "") {
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", 0);
			} else {
				comissaoUtilizadaDesconto = parseFloat(comissaoUtilizadaDesconto);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", comissaoUtilizadaDesconto);
			}

			var comissaoUtilizadaPrazoMed = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoPrazoMed");
			if (comissaoUtilizadaPrazoMed === "") {

				comissaoUtilizadaPrazoMed = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", 0);

			} else {

				comissaoUtilizadaPrazoMed = parseFloat(comissaoUtilizadaPrazoMed);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", comissaoUtilizadaPrazoMed);
			}

			var valUtilizadoVerbaPrazoMed = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaPrazoMed");
			if (valUtilizadoVerbaPrazoMed === "") {

				valUtilizadoVerbaPrazoMed = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", 0);
			} else {

				valUtilizadoVerbaPrazoMed = parseFloat(valUtilizadoVerbaPrazoMed);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", valUtilizadoVerbaPrazoMed);
			}

			var valUtilizadoVerbaBrinde = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBrinde");
			if (comissaoUtilizadaDesconto === "") {

				valUtilizadoVerbaBrinde = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else {

				valUtilizadoVerbaBrinde = parseFloat(valUtilizadoVerbaBrinde);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", valUtilizadoVerbaBrinde);
			}

			var valUtilizadoComissaoBrinde = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBrinde");
			if (valUtilizadoComissaoBrinde === "") {

				valUtilizadoComissaoBrinde = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", 0);

			} else {

				valUtilizadoComissaoBrinde = parseFloat(valUtilizadoComissaoBrinde);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", valUtilizadoComissaoBrinde);
			}

			var valTotalExcedenteBrinde = 0;
			// parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBrinde"));
			// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBrinde", valTotalExcedenteBrinde.toFixed(2));

			var valUtilizadoVerbaAmostra = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaAmostra");
			if (valUtilizadoVerbaAmostra === "") {

				valUtilizadoVerbaAmostra = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", 0);
			} else {

				valUtilizadoVerbaAmostra = parseFloat(valUtilizadoVerbaAmostra);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", valUtilizadoVerbaAmostra);

			}

			var valUtilizadoComissaoAmostra = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoAmostra");
			if (valUtilizadoComissaoAmostra === "") {

				valUtilizadoComissaoAmostra = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", 0);

			} else {

				valUtilizadoComissaoAmostra = parseFloat(valUtilizadoComissaoAmostra);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", valUtilizadoComissaoAmostra);

			}

			var valTotalExcedenteAmostra = 0;
			// valTotalExcedenteAmostra = parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteAmostra"));
			// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteAmostra", valTotalExcedenteAmostra.toFixed(2));

			var valUtilizadoVerbaBonif = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBonif");
			if (valUtilizadoVerbaBonif === "") {

				valUtilizadoVerbaBonif = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", 0);
			} else {

				valUtilizadoVerbaBonif = parseFloat(valUtilizadoVerbaBonif);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", valUtilizadoVerbaBonif);
			}

			var valUtilizadoComissaoBonif = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBonif");
			if (valUtilizadoComissaoBonif === "") {

				valUtilizadoComissaoBonif = 0;
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", 0);
			} else {

				valUtilizadoComissaoBonif = parseFloat(valUtilizadoComissaoBonif);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", valUtilizadoComissaoBonif);
			}

			var valTotalExcedenteBonif = 0;
			// valTotalExcedenteBonif = parseFloat(that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"));
			// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", valTotalExcedenteBonif.toFixed(2));

			for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
				//VALORES EM COMUM PARA TODOS OS TIPOS DE ITEM
				TotalPedidoDesc += that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt;
				Total += that.objItensPedidoTemplate[i].zzVprod * that.objItensPedidoTemplate[i].zzQnt;
				Qnt += that.objItensPedidoTemplate[i].zzQnt;
				QntProdutos += 1;

				if (that.objItensPedidoTemplate[i].ntgew > 0) {
					Ntgew += that.objItensPedidoTemplate[i].ntgew * that.objItensPedidoTemplate[i].zzQnt;
				}

				// >>>>>>>>>>>> PADRÃO PARA AMBOS OS TIPOS DE ITEM (NORMAL / DILUÍDO) >>>>>>>>>>>>

				if (that.objItensPedidoTemplate[i].mtpos == "YBRI") {

					valTotalExcedenteBrinde += that.objItensPedidoTemplate[i].zzVprodDesc2 * that.objItensPedidoTemplate[i].zzQnt;

				} else if (that.objItensPedidoTemplate[i].mtpos == "YAMO") {

					valTotalExcedenteAmostra += that.objItensPedidoTemplate[i].zzVprodDesc2 * that.objItensPedidoTemplate[i].zzQnt;

				} else if (that.objItensPedidoTemplate[i].mtpos == "NORM") {

					if (tipoPedido == "YBON" || tipoPedido == "YTRO") {

						valTotalExcedenteBonif += that.objItensPedidoTemplate[i].zzVprodDesc2 * that.objItensPedidoTemplate[i].zzQnt;

					} else {
						if (that.objItensPedidoTemplate[i].tipoItem == "Normal") {

							if (that.objItensPedidoTemplate[i].tipoItem2 == "Normal") {
								//VALOR DE COMISSÃO GERADA NO PEDIDO
								totalComissaoGerada += that.objItensPedidoTemplate[i].zzVprodDesc2 * (that.objItensPedidoTemplate[i].zzPercom / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

								//VALOR DE VERBA GERADA NO PEDIDO
								totalVerbaGerada += that.objItensPedidoTemplate[i].zzVprodDesc2 * (that.objItensPedidoTemplate[i].zzPervm / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

								//Calculo do acréscimo de prazo médio .
								percAcresPrazoMed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercExcedentePrazoMed");
								valorTotalAcresPrazoMed += parseFloat(that.objItensPedidoTemplate[i].zzVprodDesc2 * (percAcresPrazoMed / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao));

								//calculo do desconto total retirando excluindo total diluido pra ele
								var valorExcedido = Math.round((that.objItensPedidoTemplate[i].zzVprodDesc2 - that.objItensPedidoTemplate[i].zzVprodMinPermitido) * 100) / 100;
								that.objItensPedidoTemplate[i].zzValExcedidoItem = valorExcedido;

								if (that.objItensPedidoTemplate[i].zzValExcedidoItem < 0) {
									//Negatvo .. excedeu o valor.
									console.log("Produto: " + that.objItensPedidoTemplate[i].matnr + " excedeu: " + that.objItensPedidoTemplate[i].zzValExcedidoItem);
									totalExcedenteDescontos += that.objItensPedidoTemplate[i].zzValExcedidoItem * that.objItensPedidoTemplate[i].zzQnt;
								}

							} else if (that.objItensPedidoTemplate[i].tipoItem2 == "Diluicao") {
								//VALOR DE COMISSÃO GERADA NO PEDIDO
								totalComissaoGerada += that.objItensPedidoTemplate[i].zzVprodDesc * (that.objItensPedidoTemplate[i].zzPercom / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

								//VALOR DE VERBA GERADA NO PEDIDO
								totalVerbaGerada += that.objItensPedidoTemplate[i].zzVprodDesc * (that.objItensPedidoTemplate[i].zzPervm / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

							}

						} else if (that.objItensPedidoTemplate[i].tipoItem == "Diluido") {

							// totalExcedenteDescontosDiluicao += that.objItensPedidoTemplate[i].zzValorDiluido;
							//Soma o valor excedido de diluição no desconto de bonificação
							valTotalExcedenteBonif += that.objItensPedidoTemplate[i].zzValorDiluido;

							if (that.objItensPedidoTemplate[i].tipoItem2 == "Normal") {

								//VALOR DE COMISSÃO GERADA NO PEDIDO
								totalComissaoGerada += that.objItensPedidoTemplate[i].zzVprodDesc2 * (that.objItensPedidoTemplate[i].zzPercom / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

								//VALOR DE VERBA GERADA NO PEDIDO
								totalVerbaGerada += that.objItensPedidoTemplate[i].zzVprodDesc2 * (that.objItensPedidoTemplate[i].zzPervm / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);

								//Calculo do acréscimo de prazo médio .
								percAcresPrazoMed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercExcedentePrazoMed");
								valorTotalAcresPrazoMed += parseFloat(that.objItensPedidoTemplate[i].zzVprodDesc2 * (percAcresPrazoMed / 100) *
									(that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao));

								//calculo do desconto total retirando excluindo total diluido pra ele
								valorExcedido = Math.round((that.objItensPedidoTemplate[i].zzVprodDesc2 - that.objItensPedidoTemplate[i].zzVprodMinPermitido) * 100) / 100;
								that.objItensPedidoTemplate[i].zzValExcedidoItem = valorExcedido;

								if (that.objItensPedidoTemplate[i].zzValExcedidoItem < 0) {
									//Negatvo .. excedeu o valor.
									console.log("Produto: " + that.objItensPedidoTemplate[i].matnr + " excedeu: " + that.objItensPedidoTemplate[i].zzValExcedidoItem);
									totalExcedenteDescontos += that.objItensPedidoTemplate[i].zzValExcedidoItem * (that.objItensPedidoTemplate[i].zzQnt - that.objItensPedidoTemplate[i].zzQntDiluicao);
								}

							}
						} else if (that.objItensPedidoTemplate[i].tipoItem == "Diluicao") {

						}
					}

				}
			}

			console.log("CALCULO DADOS GERAIS");

			totalVerbaGerada = Math.round(totalVerbaGerada * 100) / 100;
			totalComissaoGerada = Math.round(totalComissaoGerada * 100) / 100;

			//Calculando total de desconto dado.
			TotalPedidoDesc = Math.round(parseFloat(TotalPedidoDesc * 100)) / 100;

			var descontoTotal = Total - TotalPedidoDesc;
			descontoTotal = Math.round(parseFloat(descontoTotal * 100)) / 100;

			// console.log(totalExcedenteDescontosDiluicao);
			// totalExcedenteDescontosDiluicao = Math.round(totalExcedenteDescontosDiluicao * 100) / 100;

			console.log(totalExcedenteDescontos);
			totalExcedenteDescontos = Math.abs(Math.round(totalExcedenteDescontos * 100) / 100);

			// TODO: Precisa ser feito a comparação da verba que o kra tem pra ver se ele ele excedeu o tanto de verba que ele tem.
			// TODO: A comissão precisa ser travada apenas se o total do valor gerado de comissão no proprio pedido for menor que o valor destiando para descontar.

			console.log("Verba: " + verbaUtilizadaDesconto + ". Comissão: " + comissaoUtilizadaDesconto + ". Comissão PM: " + comissaoUtilizadaPrazoMed);

			//VALOR NAO DIRECIONADO NO BALANÇO DE VERBAS. UMA VEZ QUE GEROU UMA DIFERENÇA.. GERARÁ WORKFLOW DE APROVAÇÃO;
			console.log("VALOR NÃO DIRECIONADO DESCONTOS.");
			valorNaoDirecionadoDesconto = Math.round((totalExcedenteDescontos - (verbaUtilizadaDesconto + comissaoUtilizadaDesconto)) * 100) / 100;

			console.log("VALOR NÃO DIRECIONADO PRAZO MÉDIO.");
			valorNaoDirecionadoPrazoMed = Math.round((valorTotalAcresPrazoMed - (valUtilizadoVerbaPrazoMed + comissaoUtilizadaPrazoMed)) * 100) / 100;

			console.log("VALOR NÃO DIRECIONADO AMOSTRA.");
			valorNaoDirecionadoAmostra = Math.round((valTotalExcedenteAmostra - (valUtilizadoVerbaAmostra + valUtilizadoComissaoAmostra)) * 100) / 100;
			that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteAmostra", valTotalExcedenteAmostra.toFixed(2));

			console.log("VALOR NÃO DIRECIONADO BONIFICAÇÃO.");
			valorNaoDirecionadoBonificacao = Math.round((valTotalExcedenteBonif - (valUtilizadoVerbaBonif + valUtilizadoComissaoBonif)) * 100) / 100;
			that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", valTotalExcedenteBonif.toFixed(2));

			console.log("VALOR NÃO DIRECIONADO BRINDE.");
			valorNaoDirecionadoBrinde = Math.round((valTotalExcedenteBrinde - (valUtilizadoVerbaBrinde + valUtilizadoComissaoBrinde)) * 100) / 100;
			that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBrinde", valTotalExcedenteBrinde.toFixed(2));

			//NÃO DIRECIONADO
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoDesconto", parseFloat(valorNaoDirecionadoDesconto).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed", parseFloat(valorNaoDirecionadoPrazoMed).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoBrinde", parseFloat(valorNaoDirecionadoBrinde).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoAmostra", parseFloat(valorNaoDirecionadoAmostra).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteNaoDirecionadoBonif", parseFloat(valorNaoDirecionadoBonificacao).toFixed(2));

			console.log("TOTAL VERBA UTILIZADA.");
			//Será a propria verba destinada para descontos : verbaUtilizadaDesconto
			totalVerbaUtilizada = verbaUtilizadaDesconto + valUtilizadoVerbaPrazoMed + valUtilizadoVerbaAmostra + valUtilizadoVerbaBonif + valUtilizadoVerbaBrinde;

			console.log("TOTAL COMISSÃO UTILIZADA.");
			totalComissaoUtilizada = comissaoUtilizadaDesconto + comissaoUtilizadaPrazoMed + valUtilizadoComissaoAmostra + valUtilizadoComissaoBonif + valUtilizadoComissaoBrinde;

			//TOTAIS DO PEDIDO
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaPedido", parseFloat(totalVerbaGerada).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoPedido", parseFloat(totalComissaoGerada).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/TotalItensPedido", Qnt);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotPed", parseFloat(TotalPedidoDesc).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/Ntgew", Ntgew);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValDescontoTotal", descontoTotal);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampEnxoval", valorCampEnxoval);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampBrinde", valorCampBrinde);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValCampGlobal", valorCampGlobal);

			console.log("VALORES EXCEDENTES");

			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoComissao", parseFloat(totalComissaoUtilizada).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalAbatidoVerba", parseFloat(totalVerbaUtilizada).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteBonif", parseFloat(valTotalExcedenteBonif).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedentePrazoMed", parseFloat(valorTotalAcresPrazoMed).toFixed(2));
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValTotalExcedenteDesconto", parseFloat(totalExcedenteDescontos).toFixed(2));

			console.log("VALORES UTILIZADOS CAMPANHA");
			var teste = "0.00";
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampBrinde", teste);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampGlobal", teste);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampEnxoval", teste);
			this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoCampProdutoAcabado", teste);

			console.log("CALCULO PARCELAMENTO");
			var valorEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValorEntradaPedido");
			var percEntradaPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/PercEntradaPedido");

			if (existeParcelas == false) {

				valorParcelas = TotalPedidoDesc / quantidadeParcelas;
				valorParcelas = parseFloat(Math.round(valorParcelas * 100) / 100).toFixed(2);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", valorParcelas);
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantidadeParcelasPedido", quantidadeParcelas + " x");

			} else if (existeParcelas == true) {

				if (valorEntradaPedido == 0) {

					var aux = TotalPedidoDesc - (percEntradaPedido * TotalPedidoDesc) / 100;
					valorParcelas = aux / quantidadeParcelas;
					valorParcelas = Math.round(valorParcelas * 100) / 100;
					// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", "Entrada: " + percEntradaPedido + "% + " +
					// 	quantidadeParcelas + "x " + valorParcelas.toLocaleString("pt-BR"));

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/EntradaPedido", "Entrada: " + percEntradaPedido + " % + ");
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantidadeParcelasPedido", quantidadeParcelas + " x ");
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", valorParcelas);

				} else if (percEntradaPedido == 0) {

					aux = (TotalPedidoDesc - valorEntradaPedido);
					valorParcelas = aux / quantidadeParcelas;
					valorParcelas = Math.round(valorParcelas * 100) / 100;

					// that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", "Entrada: R$: " + valorEntradaPedido +
					// 	" + " + quantidadeParcelas + "x " + valorParcelas);

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/EntradaPedido", "Entrada: " + valorEntradaPedido + " % + ");
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/QuantidadeParcelasPedido", quantidadeParcelas + " x ");
					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValParcelasPedido", valorParcelas);

				}
			}

			totalExcedenteDescontos = Math.round(totalExcedenteDescontos * 100) / 100;
			verbaUtilizadaDesconto = Math.round(verbaUtilizadaDesconto * 100) / 100;
			comissaoUtilizadaDesconto = Math.round(comissaoUtilizadaDesconto * 100) / 100;

			console.log("VALIDAÇÕES DE VALORES DIGITADOS MAIS QUE DEVERIAM.");
			//DESCONTO
			if ((comissaoUtilizadaDesconto + verbaUtilizadaDesconto).toFixed(2) > totalExcedenteDescontos) {

				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
				that.byId("idComissaoUtilizadaDesconto").setValueState("Error");
				that.byId("idComissaoUtilizadaDesconto").setValueStateText("Valor destinado para abater o excedente de descontos ultrapassou o valor total necessário. Desconto Excedente (" +
					totalExcedenteDescontos + ")");
				that.byId("idVerbaUtilizadaDesconto").setValueState("Error");
				that.byId("idVerbaUtilizadaDesconto").setValueStateText("Valor destinado para abater o excedente de descontos ultrapassou o valor total necessário. Desconto Excedente (" +
					totalExcedenteDescontos + ")");
				that.byId("idVerbaUtilizadaDesconto").focus();

			} else {

				that.byId("idVerbaUtilizadaDesconto").setValueState("None");
				that.byId("idVerbaUtilizadaDesconto").setValueStateText("");

				that.byId("idComissaoUtilizadaDesconto").setValueState("None");
				that.byId("idComissaoUtilizadaDesconto").setValueStateText("");
			}

			valorTotalAcresPrazoMed = Math.round(valorTotalAcresPrazoMed * 100) / 100;
			valUtilizadoVerbaPrazoMed = Math.round(valUtilizadoVerbaPrazoMed * 100) / 100;
			comissaoUtilizadaPrazoMed = Math.round(comissaoUtilizadaPrazoMed * 100) / 100;

			//PRAZO MÉDIO
			if ((comissaoUtilizadaPrazoMed + valUtilizadoVerbaPrazoMed).toFixed(2) > valorTotalAcresPrazoMed) {

				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");

				that.byId("idComissaoUtilizadaPrazo").setValueState("Error");
				that.byId("idComissaoUtilizadaPrazo").setValueStateText("Valor destinado para abater da comissão ultrapassou o valor total necessário. Excedente Prazo Médio (" + valorTotalAcresPrazoMed + ")");
				that.byId("idComissaoUtilizadaPrazo").focus();

				that.byId("idVerbaUtilizadaPrazo").setValueState("Error");
				that.byId("idVerbaUtilizadaPrazo").setValueStateText("Valor destinado para abater da comissão ultrapassou o valor total necessário. Excedente Prazo Médio (" + valorTotalAcresPrazoMed + ")");

			} else {

				that.byId("idComissaoUtilizadaPrazo").setValueState("None");
				that.byId("idComissaoUtilizadaPrazo").setValueStateText("");

				that.byId("idVerbaUtilizadaPrazo").setValueState("None");
				that.byId("idVerbaUtilizadaPrazo").setValueStateText("");
			}

			valUtilizadoComissaoBonif = Math.round(valUtilizadoComissaoBonif * 100) / 100;
			valUtilizadoVerbaBonif = Math.round(valUtilizadoVerbaBonif * 100) / 100;
			valTotalExcedenteBonif = Math.round(valTotalExcedenteBonif * 100) / 100;

			//BONIFICAÇÃO
			if (valTotalExcedenteBonif < (valUtilizadoVerbaBonif + valUtilizadoComissaoBonif).toFixed(2)) {
				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");

				that.byId("idVerbaUtilizadaBonif").setValueState("Error");
				that.byId("idVerbaUtilizadaBonif").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Bonificação (" + valTotalExcedenteBonif + ")");
				that.byId("idVerbaUtilizadaBonif").focus();

				that.byId("idComissaoUtilizadaBonif").setValueState("Error");
				that.byId("idComissaoUtilizadaBonif").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Bonificação (" + valTotalExcedenteBonif + ")");

			} else {
				that.byId("idVerbaUtilizadaBonif").setValueState("None");
				that.byId("idVerbaUtilizadaBonif").setValueStateText("");

				that.byId("idComissaoUtilizadaBonif").setValueState("None");
				that.byId("idComissaoUtilizadaBonif").setValueStateText("");
			}

			valTotalExcedenteAmostra = Math.round(valTotalExcedenteAmostra * 100) / 100;
			valUtilizadoVerbaAmostra = Math.round(valUtilizadoVerbaAmostra * 100) / 100;
			valUtilizadoComissaoAmostra = Math.round(valUtilizadoComissaoAmostra * 100) / 100;

			//AMOSTRA
			if (valTotalExcedenteAmostra < (valUtilizadoVerbaAmostra + valUtilizadoComissaoAmostra).toFixed(2)) {
				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");

				that.byId("idVerbaUtilizadaAmostra").setValueState("Error");
				that.byId("idVerbaUtilizadaAmostra").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Amostra (" + valTotalExcedenteAmostra + ")");
				that.byId("idVerbaUtilizadaAmostra").focus();

				that.byId("idComissaoUtilizadaAmostra").setValueState("Error");
				that.byId("idComissaoUtilizadaAmostra").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Amostra (" + valTotalExcedenteAmostra + ")");

			} else {
				that.byId("idVerbaUtilizadaAmostra").setValueState("None");
				that.byId("idVerbaUtilizadaAmostra").setValueStateText("");

				that.byId("idComissaoUtilizadaAmostra").setValueState("None");
				that.byId("idComissaoUtilizadaAmostra").setValueStateText("");
			}

			valTotalExcedenteBrinde = Math.round(valTotalExcedenteBrinde * 100) / 100;
			valUtilizadoComissaoBrinde = Math.round(valUtilizadoComissaoBrinde * 100) / 100;
			valUtilizadoVerbaBrinde = Math.round(valUtilizadoVerbaBrinde * 100) / 100;

			//BRINDE
			if (valTotalExcedenteBrinde < (valUtilizadoComissaoBrinde + valUtilizadoVerbaBrinde).toFixed(2)) {
				that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");

				that.byId("idVerbaUtilizadaBrinde").setValueState("Error");
				that.byId("idVerbaUtilizadaBrinde").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Brinde (" + valTotalExcedenteBrinde + ")");
				that.byId("idVerbaUtilizadaBrinde").focus();

				that.byId("idComissaoUtilizadaBrinde").setValueState("Error");
				that.byId("idComissaoUtilizadaBrinde").setValueStateText("Valor destinado para abater da comissão/verba ultrapassou o valor total necessário. Excedente Brinde (" + valTotalExcedenteBrinde + ")");

			} else {

				that.byId("idVerbaUtilizadaBrinde").setValueState("None");
				that.byId("idVerbaUtilizadaBrinde").setValueStateText("");

				that.byId("idComissaoUtilizadaBrinde").setValueState("None");
				that.byId("idComissaoUtilizadaBrinde").setValueStateText("");
			}
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

				var totalPercentualDiluicaoDado = 0;
				var TotalDiluicao = 0;
				var TotalNormal = 0;

				that.objItensPedidoTemplate.sort(function(a, b) {
					var x = a.tipoItem2.toLowerCase();
					var y = b.tipoItem2.toLowerCase();
					return x > y ? -1 : x < y ? 1 : 0;
				});

				for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
					if (that.objItensPedidoTemplate[i].tipoItem === "Diluicao") {
						TotalDiluicao += that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt;
					}
					if (that.objItensPedidoTemplate[i].tipoItem === "Normal") {
						TotalNormal += that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt;
					}
				}

				totalPercentualDiluicaoDado = Math.round((TotalDiluicao / TotalNormal) * 10000);
				totalPercentualDiluicaoDado = totalPercentualDiluicaoDado / 10000;

				if (totalPercentualDiluicaoDado > 0.30) {
					MessageBox.show("Quantidade de descontos ultrapassa o máximo permitido (30%) - máximo dado (" + Math.round(totalPercentualDiluicaoDado * 100) + "%)", {
						icon: MessageBox.Icon.ERROR,
						title: "Corrigir o itens a ser diluidos!",
						actions: [MessageBox.Action.OK]
					});

				} else {
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
							for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
								inseridoAux = false;
								inseridoAuxDiluicao = false;

								if (that.objItensPedidoTemplate[i].tipoItem === "Normal") {
									TotalNormal += that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt;

									//Regra para totalizar o total do pedido.
									if (vetorAux.length == 0) {

										if (that.objItensPedidoTemplate[i].kbetr == undefined) {
											that.objItensPedidoTemplate[i].kbetr = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitidoExtra == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitidoExtra = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitido == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitido = 0;
										}

										var objAuxItem = {
											idItemPedido: that.objItensPedidoTemplate[i].idItemPedido,
											aumng: that.objItensPedidoTemplate[i].aumng,
											index: that.objItensPedidoTemplate[i].index,
											knumh: that.objItensPedidoTemplate[i].knumh,
											mtpos: that.objItensPedidoTemplate[i].mtpos,
											kbetr: that.objItensPedidoTemplate[i].kbetr,
											zzRegra: that.objItensPedidoTemplate[i].zzRegra,
											zzGrpmat: that.objItensPedidoTemplate[i].zzGrpmat,
											knumhExtra: that.objItensPedidoTemplate[i].knumhExtra,
											zzRegraExtra: that.objItensPedidoTemplate[i].zzRegraExtra,
											zzGrpmatExtra: that.objItensPedidoTemplate[i].zzGrpmatExtra,
											maktx: that.objItensPedidoTemplate[i].maktx,
											matnr: that.objItensPedidoTemplate[i].matnr,
											nrPedCli: that.objItensPedidoTemplate[i].nrPedCli,
											tipoItem: "Diluido",
											ntgew: that.objItensPedidoTemplate[i].ntgew,
											zzDesext: that.objItensPedidoTemplate[i].zzDesext,
											zzDesitem: that.objItensPedidoTemplate[i].zzDesitem,
											zzPercom: that.objItensPedidoTemplate[i].zzPercom,
											zzPervm: that.objItensPedidoTemplate[i].zzPervm,
											zzQnt: 0,
											zzVprod: that.objItensPedidoTemplate[i].zzVprod,
											zzVprodDesc: that.objItensPedidoTemplate[i].zzVprodDesc,
											zzPercDescDiluicao: PercDescDiluicao,
											zzVprodMinPermitido: 0,
											zzPercDescTotal: that.objItensPedidoTemplate[i].zzPercDescTotal,
											zzVprodDescTotal: that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt,
											//Desconto normal. *****
											zzVprodDesc2: that.objItensPedidoTemplate[i].zzVprodDesc,
											//VALOR DO ITEM QUE VAI SER DILUIDO , PARA JOGAR O VALOR DIRETAMENTE NO ITEM.
											tipoItem2: that.objItensPedidoTemplate[i].tipoItem2,
											zzQntDiluicao: that.objItensPedidoTemplate[i].zzQntDiluicao,
											zzValorDiluido: 0,
											zzValExcedidoItem: that.objItensPedidoTemplate[i].zzValExcedidoItem,
											maxdescpermitido: that.objItensPedidoTemplate[i].maxdescpermitido,
											zzVprodABB: that.objItensPedidoTemplate[i].zzVprodABB,
											maxDescPermitido: that.objItensPedidoTemplate[i].maxDescPermitido,
											maxDescPermitidoExtra: that.objItensPedidoTemplate[i].maxDescPermitidoExtra
										};

										vetorAux.push(objAuxItem);
									}

									for (var t = 0; t < vetorAux.length; t++) {

										if (vetorAux[t].matnr == that.objItensPedidoTemplate[i].matnr) {
											inseridoAux = true;
										}
									}

									if (inseridoAux == false) {

										if (that.objItensPedidoTemplate[i].kbetr == undefined) {
											that.objItensPedidoTemplate[i].kbetr = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitidoExtra == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitidoExtra = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitido == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitido = 0;
										}

										var objAuxItem1 = {
											idItemPedido: that.objItensPedidoTemplate[i].idItemPedido,
											index: that.objItensPedidoTemplate[i].index,
											aumng: that.objItensPedidoTemplate[i].aumng,
											knumh: that.objItensPedidoTemplate[i].knumh,
											zzRegra: that.objItensPedidoTemplate[i].zzRegra,
											mtpos: that.objItensPedidoTemplate[i].mtpos,
											kbetr: that.objItensPedidoTemplate[i].kbetr,
											zzGrpmat: that.objItensPedidoTemplate[i].zzGrpmat,
											knumhExtra: that.objItensPedidoTemplate[i].knumhExtra,
											zzRegraExtra: that.objItensPedidoTemplate[i].zzRegraExtra,
											zzGrpmatExtra: that.objItensPedidoTemplate[i].zzGrpmatExtra,
											maktx: that.objItensPedidoTemplate[i].maktx,
											matnr: that.objItensPedidoTemplate[i].matnr,
											nrPedCli: that.objItensPedidoTemplate[i].nrPedCli,
											tipoItem: "Diluido",
											ntgew: that.objItensPedidoTemplate[i].ntgew,
											zzDesext: that.objItensPedidoTemplate[i].zzDesext,
											zzDesitem: that.objItensPedidoTemplate[i].zzDesitem,
											zzPercom: that.objItensPedidoTemplate[i].zzPercom,
											zzPervm: that.objItensPedidoTemplate[i].zzPervm,
											zzQnt: 0,
											zzVprod: that.objItensPedidoTemplate[i].zzVprod,
											zzVprodDesc: that.objItensPedidoTemplate[i].zzVprodDesc,
											zzPercDescDiluicao: PercDescDiluicao,
											zzVprodMinPermitido: 0,
											zzPercDescTotal: that.objItensPedidoTemplate[i].zzPercDescTotal,
											zzVprodDescTotal: that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt,
											zzVprodDesc2: that.objItensPedidoTemplate[i].zzVprodDesc,
											//VALOR DO ITEM QUE VAI SER DILUIDO , PARA JOGAR O VALOR DIRETAMENTE NO ITEM.
											tipoItem2: that.objItensPedidoTemplate[i].tipoItem2,
											zzQntDiluicao: that.objItensPedidoTemplate[i].zzQntDiluicao,
											zzValorDiluido: 0,
											zzValExcedidoItem: that.objItensPedidoTemplate[i].zzValExcedidoItem,
											maxdescpermitido: that.objItensPedidoTemplate[i].maxdescpermitido,
											maxDescPermitidoExtra: that.objItensPedidoTemplate[i].maxDescPermitidoExtra,
											zzVprodABB: that.objItensPedidoTemplate[i].zzVprodABB

										};

										vetorAux.push(objAuxItem1);
									}

								} else if (that.objItensPedidoTemplate[i].tipoItem === "Diluicao") {
									TotalDiluicao += that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt;

									for (t = 0; t < vetorAux.length; t++) {

										if (vetorAux[t].matnr == that.objItensPedidoTemplate[i].matnr) {
											inseridoAuxDiluicao = true;
										}
									}

									if (inseridoAuxDiluicao == false) {

										if (that.objItensPedidoTemplate[i].kbetr == undefined) {
											that.objItensPedidoTemplate[i].kbetr = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitidoExtra == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitidoExtra = 0;
										}
										if (that.objItensPedidoTemplate[i].maxDescPermitido == undefined) {
											that.objItensPedidoTemplate[i].maxDescPermitido = 0;
										}

										var objAuxItem2 = {
											idItemPedido: that.objItensPedidoTemplate[i].idItemPedido,
											index: that.objItensPedidoTemplate[i].index,
											aumng: that.objItensPedidoTemplate[i].aumng,
											knumh: that.objItensPedidoTemplate[i].knumh,
											mtpos: that.objItensPedidoTemplate[i].mtpos,
											kbetr: that.objItensPedidoTemplate[i].kbetr,
											zzRegra: that.objItensPedidoTemplate[i].zzRegra,
											zzGrpmat: that.objItensPedidoTemplate[i].zzGrpmat,
											knumhExtra: that.objItensPedidoTemplate[i].knumhExtra,
											zzRegraExtra: that.objItensPedidoTemplate[i].zzRegraExtra,
											zzGrpmatExtra: that.objItensPedidoTemplate[i].zzGrpmatExtra,
											maktx: that.objItensPedidoTemplate[i].maktx,
											matnr: that.objItensPedidoTemplate[i].matnr,
											nrPedCli: that.objItensPedidoTemplate[i].nrPedCli,
											tipoItem: "Diluido",
											ntgew: that.objItensPedidoTemplate[i].ntgew,
											zzDesext: that.objItensPedidoTemplate[i].zzDesext,
											zzDesitem: that.objItensPedidoTemplate[i].zzDesitem,
											zzPercom: that.objItensPedidoTemplate[i].zzPercom,
											zzPervm: that.objItensPedidoTemplate[i].zzPervm,
											zzQnt: 0,
											zzVprod: that.objItensPedidoTemplate[i].zzVprod,
											zzVprodDesc: that.objItensPedidoTemplate[i].zzVprodDesc,
											zzPercDescDiluicao: PercDescDiluicao,
											zzVprodMinPermitido: 0,
											zzPercDescTotal: that.objItensPedidoTemplate[i].zzPercDescTotal,
											zzVprodDescTotal: that.objItensPedidoTemplate[i].zzVprodDesc * that.objItensPedidoTemplate[i].zzQnt,
											zzVprodDesc2: that.objItensPedidoTemplate[i].zzVprodDesc,
											//VALOR DO ITEM QUE VAI SER DILUIDO , PARA JOGAR O VALOR DIRETAMENTE NO ITEM.
											zzQntDiluicao: that.objItensPedidoTemplate[i].zzQntDiluicao,
											tipoItem2: that.objItensPedidoTemplate[i].tipoItem2,
											zzValorDiluido: 0,
											zzVprodABB: that.objItensPedidoTemplate[i].zzVprodABB
										};

										vetorAux.push(objAuxItem2);
									}
								}
							}

							PercDescDiluicao = TotalNormal / (TotalNormal + TotalDiluicao);
							PercDescDiluicao = parseFloat((1 - PercDescDiluicao) * 100);

							console.log("Perc. de desconto para ser aplicado nos itens na regra de Diluição " + PercDescDiluicao);

							//APLICA O DESCONTO
							// for (var j = 0; j < that.objItensPedidoTemplate.length; j++) {

							// 	that.oItemPedido.zzVprodDesc = that.oItemPedido.zzVprodDesc - ((that.oItemPedido.zzVprodDesc) * (PercDescDiluicao / 100));
							// 	that.oItemPedido.zzVprodDesc = Math.round(parseFloat(that.oItemPedido.zzVprodDesc * 100)) / 100;

							// }

							for (var j = 0; j < vetorAux.length; j++) {
								if (vetorAux[j].mtpos != "YBRI" && vetorAux[j].mtpos != "YAMO") {
									vetorAux[j].zzVprodDesc = vetorAux[j].zzVprodDesc - ((vetorAux[j].zzVprodDesc) * (PercDescDiluicao / 100));
								}
								// vetorAux[j].zzVprodDesc = Math.round(parseFloat(vetorAux[j].zzVprodDesc * 100)) / 100;
							}

							for (var l = 0; l < that.objItensPedidoTemplate.length; l++) {
								for (var m = 0; m < vetorAux.length; m++) {
									if (vetorAux[m].matnr === that.objItensPedidoTemplate[l].matnr) {
										vetorAux[m].zzQnt += that.objItensPedidoTemplate[l].zzQnt;
										vetorAux[m].zzVprodDescTotal = vetorAux[m].zzVprodDesc * vetorAux[m].zzQnt;
										vetorAux[m].zzVprodDesc = vetorAux[m].zzVprodDesc;
										vetorAux[m].zzQntDiluicao = that.objItensPedidoTemplate[l].zzQntDiluicao;
										vetorAux[m].zzValorDiluido = (Math.round(that.objItensPedidoTemplate[l].zzQntDiluicao * that.objItensPedidoTemplate[l].zzVprodDesc * 100) / 100).toFixed(2);
									}
									vetorAux[m].zzValorDiluido = parseFloat(vetorAux[m].zzValorDiluido);
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

							that.objItensPedidoTemplate = [];
							that.objItensPedidoTemplate = vetorAux;
							var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");

							that.onBloqueiaPrePedido();

							console.log("Resultado dos itens da regra de Diluição");
							console.log(vetorAux);

							var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
							var objItensPedido = storeItensPedido.objectStore("ItensPedido");

							for (var p = 0; p < that.objItensPedidoTemplate.length; p++) {

								var requestADDItem = objItensPedido.put(that.objItensPedidoTemplate[p]);

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
							that.byId("idFormaPagamento").setProperty("enabled", false);
							that.byId("idTipoTransporte").setProperty("enabled", false);
							that.byId("idPrimeiraParcela").setProperty("enabled", false);
							that.byId("idQuantParcelas").setProperty("enabled", false);
							that.byId("idIntervaloParcelas").setProperty("enabled", false);

							oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");
						}
					};
				}
			};
		},

		onInicioBalancoVerbas: function(resolve, reject) {
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

								var transaction2 = db.transaction("A959", "readonly");
								var objectStore2 = transaction2.objectStore("A959");

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

										//Fazer o calculo do que foi excedido
										//Neste momento tenho os percentuais do max permitido de cada item de acordo com as familias cadastradas
										that.onPrecoMinPermitido(that.objItensPedidoTemplate);
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

		onPrecoMinPermitido: function(objItensPedidoTemplate) {
			var that = this;

			for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
				var valorProdutoCheio = that.objItensPedidoTemplate[i].zzVprod;

				//VALOR DO PRODUTO INICIAL É DESCONTADO O PERCENTUAL DA TABELA AVISTA QUANDO TIVER
				if (this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoNegociacao") === "01") {

					valorProdutoCheio = valorProdutoCheio - (valorProdutoCheio * 5 / 100);

				}

				var valorMinPermitido = valorProdutoCheio - (valorProdutoCheio * parseFloat(that.objItensPedidoTemplate[i].maxDescPermitido) / 100);
				valorMinPermitido = valorMinPermitido - (valorMinPermitido * parseFloat(that.objItensPedidoTemplate[i].maxDescPermitidoExtra) / 100);

				that.objItensPedidoTemplate[i].zzVprodMinPermitido = (valorMinPermitido).toFixed(3);
				console.log("Item :" + that.objItensPedidoTemplate[i].matnr + ", Min Permitido: " + that.objItensPedidoTemplate[i].zzVprodMinPermitido);

			}
		},

		onTablFilterEvent: function(evt) {
			var that = this;
			var item = evt.getParameters();
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

				if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {

					var promise = new Promise(function(resolve, reject) {
						that.onInicioBalancoVerbas(resolve, reject);
					});

					promise.then(function() {
						that.calculaTotalPedido();
					});

					that.setaCompleto(db, "Não");

					var storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
					var objItensPedido = storeItensPedido.objectStore("ItensPedido");

					for (var p = 0; p < that.objItensPedidoTemplate.length; p++) {

						if (that.objItensPedidoTemplate[p].tipoItem2 == "Diluicao") {
							that.objItensPedidoTemplate[p].zzValExcedidoItem = 0;
						} else {
							that.objItensPedidoTemplate[p].zzValExcedidoItem = Math.round(that.objItensPedidoTemplate[p].zzValExcedidoItem * 1000) / 1000;
						}

						that.objItensPedidoTemplate[p].zzVprodDesc2 = (Math.round(that.objItensPedidoTemplate[p].zzVprodDesc2 * 1000) / 1000);
						that.objItensPedidoTemplate[p].zzVprodDesc = (Math.round(that.objItensPedidoTemplate[p].zzVprodDesc * 1000) / 1000);

						var requestADDItem = objItensPedido.put(that.objItensPedidoTemplate[p]);

						requestADDItem.onsuccess = function(e3) {
							console.log("Itens atualizados com sucesso");

						};
						requestADDItem.onerror = function(e3) {
							console.log("Falha ao atualizar os Itens");
						};
					}
				}
				if (item.selectedKey == "tab3") {
					if (that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco") == "") {
						MessageBox.show("Escolha uma tabela de preço!", {
							icon: MessageBox.Icon.ERROR,
							title: "Falha ao inserir",
							actions: [MessageBox.Action.OK],
							onClose: function() {
								that.byId("idTopLevelIconTabBar").setSelectedKey("tab5");
								that.byId("idTabelaPreco").focus();
							}
						});
					}
				}
			};
		},

		onDefineFamilias: function(vetorRange, tipoDesconto) {
			var that = this;

			var vetorGeral = that.objItensPedidoTemplate;
			var vetorGeralExtra = that.objItensPedidoTemplate;
			var vetorFamilia = [];
			var proximoItemDiferente = false;
			var percDescPermitido = 0;

			if (tipoDesconto == "Normal") {

				//Ordenando para desconto Familia normal
				vetorGeral.sort(function(a, b) {
					return parseInt(a.kstbm) - parseInt(b.kstbm);
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
				console.log(that.objItensPedidoTemplate);
			} else if (tipoDesconto == "Extra") {

				//Ordenando para desconto Familia normal
				vetorGeralExtra.sort(function(a, b) {
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
				console.log(that.objItensPedidoTemplate);
			}
		},

		//Calcula se o item entra no desconto extra e calcula o desconto normal
		onBuscaPorcentagem: function(vetorFamilia, vetorDescontos, tipoDesconto) {
			var that = this;

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
					return a.kstbm - b.kstbm;
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

				that.oItemPedido.kbetr = auxRangeQuant;
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
					return a.kstbm - b.kstbm;
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

				that.oItemPedido.kbetr = auxRangeQuantExtra;
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
				that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PrazoMedioParcelas", prazoMedio);
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
					var base = 0;
					var valorInterm = 0;
					var dias = 0;

					for (i = 1; i <= quantidadeParcelas + 1; i++) {
						if (i == 1) {
							base = valorEntradaPedido;
							dias = 1;
						} else if (i == 2) {
							dias += diasPrimeiraParcela;
							valorInterm += dias * valorDasparcelas;
						} else {
							dias += intervaloParcelas;
							valorInterm += dias * valorDasparcelas;
						}
					}
					mediaPonderada = (base + valorInterm) / valTotPed;

					// //COMEÇA EM 1 POR QUE A PRIMEIRA PARCELA É DEFINIDO.
					// for (i = 1; i < quantidadeParcelas; i++) {
					// 	somatoriaParcelas += (valorDasparcelas * intervaloParcelas);
					// }

					// mediaPonderada = ((1 * valorDasparcelas) + somatoriaParcelas) / valTotPed;
					mediaPonderada = Math.round(mediaPonderada * 100) / 100;

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PrazoMedioParcelas", mediaPonderada);

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

					// valorDasparcelas = (valTotPed - (percEntradaPedido * valTotPed)) / quantidadeParcelas;
					valorEntradaPedido = percEntradaPedido * valTotPed;
					valorDasparcelas = Math.round(parseFloat((valTotPed - valorEntradaPedido) / quantidadeParcelas) * 100) / 100;

					base = 0;
					valorInterm = 0;
					dias = 0;

					for (i = 1; i <= quantidadeParcelas + 1; i++) {
						if (i == 1) {
							base = valorEntradaPedido;
							dias = 1;
						} else if (i == 2) {
							dias += diasPrimeiraParcela;
							valorInterm += dias * valorDasparcelas;
						} else {
							dias += intervaloParcelas;
							valorInterm += dias * valorDasparcelas;
						}
					}
					mediaPonderada = (base + valorInterm) / valTotPed;
					mediaPonderada = Math.round(mediaPonderada * 100) / 100;

					// //COMEÇA EM 1 POR QUE A PRIMEIRA PARCELA É DEFINIDO.
					// for (i = 1; i < quantidadeParcelas; i++) {
					// 	somatoriaParcelas = (valorDasparcelas * intervaloParcelas);
					// }

					// mediaPonderada = ((diasPrimeiraParcela * valorDasparcelas) + somatoriaParcelas) / valTotPed * quantidadeParcelas;
					// mediaPonderada = Math.round(mediaPonderada * 100) / 100;

					that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/PrazoMedioParcelas", mediaPonderada);

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

		onNavegaBalancoVenda: function() {

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab6");

		},

		popularCamposItemPedido: function() {
			var that = this;

			sap.ui.getCore().byId("idItemPedido").setValue(that.oItemPedido.matnr);
			sap.ui.getCore().byId("idDescricao").setValue(that.oItemPedido.maktx);
			sap.ui.getCore().byId("idQuantidade").setValue(that.oItemPedido.zzQnt);
			sap.ui.getCore().byId("idVerba").setValue(that.oItemPedido.zzPervm);
			sap.ui.getCore().byId("idComissao").setValue(that.oItemPedido.zzPercom);
			sap.ui.getCore().byId("idPrecoCheio").setValue(that.oItemPedido.zzVprod);
			sap.ui.getCore().byId("idDesconto").setValue(that.oItemPedido.zzDesitem);
			// sap.ui.getCore().byId("idPrecoDesconto").setValue(that.oItemPedido.zzVprodDescTotal);
			// this.getView().setModel(this.getOwnerComponent().setModel("modelItemPedido").setProperty("/valorTotal", that.oItemPedido.zzVprodDescTotal);
			this.getOwnerComponent().getModel("modelItemPedido").setProperty("/valorTotal", that.oItemPedido.zzVprodDescTotal);
			// sap.ui.getCore().byId("idPrecoDesconto").setValue(that.oItemPedido.zzVprodDescTotal);
			// sap.ui.getCore().byId("idPrecoDesconto").setValue(that.oItemPedido.zzVprodDescTotal.toString().replace(".", ","));

			// this.getView().getModel().setProperty("/precoVenda", 150.2);
			// sap.ui.getCore().byId("idPrecoDesconto").setValue(that.oItemPedido.zzVprodDescTotal)ç

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
				that.objItensPedidoTemplate = [];
				var db = open.result;
				var numeroPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");

				var store = db.transaction("ItensPedido").objectStore("ItensPedido");
				store.openCursor().onsuccess = function(event1) {
					var cursor = event1.target.result;

					if (cursor) {
						if (cursor.value.nrPedCli === numeroPedido) {
							that.objItensPedidoTemplate.push(cursor.value);
						}
						cursor.continue();
					} else {

						var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
						that.getView().setModel(oModel, "ItensPedidoGrid");

						that.onBloqueiaPrePedido();
						that.calculaTotalPedido();

						//Clicou no editar item .. mas cancelou .. dai tem que resetar a variavel que identifica que é um edit
						that.getOwnerComponent().getModel("modelAux").setProperty("/EditarindexItem", 0);
					}
				};
			};
		},

		onDialogSubmitButton: function() {

			var that = this;
			var oPanel = sap.ui.getCore().byId("idDialog");
			var itemExistente = false;
			var aux = [];
			var indexEdit = that.getOwnerComponent().getModel("modelAux").getProperty("/EditarindexItem");

			for (var j = 0; j < that.objItensPedidoTemplate.length; j++) {
				if (that.oItemPedido.matnr == that.objItensPedidoTemplate[j].matnr && that.objItensPedidoTemplate[j].tipoItem == "Normal" && (indexEdit == undefined || indexEdit == 0 || indexEdit == "")) {
					itemExistente = true;
					break;
				}
			}

			if (itemExistente == false) {

				if (indexEdit == undefined) {
					that.getOwnerComponent().getModel("modelAux").setProperty("/EditarindexItem", 0);
					indexEdit = 0;
				}

				var nrPedCli = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
				var oPanel = sap.ui.getCore().byId("idDialog");
				var oButtonSalvar = sap.ui.getCore().byId("idButtonSalvarDialog");
				oButtonSalvar.setEnabled(false);

				//Define o index do produto a ser inserido
				for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
					if (i == 0) {
						aux = that.objItensPedidoTemplate[i].idItemPedido.split("/");
						that.indexItem = parseInt(aux[1]);

					} else if (i > 0) {
						aux = that.objItensPedidoTemplate[i].idItemPedido.split("/");

						if (that.indexItem < parseInt(aux[1])) {
							that.indexItem = parseInt(aux[1]);

						}
					}
				}
				if (that.objItensPedidoTemplate.length === 0) {
					that.indexItem = 1;
				} else {
					that.indexItem += 1;
				}

				// if(indexEdit !== "" && indexEdit !== undefined){
				// 	that.indexItem = indexEdit;
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
							sap.ui.getCore().byId("idQuantidade").setValue(1);
						}
					});

				} else if (that.oItemPedido.aumng != 0 && (that.oItemPedido.zzQnt / that.oItemPedido.aumng) != 0) {

					MessageBox.show("Digite uma quantidade multipla de " + that.oItemPedido.aumng, {
						icon: MessageBox.Icon.ERROR,
						title: "Quantidade Inválida.",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							oPanel.setBusy(false);
							oButtonSalvar.setEnabled(true);
							sap.ui.getCore().byId("idQuantidade").setValue(1);

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


										that.getOwnerComponent().getModel("modelAux").setProperty("/UltimoindexItem", nrPedCli + "/" + (that.indexItem));
										that.oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/UltimoindexItem");
										that.oItemPedido.index = that.indexItem;
										that.oItemPedido.nrPedCli = nrPedCli;
									} else {
										//OBJ ENCONTRADO NO BANCO... ATUALIZA ELE.
										that.oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/EditarindexItem");
									}

									var pAtualizarItem = new Promise(function(resII, rejII) {
										if (that.oItemPedido.mtpos == "YAMO") {
											that.onConsumirSaldoAmostra(db, that.oItemPedido, resII, rejII, that.oItemPedido.zzQnt);
										} else {
											resII();
										}
									});
									
									pAtualizarItem.then(function() {
										storeItensPedido = db.transaction(["ItensPedido"], "readwrite");
										objItensPedido = storeItensPedido.objectStore("ItensPedido");

										var requestPutItens = objItensPedido.put(that.oItemPedido);
										requestPutItens.onsuccess = function() {
											
											/* Se for inserção */
											if (result2 == undefined) {
												that.objItensPedidoTemplate.push(that.oItemPedido);
												console.log("Item: " + that.oItemPedido.index + " adicionado com sucesso");

											} else {
												for (var j = 0; j < that.objItensPedidoTemplate.length; j++) {
													if (that.objItensPedidoTemplate[j].idItemPedido === that.oItemPedido.idItemPedido) {
														that.objItensPedidoTemplate[j] = that.oItemPedido;
													}
												}
												console.log("Item: " + that.oItemPedido.index + " foi Atualizado");

											}

											that.setaCompleto(db, "Não");
											that.calculaTotalPedido();
											that.oItemTemplate = [];

											if (that._ItemDialog) {
												that._ItemDialog.destroy(true);
											}

											oButtonSalvar.setEnabled(true);
											that.getOwnerComponent().getModel("modelAux").setProperty("/EditarindexItem", 0);

											var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
											that.getView().setModel(oModel, "ItensPedidoGrid");
											that.onBloqueiaPrePedido();

										};
										requestPutItens.onerror = function(event) {
											console.log(" Dados itensPedido não foram inseridos");

											oButtonSalvar.setEnabled(true);

											if (that._ItemDialog) {
												that._ItemDialog.destroy(true);
											}
										};

									}).catch(function() {
										oButtonSalvar.setEnabled(true);

										return;
									});
								};
							}
						};
					};
				}
			} else {
				MessageBox.show("Produto: " + that.oItemPedido.matnr + " já inserido na lista de itens!", {
					icon: MessageBox.Icon.ERROR,
					title: "Produto já inserido.",
					actions: [MessageBox.Action.YES],
					onClose: function() {
						that.onResetaCamposDialog();
						sap.ui.getCore().byId("idItemPedido").setValue();
						sap.ui.getCore().byId("idItemPedido").focus();
						oPanel.setBusy(false);
					}
				});
			}
		},

		onDialogDiluicaoSubmitButton: function() {

			var that = this;
			var nrPedCli = that.getOwnerComponent().getModel("modelAux").getProperty("/NrPedCli");
			var oPanel = sap.ui.getCore().byId("idDialog");
			var oButtonSalvar = sap.ui.getCore().byId("idButtonSalvarDiluicaoDialog");
			oButtonSalvar.setEnabled(false);
			var itemJaInseridoDiluicao = false;

			for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {

				if (that.objItensPedidoTemplate[i].matnr === that.oItemPedido.matnr && that.objItensPedidoTemplate[i].tipoItem === "Diluicao") {
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
						oButtonSalvar.setEnabled(true);
						that.onResetaCamposDialog();
						sap.ui.getCore().byId("idItemPedido").setValue();
						sap.ui.getCore().byId("idItemPedido").focus();
						oPanel.setBusy(false);
						itemJaInseridoDiluicao = false;

					}
				});

			} else {

				that.indexItem = this.onCriarIndexItemPedido();

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
							sap.ui.getCore().byId("idQuantidade").setValue(that.oItemTemplate.QtdPedida);

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

								that.getOwnerComponent().getModel("modelAux").setProperty("/UltimoindexItem", nrPedCli + "/" + (that.indexItem));
								that.oItemPedido.idItemPedido = that.getOwnerComponent().getModel("modelAux").getProperty("/UltimoindexItem");
								that.oItemPedido.index = that.indexItem;
								that.oItemPedido.nrPedCli = nrPedCli;
								var requestADDItem = objItensPedido.add(that.oItemPedido);
								requestADDItem.onsuccess = function(e3) {

									that.objItensPedidoTemplate.push(that.oItemPedido);
									// that.indexItem = that.indexItem + 1;
									that.setaCompleto(db, "Não");

									var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
									that.getView().setModel(oModel, "ItensPedidoGrid");

									that.onBloqueiaPrePedido();

									that.byId("idDiluirItens").setEnabled(true);

									console.log("Item: " + that.oItemPedido.index + " adicionado com sucesso, tipo Item: " + that.oItemPedido.tipoItem);

									that.calculaTotalPedido();

								};
								requestADDItem.onerror = function(e3) {
									oButtonSalvar.setEnabled(true);
									console.log("Falha ao adicionar o Item: " + that.oItemPedido.index);
								};

								if (that._ItemDialog) {
									that._ItemDialog.destroy(true);
									oButtonSalvar.setEnabled(true);
								}
							}
						};
					};
				}
			}
		},

		// FIM DOS DADOS FRAGMENTO

		// EVENTOS DA TABLE 						<<<<<<<<<<<<
		onNovoItem: function() {
			var that = this;

			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");
			var tipoPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");
			that.oItemPedido = [];

			if (statusPedido == 3) {
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

				/*set model para o dialog*/
				this._ItemDialog.open();
				sap.ui.getCore().byId("idItemPedido").focus();

				if (tipoPedido == "YBON" || tipoPedido == "YTRO") {
					sap.ui.getCore().byId("idDesconto").setEnabled(false);
				} else {
					sap.ui.getCore().byId("idDesconto").setEnabled(true);
				}
			}
		},

		onNovoItemDiluicao: function() {
			var that = this;

			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");
			that.oItemPedido = [];

			if (statusPedido == 3) {
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

				var itensDiluicao = [];
				var materiais = this.getView().getModel("materiaisCadastrados");

				for (var t = 0; t < materiais.oData.length; t++) {

					if (materiais.oData[t].mtpos !== "YAMO" && materiais.oData[t].mtpos !== "YBRI") {
						itensDiluicao.push(materiais.oData[t]);
					}
				}

				var oModel = new sap.ui.model.json.JSONModel(itensDiluicao);
				that.getView().setModel(oModel, "materiaisCadastradosDiluicao");

				this._ItemDialog.open();
				this.getOwnerComponent().getModel("modelAux").setProperty("/IserirDiluicao", true);
				sap.ui.getCore().byId("idItemPedido").focus();
			}
		},

		onEditarItemPress: function(oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");
			//VARIAVEL QUE MOSTRA UM ITEM ESTÁ SENDO EDITADO
			var itemPedido = oItem.getBindingContext("ItensPedidoGrid").getProperty("idItemPedido");
			that.getOwnerComponent().getModel("modelAux").setProperty("/EditarindexItem", itemPedido);
			var tipoPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");

			if (statusPedido == 3) {

				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else {
				//TO DO SETAR TODOS OS CAMPOS COM OS DADOS DO that.oItemTemplate  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
				for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {

					if (that.objItensPedidoTemplate[i].idItemPedido === itemPedido) {
						that.oItemPedido = that.objItensPedidoTemplate[i];
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

				that._ItemDialog.setModel(that.getView().getModel());
				that._ItemDialog.open();
				that.popularCamposItemPedido();

				if (that.oItemPedido.tipoItem == "Diluicao" || tipoPedido == "YBON" || tipoPedido == "YTRO") {
					sap.ui.getCore().byId("idDesconto").setEnabled(false);
				} else {
					sap.ui.getCore().byId("idDesconto").setEnabled(true);
				}

				sap.ui.getCore().byId("idItemPedido").setEnabled(false);

				if (that.oItemPedido.tipoItem == "Diluido") {
					sap.ui.getCore().byId("idItemPedido").setEnabled(false);
					sap.ui.getCore().byId("idQuantidade").setEnabled(false);
					sap.ui.getCore().byId("idDesconto").setEnabled(false);
				}
			}
		},

		onDeletarItemPedido: function(oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var idItemPedido = oItem.getBindingContext("ItensPedidoGrid").getProperty("idItemPedido");
			var idItem = oItem.getBindingContext("ItensPedidoGrid").getProperty("matnr");
			var statusPedido = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");
			if (statusPedido == 3) {

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
					actions: ["Excluir", "Cancelar"],
					onClose: function(oAction) {
						if (oAction === "Excluir") {

							for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
								if (that.objItensPedidoTemplate[i].idItemPedido === idItemPedido) {

									that.objItensPedidoTemplate.splice(i, 1);

									if (that.objItensPedidoTemplate.length === 0) {

										that.byId("idTipoNegociacao").setProperty("enabled", true);
										that.byId("idTabelaPreco").setProperty("enabled", true);
										that.byId("idFormaPagamento").setProperty("enabled", true);
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
							var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
							that.getView().setModel(oModel, "ItensPedidoGrid");

							that.onBloqueiaPrePedido();

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

			//Percorre os itens do pesdido para fazer uma verificação se realmente não tem produto repetido.
			var that = this;
			var idStatusPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");
			var valorParcelas = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValParcelasPedido");

			if (idStatusPedido == 3) {

				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else if (valorParcelas < 300) {

				MessageBox.show("Pedido deve ter um parcelamento maior que R$: 300,00.", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else {

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

							if (that.getOwnerComponent().getModel("modelAux").getProperty("/Tipousuario") == 2) {
								that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/IdStatusPedido", 9);
								that.getOwnerComponent().getModel("modelDadosPedido").setProperty("/SituacaoPedido", "Preposto");
							}

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
								// valComissao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissao"),
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
								valComissaoUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoUtilizadaDesconto"),
								valVerbaUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto"),
								valUtilizadoComissaoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoPrazoMed"),
								valTotalExcedenteNaoDirecionadoDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoDesconto"),
								valTotalExcedenteNaoDirecionadoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed"),
								valTotalExcedenteNaoDirecionadoBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoBrinde"),
								valTotalExcedenteNaoDirecionadoAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoAmostra"),
								valTotalExcedenteNaoDirecionadoBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoBonif"),
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
								valUtilizadoVerbaPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaPrazoMed"),
								valUtilizadoComissaoBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBrinde"),
								valTotalExcedenteAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteAmostra"),
								valUtilizadoVerbaAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaAmostra"),
								valUtilizadoComissaoAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoAmostra"),
								valTotalExcedenteBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"),
								valUtilizadoVerbaBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBonif"),
								valUtilizadoComissaoBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBonif"),
								codUsr: that.getOwnerComponent().getModel("modelAux").getProperty("/CodUsr"),
								tipoUsuario: that.getOwnerComponent().getModel("modelAux").getProperty("/Tipousuario"),
								verificadoPreposto: true,
								zlsch: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/FormaPagamento"),
							};

							var store1 = db.transaction("PrePedidos", "readwrite");
							var objPedido = store1.objectStore("PrePedidos");
							var request = objPedido.put(objBancoPrePedido);

							request.onsuccess = function() {
								// that.atualizaMovtoVerba(db);
								that.setaCompleto(db, "Sim");
								that.onResetarCamposPrePedido();
								that.oItemTemplate = [];
								console.log("Pedido inserido");
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
									that.getOwnerComponent().getModel("modelAux").setProperty("/bEnviarPedido", true);
									sap.ui.core.UIComponent.getRouterFor(that).navTo("enviarPedidos");
									that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
								}
								if (oAction == sap.m.MessageBox.Action.NO) {
									that.getOwnerComponent().getModel("modelAux").setProperty("/bEnviarPedido", true);
									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
									that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
								}
							}
						});
					};
				}
			}
		},

		onLiberarItensPedido: function() {
			var that = this;

			var idStatusPedido = that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido");

			if (idStatusPedido == 3) {
				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});
			} else {
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
				} else if (((this.byId("idTipoPedido").getSelectedKey() == "YBON" && this.byId("idTipoPedido").getSelectedKey() == "YTRO") && this.byId("idFormaPagamento").getSelectedKey() == "") || ((this.byId("idTipoPedido").getSelectedKey() == "YBON" && this.byId("idTipoPedido").getSelectedKey() == "YTRO") && this.byId("idFormaPagamento").getSelectedKey() == undefined)) {
					MessageBox.show("Preencher o forma de pagamento!", {
						icon: MessageBox.Icon.ERROR,
						title: "Corrigir o campo!",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							that.byId("idFormaPagamento").focus();
						}
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
				} else if (this.byId("idPrimeiraParcela").getValue() == "" || this.byId("idPrimeiraParcela").getValue() == undefined) {
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
					// that.objItensPedidoTemplate = [];
					// var oModel = new sap.ui.model.json.JSONModel(that.objItensPedidoTemplate);
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
								idStatusPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/IdStatusPedido"),
								situacaoPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/SituacaoPedido"),
								tabPreco: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TabPreco"),
								completo: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/Completo"),
								valMinPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValMinPedido"),
								dataPedido: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DataPedido"),
								dataImpl: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/DataImpl"),
								// valComissao: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissao"),
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
								valComissaoUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValComissaoUtilizadaDesconto"),
								valVerbaUtilizadaDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValVerbaUtilizadaDesconto"),
								valUtilizadoComissaoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoPrazoMed"),
								valTotalExcedenteNaoDirecionadoDesconto: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoDesconto"),
								valTotalExcedenteNaoDirecionadoPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteNaoDirecionadoPrazoMed"),
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
								valUtilizadoVerbaPrazoMed: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaPrazoMed"),
								valUtilizadoComissaoBrinde: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBrinde"),
								valTotalExcedenteAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteAmostra"),
								valUtilizadoVerbaAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaAmostra"),
								valUtilizadoComissaoAmostra: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoAmostra"),
								valTotalExcedenteBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValTotalExcedenteBonif"),
								valUtilizadoVerbaBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoVerbaBonif"),
								valUtilizadoComissaoBonif: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/ValUtilizadoComissaoBonif"),
								codUsr: that.getOwnerComponent().getModel("modelAux").getProperty("/CodUsr"),
								tipoUsuario: that.getOwnerComponent().getModel("modelAux").getProperty("/Tipousuario"),
								verificadoPreposto: false,
								zlsch: that.getOwnerComponent().getModel("modelDadosPedido").getProperty("/FormaPagamento")
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
									valUtilizadoVerbaPrazoMed: "",
									valUtilizadoComissaoBrinde: "",
									valTotalExcedenteAmostra: "",
									valUtilizadoVerbaAmostra: "",
									valUtilizadoComissaoAmostra: "",
									valTotalExcedenteBonif: "",
									valUtilizadoVerbaBonif: "",
									valUtilizadoComissaoBonif: "",
									codUsr: "",
									tipoUsuario: "",
									verificadoPreposto: "",
									zlsch: ""
								};

								request1.onsuccess = function() {

									that.setaCompleto(db, "Não");

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
									valUtilizadoVerbaPrazoMed: "",
									valUtilizadoComissaoBrinde: "",
									valTotalExcedenteAmostra: "",
									valUtilizadoVerbaAmostra: "",
									valUtilizadoComissaoAmostra: "",
									valTotalExcedenteBonif: "",
									valUtilizadoVerbaBonif: "",
									valUtilizadoComissaoBonif: "",
									codUsr: "",
									tipoUsuario: "",
									verificadoPreposto: "",
									zlsch: ""
								};

								request1.onsuccess = function() {
									that.setaCompleto(db, "Não");
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
			}
		},

		onResetarCamposPrePedido: function() {

			this.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", "");
			this.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", "");

			this.onResetaCamposPrePedido();
		},

		onCancelarPedido: function() {
			var that = this;

			this.onResetarCamposPrePedido();
			that.oItemTemplate = [];

			sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
		},

		onBloqueiaPrePedidoTotal: function(habilitado) {

			this.byId("idTabelaPreco").setEnabled(habilitado);
			this.byId("idFormaPagamento").setEnabled(habilitado);
			this.byId("idTipoTransporte").setEnabled(habilitado);
			this.byId("idTipoNegociacao").setEnabled(habilitado);
			this.byId("idTipoPedido").setEnabled(habilitado);
			this.byId("idPrimeiraParcela").setEnabled(habilitado);
			this.byId("idQuantParcelas").setEnabled(habilitado);
			this.byId("idIntervaloParcelas").setEnabled(habilitado);
			this.byId("idValorEntrada").setEnabled(habilitado);
			this.byId("idPercEntrada").setEnabled(habilitado);
			this.byId("idInserirItemDiluicao").setEnabled(habilitado);
			this.byId("idInserirItem").setEnabled(habilitado);
			this.byId("idObservacoesAuditoria").setEnabled(habilitado);
			this.byId("idObservacoes").setEnabled(habilitado);

			//Balanço verbas.
			this.byId("idVerbaUtilizadaDesconto").setEnabled(habilitado);
			this.byId("idComissaoUtilizadaDesconto").setEnabled(habilitado);
			this.byId("idVerbaUtilizadaPrazo").setEnabled(habilitado);
			this.byId("idComissaoUtilizadaPrazo").setEnabled(habilitado);
			this.byId("idVerbaUtilizadaBrinde").setEnabled(habilitado);
			this.byId("idComissaoUtilizadaBrinde").setEnabled(habilitado);
			this.byId("idVerbaUtilizadaAmostra").setEnabled(habilitado);
			this.byId("idComissaoUtilizadaAmostra").setEnabled(habilitado);
			this.byId("idVerbaUtilizadaBonif").setEnabled(habilitado);
			this.byId("idComissaoUtilizadaBonif").setEnabled(habilitado);
			this.byId("idVerbaEnxoval").setEnabled(habilitado);
			this.byId("idValCampProdAcabado").setEnabled(habilitado);
			this.byId("idValCampGlobal").setEnabled(habilitado);
		},

		onBloqueiaPrePedido: function() {
			var that = this;

			var tipoPed = this.getOwnerComponent().getModel("modelDadosPedido").getProperty("/TipoPedido");

			for (var i = 0; i < that.objItensPedidoTemplate.length; i++) {
				if (that.objItensPedidoTemplate[i].tipoItem == "Diluicao") {
					this.byId("idDiluirItens").setEnabled(true);
					this.byId("idInserirItemDiluicao").setEnabled(true);
					break;
				} else if (that.objItensPedidoTemplate[i].tipoItem == "Diluido") {
					this.byId("idDiluirItens").setEnabled(false);
					this.byId("idInserirItemDiluicao").setEnabled(false);
					this.byId("idInserirItem").setEnabled(false);
					break;
				}
			}

			if (that.objItensPedidoTemplate.length > 0) {
				this.byId("idTabelaPreco").setEnabled(false);
				this.byId("idFormaPagamento").setEnabled(false);
				this.byId("idTipoTransporte").setEnabled(false);
				this.byId("idTipoNegociacao").setEnabled(false);
				this.byId("idTipoPedido").setEnabled(false);

			} else {

				this.byId("idTabelaPreco").setEnabled(true);
				this.byId("idFormaPagamento").setEnabled(true);
				this.byId("idTipoTransporte").setEnabled(true);
				this.byId("idTipoNegociacao").setEnabled(true);
				this.byId("idTipoPedido").setEnabled(true);
				this.byId("idPrimeiraParcela").setEnabled(true);
				this.byId("idQuantParcelas").setEnabled(true);
				this.byId("idIntervaloParcelas").setEnabled(true);
				this.byId("idValorEntrada").setEnabled(true);
				this.byId("idPercEntrada").setEnabled(true);
				this.byId("idInserirItemDiluicao").setEnabled(true);
				this.byId("idInserirItem").setEnabled(true);

			}

			if (tipoPed == "YTRO") {
				this.byId("idInserirItemDiluicao").setEnabled(false);
			} else if (tipoPed == "YBON") {
				this.byId("idInserirItemDiluicao").setEnabled(false);
			}
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

		onValidaComissaoUtilizadaDesconto: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValComissaoUtilizadaDesconto", 0);
			}
		},

		onValidaVerbaUtilizadaPrazoMedio: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0 && valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", parseFloat(valor));
				oSource.setValueState("None");
				oSource.setValueStateText("");

			} else {
				oSource.setValueState("Error");
				oSource.setValueStateText("Inserir apenas numeros");
				// this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaPrazoMed", 0);

			}
		},

		onValidaComissaoUtilizadaPrazoMedio: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoPrazoMed", 0);
			}
		},

		onValidaComissaoUtilizadaBonif: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBonif", 0);
			}
		},

		onValidaVerbaUtilizadaBonif: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBonif", 0);
			}
		},

		onValidaVerbaUtilizadaAmostra: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaAmostra", 0);
			}
		},

		onValidaComissaoUtilizadaAmostra: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoAmostra", 0);
			}
		},

		onValidaComissaoUtilizadaBrinde: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoComissaoBrinde", 0);
			}
		},

		onValidaVerbaUtilizadaBrinde: function(evt) {
			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValUtilizadoVerbaBrinde", 0);
			}
		},

		onValidaNumeroPositivo: function(evt) {

			var oSource = evt.getSource();

			var valor = oSource.getValue();

			if (valor < 0) {

			}
		},

		onValidaVerbaUtilizadaDesconto: function(evt) {

			var oSource = evt.getSource();
			var valor = oSource.getValue();

			if (valor == "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", 0);
			} else if (valor >= 0) {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", parseFloat(valor));
			} else if (valor != "") {
				this.getOwnerComponent().getModel("modelDadosPedido").setProperty("/ValVerbaUtilizadaDesconto", 0);
			}
		},

		onSubmitParcela: function() {
			this.byId("idQuantParcelas").focus();
		},

		onSubmitParcela2: function() {
			this.byId("idIntervaloParcelas").focus();
		},

		onFormatterzzVprodDesc: function(value) {
			return parseFloat(Math.round(value * 100) / 100);
		},

		//Passa o item corrente a ser adicionado
		onConsumirSaldoAmostra: function(db, itemPedido, resII, rejII, iQtde) {
			var that = this;

			var codUsuario = this.getOwnerComponent().getModel("modelAux").getProperty("/CodUsr");

			var store = db.transaction("ControleAmostra", "readwrite");
			var objControleAmostras = store.objectStore("ControleAmostra");

			var requestMaterial = objControleAmostras.get(0);

			requestMaterial.onsuccess = function(e) {
				var oSaldo = e.target.result;

				if (oSaldo == undefined) {

					MessageBox.show("Não possui saldo de Amostra!", {
						icon: MessageBox.Icon.ERROR,
						title: "Saldo Indisponível!",
						actions: [MessageBox.Action.OK],
					});

				} else {

					var pSaldo = new Promise(function(res4) {
						/* Recupero o saldo de amostras */
						var oAmostras = [];

						that.onGetSaldoAmostra(oAmostras, res4, itemPedido);

					}).then(function(oAmostras) {
						var dValorTotAmo = iQtde + oAmostras.qtde;

						if (dValorTotAmo > parseInt(oSaldo.quantidadeTotal)) {

							MessageBox.show("Não possui saldo de Amostra!", {
								icon: MessageBox.Icon.ERROR,
								title: "Saldo Indisponível!",
								actions: [MessageBox.Action.OK],
							});

							rejII();
						} else {
							resII();
						}
					});
				}
			};
		},

		onGetSaldoAmostra: function(oAmostras, res4, itemPedido) {
				var open = indexedDB.open("VB_DataBase");
				var db = "";

				/* Recupero todas os documentos pendentes, inclusive o que está sendo digitado */
				var p1 = new Promise(function(res, rej) {

					open.onsuccess = function() {
						db = open.result;

						var sPedidos = db.transaction("PrePedidos", "readwrite");
						var objPedidos = sPedidos.objectStore("PrePedidos");
						var iStatus = objPedidos.index("idStatusPedido");

						var krStatus = IDBKeyRange.bound(1, 2);

						/* Recupero todos os pedidos com status 1 e 2 */
						var tPedido = iStatus.getAll(krStatus);

						var oDocsPendentes = [];
						tPedido.onsuccess = function(e) {
							oDocsPendentes = e.target.result;

							res(oDocsPendentes);
						};
					};
				});

				/* Recupero todos os itens do tipo YAMO => AMOSTRA  */
				p1.then(function(oDocsPendentes) {

					var vItensAmostras = [];

					var p2 = new Promise(function(res2) {
						var iIteracao = 0;

						/* Percorro todos os pedidos buscando os itens do tipo amostras em aberto */
						for (var i = 0; i < oDocsPendentes.length; i++) {
							var sItens = db.transaction("ItensPedido", "readwrite");
							var objItens = sItens.objectStore("ItensPedido");
							var inrPedCli = objItens.index("nrPedCli");

							var p3 = new Promise(function(res3, rej3) {
								var tItens = inrPedCli.openCursor(oDocsPendentes[i].nrPedCli);
								var tempItensBon = [];

								tItens.onsuccess = function(e) {
									var cursor = e.target.result;

									if (cursor) {

										/* Verifico se o item em questão é de Amostras (YAMO)*/
										if (cursor.value.mtpos === "YAMO") {
											tempItensBon.push(cursor.value);
										}

										cursor.continue();
									} else {
										res3(tempItensBon);
									}
								};
							}).then(function(tempItensBon) { /*res3*/
								iIteracao = iIteracao + 1;

								for (var j = 0; j < tempItensBon.length; j++) {
									/* Verifico se não é o pedido e o material em questão, não posso considerar para cálculo de saldo */
									if (tempItensBon[j].idItemPedido == itemPedido.idItemPedido && tempItensBon[j].index == itemPedido.index){
										continue;
									}
									
									vItensAmostras.push(tempItensBon[j]);
								}

								/* Verifico se é a últma iteração do loop pra dar continuidade ao processo */
								if (iIteracao == oDocsPendentes.length) {
									res2(vItensAmostras);
								}
							});

						} /* for */

					}).then(function(vItensAmostras) {
						var iQtdeUtilizada = 0;
						for (var i = 0; i < vItensAmostras.length; i++) {
							iQtdeUtilizada = iQtdeUtilizada + vItensAmostras[i].zzQnt;
						}

						oAmostras.itens = vItensAmostras;
						oAmostras.qtde = iQtdeUtilizada;

						res4(oAmostras);
					});
				});
			}
			/* onGetSaldoAmostra */

	});
});