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

					var itensEnvolvidos = "";
					var brindesEnvolvidos = "";
					if (mensagemCmpGlobal[1] !== undefined) {
						for (var a = 0; a < mensagemCmpGlobal[1].length; a++) {
							itensEnvolvidos += "<li> Material:" + mensagemCmpGlobal[1][a].matnr + ", Qnt: " + mensagemCmpGlobal[1][a].zzQnt + ", SubGrupo: " + mensagemCmpGlobal[1][a].zzSubGrupoGlobal + "</li>";
						}
					}
					if (mensagemCmpGlobal[2] !== undefined) {
						for (a = 0; a < mensagemCmpGlobal[2].length; a++) {
							brindesEnvolvidos += "<li> Material:" + mensagemCmpGlobal[2][a].matnr + ", Qnt: " + mensagemCmpGlobal[2][a].zzQnt + ", SubGrupo: " + mensagemCmpGlobal[2][a].zzSubGrupoGlobal + "</li>";
						}
					}

					MessageBox.show(mensagemCmpGlobal[0], {
						icon: MessageBox.Icon.ERROR,
						title: "Brinde inválido.",
						actions: [MessageBox.Action.OK],
						details: "<p><strong>Itens: </strong></p>\n" +
							"<ul>" +
							itensEnvolvidos +
							"</ul>" +
							"<p><strong>Brindes: </strong></p>\n" +
							"<ul>" +
							brindesEnvolvidos +
							"\n</ul>",
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
			// var vetorAuxItensPedido = [];

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

			// mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorAuxItensPedido, vetorBrindes, that);
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
			var qntTotalItens = 0;

			//Verifca os itens, somando a quantidade permitida.

			vetorQntItens = this.onAgruparQuantidades(vetorItens);
			console.error(vetorQntItens, "Vetor de Qnt Itens");

			vetorQntBrindes = this.onAgruparQuantidades(vetorBrindes);
			console.error(vetorQntBrindes, "Vetor de Qnt Brindes");
			
			this.onCheckQuantidadeGlobal();

			vetorQntBrindes.sort(function(a, b) {
				if (a.zzSubGrupoGlobal.length < b.zzSubGrupoGlobal.length) {
					return 1;
				}
				if (a.zzSubGrupoGlobal.length > b.zzSubGrupoGlobal.length) {
					return -1;
				}
			});

			var encontrouSubGrupo = false;
			var vetorAux = [];

			//agrupa todos os brindes pelo subgrupo, somando as quantidades respectivas
			for (var t = 0; t < vetorQntBrindes.length; t++) {

				if (t === 0) {

					vetorAux.push(vetorQntBrindes[t]);

				} else {

					encontrouSubGrupo = false;

					for (var e = 0; e < vetorAux.length; e++) {

						if (vetorAux[e].zzSubGrupoGlobal.indexOf(vetorQntBrindes[t].zzSubGrupoGlobal) !== -1) {

							vetorAux[e].zzQnt += vetorQntBrindes[t].zzQnt;
							encontrouSubGrupo = true;

						}
					}

					if (!encontrouSubGrupo) {
						vetorAux.push(vetorQntBrindes[t]);
					}
				}
			}

			console.log(vetorAux, "Vetor agrupado Brindes");
			console.log(vetorQntItens, "Vetor agrupado Itens");

			for (var z = 0; z < vetorAux.length; z++) {

				qntTotalBrindes = vetorAux[z].zzQnt;
				qntTotalItens = 0;

				var subGrupo = vetorAux[z].zzSubGrupoGlobal.split("|");
				subGrupo.splice(subGrupo.length - 1, 1);

				if (subGrupo.length > 1) {

					for (var a = 0; a < subGrupo.length; a++) {
						for (var b = 0; b < vetorQntItens.length; b++) {
							if (subGrupo[a].indexOf(vetorQntItens[b].zzSubGrupoGlobal) > -1) {
								qntTotalItens += vetorQntItens[b].zzQnt;

							}
						}
					}

					if (qntTotalItens < qntTotalBrindes) {

						mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens + ". Quantidade de itens que está tentando inserir: " + qntTotalBrindes;

						for (var c = 0; c < subGrupo.length; c++) {

							for (var d = 0; d < vetorItens.length; d++) {

								if (vetorItens[d].zzSubGrupoGlobal === subGrupo[c]) {

									mensagemItensEnvolvidos.push(vetorItens[d]);
								}
							}

							for (e = 0; e < vetorBrindes.length; e++) {

								if (vetorBrindes[e].zzSubGrupoGlobal.indexOf(subGrupo[c]) > -1) {

									var jaInserido = false;

									for (var g = 0; g < mensagemBrindesEnvolvidos.length; g++) {
										if (vetorBrindes[e].matnr == mensagemBrindesEnvolvidos[g].matnr) {
											jaInserido = true;
										}
									}

									if (!jaInserido) {
										mensagemBrindesEnvolvidos.push(vetorBrindes[e]);
									}
								}
							}
						}

						return [mensagemCmpGlobal, mensagemItensEnvolvidos, mensagemBrindesEnvolvidos];

					} else {

						return "OK";

					}

				} else {

					for (b = 0; b < vetorQntItens.length; b++) {
						if (subGrupo[0].indexOf(vetorQntItens[b].zzSubGrupoGlobal) > -1) {
							qntTotalItens = vetorQntItens[b].zzQnt;

						}
					}

					if (qntTotalItens < qntTotalBrindes) {

						mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens + ". Quantidade de itens que está tentando inserir: " + qntTotalBrindes;

						for (c = 0; c < subGrupo.length; c++) {

							for (d = 0; d < vetorItens.length; d++) {

								if (vetorItens[d].zzSubGrupoGlobal === subGrupo[c]) {

									mensagemItensEnvolvidos.push(vetorItens[d]);
								}
							}

							for (e = 0; e < vetorBrindes.length; e++) {

								if (vetorBrindes[e].zzSubGrupoGlobal.indexOf(subGrupo[c]) > -1) {

									jaInserido = false;

									for (g = 0; g < mensagemBrindesEnvolvidos.length; g++) {
										if (vetorBrindes[e].matnr == mensagemBrindesEnvolvidos[g].matnr) {
											jaInserido = true;
										}
									}

									if (!jaInserido) {
										mensagemBrindesEnvolvidos.push(vetorBrindes[e]);
									}
								}
							}
						}

						return [mensagemCmpGlobal, mensagemItensEnvolvidos, mensagemBrindesEnvolvidos];

					} else {
						return "OK";
					}
				}
			}
		},

		/* 2.1 Agrupar em quantidades, tanto o vetor de itens como o vetor de brindes. */
		onAgruparQuantidades: function(vetorItens) {

			var proximoItemIgual = false;
			var inserirNovoItem = false;
			var vetorQntItens = [];

			for (var i = 0; i < vetorItens.length; i++) {

				var objVetorQntItens = {
					zzQnt: 0,
					zzSubGrupoGlobal: ""
				};

				//Somar a quantidade no vetor que já está adicionado (se for diferente do ultimo)
				//Quando o proximo item do correntefor é igual .. Atualizar a qnt
				if (proximoItemIgual && !inserirNovoItem && (i + 1) !== vetorItens.length) {

					for (var o = 0; o < vetorQntItens.length; o++) {
						if (vetorQntItens[o].zzSubGrupoGlobal === vetorItens[i].zzSubGrupoGlobal) {
							vetorQntItens[o].zzQnt += vetorItens[i].zzQnt;
						}
					}

					//Reseta a variável depois que adicionou no vetor 
					proximoItemIgual = false;

				} else if (!proximoItemIgual && inserirNovoItem && (i + 1) !== vetorItens.length) {
					//Quando o proximo item do corrente for dif .. Inserir ele no vetor (se for diferente do ultimo)

					// objVetorQntItens.matnr = vetorItens[i].matnr;
					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;

					vetorQntItens.push(objVetorQntItens);
				}

				if (i === 0) {

					objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
					objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;

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
							}
						}

					} else if (vetorItens[i].zzSubGrupoGlobal !== vetorItens[i - 1].zzSubGrupoGlobal) {
						//Insere
						// objVetorQntItens.matnr = vetorQntItens[o];
						objVetorQntItens.zzQnt = vetorItens[i].zzQnt;
						objVetorQntItens.zzSubGrupoGlobal = vetorItens[i].zzSubGrupoGlobal;

						vetorQntItens.push(objVetorQntItens);
					}
				}
			}
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