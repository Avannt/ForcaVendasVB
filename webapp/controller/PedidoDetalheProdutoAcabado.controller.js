/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController"
], function(BaseController) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheProdutoAcabado", {

		constructor: function(sView) {
			this.setLog("Inicio da verificação de campanha de produto acabado.");
			that = this;

			/* CAMPOS - INICIO */
			that.PDControllerCpPA = undefined;
			that.oCmpPA = undefined;
			that.oItemCpPA = undefined;
			that.oItemGrCpPA = undefined;
			/* CAMPOS - FIM */

			that.bCampanhaPAAtiva = false;
			that.PDControllerCpPA = sView;

			this.setLog("Iniciando campanha PA.");
			this.InicializarEventosCampPA();
		},
		/* constructor */

		onChangeIdTipoPedidoCpPA: function() {
			this.setLog("Mudança de tipo de pedido", "CPA");

			that.VerificarCampanhaPA();
		} /* onChangeIdTipoPedidoCpPA */ ,

		onSelectIconTabBarCpPA: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				// that.calcularTotalPedidoCpPA();
			}
		},
		/* onSelectIconTabBarCpPA */

		InicializarEventosCampPA: function() {
			this.setLog("Atribuindo eventos.", "CPA");

			this.onVerificarEvento("idTipoPedido", this.onChangeIdTipoPedidoCpPA, "change"); /* change */
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCpPA, "select"); /* select */
			this.onVerificarEvento("idInserirItem", this.onInserirItemPressCpPA, "press"); /* press */
			this.onVerificarEvento("idItemPedido", this.onSuggestItemCpPA, "suggest"); /* Evento ao incluir um novo item. */
			this.onVerificarEvento("idButtonSalvarDialog", this.onSalvarItemDialogCpPA, "press"); /* press 'salvar' ao incluir um item */
			this.onVerificarEvento("idQuantidade", this.onQuantidadeChangeCpPA, "change"); /* Evento ao editar uma quantidade no fragmento de escolha de itens. */
			this.onVerificarEvento("table_pedidos", this.onItemPressCpPA, "itemPress"); /* itemPress ao editar um item na tabela de itens */

			this.GetCampanha();
		},
		/* InicializarEventosCampPA */

		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCpPA.byId(sIdControle)) {
				oElemento = that.PDControllerCpPA.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCpPA.byId(sIdControle)){
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

		onItemPressCpPA: function(evt) {
			var sItem = this.PDControllerCpPA.oItemPedido.matnr;

			this.verificarExibicaoCampoQtdePA(sItem);

			/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
			this.InicializarEventosCampPA();
		},
		/* onItemPressCpPA */

		onSuggestItemCpPA: function(evt) {
			var sItem = evt.getParameter("suggestValue");
			this.oItemCpPA = undefined;
			this.oItemGrCpPA = undefined;

			this.verificarExibicaoCampoQtdePA(sItem);
		},
		/* onSuggestItemCpPA */

		onSalvarItemDialogCpPA: function(evt) {
			/* Ao pressionar o botão salvar, o sistema irá identificar o que é excedente de PA e o que é equivalente a campanha */

			var iQtdeCpPA = parseFloat(sap.ui.getCore().byId("idQuantidadePA").getValue());

			if (isNaN(iQtdeCpPA) == false) {
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = iQtdeCpPA;
				this.PDControllerCpPA.oItemPedido.zzGrupoCpPA = this.oItemGrCpPA.grupoSku;
				this.PDControllerCpPA.oItemPedido.zzIDCpPA = this.oItemCpPA.idcampanha;

			} else {
				this.PDControllerCpPA.oItemPedido.zzQntCpPA = 0;
				this.PDControllerCpPA.oItemPedido.zzGrupoCpPA = "";
				this.PDControllerCpPA.oItemPedido.zzIDCpPA = "";
			}
		},

		onQuantidadeChangeCpPA: function() {
			this.setLog("Ao digitar a quantidade dos itens", "CPA");

			/* Só chamo a função de setar valores se encontrou um item de campanha */
			if (this.oItemCpPA) {
				this.setValoresCpPA(this);
			}
		},
		/* onQuantidadeChangeCpPA */

		onInserirItemPressCpPA: function() {
			that.InicializarEventosCampPA();

			this.setLog("onInserirItemPressCpPA da campanha de produto acabado!", "CPA");
		},
		/* onInserirItemPressCpPA */

		onSearchItemPedido: function() {
			this.setLog("onSearchItemPedido da campanha de produto acabado!", "CPA");
		},
		/* onSearchItemPedido */

		VerificarCampanhaPA: function() {
			/*Restrições (
				TABELA DA CAMPANHA S4		=> VERIFICAR
				TABELA DA CAMPANNHA LOCAL	=> CmpProdsAcabs
				Tipo de pedido: YBON																=> sIdTipoPed
				Vigência da campanha																=> that.oCmpPA[i].bCampanhaVigente, 
				
				Resultado																			=> that.bCampanhaPAAtiva = true
			)*/

			/* Verifico se não existe duas campanhas ativas para o mesmo representante e item */
			for (var i = 0; i < that.oCmpPA.length; i++) {

				if (that.oCmpPA[i].bCampanhaVigente) {
					/* Se existir mais de uma campanha ativa para o mesmo item, bloqueio o processo */
					var iTempQtdeCampanhasAtivasMesmoItem = 0;

					/* Percorro todos os materiais */
					for (var j = 0; j < that.oCmpPA[i].length; j++) {

						/* Para cada item de campanha, percorro todos os itens para identificar
						se existe algum em duplicidade. */
						for (var i2 = 0; i2 < that.oCmpPA.length; i2++) {
							for (var j2 = 0; j2 < that.oCmpPA[i2].length; j2++) {

								/* Preciso desconsiderar o item da campanha atual */
								if (i === i2 && j === j2) {
									continue;
								}

								/* Verifico se não é o mesmo material */
								if (that.oCmpPA[i].grupo[j].matnr === that.oCmpPA[i2].grupo[j2].matnr) {
									iTempQtdeCampanhasAtivasMesmoItem += 1;
								}
							}
						}
					}

					if (iTempQtdeCampanhasAtivasMesmoItem > 1) {
						sap.m.MessageBox.error("Duas campanhas vigentes ao mesmo tempo para o representante e material, campanha de 'PA' não será considerada!", {
							title: "Inconsitência no cadastro",
							actions: [sap.m.MessageBox.Action.OK],
							close: function() {
								that.bCampanhaPAAtiva = false;
							}
						});

						this.setLog("Não usa campanha PA: Mais de uma campanha ativa para o mesmo representante / material!", "CPA");
						return;
					}

					this.setLog("Verificação de duplicidades de campanhas concluídas.", "CPA");
				}
			}
		} /* VerificarCampanhaPA */ ,

		GetCampanha: function() {

			new Promise(function(res, rej) {
				var open = indexedDB.open("VB_DataBase");

				open.onsuccess = function() {
					var db = open.result;

					var tCmpPA = db.transaction("CmpProdsAcabs", "readonly");
					var osCmpPA = tCmpPA.objectStore("CmpProdsAcabs");

					if ("getAll" in osCmpPA) {
						osCmpPA.getAll().onsuccess = function(event) {
							var tmpCampanha = event.target.result;

							res(tmpCampanha);
						};
					}
				};
			}).then(function(tmpCampanha) {
				var oCp;
				var oSg;
				that.oCmpPA = [];
				var bMudouCampanha = false;
				var sProximaCamp = "";

				/* Filtro as campanhas únicas */
				var cpUnicas = tmpCampanha.filter(function(value, index, self) {
					var bRetorno;

					/* Verifico se é o primeiro registro */
					if (index === 0) {
						bRetorno = true;
					}
					else {
						/* Comparo sempre com o registro anterior */
						if (self[index].Idcamp === self[index - 1].Idcamp) {
							bRetorno = false;
						} else {
							bRetorno = true;
						}
					} 

					return bRetorno;
				});
				
				/* Percorro todas as campanhas únicas */
				for (var i = 0; i < cpUnicas.length; i++) {
					oCp = new Object();
					
					oCp.idcampanha = cpUnicas[i].Idcamp || "";
					oCp.representante = cpUnicas[i].representante || "";
					oCp.descricaoRepresentante = cpUnicas[i].descricaoRepresentante || "";
					oCp.dataInicio = cpUnicas[i].dataInicio || "";
					oCp.dataFim = cpUnicas[i].dataFim || "";
					oCp.quantidadeMaxima = cpUnicas[i].quantidadeMaxima || 0;
					oCp.bCampanhaVigente = true;

					/* Filtro somente os grupos da campanha atual */
					var gruposCP = tmpCampanha.filter(function(value, index, self){
						var bRetorno;
						
						bRetorno = cpUnicas[i].Idcamp === self[index].Idcamp;
						// if(index === 0){
						// 	bRetorno = cpUnicas[i].Idcamp === self[index].Idcamp;
						// }
						// else{
						// 	/* Retorno grupos das mesmas campanha */
						// 	bRetorno = cpUnicas[i].Idcamp === self[index - 1].Idcamp;
						// }
						
						return bRetorno;
					});
					
					oCp.grupo = [];
					/* Percorro todos os grupos da campanha em questão para criar os objetos */
					for (var j = 0; j < gruposCP.length; j++) {
						oSg = new Object();
						
						oSg.idcampanha = gruposCP[j].Idcamp || "";
						oSg.grupoSku = gruposCP[j].Grupo || "";
						oSg.matnr = gruposCP[j].material || "";
						
						oCp.grupo.push(oSg);
					}
					
					that.oCmpPA.push(oCp);
				}
				
				that.setLog(that.oCmpPA, "CPA");
			});

		} /* GetCampanha */ ,

		VerificarCampanhasValidas: function() {
			var dDataAtual = new Date();

			for (var i = 0; i < that.oCmpPA.length; i++) {

				if ((dDataAtual >= that.oCmpPA[i].dataInicio) && (dDataAtual <= that.oCmpPA[i].dataFim)) {
					this.setLog("Campanha " + that.oCmpPA[i].idcampanha + " com vigência VÁLIDA!", "CPA");
					that.oCmpPA[i].bCampanhaVigente = true;
				} else {
					this.setLog("Campanha " + that.oCmpPA[i].idcampanha + " com vigência INVÁLIDA!", "CPA");
					that.oCmpPA[i].bCampanhaVigente = false;
				}
			}
		},
		/* VerificarCampanhasValidas */

		setValoresCpPA: function(that) {
			var iQtdeMaxPedGrupo = 0;
			var iQtdeDigitada = parseFloat(sap.ui.getCore().byId("idQuantidade").getValue());
			var iQtdeDigitadaGrupo = 0;
			var iSaldoCpPA;
			var iQtdePA = 0;
			
			var sCodCampanha = this.oItemGrCpPA.idcampanha || "";
			var sCodGrupo = this.oItemGrCpPA.grupoSku || "";

			/* Vou na campanha identificar qual a quantidade liberada para um grupo de SKU */
			iQtdeMaxPedGrupo = this.oItemCpPA.quantidadeMaxima;

			/* Identifico quanto já foi digitado nesse pedido do grupo de SKU em questão. */
			/*that.objItensPedidoTemplate*/
			for (var i = 0; i < this.PDControllerCpPA.objItensPedidoTemplate.length; i++) {

				/* O material em questão não pode ser considerado pra o saldo (no caso da edição eu devo ignorar no montante total) */
				if (this.PDControllerCpPA.objItensPedidoTemplate[i].idItemPedido != this.PDControllerCpPA.oItemPedido.idItemPedido) {

					/* Para cada linha percorro todos itens da campanha para verificar se a eles pertencem
					e somar a quantidade*/
					for (var j = 0; j < this.oItemCpPA.grupo.length; j++) {

						/* zzGrupoCpPA -> Gravo essa informação no momento que o usuário pressiona o botão 'salvar' */
						if (((this.PDControllerCpPA.objItensPedidoTemplate[i].zzGrupoCpPA || "") === sCodGrupo) &&
						((this.PDControllerCpPA.objItensPedidoTemplate[i].zzIDCpPA || "" ) === sCodCampanha)) {
							iQtdeDigitadaGrupo = iQtdeDigitadaGrupo + this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA;
							break;
						}

					}
				}
			}

			iSaldoCpPA = iQtdeMaxPedGrupo - iQtdeDigitadaGrupo;

			if (iQtdeDigitada < iSaldoCpPA) {
				iQtdePA = iQtdeDigitada;
			} else {
				iQtdePA = iSaldoCpPA;
			}

			/*parseFloat(this.oItemCpPA.quantidadeMaxima)*/
			sap.ui.getCore().byId("idQuantidadePA").setValue(iQtdePA);
			/* Fim */
		},
		/* setValoresCpPA */

		verificarExibicaoCampoQtdePA: function(sItem) {
			this.setLog("Verifico se é pra exibir ou ocultar o campo de quantidade.", "CPA");

			/* O evento é disparado duas vezes, controlo pelo valor sugerido, se tiver diferente de branco é proque 
			foi executado. */
			if (sItem != "") {
				var bItemCampanha = false;

				/* Verifico se existe campanha ativa para o item escolhido. */
				for (var i = 0; i < this.oCmpPA.length; i++) {
					/* A campanha tem que estar vigente*/
					if (this.oCmpPA[i].bCampanhaVigente) {

						for (var j = 0; j < this.oCmpPA[i].grupo.length; j++) {

							/* Verifico se é para o material escolhido */
							if (this.oCmpPA[i].grupo[j].matnr == sItem) {
								this.setLog("Campanha encontrada para o item: " + sItem, "CPA");
								bItemCampanha = true;
								this.oItemCpPA = this.oCmpPA[i];
								this.oItemGrCpPA = this.oCmpPA[i].grupo[j];
							}
						}
					}
				}

				/* Se for item de campanha, preencho o valor da campanha automaticamnete e exibo o campo quantidade de produto acabado*/
				sap.ui.getCore().byId("idQuantidadePA").setVisible(bItemCampanha);
				sap.ui.getCore().byId("idQuantidade").focus();

				/* Só chamo a função de setar valores se encontrou um item de campanha */
				if (this.oItemCpPA) {
					/* Chamo a primeira vez a distribuição de valores pois o item inserido é incluso com valor 1. */
					this.setValoresCpPA(this);
				} else {
					this.setLog("Nenhuma campanha encontrada para o item: " + sItem, "CPA");
				}
			}
		},

		disponibilizarValoresCpPAs: function() {
			/* Percorro todos os itens para distribuir os excedentes */
			this.setLog("MUDAR TAB CAMPANHA PA.", "CPA");
		},

		calcularTotalPedidoCpPA: function() {
			var oModelPed = that.PDControllerCpPA.getOwnerComponent().getModel("modelDadosPedido");

			var dValorExcedenteTotal = 0;
			var dValorExcProduto = 0;
			var dValorBExcedenteBonific = 0;
			var dValorLExcedenteBonific = 0;
			var dValorBonificacao = parseFloat(oModelPed.getProperty("/ValTotalExcedenteNaoDirecionadoBonif"));

			for (var i = 0; i < this.PDControllerCpPA.objItensPedidoTemplate.length; i++) {
				dValorExcProduto = 0;

				/* Verifico houve quantidade exclusiva para campanhas */
				if (parseInt(this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA) > 0) {
					dValorExcProduto = this.PDControllerCpPA.objItensPedidoTemplate[i].zzQntCpPA * parseFloat(this.PDControllerCpPA.objItensPedidoTemplate[i].zzVprodDesc2);
					dValorExcedenteTotal = dValorExcedenteTotal + dValorExcProduto;
				}
			}

			dValorBExcedenteBonific = parseFloat(oModelPed.getProperty("/ValTotalExcedenteBonif") || 0);

			if (dValorBExcedenteBonific > 0) {
				var dValorLiquidoBonificacao = dValorBonificacao - dValorExcedenteTotal;
				dValorLExcedenteBonific = dValorBExcedenteBonific - dValorExcedenteTotal;

				dValorLExcedenteBonific = Math.round(dValorLExcedenteBonific * 100) / 100;
				dValorExcedenteTotal = Math.round(dValorExcedenteTotal * 100) / 100;
				dValorLiquidoBonificacao = Math.round(dValorLiquidoBonificacao * 100) / 100;

				oModelPed.setProperty("/ValTotalExcedenteBonif", dValorLExcedenteBonific);
				oModelPed.setProperty("/ValTotalCampProdutoAcabado", dValorExcedenteTotal || 0);
				oModelPed.setProperty("/ValTotalExcedenteNaoDirecionadoBonif", dValorLiquidoBonificacao.toString());
			}
		}
	});
});