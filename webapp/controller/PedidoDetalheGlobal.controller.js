/*eslint-disable no-console, no-alert */
/*eslint-disable sap-no-ui5base-prop*/
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/m/MessageBox"

], function(BaseController, MessageBox) {
	"use strict";

	var that;

	return BaseController.extend("testeui5.controller.PedidoDetalheGlobal", {

		constructor: function(sView) {
			that = this;

			/* CAMPOS - INICIO */
			/* that.oCmpEnxoval[i].bCampanhaVigente */
			that.PDControllerCmpGlobal = undefined;
			that.oCmpGB = new Object();
			/* CAMPOS - FIM */

			that.PDControllerCmpGlobal = sView;
			that.InicializarEventosCampGlobal();

		},
		/* constructor */

		InicializarEventosCampGlobal: function() {
			this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCmpGlobal, "select"); /* select */
			this.onVerificarEvento("idButtonSalvarDialog", this.onSalvarItemDialogCpGlobal, "press"); /* press 'salvar' ao incluir um item */
			// this.onVerificarEvento("table_pedidos", this.onItemPressCpGlobal, "itemPress"); /* itemPress ao editar um item na tabela de itens */

			this.setLog("Recuperando campanha global.", "CPG");
			that.GetCampanha();
		} /* InicializarEventosCampGlobal */ ,

		onItemPressCpGlobal: function() {

			/* Preciso verificar os eventos novamente pois como abriu o fragment, o evento pode não estar atribuído ao controle*/
			this.InicializarEventosCampGlobal();
		},
		/* onItemPressCpGlobal */

		onSelectIconTabBarCmpGlobal: function(evt) {
			var item = evt.getParameters();
			var that = this;

			if (item.selectedKey === "tab6" || item.selectedKey === "tab5") {

				new Promise(function(res, rej) {
					var itemBranco = [];
					var aba = true;
					that.onCheckBrindeCampanhaGlobal(itemBranco, res, rej, aba);

				}).then(function(retornoCmpGlobal) {

					console.log("Itens Campanha Global estão OK", "CPG");
				}).catch(function(mensagemCmpGlobal) {

					MessageBox.show(mensagemCmpGlobal[0], {
						icon: MessageBox.Icon.ERROR,
						title: "Brinde inválido.",
						actions: [MessageBox.Action.OK],
						onClose: function() {
							that.PDControllerCmpGlobal.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
						}
					});
				});
			}

		},
		/* onSelectIconTabBar */

		onSalvarItemDialogCpGlobal: function() {
			var a = "teste";
		},
		/* onSalvarItemDialogCpGlobal */

		GetCampanha: function() {
			var that = this;
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

				var transaction = db.transaction("CmpGbProdsAcabs", "readonly");
				var objectStoreMaterial = transaction.objectStore("CmpGbProdsAcabs");
				var request = objectStoreMaterial.getAll();

				request.onsuccess = function(event) {
					var result = event.target.result;

					that.oCmpGB = result;

					transaction = db.transaction("CmpGbGrpProdsAcabs", "readonly");
					objectStoreMaterial = transaction.objectStore("CmpGbGrpProdsAcabs");
					request = objectStoreMaterial.getAll();

					request.onsuccess = function(event) {
						var vPAs = event.target.result;
						var tempPAs;
						var bRetorno;

						for (var i = 0; i < that.oCmpGB.length; i++) {
							that.oCmpGB[i].PAs = [];

							/* Buscto todos os PAs do Grupo em questão */
							tempPAs = vPAs.filter(function(obj, j, array) {
								bRetorno = false;

								if (that.oCmpGB[i].grupo === obj.grupo) {
									bRetorno = true;
								}

								return bRetorno;
							});

							that.oCmpGB[i].PAs = tempPAs;
						}

						/* Verifico todos os brindes do subgrupo em questão */
						transaction = db.transaction("CmpGbItensBrindes", "readonly");
						objectStoreMaterial = transaction.objectStore("CmpGbItensBrindes");
						request = objectStoreMaterial.getAll();

						request.onsuccess = function(event) {
							var vBrindes = event.target.result;
							var tempBrindes;
							var bRetorno;
							var vUnicos = [];
							var sGrupo;
							var bEncontrouReg;

							/* Ordeno os brindes por grupos */
							tempBrindes = vBrindes.sort(function(a, b) {
								var x = a.grupo.toLowerCase();
								var y = b.grupo.toLowerCase();

								var comparison = 0;
								if (x > y) {
									comparison = 1;
								} else if (x < y) {
									comparison = -1;
								}
								return comparison;
							});

							/* Percorro os brindes existentes para identificar os únicos */
							for (var j = 0; j < tempBrindes.length; j++) {
								sGrupo = tempBrindes[j].grupo;

								bEncontrouReg = false;

								for (var k = 0; k < vUnicos.length; k++) {
									if (sGrupo === vUnicos[k]) {
										bEncontrouReg = true;
									}
								}

								/* Se não encontrou o registro, adiciono aos únicos */
								if (bEncontrouReg == false) {
									vUnicos.push(sGrupo);
								}
							}

							that.oCmpGB.GrBrindes = [];
							var oGrupo;

							/* Percorro os únicos para recuperar os registros agrupados */
							for (var j = 0; j < vUnicos.length; j++) {
								oGrupo = new Object();

								oGrupo.grupo = vUnicos[j];

								/* Buscto todos os brindes do Grupo em questão */
								tempBrindes = vBrindes.filter(function(obj, k, array) {
									bRetorno = false;

									if (vUnicos[j] === obj.grupo) {
										bRetorno = true;
									}

									return bRetorno;
								});

								oGrupo.brindes = tempBrindes;
								that.oCmpGB.GrBrindes.push(oGrupo);
							}

							that.setLog(that.oCmpGB, "CPG");
						};
					};
				};
			};
		},

		//Agrupa os itens da campanha pelo grupo e verifica se atingiu a regra para ver a quantidade de bonificação
		// que o kra pode inserir com o Brinde.
		onAgrupaItensGlobal: function(retorno) {
			var proximoItemDiferente = false;
			var vetorGrpFamilia = [];
			var vBrindesAgrupadosItensPedido = [];
			var vBrindesAgrupadosItensPedidoTotal = [];
			var aux = [];
			//Pra tratar quando o kra insere apenas itens de amostra e brindes.
			//Faz com que insere o item sem cair na verificação de id de grupo global.
			var existeBRI = true;
			var contemItemAtual = false;

			//Garante que tem todos os itens inseridos no vetor vBrindesAgrupadosItensPedidoTotal. Incluindo o oItemPedido. 
			for (var i = 0; i < that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++) {
				if (that.PDControllerCmpGlobal.oItemPedido.matnr == that.PDControllerCmpGlobal.objItensPedidoTemplate[i].matnr) {
					contemItemAtual = true;
				}

				aux = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
				vBrindesAgrupadosItensPedidoTotal.push(aux);

			}
			if (!contemItemAtual) {
				vBrindesAgrupadosItensPedidoTotal.push(that.PDControllerCmpGlobal.oItemPedido);
			}

			//Verifica se o vetor tem apenas Brindes. Se tiver retornar.
			for (i = 0; i < vBrindesAgrupadosItensPedidoTotal.length; i++) {

				if (vBrindesAgrupadosItensPedidoTotal[i].mtpos != "YBRI" && vBrindesAgrupadosItensPedidoTotal[i].mtpos != "YAMO") {
					existeBRI = false;
				}
			}

			if (existeBRI) {
				return "OK";
			}

			for (i = 0; i < vBrindesAgrupadosItensPedidoTotal.length; i++) {

				if (vBrindesAgrupadosItensPedidoTotal[i].mtpos != "YBRI" && vBrindesAgrupadosItensPedidoTotal[i].mtpos != "YAMO") {
					vBrindesAgrupadosItensPedido.push(vBrindesAgrupadosItensPedidoTotal[i]);
				}
			}

			//Ordenando para desconto Familia normal. Utiliza vetor global de itens (objItensPedidoTemplate).
			vBrindesAgrupadosItensPedido.sort(function(a, b) {
				return a.zzGrupoGlobal - b.zzGrupoGlobal;
			});

			/*Percorre os itens já inseridos e identica se atingiu a quantidade do grupo da Camp global */
			for (i = 0; i < vBrindesAgrupadosItensPedido.length; i++) {

				if (proximoItemDiferente == true) {
					proximoItemDiferente = false;
					vetorGrpFamilia = [];
				}

				if (vetorGrpFamilia.length == 0 && vBrindesAgrupadosItensPedido.length == 1 && vBrindesAgrupadosItensPedido[i].tipoItem != "Diluido") {

					//o vetor de itens tem um unico item. nesse caso já tenho que verificar 
					//se já atingiu a quantidade para utilizar os brindes.

					vetorGrpFamilia.push(vBrindesAgrupadosItensPedido[i]);
					retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);

				} else if (vBrindesAgrupadosItensPedido.length > 1 && (i + 1) < vBrindesAgrupadosItensPedido.length && vBrindesAgrupadosItensPedido[i].tipoItem != "Diluido") {

					if (vBrindesAgrupadosItensPedido[i].zzGrupoGlobal == vBrindesAgrupadosItensPedido[i + 1].zzGrupoGlobal) {

						proximoItemDiferente = false;
						vetorGrpFamilia.push(vBrindesAgrupadosItensPedido[i]);

					} else {
						//Nesse momento tenho os itens da mesma familia.. tendo os itens da familia .. somar as quantidades
						vetorGrpFamilia.push(vBrindesAgrupadosItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
						proximoItemDiferente = true;
					}

				} else if ((i + 1) == vBrindesAgrupadosItensPedido.length && vBrindesAgrupadosItensPedido[i].tipoItem != "Diluido") {

					//sinal proximoItemDiferente = true e limpou
					if (vetorGrpFamilia.length > 0) {

						vetorGrpFamilia.push(vBrindesAgrupadosItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);

					} else {
						//ultimo item e é diferente do antepenultimo
						vetorGrpFamilia.push(vBrindesAgrupadosItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
					}
				}
			}

			if (retorno == "OK") {
				return retorno;
			} else {
				return retorno;
			}
		},

		//Verifica quantas vezes vai poder utilizar o range dos brindes, Rotina executada antes da inserção do item no total dos itens.
		onCheckQuantidadeGlobal: function(vetorGrpFamilia) {
			// var that = this;
			var qntItens = 0;
			var valorRange = 0;
			var zzGrupoGlobal = "";
			//variável que grava quantas vezes o kra pode usar o range de brindes.
			//Ex: se o range a ser atingido for 20 itens para usar os brindes e a quantidade digita do produto for 40.
			// essa variavel irá armazenar 2. (Quantidade atingida a ser utilizada).
			var qntParaUtilizar = 0;

			for (var i = 0; i < vetorGrpFamilia.length; i++) {

				qntItens += vetorGrpFamilia[i].zzQnt;
				valorRange = vetorGrpFamilia[i].zzQntRegraGb;
				zzGrupoGlobal = vetorGrpFamilia[i].zzGrupoGlobal;

			}

			if (qntItens >= valorRange && valorRange > 0) {

				qntParaUtilizar = parseInt(qntItens / valorRange, 10);

			} else {

				qntParaUtilizar = 0;
			}

			for (i = 0; i < vetorGrpFamilia.length; i++) {
				//atualiza o item atual.
				if (vetorGrpFamilia[i].matnr == that.PDControllerCmpGlobal.oItemPedido.matnr) {
					if (qntParaUtilizar > 0) {
						that.PDControllerCmpGlobal.oItemPedido.zzAtingiuCmpGlobal = "Sim";
					} else {
						that.PDControllerCmpGlobal.oItemPedido.zzAtingiuCmpGlobal = "Não";
					}
				}
				for (var j = 0; j < that.PDControllerCmpGlobal.objItensPedidoTemplate.length; j++) {
					//Atualiza o vetor de itens já inseridos
					if (vetorGrpFamilia[i].matnr == that.PDControllerCmpGlobal.objItensPedidoTemplate[j].matnr) {
						if (qntParaUtilizar > 0) {
							that.PDControllerCmpGlobal.objItensPedidoTemplate[j].zzAtingiuCmpGlobal = "Sim";
						} else {
							that.PDControllerCmpGlobal.objItensPedidoTemplate[j].zzAtingiuCmpGlobal = "Não";
						}
					}
				}
			}

			if (qntItens >= valorRange) {
				console.log("O grupo " + zzGrupoGlobal + " teve " + qntItens + " itens e pode utilizar os brindes.");
			} else {
				console.log("O grupo " + zzGrupoGlobal + " teve " + qntItens + " e não atingiu o rangedos itens.");
			}
			return "OK";
		},

		onVerificarEvento: function(sIdControle, oMetodoEvento, sTipoEvento) {
			var oEventRegistry;
			var oElemento;

			if (that.PDControllerCmpGlobal.byId(sIdControle)) {
				oElemento = that.PDControllerCmpGlobal.byId(sIdControle);
			} else if (sap.ui.getCore().byId(sIdControle)) {
				oElemento = sap.ui.getCore().byId(sIdControle);
			}

			/* Verifico se o componente existe */
			//if (that.PDControllerCmpGlobal.byId(sIdControle)){
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

		/* Campanha Global Primeira função */
		//Esse metodo carrega todas as informações da campanha global e inseri no item para ser usado depois.
		onValidarItensCampanhaGlobal: function(ItemPedido, resolveTopo, rejectTopo) {

			//Promise secundaria que resolve a promise primária passada por parâmetro
			new Promise(function(resolve, reject) {
				/* Busca o grupo da camp global do item selecionado */
				that.onBuscaGrupoCmpGlobal(ItemPedido, resolve, reject);

			}).then(function() {
				resolveTopo();
				//Verifica a quantidade de itens que tem que ser vendidos para entrar na campanha
				// that.onVerifQuantCmpGlobal(db, ItemPedido, resolveTopo, rejectTopo);

			}).catch(function(Matnr) {

				/* Não achou grupo do material para campanha Global */
				console.log("Matnr: " + Matnr + " não possui Grupo Cmp Global.");
				resolveTopo();
			});

		},
		/* Fim Campanha Global Primeira função */

		//Busca em qual grupo da campanha Global o item pertence.
		onBuscaGrupoCmpGlobal: function(ItemPedido, resolve, reject) {
			var auxVetor = false;

			for (var i = 0; i < this.oCmpGB.length; i++) {
				for (var j = 0; j < this.oCmpGB[i].PAs.length; j++) {
					if (this.oCmpGB[i].PAs[j].material == ItemPedido.matnr) {
						this.setLog("Matnr: " + this.oCmpGB[i].PAs[j].material + ", Grupo: " + this.oCmpGB[i].PAs[j].grupo + ", SubGrupo: " + this.oCmpGB[i].PAs[j].subGrupo, "CPG");
						ItemPedido.zzGrupoGlobal = this.oCmpGB[i].PAs[j].grupo;
						//trocar a referência do sub grupo;
						ItemPedido.zzSubGrupoGlobal = this.oCmpGB[i].PAs[j].subGrupo;
						auxVetor = true;
						break;
					}
				}

				if (auxVetor) {
					ItemPedido.zzQntRegraGb = this.oCmpGB[i].quantidade;
					auxVetor = false;
				}
			}

			if (auxVetor) {
				resolve(ItemPedido);
			} else {
				reject(ItemPedido.matnr);
			}

			//Verifica se o item item grupo de Campanha Global para ser Agrupado. Senão tiver zzGrupoGlobal = 0;
			// var transaction = db.transaction("CmpGbGrpProdsAcabs", "readonly");
			// var objectStoreMaterial = transaction.objectStore("CmpGbGrpProdsAcabs");

			// var indexMatnr = objectStoreMaterial.index("material");

			// var request = indexMatnr.get(ItemPedido.matnr);

			// request.onsuccess = function(event) {

			// 	var result = event.target.result;

			// 	if (result != undefined && result != null) {

			// 		console.log("Matnr: " + result.material + ", Grupo: " + result.grupo + ", SubGrupo: " + result.subGrupo);
			// 		ItemPedido.zzGrupoGlobal = result.grupo;
			// 		//trocar a referência do sub grupo;
			// 		ItemPedido.zzSubGrupoGlobal = result.subGrupo;
			// 		resolve(ItemPedido);

			// 	} else {
			// 		//Se não achar o item cadastrado na camp global, setar o id do grupo e a quantidade de range como 0.
			// 		//no catch da promise
			// 		reject(ItemPedido.matnr);

			// 	}
			// };
		},

		//Quantidade que este grupo deve vender na Camp Global.
		onVerifQuantCmpGlobal: function(db, ItemPedido, resolveTopo, rejectTopo) {
			var transaction = db.transaction("CmpGbProdsAcabs", "readonly");
			var objectStore = transaction.objectStore("CmpGbProdsAcabs");
			var indexGrupo = objectStore.index("grupo");

			var request = indexGrupo.get(ItemPedido.zzGrupoGlobal);

			request.onsuccess = function(event) {

				var result = event.target.result;

				if (result != undefined && result != null) {

					//zzQntRegraGb vai ser a variavel para identificar a quantidade que o kra tem que comprar 
					//pra ativar a bonificação
					console.log("Material: " + ItemPedido.matnr + ", Qtd: " + parseFloat(result.quantidade));
					ItemPedido.zzQntRegraGb = parseFloat(result.quantidade);
					resolveTopo();

				} else {

					// Quando não tem range para ativar campanha. (Quantidade necessaria para ativar Campanha Global)
					MessageBox.show("Falta o cadastro na tabela de ranges para o material " + ItemPedido.matnr + " para utilizar na campanha Global.", {
						icon: MessageBox.Icon.ERROR,
						title: "Entre em contato com a TI da VB!",
						actions: [MessageBox.Action.OK],
						onClose: function() {

						}
					});

					rejectTopo();
				}
			};
		},

		/* Validação de itens inseridos da campanha Global */
		/* 1.1º Função que divide o vetor em grupos de campanha e chama outra função para checar quantidade */
		onAgrupaValidaItensCampGlobal: function(bInserindoItem, res, rej, aba) {

			var vetorTodosItensPedido = [];
			var vetorItens = [];
			var vetorBrindes = [];

			if (that.PDControllerCmpGlobal.getModel("modelAux").getProperty("/EditarindexItem") === 0 && !aba) {
				var aux = this.PDControllerCmpGlobal.oItemPedido;
				vetorTodosItensPedido.push(aux);
			}

			for (var i = 0; i < that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++) {
				var aux = [];
				aux = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
				vetorTodosItensPedido.push(aux);
			}

			var retornoVetor = that.onDivideItensCmpGlobal(vetorTodosItensPedido);

			vetorItens = retornoVetor[0];
			vetorBrindes = retornoVetor[1];

			console.error(vetorItens, "Itens");
			console.error(vetorBrindes, "Brindes");

			//Ordena o subGrupo dos itens
			vetorItens.sort(function(a, b) {
				return parseInt(a.zzSubGrupoGlobal, 10) - parseInt(b.zzSubGrupoGlobal, 10);
			});

			vetorBrindes.sort(function(a, b) {
				return a.zzSubGrupoGlobal.indexOf(b.zzSubGrupoGlobal);
			});

			res([vetorItens, vetorBrindes]);
		},

		//Validação da Campanha Global
		/* 1.2º Função que separa em Brindes e itens Normais */
		onDivideItensCmpGlobal: function(todosItens) {
			// var mensagemCmpGlobal = "";
			var vetorBrindes = [];
			var vetorItens = [];
			// var vBrindesAgrupadosItensPedido = [];

			//Carregar o vetor de brindes.
			for (var i = 0; i < todosItens.length; i++) {
				if (todosItens[i].mtpos !== "YBRI" && todosItens[i].zzSubGrupoGlobal !== "0") {
					var aux2 = todosItens[i];
					vetorItens.push(aux2);
				}
				//Adiciona os itens que fazem parte do mesmo id da campanha que está sendo inserido.
				else if (todosItens[i].mtpos === "YBRI" && todosItens[i].zzSubGrupoGlobal !== "") {
					var aux3 = todosItens[i];
					vetorBrindes.push(aux3);
				}
			}

			return [vetorItens, vetorBrindes];

			// mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vBrindesAgrupadosItensPedido, vetorBrindes, that);
			// return mensagemCmpGlobal;

		},

		//Checa se as quantidades são permitidas para inserir os itens
		/* 2º Função que faz a contagem dos itens permitidos por cada campanha */
		onSepararValidarItens: function(vetorItens, vetorBrindes) {
			var vetorQntItens = [];
			var vetorQntBrindes = [];
			var mensagemCmpGlobal = "OK";
			var mensagemItensEnvolvidos = [];
			var mensagemBrindesEnvolvidos = [];
			var qntTotalBrindes = 0;

			//Verifca os itens, somando a quantidade permitida.

			/* Preciso ordenar os itens pelo grupo Global crescente, pra separar num segundo vetor agrupado posteriormente */
			// vetorItens.sort(function(a, b) {
			// 	if (a.zzSubGrupoGlobal > b.zzSubGrupoGlobal) {
			// 		return 1;
			// 	}
			// 	if (a.zzSubGrupoGlobal < b.zzSubGrupoGlobal) {
			// 		return -1;
			// 	}
			// });
			
			vetorItens.sort(function(proximo, anterior) {
				/* Se a quantidade do primeiro item for menor , movo pra baixo*/
				if (proximo.zzSubGrupoGlobal < anterior.zzSubGrupoGlobal) return -1;
				/* Se for maior, movo pra baixo */
				if (proximo.zzSubGrupoGlobal > anterior.zzSubGrupoGlobal) return 1;

				/* Se a quantidade do primeiro item for maior, movo pra cima */
				if (proximo.zzGrupoGlobal < anterior.zzGrupoGlobal) return -1;
				/* Se não, movo pra baixo */
				if (proximo.zzGrupoGlobal > anterior.zzGrupoGlobal) return 1;
			});
			
			vetorQntItens = this.onAgruparQuantidadesPA(vetorItens);

			vetorQntBrindes = this.onAgruparQuantidades(vetorBrindes);

			/* Percorro todos os itens grupados por grupo de PA */
			for (var i = 0; i < vetorQntItens.length; i++) {

				/* Verifico se pra essa posição dos itens, a campanha é válida para o grupo inteiro */
				vetorQntItens[i].bCampanhaAtivaGrupo = false;
				/* Ou seja, se a quantidade mínima (zzQntRegraGb) foi atingida para o grupo de PA em questão (zzQntTotalGrupo)*/
				if (vetorQntItens[i].zzQntTotalGrupo >= vetorQntItens[i].zzQntRegraGb) {
					vetorQntItens[i].bCampanhaAtivaGrupo = true;
				}

				vetorQntItens[i].zzQntTotalSubGrupoLimitePA = 0;
				/* Para cada subgrupo de brindes, procuro se ele existe no no vetor vetorQntItens e somo as quantidades */
				for (var j = 0; j < vetorQntItens.length; j++) {

					/* Se o subgrupo do item conter em algum subugrupo do brinde em questão, somo as quantidades*/
					if (vetorQntItens[j].zzSubGrupoGlobal.indexOf(vetorQntItens[i].zzSubGrupoGlobal) != -1) {
						vetorQntItens[i].zzQntTotalSubGrupoLimitePA += vetorQntItens[j].zzQnt;
					}
				}

				/* Para cada subgrupo de brindes, procuro se ele existe no no vetor vetorQntBrindes e somo as quantidades */
				vetorQntItens[i].zzQntTotalSubGrupoAcumulada = 0;
				for (var j = 0; j < vetorQntBrindes.length; j++) {

					/* Se o subgrupo do item conter em algum subugrupo do brinde em questão, somo as quantidades*/
					if (vetorQntBrindes[j].zzSubGrupoGlobal.indexOf(vetorQntItens[i].zzSubGrupoGlobal) != -1) {
						vetorQntItens[i].zzQntTotalSubGrupoAcumulada += vetorQntBrindes[j].zzQnt;
					}
				}
			}

			/* Ordeno o vetor de brindes do mais específico para o mais genérico */
			vetorQntBrindes.sort(function(a, b) {
				if (a.zzSubGrupoGlobal.length > b.zzSubGrupoGlobal.length) {
					return 1;
				}
				if (a.zzSubGrupoGlobal.length < b.zzSubGrupoGlobal.length) {
					return -1;
				}
			});

			this.setLog(vetorItens, "CPG-vetorItens");
			this.setLog(vetorQntBrindes, "CPG-vetorQntBrindes");

			/* Percorro o vetor dos itens*/
			/* Preencho com a quantidade da campanha somente para os grupos ativos */
			for (i = 0; i < vetorQntItens.length; i++) {
				if (vetorQntItens[i].bCampanhaAtivaGrupo) {
					vetorQntItens[i].zzQntCP = vetorQntItens[i].zzQnt;
				} else {
					vetorQntItens[i].zzQntCP = 0;
				}
			}

			/* Percorro todos os brindes para ver se existe quantidade disponíveis para eles na campanha */
			for (i = 0; i < vetorQntBrindes.length; i++) {

				/* Trato quando o brinde é compartilhado com vários subgrupos */
				var vSubGrupos = vetorQntBrindes[i].zzSubGrupoGlobal.split("|");

				/* Elimino as posições em branco*/
				vSubGrupos = vSubGrupos.filter(function(a, b, c) {
					return a != "";
				});

				var iQtdeBrindesNecessaria = vetorQntBrindes[i].zzQnt;

				/* Para o brinde em questão, preciso ordenar de menções que existem da posição atual pra baixo.*/
				var vGrupos = [];
				var oGrupo;
				for (j = 0; j < vSubGrupos.length; j++) {
					oGrupo = new Object();
					oGrupo.subgrupo = vSubGrupos[j];
					/* Essa variável (qntSG) controla quantas vezes esse subgrupo é mencionado da posição atual pra baixo, pra 
					posteriormente eu ordenar do mais específico (menos vezes mencionado) pro mais genérico (mais vezes mencionado)*/
					oGrupo.qntSG = 0;

					/* Percorro o vetor de brindes da posição atual pra baixo pra ver quais grupos são mais específicos*/
					for (var k = i; k < vetorQntBrindes.length; k++) {
						/* Trato quando o brinde é compartilhado com vários subgrupos */
						var vSubGrupos2 = vetorQntBrindes[k].zzSubGrupoGlobal.split("|");

						/* Elimino as posições em branco*/
						vSubGrupos2 = vSubGrupos2.filter(function(a, b, c) {
							return a != "";
						});

						for (var l = 0; l < vSubGrupos2.length; l++) {
							if (oGrupo.subgrupo === vSubGrupos2[l]) {
								oGrupo.qntSG += 1;
							}
						}
					}

					oGrupo.zzQntCP = 0;
					/* Acumulo o saldo dos grupos em questão, pois caso tenha itens igualmente mencionados, ordeno por quantidade de itens disponíveis. */
					for (k = 0; k < vetorQntItens.length; k++) {

						if (vSubGrupos[j] === vetorQntItens[k].zzSubGrupoGlobal) {
							oGrupo.zzQntCP += vetorQntItens[k].zzQntCP;
						}
					}

					vGrupos.push(oGrupo);
				}

				/* Ordeno pelos grupos menos mencionados primeiro*/
				vGrupos.sort(function(proximo, anterior) {
					/* Se a quantidade do primeiro item for menor , movo pra baixo*/
					if (proximo.qntSG < anterior.qntSG) return -1;
					/* Se for maior, movo pra baixo */
					if (proximo.qntSG > anterior.qntSG) return 1;
				});

				vGrupos.sort(function(proximo, anterior) {
					/* Se a quantidade do primeiro item for menor , movo pra baixo*/
					if (proximo.qntSG < anterior.qntSG) return -1;
					/* Se for maior, movo pra baixo */
					if (proximo.qntSG > anterior.qntSG) return 1;

					/* Se for a mesma, ordeno por quantidade disponível */
					/* Se a quantidade do primeiro item for maior, movo pra cima */
					if (proximo.zzQntCP < anterior.zzQntCP) return 1;
					/* Se não, movo pra baixo */
					if (proximo.zzQntCP > anterior.zzQntCP) return -1;
				});

				/* A busca de quantidade deve ser por subgrupo */
				for (j = 0; j < vGrupos.length; j++) {

					/* Busco nas campanhas ativas se existe quantidade disponível para o brinde em questão*/
					for (var k = 0; k < vetorQntItens.length; k++) {

						/* Se campanha tá ativa para o subgrupo de PA*/
						if (vetorQntItens[k].bCampanhaAtivaGrupo) {

							/* Verifico se o subgrupo do brinde em questão é igual ao da campanha ativa */
							if (vGrupos[j].subgrupo === vetorQntItens[k].zzSubGrupoGlobal) {

								/* Se a quantidade disponível for zero, continuo o laço */
								if (vetorQntItens[k].zzQntCP === 0) {
									continue;
								}

								/* Se o saldo (iQtdeBrindesNecessaria) for maior que a quantidade disponível, 
								utilizo para o brinde em questão*/
								if (iQtdeBrindesNecessaria > vetorQntItens[k].zzQntCP) {
									/* Utilizo o que tem */
									iQtdeBrindesNecessaria -= vetorQntItens[k].zzQntCP;

									/* Reduzo o saldo */
									vetorQntItens[k].zzQntCP = 0;
									continue;
								}

								/* Se o que eu preciso é menor do que tem no grupo, retiro somente o necessário */
								if (iQtdeBrindesNecessaria <= vetorQntItens[k].zzQntCP) {
									vetorQntItens[k].zzQntCP -= iQtdeBrindesNecessaria;

									iQtdeBrindesNecessaria = 0;
									continue;
								}
							}
						}
					}
				}

				if (iQtdeBrindesNecessaria > 0) {
					/* Removo o último PIPE (|) do subgrupo (somente para exibir melhor na mensagem) */
					var sMatnr = vetorQntBrindes[i].matnr.substr(0, vetorQntBrindes[i].matnr.length - 1);

					mensagemCmpGlobal = "Saldo insuficiente de campanha para o brinde {matnr}. Quantidade necessária: {qtn}";

					mensagemCmpGlobal = mensagemCmpGlobal.replace("{matnr}", sMatnr);
					mensagemCmpGlobal = mensagemCmpGlobal.replace("{qtn}", iQtdeBrindesNecessaria.toString());
					return [mensagemCmpGlobal];
				} else {
					mensagemCmpGlobal = "OK";
				}
			}

			/* Se percorreu o loop e deu certo, retorno OK*/
			if (mensagemCmpGlobal == "OK") {
				return "OK";
			}
		},

		onAgruparQuantidadesPA: function(vetorItens) {

			var proximoItemIgual = false;
			var inserirNovoItem = false;
			var vetorQntItens = [];

			/* Percorre todos os itens do pedido */
			for (var i = 0; i < vetorItens.length; i++) {

				var objVetorQntItens = {
					zzQnt: 0,
					zzSubGrupoGlobal: ""
				};

				//Somar a quantidade no vetor que já está adicionado (se for diferente do ultimo)
				//Quando o proximo item do correntefor é igual .. Atualizar a qnt
				if (proximoItemIgual && !inserirNovoItem && (i + 1) !== vetorItens.length) {

					for (var o = 0; o < vetorQntItens.length; o++) {
						if ((vetorQntItens[o].zzSubGrupoGlobal === vetorItens[i].zzSubGrupoGlobal) && (vetorQntItens[o].zzGrupoGlobal === vetorItens[i].zzGrupoGlobal)) {
							vetorQntItens[o].zzQnt += vetorItens[i].zzQnt;
						}
					}

				} else if (!proximoItemIgual && inserirNovoItem && (i + 1) !== vetorItens.length) {
					//Quando o proximo item do corrente for dif .. Inserir ele no vetor (se for diferente do ultimo)

					// objVetorQntItens.matnr = vetorItens[i].matnr;
					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
					objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
					objVetorQntItens.zzGrupoGlobal = vetorItens[i].zzGrupoGlobal;

					vetorQntItens.push(objVetorQntItens);
				}

				//Reseta a variável depois que adicionou no vetor 
				proximoItemIgual = false;
				inserirNovoItem = false;

				if (i === 0) {

					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
					objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
					objVetorQntItens.zzGrupoGlobal = vetorItens[i].zzGrupoGlobal;

					vetorQntItens.push(objVetorQntItens);

					if (vetorItens.length > 1 && ((vetorItens[i].zzSubGrupoGlobal === vetorItens[i + 1].zzSubGrupoGlobal) && (vetorItens[i].zzGrupoGlobal === vetorItens[i + 1].zzGrupoGlobal))) {
						proximoItemIgual = true;

					} else if ((vetorItens.length > 1 && vetorItens[i].zzSubGrupoGlobal !== vetorItens[i + 1].zzSubGrupoGlobal) || (vetorItens[i].zzGrupoGlobal !== vetorItens[i + 1].zzGrupoGlobal)) {
						inserirNovoItem = true;
					}

				} else if (i > 0 && (i + 1) < vetorItens.length) {

					if ((vetorItens[i].zzSubGrupoGlobal === vetorItens[i + 1].zzSubGrupoGlobal) && (vetorItens[i].zzGrupoGlobal === vetorItens[i + 1].zzGrupoGlobal)) {
						proximoItemIgual = true;
						//Procurar e atualizar a quantidade

					} else if ((vetorItens[i].zzSubGrupoGlobal !== vetorItens[i + 1].zzSubGrupoGlobal) || (vetorItens[i].zzGrupoGlobal !== vetorItens[i + 1].zzGrupoGlobal)){
						inserirNovoItem = true;
					}
					
					/* SE FOR O ÚLTIMO ITEM */
				} else if ((i + 1) === vetorItens.length) {

					// Se o atual for o ultimo e igual ao penultimo (Atualizar). Senão Inserir no vetor.
					if ((vetorItens[i].zzSubGrupoGlobal === vetorItens[i - 1].zzSubGrupoGlobal) && (vetorItens[i].zzGrupoGlobal === vetorItens[i - 1].zzGrupoGlobal)) {
						//Atualiza
						for (o = 0; o < vetorQntItens.length; o++) {
							if ((vetorQntItens[o].zzSubGrupoGlobal === vetorItens[i].zzSubGrupoGlobal) && (vetorQntItens[o].zzGrupoGlobal === vetorItens[i].zzGrupoGlobal)) {
								vetorQntItens[o].zzQnt += vetorItens[i].zzQnt;
								vetorQntItens[o].zzQntRegraGb = vetorItens[i].zzQntRegraGb;
								vetorQntItens[o].zzGrupoGlobal = vetorItens[i].zzGrupoGlobal;
							}
						}

					} else if ((vetorItens[i].zzSubGrupoGlobal !== vetorItens[i - 1].zzSubGrupoGlobal) &&  (vetorItens[i].zzGrupoGlobal !== vetorItens[i - 1].zzGrupoGlobal)) {
						//Insere
						// objVetorQntItens.matnr = vetorQntItens[o];
						objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
						objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
						objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
						objVetorQntItens.zzGrupoGlobal = vetorItens[i].zzGrupoGlobal;

						vetorQntItens.push(objVetorQntItens);
					}
				}
			}

			var bRetorno;
			var bEncontrouRegistro;
			var vGrupos = [];

			/* Recupero um vetor com os grupos de PAs únicos*/
			for (i = 0; i < vetorQntItens.length; i++) {
				bEncontrouRegistro = false;

				// Se for primeira linha
				if (i === 0) {
					vGrupos.push(vetorQntItens[i]);
				} else {
					/* Verifico se o gruop em questão não existe no vetor de grupos */
					for (var j = 0; j < vGrupos.length; j++) {

						if (vetorQntItens[i].zzGrupoGlobal === vGrupos[j].zzGrupoGlobal) {
							bEncontrouRegistro = true;
						}
					}

					if (bEncontrouRegistro === false) {
						vGrupos.push(vetorQntItens[i]);
					}
				}
			}

			var vSubGrupos = [];

			/* Recupero um vetor com os subgrupos de brindes únicos */
			for (i = 0; i < vetorQntItens.length; i++) {
				bEncontrouRegistro = false;

				// Se for primeira linha
				if (i === 0) {
					vSubGrupos.push(vetorQntItens[i]);
				} else {
					/* Verifico se o gruop em questão não existe no vetor de grupos */
					for (var j = 0; j < vSubGrupos.length; j++) {

						if (vetorQntItens[i].zzSubGrupoGlobal === vSubGrupos[j].zzSubGrupoGlobal) {
							bEncontrouRegistro = true;
						}
					}

					if (bEncontrouRegistro === false) {
						vSubGrupos.push(vetorQntItens[i]);
					}
				}
			}

			var iQtde = 0;
			/* Somo as quantidades por grupos de PA */
			for (i = 0; i < vGrupos.length; i++) {

				iQtde = 0;
				/*Somo todas as quantidades*/
				for (j = 0; j < vetorQntItens.length; j++) {
					if (vGrupos[i].zzGrupoGlobal == vetorQntItens[j].zzGrupoGlobal) {
						iQtde += vetorQntItens[j].zzQnt;
					}
				}

				/*Atribuo a todos os vetores com o mesmo grupo*/
				for (j = 0; j < vetorQntItens.length; j++) {
					if (vGrupos[i].zzGrupoGlobal == vetorQntItens[j].zzGrupoGlobal) {
						vetorQntItens[j].zzQntTotalGrupo = iQtde;
					}
				}
			}

			return vetorQntItens;
		},

		/* 2.1 Agrupar em quantidades, tanto o vetor de itens como o vetor de brindes. */
		onAgruparQuantidades: function(vetorItens) {

			var proximoItemIgual = false;
			var inserirNovoItem = false;
			var vetorQntItens = [];

			/* Percorre todos os itens do pedido */
			for (var i = 0; i < vetorItens.length; i++) {

				var objVetorQntItens = {
					zzQnt: 0,
					zzSubGrupoGlobal: "",
					matnr: ""
				};

				//Somar a quantidade no vetor que já está adicionado (se for diferente do ultimo)
				//Quando o proximo item do correntefor é igual .. Atualizar a qnt
				if (proximoItemIgual && !inserirNovoItem && (i + 1) !== vetorItens.length) {

					for (var o = 0; o < vetorQntItens.length; o++) {
						if (vetorQntItens[o].zzSubGrupoGlobal === vetorItens[i].zzSubGrupoGlobal) {
							vetorQntItens[o].zzQnt += vetorItens[i].zzQnt;
							vetorQntItens[o].matnr += vetorItens[i].matnr + ";";
						}
					}

				} else if (!proximoItemIgual && inserirNovoItem && (i + 1) !== vetorItens.length) {
					//Quando o proximo item do corrente for dif .. Inserir ele no vetor (se for diferente do ultimo)

					// objVetorQntItens.matnr = vetorItens[i].matnr;
					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
					objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
					objVetorQntItens.matnr += vetorItens[i].matnr + ";";

					vetorQntItens.push(objVetorQntItens);
				}

				//Reseta a variável depois que adicionou no vetor 
				proximoItemIgual = false;
				inserirNovoItem = false;

				if (i === 0) {

					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
					objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
					objVetorQntItens.matnr += vetorItens[i].matnr + ";";

					vetorQntItens.push(objVetorQntItens);

					if (vetorItens.length > 1 && vetorItens[i].zzSubGrupoGlobal === vetorItens[i + 1].zzSubGrupoGlobal) {
						proximoItemIgual = true;

					} else if (vetorItens.length > 1 && vetorItens[i].zzSubGrupoGlobal !== vetorItens[i + 1].zzSubGrupoGlobal) {
						inserirNovoItem = true;
					}

				} else if (i > 0 && (i + 1) < vetorItens.length) {

					if (vetorItens[i].zzSubGrupoGlobal === vetorItens[i + 1].zzSubGrupoGlobal) {
						proximoItemIgual = true;
						//Procurar e atualizar a quantidade

					} else if (vetorItens[i].zzSubGrupoGlobal !== vetorItens[i + 1].zzSubGrupoGlobal) {
						inserirNovoItem = true;
					}

				} else if ((i + 1) === vetorItens.length) {

					// Se o atual for o ultimo e igual ao penultimo (Atualizar). Senão Inserir no vetor.
					if (vetorItens[i].zzSubGrupoGlobal === vetorItens[i - 1].zzSubGrupoGlobal) {
						//Atualiza
						for (o = 0; o < vetorQntItens.length; o++) {
							if (vetorQntItens[o].zzSubGrupoGlobal === vetorItens[i].zzSubGrupoGlobal) {
								vetorQntItens[o].zzQnt += vetorItens[i].zzQnt;
								vetorQntItens[o].zzQntRegraGb = vetorItens[i].zzQntRegraGb;
							}
						}

					} else if (vetorItens[i].zzSubGrupoGlobal !== vetorItens[i - 1].zzSubGrupoGlobal) {
						//Insere
						// objVetorQntItens.matnr = vetorQntItens[o];
						objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
						objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;
						objVetorQntItens.zzQntRegraGb = vetorItens[i].zzQntRegraGb;
						objVetorQntItens.matnr += vetorItens[i].matnr + ";";

						vetorQntItens.push(objVetorQntItens);
					}
				}
			}

			vetorQntItens.sort(function(proximo, anterior) {
				/* Se a quantidade do primeiro item for menor , movo pra baixo*/
				if (proximo.zzSubGrupoGlobal.length < anterior.zzSubGrupoGlobal.length) return -1;
				/* Se for maior, movo pra baixo */
				if (proximo.zzSubGrupoGlobal.length > anterior.zzSubGrupoGlobal.length) return 1;

				/* Se for a mesma, ordeno por quantidade disponível */
				/* Se a quantidade do primeiro item for maior, movo pra cima */
				if (proximo.zzQnt > anterior.zzQnt) return 1;
				/* Se não, movo pra baixo */
				if (proximo.zzQnt < anterior.zzQnt) return -1;
			});

			return vetorQntItens;
		},

		onCheckBrindeCampanhaGlobal: function(oItemPedido, res, rej, aba) {
			var oPanel = sap.ui.getCore().byId("idDialog");
			//Armazena quantas vezes os brindes podem ser usados
			var mensagemCmpGlobal = "";
			var bEncontrouBrinde = false;
			oItemPedido.zzSubGrupoGlobal = "";

			//Essa variavel verifica se encontrar mais que um subgrupo cadastrado para o brinde, ativa uma variavel 
			// zzMultSubGrupo para true. Isso mostra que devo procurar todos os brindes com todos os subgrupos cadastrados.
			var ativarMultSubGrupo = 0;

			for (var i = 0; i < this.oCmpGB.GrBrindes.length; i++) {
				for (var j = 0; j < this.oCmpGB.GrBrindes[i].brindes.length; j++) {

					if (this.oCmpGB.GrBrindes[i].brindes[j].material === oItemPedido.matnr) {
						//Se encontrar o brinde na tabela cadastrada. Setar ele como oItemPedido.zzUtilCampGlobal = Sim, pois não irá cobrar brinde deste item. 
						oItemPedido.zzUtilCampGlobal = "Sim";

						//Encontrou o brinde na campanha Global. Agora tem que verificar se o item atinge a quantidade para utilizar os brindes.
						//Depois verificar se a quantidade digitada ultrapassa o limite permitido do item.
						oPanel.setBusy(false);

						//Parâmetro para verificar qual o grupo que o brinde pertence.
						oItemPedido.zzSubGrupoGlobal += this.oCmpGB.GrBrindes[i].brindes[j].grupo + "|";
						ativarMultSubGrupo += 1;

						bEncontrouBrinde = true;
					}
				}
			}

			if (bEncontrouBrinde || aba) {
				if (ativarMultSubGrupo >= 2) {
					oItemPedido.zzMultSubGrupo = true;
				}

				new Promise(function(res1, rej1) {
					/* Busca o grupo da camp global do item selecionado */
					that.onAgrupaValidaItensCampGlobal(true, res1, rej1, aba);

				}).then(function(vetorItens) {

					//Carregar o vetor de itens que ativam a utilização das Campanhas 
					mensagemCmpGlobal = that.onSepararValidarItens(vetorItens[0], vetorItens[1]);

					if (mensagemCmpGlobal === "OK") {
						res(mensagemCmpGlobal);
					} else {
						rej(mensagemCmpGlobal);
					}

				}).catch(function(Matnr) {
					var msg = [];
					msg.push("Erro na separação entre itens normais e itens para brindes.");

					rej(msg);
				});

			} else {

				mensagemCmpGlobal = [];
				mensagemCmpGlobal.push("OK");

				res(mensagemCmpGlobal);

			}
		}
	});
});