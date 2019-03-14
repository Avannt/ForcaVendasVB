/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheBrindes", {

		constructor: function(sView) {
			console.log("Inicio da verificação de campanha de brindes.");
			that = this;

			/* CAMPOS - INICIO */
			/* that.oCmpBrinde[i].bCampanhaVigente */
			that.PDControllerCpBrinde = undefined;
			that.oCmpBrinde = undefined;
			that.oItemCpBrindeAtual = undefined;
			that.bCampanhaBrindeAtiva = false;
			/* CAMPOS - FIM */

			that.PDControllerCpBrinde = sView;

			this.InicializarEventosCampBrinde();
		} /* constructor */ ,

		onChangeIdTipoPedidoCpBrindes: function() {
			that.VerificarCampanhaBrinde();
		} /* onChangeIdTipoPedidoCpBrindes */ ,

		onSelectIconTabBarCpBrindes: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.VerificarCampanhaBrinde();

				that.disponibilizarValoresCpBrindes();
			}
		},
		/* onSelectIconTabBarCpBrindes */

		InicializarEventosCampBrinde: function() {
			this.onVerificarEvento("idTipoPedido", this.onChangeIdTipoPedidoCpBrindes, "change"); /* change */
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCpBrindes, "select"); /* select */
			this.onVerificarEvento("idInserirItem", this.onInserirItemPressCpBrindes, "press"); /* press */
			this.onVerificarEvento("idItemPedido", this.onSuggestItemCpBrindes, "suggest"); /* Evento ao incluir um novo item. */
			this.onVerificarEvento("idQuantidade", this.onQuantidadeChangeCpBrinde, "change"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
			this.onVerificarEvento("idButtonSalvarDialog", this.onSalvarItemDialogCpBrinde, "press"); /* press 'salvar' ao incluir um item */
			this.onVerificarEvento("table_pedidos", this.onItemPressCpBrinde, "itemPress"); /* itemPress 'salvar' ao incluir um item */

			this.GetCampanha();
		},
		/* InicializarEventosCampBrinde */

		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCpBrinde.byId(sIdControle)) {
				oElemento = that.PDControllerCpBrinde.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCpBrinde.byId(sIdControle)){
			if (oElemento) {
				oEventRegistry = oElemento.mEventRegistry;
				var bExisteEvento = false;

				/* Preciso verificar se o evento já não foi atribuído ao controle pelo menos uma vez para 
				que não chame em duplicidade */

				if (sTipoEvento == "itemPress") {
					for (var i = 0; i < oEventRegistry.itemPress.length; i++) {
						if (oEventRegistry.itemPress[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachItemPress(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "change") {
					for (var i = 0; i < oEventRegistry.change.length; i++) {
						if (oEventRegistry.change[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachChange(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "select") {
					for (var i = 0; i < oEventRegistry.select.length; i++) {
						if (oEventRegistry.select[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachSelect(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "press") {
					for (var i = 0; i < oEventRegistry.press.length; i++) {
						if (oEventRegistry.press[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachPress(oMetodoEvento, this);
					}
				}

				if (sTipoEvento == "suggest") {
					for (var i = 0; i < oEventRegistry.search.length; i++) {
						if (oEventRegistry.suggest[i].fFunction.name == oMetodoEvento.name) {
							bExisteEvento = true;
						}
					}
					if (!bExisteEvento) {
						/* Atribuição de eventos exclusivos da campanha */
						oElemento.attachSuggest(oMetodoEvento, this);
					}
				}
			}
		},
		
		onItemPressCpBrinde: function(evt){
			var sItem = this.PDControllerCpBrinde.oItemPedido.matnr;
			
			this.verificarExibicaoCampoQtdeBrinde(sItem);
			
			/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
			this.InicializarEventosCampBrinde();
		},
		/* onItemPressCpBrinde */

		onSuggestItemCpBrindes: function(evt) {
			var sItem = evt.getParameter("suggestValue");
			this.oItemCpBrindeAtual = undefined;
			
			this.verificarExibicaoCampoQtdeBrinde(sItem);
		},
		/* onSuggestItemCpBrindes */
		
		onSalvarItemDialogCpBrinde: function(evt){
			/* Ao pressionar o botão salvar, o sistema irá identificar o que é excedente de brinde e o que é equivalente a campanha */
			
			var iQtdeCpBrinde = parseFloat(sap.ui.getCore().byId("idQuantidadeBrinde").getValue());
			
			if (isNaN(iQtdeCpBrinde) == false ){
				this.PDControllerCpBrinde.oItemPedido.zzQntCpBrinde = iQtdeCpBrinde;
			}else{
				this.PDControllerCpBrinde.oItemPedido.zzQntCpBrinde = 0;
			}
		},

		onQuantidadeChangeCpBrinde: function() {
			this.setValoresCpBrindes(this);
		},
		/* onQuantidadeChangeCpBrinde */

		onInserirItemPressCpBrindes: function() {
			that.InicializarEventosCampBrinde();

			// that.PDControllerCpBrinde.byId("idTipoPedido").setVisible(false);
			console.log("onInserirItemPressCpBrindes da campanha de brindes!");
		},
		/* onInserirItemPressCpBrindes */

		onSearchItemPedido: function() {
			console.log("onSearchItemPedido da campanha de brindes!");
		},
		/* onSearchItemPedido */

		VerificarCampanhaBrinde: function() {
			/*Restrições (
				TABELA DA CAMPANHA S4		=> zsdt025
				TABELA DA CAMPANNHA LOCAL	=> CmpSldBrindes
				Tipo de pedido: TODOS																=> sIdTipoPed
				Vigência da campanha																=> that.oCmpBrinde[i].bCampanhaVigente, 
				
				Resultado																			=> that.bCampanhaBrindeAtiva = true
			)*/

			/* Verifico se não existe duas campanhas ativas para o mesmo representante e item */
			for (var i = 0; i < that.oCmpBrinde.length; i++) {

				if (that.oCmpBrinde[i].bCampanhaVigente) {

					/* Se existir mais de uma campanha ativa para o mesmo item, bloqueio o processo */
					var iTempQtdeCampanhasAtivasMesmoItem = 0;

					/* Para cada campanha ativa, eu preciso percorrer todas novamente para verificar se não existe uma em duplicidade */
					for (var j = 0; j < that.oCmpBrinde.length; j++) {

						/* Se forem de materiais iguais, incremento a variável */
						if (that.oCmpBrinde[i].material === that.oCmpBrinde[j].material) {
							iTempQtdeCampanhasAtivasMesmoItem += 1;
						}
					}

					if (iTempQtdeCampanhasAtivasMesmoItem > 1) {
						sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante e material, campanha de 'Brinde' não será considerada!", {
							title: "Inconsitência no cadastro",
							actions: [sap.m.MessageBox.Action.OK],
							close: function() {
								that.bCampanhaBrindesAtiva = false;
							}
						});

						console.log("Não usa campanha Brinde: Mais de uma campanha ativa para o mesmo representante / material!");
						return;
					}
				}
			}
		} /* VerificarCampanhaBrinde */ ,

		GetCampanha: function() {
			var open = indexedDB.open("VB_DataBase");

			open.onsuccess = function() {
				var db = open.result;

				var tCmpBrinde = db.transaction("CmpSldBrindes", "readonly");
				var osCmpBrinde = tCmpBrinde.objectStore("CmpSldBrindes");

				if ("getAll" in osCmpBrinde) {
					osCmpBrinde.getAll().onsuccess = function(event) {
						var tmpCampanha = event.target.result;
						// var oModel = new sap.ui.model.json.JSONModel(tmpCampanha);

						that.oCmpBrinde = tmpCampanha;
						that.VerificarCampanhasValidas();

						// that.getView().setModel(oModel, "tiposPedidos");
					};
				}
			};
		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function() {
			var dDataAtual = new Date();

			for (var i = 0; i < that.oCmpBrinde.length; i++) {

				if ((dDataAtual >= that.oCmpBrinde[i].dataInicio) && (dDataAtual <= that.oCmpBrinde[i].dataFim)) {
					that.oCmpBrinde[i].bCampanhaVigente = true;
				} else {
					that.oCmpBrinde[i].bCampanhaVigente = false;
				}
			}
		},
		/* VerificarCampanhasValidas */

		setValoresCpBrindes: function(that) {
			var iQtdeMaxPed = parseFloat(this.oItemCpBrindeAtual.quantidadeMaxima);
			var iQtdeTotal = parseFloat(this.oItemCpBrindeAtual.quantidadeTotal);
			var iQtdeDigitada = parseFloat(sap.ui.getCore().byId("idQuantidade").getValue());

			/* Busco todos os itens que foram utilizados em campanhas */
			var iTotalSistema = 0;
			
			/* Calculo o saldo que consta no sistema */
			var iSaldo = iQtdeTotal - iTotalSistema;
			
			var iQtdeLiberadaBrinde = 0;
			var iQtdeBrinde = 0;
			
			/* Se o saldo for menor que a quantidade disponível, considero o saldo como liberada pra uso*/
			if(iSaldo < iQtdeMaxPed){
				iQtdeLiberadaBrinde = iSaldo;
			} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
				iQtdeLiberadaBrinde = iQtdeMaxPed;
			}
			
			/* Agora preciso comparar a quantidade liberada pra uso com a quantidade digitada pelo usuário. */
			if(iQtdeLiberadaBrinde < iQtdeDigitada){
				iQtdeBrinde = iQtdeLiberadaBrinde;
			} else { /* Caso contrário, considero a qtde máxima por pedido como liberada */
				iQtdeBrinde = iQtdeDigitada;
			}
			
			sap.ui.getCore().byId("idQuantidadeBrinde").setValue(iQtdeBrinde);
		},
		/* setValoresCpBrindes */
		
		verificarExibicaoCampoQtdeBrinde: function(sItem){
			/* O evento é disparado duas vezes, controlo pelo valor sugerido, se tiver diferente de branco é proque 
			foi executado. */
			if (sItem != "") {
				var bItemCampanha = false;

				/* Verifico se existe campanha ativa para o item escolhido. */
				for (var i = 0; i < this.oCmpBrinde.length; i++) {
					/* A campanha tem que estar vigente*/
					if (this.oCmpBrinde[i].bCampanhaVigente) {
						/* Verifico se é para o material escolhido */
						if (this.oCmpBrinde[i].material == sItem) {
							bItemCampanha = true;
							this.oItemCpBrindeAtual = this.oCmpBrinde[i];
						}
					}
				}

				/* Se for item de campanha, preencho o valor da campanha automaticamnete e exibo o campo quantidade de brindes*/
				sap.ui.getCore().byId("idQuantidadeBrinde").setVisible(bItemCampanha);
				sap.ui.getCore().byId("idQuantidade").focus();

				/* Só chamo a função de setar valores se encontrou um item de campanha */
				if (this.oItemCpBrindeAtual) {
					/* Chamo a primeira vez a distribuição de valores pois o item inserido é incluso com valor 1. */
					this.setValoresCpBrindes(this);
				}
			}			
		},
		
		disponibilizarValoresCpBrindes: function(){
			
			/* Percorro todos os itens para distribuir os excedentes */
			console.log("MUDAR TAB CAMPANHA BRINDE.");
			
		}
	});
});