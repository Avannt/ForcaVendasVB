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
			/* CAMPOS - FIM */
			
			that.PDControllerCmpGlobal = sView;
			that.InicializarEventosCampGlobal();
			
		}, /* constructor */ 
		
		InicializarEventosCampGlobal: function() {
			 this.onVerificarEvento("idTopLevelIconTabBar", this.onSelectIconTabBarCmpGlobal, "select"); /* select */
		} /* InicializarEventosCampGlobal */ ,
		
		onSelectIconTabBarCmpGlobal: function(evt) {
			var item = evt.getParameters();

			if (item.selectedKey == "tab6" || item.selectedKey == "tab5") {
				that.onAgrupaValidaItensCampGlobal();
			}

		},
		/* onSelectIconTabBar */
		
		/* Campanha Global Primeiro método */
		//Esse metodo carrega todas as informações da campanha global e inseri no item para ser usado depois.
		onValidarItensCampanhaGlobal: function(db, ItemPedido, resolveTopo, rejectTopo) {
			
			//Promise secundaria que resolve a promise primária passada por parâmetro
			new Promise(function(resolve, reject) {
				/* Busca o grupo da camp global do item selecionado */
				that.onBuscaGrupoCmpGlobal(db, ItemPedido, resolve, reject);
				
			}).then(function() {
				
				//Verifica a quantidade de itens que tem que ser vendidos para entrar na campanha
				that.onVerifQuantCmpGlobal(db, ItemPedido, resolveTopo, rejectTopo);

			}).catch(function(Matnr) {
				
				/* Não achou grupo do material para campanha Global */
				console.log("Matnr: " + Matnr + " não possui Grupo Cmp Global.");
				resolveTopo();
			});
			
		},
		/* Fim Campanha Global Primeiro método */
		
		//Busca em qual grupo da campanha Global o item pertence.
		onBuscaGrupoCmpGlobal: function(db, ItemPedido, resolve, reject) {

			//Verifica se o item item grupo de Campanha Global para ser Agrupado. Senão tiver zzGrupoGlobal = 0;
			var transaction = db.transaction("CmpGbGrpProdsAcabs", "readonly");
			var objectStoreMaterial = transaction.objectStore("CmpGbGrpProdsAcabs");

			var indexMatnr = objectStoreMaterial.index("material");

			var request = indexMatnr.get(ItemPedido.matnr);

			request.onsuccess = function(event) {

				var result = event.target.result;

				if (result != undefined && result != null) {

					console.log("Matnr: " + result.material + ", Grupo: " + result.grupo + ", SubGrupo: " + result.subGrupo);
					ItemPedido.zzGrupoGlobal = result.grupo;
					//trocar a referência do sub grupo;
					ItemPedido.zzSubGrupoGlobal = result.subGrupo;
					resolve(ItemPedido);
					
				} else {
					//Se não achar o item cadastrado na camp global, setar o id do grupo e a quantidade de range como 0.
					//no catch da promise
					reject(ItemPedido.matnr);

				}
			};
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
						onClose: function(){
							
						}
					});
					
					rejectTopo();
				}
			};
		},
		
		//Agrupa os itens da campanha pelo grupo e verifica se atingiu a regra para ver a quantidade de bonificação
		// que o kra pode inserir com o Brinde.
		onAgrupaItensGlobal: function(retorno) {
			var proximoItemDiferente = false;
			var vetorGrpFamilia = [];
			var vetorAuxItensPedido = [];
			var vetorAuxItensPedidoTotal = [];
			var aux = [];
			//Pra tratar quando o kra insere apenas itens de amostra e brindes.
			//Faz com que insere o item sem cair na verificação de id de grupo global.
			var existeBRI = true;
			var contemItemAtual = false;
			
			//Garante que tem todos os itens inseridos no vetor vetorAuxItensPedidoTotal. Incluindo o oItemPedido. 
			for (var i = 0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++) {
				if(that.PDControllerCmpGlobal.oItemPedido.matnr == that.PDControllerCmpGlobal.objItensPedidoTemplate[i].matnr){
					contemItemAtual = true;
				}	
				
				aux = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
				vetorAuxItensPedidoTotal.push(aux);
				
			}
			if(!contemItemAtual){
				vetorAuxItensPedidoTotal.push(that.PDControllerCmpGlobal.oItemPedido);
			}
			
			//Verifica se o vetor tem apenas Brindes. Se tiver retornar.
			for (i = 0; i<vetorAuxItensPedidoTotal.length; i++) {
				
				if(vetorAuxItensPedidoTotal[i].mtpos != "YBRI" && vetorAuxItensPedidoTotal[i].mtpos != "YAMO"){
					existeBRI = false;
				}
			}
			
			if(existeBRI){
				return "OK";
			}
			
			for (i = 0; i<vetorAuxItensPedidoTotal.length; i++) {
				
				if(vetorAuxItensPedidoTotal[i].mtpos != "YBRI" && vetorAuxItensPedidoTotal[i].mtpos != "YAMO"){
					vetorAuxItensPedido.push(vetorAuxItensPedidoTotal[i]);
				}
			}
			
			
			//Ordenando para desconto Familia normal. Utiliza vetor global de itens (objItensPedidoTemplate).
			vetorAuxItensPedido.sort(function(a, b) {
				return a.zzGrupoGlobal - b.zzGrupoGlobal;
			});
			
			/*Percorre os itens já inseridos e identica se atingiu a quantidade do grupo da Camp global */
			for (i = 0; i<vetorAuxItensPedido.length; i++) {
				
				if (proximoItemDiferente == true) {
					proximoItemDiferente = false;
					vetorGrpFamilia = [];
				}
				
				if (vetorGrpFamilia.length == 0 && vetorAuxItensPedido.length == 1 && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					//o vetor de itens tem um unico item. nesse caso já tenho que verificar 
					//se já atingiu a quantidade para utilizar os brindes.
					
					vetorGrpFamilia.push(vetorAuxItensPedido[i]);
					retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
					
				} else if (vetorAuxItensPedido.length > 1 && (i + 1) < vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					if (vetorAuxItensPedido[i].zzGrupoGlobal == vetorAuxItensPedido[i + 1].zzGrupoGlobal) {
						
						proximoItemDiferente = false;
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						
					} else {
						//Nesse momento tenho os itens da mesma familia.. tendo os itens da familia .. somar as quantidades
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
						proximoItemDiferente = true;
					}
					
				} else if ((i + 1) == vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					//sinal proximoItemDiferente = true e limpou
					if (vetorGrpFamilia.length > 0) {
						
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
						
					} else {
						//ultimo item e é diferente do antepenultimo
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onCheckQuantidadeGlobal(vetorGrpFamilia, that);
					}
				}
			}
			
			if(retorno == "OK"){
				return retorno;
			}else {
				return retorno;
			}
		},
		
		//Verifica quantas vezes vai poder utilizar o range dos brindes, Rotina executada antes da inserção do item no total dos itens.
		onCheckQuantidadeGlobal: function(vetorGrpFamilia){
			// var that = this;
			var qntItens = 0;
			var valorRange = 0;
			var zzGrupoGlobal = "";
			//variável que grava quantas vezes o kra pode usar o range de brindes.
			//Ex: se o range a ser atingido for 20 itens para usar os brindes e a quantidade digita do produto for 40.
			// essa variavel irá armazenar 2. (Quantidade atingida a ser utilizada).
			var qntParaUtilizar = 0;
			
			for(var i=0; i<vetorGrpFamilia.length; i++){
				
				qntItens += vetorGrpFamilia[i].zzQnt;
				valorRange = vetorGrpFamilia[i].zzQntRegraGb;
				zzGrupoGlobal = vetorGrpFamilia[i].zzGrupoGlobal;
				
			}
			
			if(qntItens >= valorRange && valorRange > 0){
				
				qntParaUtilizar = parseInt(qntItens/valorRange, 10);
				
			} else {
				
				qntParaUtilizar = 0;
			}
				
			for(i=0; i<vetorGrpFamilia.length; i++){
				//atualiza o item atual.
				if(vetorGrpFamilia[i].matnr == that.PDControllerCmpGlobal.oItemPedido.matnr){
					if(qntParaUtilizar > 0){
						that.PDControllerCmpGlobal.oItemPedido.zzAtingiuCmpGlobal = "Sim";
					} else {
						that.PDControllerCmpGlobal.oItemPedido.zzAtingiuCmpGlobal = "Não";
					}
				}
				for(var j=0; j<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; j++){
					//Atualiza o vetor de itens já inseridos
					if(vetorGrpFamilia[i].matnr == that.PDControllerCmpGlobal.objItensPedidoTemplate[j].matnr){
						if(qntParaUtilizar > 0){
							that.PDControllerCmpGlobal.objItensPedidoTemplate[j].zzAtingiuCmpGlobal = "Sim";
						} else {
							that.PDControllerCmpGlobal.objItensPedidoTemplate[j].zzAtingiuCmpGlobal = "Não";
						}
					}
				}
			}
			
			if(qntItens >= valorRange){
				console.log("O grupo " + zzGrupoGlobal + " teve " + qntItens + " itens e pode utilizar os brindes.");
			} else{
				console.log("O grupo " + zzGrupoGlobal + " teve " + qntItens + " e não atingiu o rangedos itens.");
			}
			return "OK";
		},
		
		//Validação da Campanha Global
		onValidaItensCampGlobal: function(vetorGrpFamilia, that){
			// var that = this;
			var proximoItemDiferente = false;
			var mensagemCmpGlobal = "";
			var vetorItens = [];
			var vetorBrindes = [];
			var vetorAuxItensPedido = [];
			
			//Carregar o vetor de brindes.
			for(var i=0; i<vetorGrpFamilia.length; i++){
				if(vetorGrpFamilia[i].mtpos != "YBRI"){
					var aux2 = vetorGrpFamilia[i];
					vetorAuxItensPedido.push(aux2);
				} 
				//Adiciona os itens que fazem parte do mesmo id da campanha que está sendo inserido.
				else if(vetorGrpFamilia[i].mtpos == "YBRI"){
					var aux3 = vetorGrpFamilia[i];
					vetorBrindes.push(aux3);
				}
			}
			
			mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorAuxItensPedido, vetorBrindes, that);
			
			// //Ordenando para desconto Familia normal. Utiliza vetor global de itens (objItensPedidoTemplate).
			// vetorAuxItensPedido.sort(function(a, b) {
			// 	return a.zzSubGrupoGlobal - b.zzSubGrupoGlobal;
			// });
			
			// /*Percorre os itens já inseridos e identica se atingiu a quantidade do grupo da Camp global */
			// for (var i = 0; i<vetorAuxItensPedido.length; i++) {
				
			// 	if (proximoItemDiferente == true) {
			// 		proximoItemDiferente = false;
			// 		vetorAuxItensPedido = [];
			// 	}
				
			// 	if (vetorItens.length == 0 && vetorAuxItensPedido.length == 1 && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
			// 		//o vetor de itens tem um unico item. nesse caso já tenho que verificar 
			// 		//se já atingiu a quantidade para utilizar os brindes.
					
			// 		vetorItens.push(vetorAuxItensPedido[i]);
			// 		mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorItens, vetorBrindes, that);
					
			// 	} else if (vetorAuxItensPedido.length > 1 && (i + 1) < vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
			// 		if (vetorAuxItensPedido[i].zzSubGrupoGlobal == vetorAuxItensPedido[i + 1].zzSubGrupoGlobal) {
						
			// 			proximoItemDiferente = false;
			// 			vetorItens.push(vetorAuxItensPedido[i]);
						
			// 		} else {
			// 			//Nesse momento tenho os itens da mesma familia.. tendo os itens da familia .. somar as quantidades
			// 			vetorItens.push(vetorAuxItensPedido[i]);
			// 			mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorItens, vetorBrindes, that);
			// 			proximoItemDiferente = true;
			// 		}
					
			// 	} else if ((i + 1) == vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
			// 		//sinal proximoItemDiferente = true e limpou
			// 		if (vetorItens.length > 0) {
						
			// 			vetorItens.push(vetorAuxItensPedido[i]);
			// 			mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorItens, vetorBrindes, that);
						
			// 		} else {
			// 			//ultimo item e é diferente do antepenultimo
			// 			vetorItens.push(vetorAuxItensPedido[i]);
			// 			mensagemCmpGlobal = that.onChecaQuantidadeBrindes(vetorItens, vetorBrindes, that);
			// 		}
			// 	}
			// }
		},
		
		onChecaQuantidadeBrindes: function(vetorItens, vetorBrindes, that){
			var qntTotalItens = 0;
			var qntTotalBrindes = 0;
			var mensagemCmpGlobal = "";
			var qntTotalItensJaInseridos = [];
			
			//Verifca os itens, somando a quantidade permitida.
			for(var i=0; i<vetorItens.length; i++){
				qntTotalItens += vetorItens[i].zzQnt;
			}
			
			for(i=0; i<vetorBrindes.length; i++){
				qntTotalBrindes += vetorBrindes[i].zzQnt;
			}
			
			//Não atingiu a quantidade de itens necessarios.
			if(qntTotalItens == 0){
				
				mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalBrindes;
				
				MessageBox.show(mensagemCmpGlobal, {
					icon: MessageBox.Icon.ERROR,
					title: "Erro com os Itens Cmp Global",
					actions: [MessageBox.Action.YES],
					onClose: function() {
						that.PDControllerCmpGlobal.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
					}
				});
				
				return mensagemCmpGlobal;
				
			}
			//Verificação se atingiu a quantidade permiitda.
			if(qntTotalBrindes > qntTotalItens){
				
				//Quantidade de itens já inseridos 
				qntTotalItensJaInseridos = qntTotalBrindes - that.PDControllerCmpGlobal.oItemPedido.zzQnt;
				 
				mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens + ". Quantidade de itens que está tentando inserir: " + qntTotalBrindes;
			
				MessageBox.show(mensagemCmpGlobal, {
					icon: MessageBox.Icon.ERROR,
					title: "Erro com os Itens Cmp Global",
					actions: [MessageBox.Action.YES],
					onClose: function() {
						that.PDControllerCmpGlobal.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
					}
				});
				
				return mensagemCmpGlobal;
				
			} else {
				return "OK";
				
			}
		},
		
		//Validação da Campanha Global
		onAgrupaValidaItensCampGlobal: function(res, rej) {
			var proximoItemDiferente = false;
			var vetorGrpFamilia = [];
			var vetorAuxItensPedido = [];
			var retorno = "";
			
			if(that.PDControllerCmpGlobal.objItensPedidoTemplate.length == 1 && that.PDControllerCmpGlobal.objItensPedidoTemplate[0].mtpos == "YBRI"){
				return retorno;
			}
			
			for (var i = 0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++) {
					var aux = [];
					aux = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
					vetorAuxItensPedido.push(aux);
			}
			
			//Ordena o subGrupo dos itens
			vetorAuxItensPedido.sort(function(a, b) {
				return a.zzSubGrupoGlobal - b.zzSubGrupoGlobal;
			});
			
			/*Percorre os itens já inseridos e identica se atingiu a quantidade do grupo da Camp global */
			for (var i = 0; i<vetorAuxItensPedido.length; i++) {
				
				if (proximoItemDiferente == true) {
					proximoItemDiferente = false;
					vetorGrpFamilia = [];
				}
				
				if (vetorGrpFamilia.length == 0 && vetorAuxItensPedido.length == 1 && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					//o vetor de itens tem um unico item. nesse caso já tenho que verificar 
					//se já atingiu a quantidade para utilizar os brindes.
					
					vetorGrpFamilia.push(vetorAuxItensPedido[i]);
					retorno = that.onValidaItensCampGlobal(vetorGrpFamilia, that);
					
				} else if (vetorAuxItensPedido.length > 1 && (i + 1) < vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					if (vetorAuxItensPedido[i].zzSubGrupoGlobal == vetorAuxItensPedido[i + 1].zzSubGrupoGlobal) {
						
						proximoItemDiferente = false;
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						
					} else {
						//Nesse momento tenho os itens da mesma familia.. tendo os itens da familia .. somar as quantidades
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onValidaItensCampGlobal(vetorGrpFamilia, that);
						proximoItemDiferente = true;
					}
					
				} else if ((i + 1) == vetorAuxItensPedido.length && vetorAuxItensPedido[i].tipoItem != "Diluido") {
					
					//sinal proximoItemDiferente = true e limpou
					if (vetorGrpFamilia.length > 0) {
						
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onValidaItensCampGlobal(vetorGrpFamilia, that);
						
					} else {
						//ultimo item e é diferente do antepenultimo
						vetorGrpFamilia.push(vetorAuxItensPedido[i]);
						retorno = that.onValidaItensCampGlobal(vetorGrpFamilia, that);
					}
				}
			}
			
			return retorno;
		},
		
		onCheckBrindeCampanhaGlobal: function(db, oItemPedido, res, rej){
			var oPanel = sap.ui.getCore().byId("idDialog");
			//Armazena quantas vezes os brindes podem ser usados
			var qntRangeProdutos = 0;
			var totalItensPermitidos = 0;
			var mensagemCmpGlobal = "";
			var qntTotalItens = 0;
			var qntTotalBrindes = 0;
			var vetorBrindes = [];
			var vetorItens = [];
			var qntTotalItensJaInseridos = 0;
			
			var objStore = db.transaction("CmpGbItensBrindes", "readwrite");
			var objCmpGbItensBrindes = objStore.objectStore("CmpGbItensBrindes");
			var indexItensBrindes = objCmpGbItensBrindes.index("material");
			
			var requestIndexItensBrindes = indexItensBrindes.get(oItemPedido.matnr);
			
			requestIndexItensBrindes.onsuccess = function(e) {
				var oBrinde = e.target.result;
				
				//Esse if verifica se o brinde inserido está contido em campanha.
				//Produto encontrado na lista dos brinde. Pode inserir apenas se atender a quantidade de itens para ativar a promoção. Senão 
				//1º Agrupar os brindes de acordo com o id da campanha.
				//2º Verificar se atingiu a quantidade de acordo com o grupo da campanha.
				//3º Verificar se a quantidade digitada ultrapassa o limite permitido de brinde.
				
				if (oBrinde == undefined) {
					
					//Pode inserir normalmente o item de brinde, gerando excedente de brinde.
					mensagemCmpGlobal = "OK";
					res(mensagemCmpGlobal);
					
				} else{
					
					//Se encontrar o brinde na tabela cadastrada. Setar ele como oItemPedido.zzUtilCampGlobal = Sim, pois não irá cobrar brinde deste item. 
					oItemPedido.zzUtilCampGlobal = "Sim";
					
					//Encontrou o brinde na campanha Global. Agora tem que verificar se o item atinge a quantidade para utilizar os brindes.
					//Depois verificar se a quantidade digitada ultrapassa o limite permitido do item.
					oPanel.setBusy(false);
					
					//Parâmetro para verificar qual o grupo que o brinde pertence.
					oItemPedido.zzSubGrupoGlobal = oBrinde.grupo;
					
					//Verifica se o item item grupo de Campanha Global para ser Agrupado. Senão tiver zzGrupoGlobal = 0;
					var transaction = db.transaction("CmpGbGrpProdsAcabs", "readonly");
					var objectStoreMaterial = transaction.objectStore("CmpGbGrpProdsAcabs");
					
					var indexMatnr = objectStoreMaterial.index("subGrupo");
					
					var request1 = indexMatnr.get(oItemPedido.zzSubGrupoGlobal);
					
			
					request1.onsuccess = function(e) {
						var req = e.target.result;
					
						if (req == undefined && req == null) {
							
							mensagemCmpGlobal = "OK";
							res(mensagemCmpGlobal);
							
						} else{
							
							console.log("O Brinde: " + oItemPedido.matnr + ", Grupo: " + req.grupo + ", SubGrupo: " + oItemPedido.zzSubGrupoGlobal);
							oItemPedido.zzGrupoGlobal = req.grupo;
							//Insere o item corrente no vetor de itens de brinde. Nesse momento ainda não tem inserido no objItensPedidoTemplate.
							if(that.PDControllerCmpGlobal.getModel("modelAux").getProperty("/EditarindexItem") == 0){
								var aux = oItemPedido;
								vetorBrindes.push(aux);
							}
							
							//Carregar o vetor de itens que ativam a utilização das Campanhas 
							for(var i=0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++){
								if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzSubGrupoGlobal == oItemPedido.zzSubGrupoGlobal 
									&& that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzAtingiuCmpGlobal == "Sim"
									&&  that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos != "YBRI"){
										
									var aux2 = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
									vetorItens.push(aux2);
								} 
								
								//Adiciona os itens que fazem parte do mesmo subGrupo e que seja brindes. Para fazer a validação das quantidades.
								else if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzSubGrupoGlobal == oItemPedido.zzSubGrupoGlobal 
									&& that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos == "YBRI"){
										
									var aux3 = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
									vetorBrindes.push(aux3);
									
								}
							}
							
							//Verifca os itens, somando a quantidade permitida.
							for(i=0; i<vetorItens.length; i++){
								
								//Compara nos itens inseridos, quantos itens de brinde pode inserir de acordo com o subgrupo do Brinde que está sendo inserido;
								if(vetorItens[i].zzSubGrupoGlobal == oItemPedido.zzSubGrupoGlobal){
									qntTotalItens += vetorItens[i].zzQnt;
								}
							}
							
							for(i=0; i<vetorBrindes.length; i++){
								
								if(vetorBrindes[i].zzSubGrupoGlobal == oItemPedido.zzSubGrupoGlobal){
									qntTotalBrindes += vetorBrindes[i].zzQnt;
								}
							}
							
							//Não atingiu a quantidade de itens necessarios.
							if(qntTotalItens == 0){
								mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens;
								rej(mensagemCmpGlobal);
						}
							//Verificação se atingiu a quantidade permiitda.
							if(qntTotalBrindes > qntTotalItens){
								
								//Quantidade de itens já inseridos 
								qntTotalItensJaInseridos = qntTotalBrindes - oItemPedido.zzQnt;
								 
								mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens + ". Quantidade de itens que está tentando inserir: " + qntTotalBrindes;
								rej(mensagemCmpGlobal);
								
							} else {
								
								res("OK");
							}
						}
					};
					
				}
			};
		},
		
		// onCheckBrindeCampanhaGlobal: function(db, oItemPedido, res, rej){
		// 	var oPanel = sap.ui.getCore().byId("idDialog");
		// 	//Armazena quantas vezes os brindes podem ser usados
		// 	var qntRangeProdutos = 0;
		// 	var totalItensPermitidos = 0;
		// 	var mensagemCmpGlobal = "";
		// 	var qntTotalItens = 0;
		// 	var qntTotalBrindes = 0;
		// 	var vetorBrindes = [];
		// 	var vetorItens = [];
		// 	var qntTotalItensJaInseridos = 0;
			
		// 	var objStore = db.transaction("CmpGbItensBrindes", "readwrite");
		// 	var objCmpGbItensBrindes = objStore.objectStore("CmpGbItensBrindes");
		// 	var indexItensBrindes = objCmpGbItensBrindes.index("material");
			
		// 	var requestIndexItensBrindes = indexItensBrindes.get(oItemPedido.matnr);
			
		// 	requestIndexItensBrindes.onsuccess = function(e) {
		// 		var oBrinde = e.target.result;
				
		// 		//Esse if verifica se o brinde inserido está contido em campanha.
		// 		//Produto encontrado na lista dos brinde. Pode inserir apenas se atender a quantidade de itens para ativar a promoção. Senão 
		// 		//1º Agrupar os brindes de acordo com o id da campanha.
		// 		//2º Verificar se atingiu a quantidade de acordo com o grupo da campanha.
		// 		//3º Verificar se a quantidade digitada ultrapassa o limite permitido de brinde.
				
		// 		if (oBrinde == undefined) {
					
		// 			//Pode inserir normalmente o item de brinde, gerando excedente de brinde.
		// 			mensagemCmpGlobal = "OK";
		// 			res(mensagemCmpGlobal);
					
		// 		} else{
					
		// 			//Encontrou o brinde na campanha Global. Agora tem que verificar se o item atinge a quantidade para utilizar os brindes.
		// 			//Depois verificar se a quantidade digitada ultrapassa o limite permitido do item.
		// 			oPanel.setBusy(false);
					
		// 			//Parâmetro para verificar qual o grupo que o brinde pertence.
		// 			oItemPedido.zzGrupoGlobal = oBrinde.grupo;
					
		// 			//Insere o item corrente no vetor de itens de brinde. Nesse momento ainda não tem inserido no objItensPedidoTemplate.
		// 			if(that.PDControllerCmpGlobal.getModel("modelAux").getProperty("/EditarindexItem") == 0){
		// 				var aux = oItemPedido;
		// 				vetorBrindes.push(aux);
		// 			}
					
		// 			//Carregar o vetor de brindes.
		// 			for(var i=0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++){
		// 				if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzSubGrupoGlobal == oItemPedido.zzGrupoGlobal && that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos != "YBRI"){
		// 					var aux2 = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
		// 					vetorItens.push(aux2);
		// 				} 
		// 				//Adiciona os itens que fazem parte do mesmo id da campanha que está sendo inserido.
		// 				else if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzGrupoGlobal == oItemPedido.zzGrupoGlobal && that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos == "YBRI"){
		// 					var aux3 = that.PDControllerCmpGlobal.objItensPedidoTemplate[i];
		// 					vetorBrindes.push(aux3);
							
		// 				}
		// 			}
					
		// 			//Verifca os itens, somando a quantidade permitida.
		// 			for(i=0; i<vetorItens.length; i++){
		// 				if(vetorItens[i].zzSubGrupoGlobal == oItemPedido.zzGrupoGlobal){
		// 					qntTotalItens += vetorItens[i].zzQnt;
		// 				}
		// 			}
		// 			for(i=0; i<vetorBrindes.length; i++){
		// 				if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzGrupoGlobal == oItemPedido.zzGrupoGlobal){
		// 					qntTotalBrindes += vetorBrindes[i].zzQnt;
		// 				}
		// 			}
					
		// 			//Não atingiu a quantidade de itens necessarios.
		// 			if(qntTotalItens == 0){
		// 				mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalBrindes;
		// 				rej(mensagemCmpGlobal);
		// 			}
		// 			//Verificação se atingiu a quantidade permiitda.
		// 			if(qntTotalBrindes > qntTotalItens){
						
		// 				//Quantidade de itens já inseridos 
		// 				qntTotalItensJaInseridos = qntTotalBrindes - oItemPedido.zzQnt;
						 
		// 				mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + qntTotalItens + ". Quantidade de itens que está tentando inserir: " + qntTotalBrindes;
		// 				rej(mensagemCmpGlobal);
		// 			} else {
		// 				res("OK");
		// 			}
					
		// 			// //Verifica a quantidade de brindes que pode utilizar de acordo com a quantidade normais de itens inseridos.
		// 			// //Somar todas as quantidades de brindes já inseridos daquele id de campanha global. Mais a quantidade do item corrente (que está sendo inserido).
		// 			// for(var i=0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++){
		// 			// 	if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzSubGrupoGlobal == oItemPedido.zzGrupoGlobal){
							
		// 			// 		if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzAtingiuCmpGlobal){
								
		// 			// 			qntRangeProdutos = that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzAtingiuCmpGlobal;
		// 			// 		}
		// 			// 		//Contabiliza a quantidade de itens de brinde já inseridos com o id da campanha corrente do item que está sendo editado/novo.
		// 			// 		if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos == "YBRI"){
		// 			// 			qntTotalItensJaInseridos += that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzQnt;
		// 			// 		}
		// 			// 	}
		// 			// }
					
		// 			// // Valor total permitido inserir de itens de brindes.
		// 			// totalItensPermitidos = oItemPedido.zzQntRegraGb * qntRangeProdutos;
					
		// 			// //O kra digitou uma quantidade maior que o permitido. Barrar e gerar uma mensagem pra ele.
					
		// 			// if(totalItensPermitidos < qntTotalItensJaInseridos){
		// 			// 	//Ultrapassou a quantidade permitida de itens
		// 			// 	mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + totalItensPermitidos + ". Quantidade de itens já inseridos: " + qntTotalItensJaInseridos;
		// 			// 	rej(mensagemCmpGlobal);
						
		// 			// } else{
		// 			// 	//Atendeu todas as expectativas e consegue usar a quantidade.
		// 			// 	res("OK");
		// 			// }
		// 		}
		// 	};
		// },
		
		// onCheckBrindeCampanhaGlobal: function(db, oItemPedido, res, rej){
		// 	var oPanel = sap.ui.getCore().byId("idDialog");
		// 	//Armazena quantas vezes os brindes podem ser usados
		// 	var qntRangeProdutos = 0;
		// 	var totalItensPermitidos = 0;
		// 	var mensagemCmpGlobal = "";
		// 	var qntTotalItensJaInseridos = 0;
			
		// 	var objStore = db.transaction("CmpGbItensBrindes", "readwrite");
		// 	var objCmpGbItensBrindes = objStore.objectStore("CmpGbItensBrindes");
		// 	var indexItensBrindes = objCmpGbItensBrindes.index("material");
			
		// 	var requestIndexItensBrindes = indexItensBrindes.get(oItemPedido.matnr);
			
		// 	requestIndexItensBrindes.onsuccess = function(e) {
		// 		var oBrinde = e.target.result;
				
		// 		//Esse if verifica se o brinde inserido está contido em campanha.
		// 		//Produto encontrado na lista dos brinde. Pode inserir apenas se atender a quantidade de itens para ativar a promoção. Senão 
		// 		//1º Agrupar os brindes de acordo com o id da campanha.
		// 		//2º Verificar se atingiu a quantidade de acordo com o grupo da campanha.
		// 		//3º Verificar se a quantidade digitada ultrapassa o limite permitido de brinde.
				
		// 		if (oBrinde == undefined) {
					
		// 			//Pode inserir normalmente o item de brinde, gerando excedente de brinde.
		// 			mensagemCmpGlobal = "OK";
		// 			res(mensagemCmpGlobal);
					
		// 		} else{
					
		// 			//Encontrou o brinde na campanha Global. Agora tem que verificar se o item atinge a quantidade para utilizar os brindes.
		// 			//Depois verificar se a quantidade digitada ultrapassa o limite permitido do item.
		// 			oPanel.setBusy(false);
					
		// 			//Parâmetro para verificar qual o grupo que o brinde pertence.
		// 			oItemPedido.zzSuGrupoGlobal = oBrinde.grupo;
					
		// 			var objStoreBrindeCmpGlobal = db.transaction("CmpGbQtdItens", "readwrite");
		// 			var objCmpGbQtdItens = objStoreBrindeCmpGlobal.objectStore("CmpGbQtdItens");
		// 			var indexCmpGbQtdItens = objCmpGbQtdItens.index("grupo");
					
		// 			var requestCmpGbQtdItens = indexCmpGbQtdItens.get(oItemPedido.zzGrupoGlobal);
					
		// 			requestCmpGbQtdItens.onsuccess = function(e) {
		// 				var oBrindeRange = e.target.result;
						
		// 				if(!oBrindeRange){
		// 					mensagemCmpGlobal = "Cadastro do range de brindes não cadastrado para a Campanha Global.";
		// 					res(mensagemCmpGlobal);
		// 				}
						
		// 				//Quantidade de range permitido para o brinde. 
		// 				oItemPedido.zzQntRegraGb = oBrindeRange.quantidade;
						
		// 				//Insere o item corrente para contabilizar a somatoria dos itens de brindes digitada por ID campanha global. se for == 0 sinal que é item novo,
		// 				// e item novo não está contido no vetor objItensPedidoTemplate
		// 				if(that.PDControllerCmpGlobal.getModel("modelAux").getProperty("/EditarindexItem") == 0){
		// 					qntTotalItensJaInseridos = oItemPedido.zzQnt;
		// 				}
						
		// 				//Verifica a quantidade de brindes que pode utilizar de acordo com a quantidade normais de itens inseridos.
		// 				//Somar todas as quantidades de brindes já inseridos daquele id de campanha global. Mais a quantidade do item corrente (que está sendo inserido).
		// 				for(var i=0; i<that.PDControllerCmpGlobal.objItensPedidoTemplate.length; i++){
		// 					if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzGrupoGlobal == oItemPedido.zzGrupoGlobal){
		// 						//Consultar quantas vezes esse id atingiu a quantidade para utilizar a campanha.
		// 						//EX: zzAtingiuCmpGlobal = 2. Significa que atingiu 2 x 20 unidades. Então ele pode inserir 2x o combo de brindes.
		// 						if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzAtingiuCmpGlobal){
									
		// 							qntRangeProdutos = that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzAtingiuCmpGlobal;
		// 						}
		// 						//Contabiliza a quantidade de itens de brinde já inseridos com o id da campanha corrente do item que está sendo editado/novo.
		// 						if(that.PDControllerCmpGlobal.objItensPedidoTemplate[i].mtpos == "YBRI"){
		// 							qntTotalItensJaInseridos += that.PDControllerCmpGlobal.objItensPedidoTemplate[i].zzQnt;
		// 						}
		// 					}
		// 				}
						
		// 				//Não atingiu a quantidade de itens necessarios.
		// 				if(qntRangeProdutos == 0){
		// 					mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + totalItensPermitidos;
		// 					rej(mensagemCmpGlobal);
		// 				}
						
		// 				// Valor total permitido inserir de itens de brindes.
		// 				totalItensPermitidos = oItemPedido.zzQntRegraGb * qntRangeProdutos;
						
		// 				//O kra digitou uma quantidade maior que o permitido. Barrar e gerar uma mensagem pra ele.
						
		// 				if(totalItensPermitidos < qntTotalItensJaInseridos){
		// 					//Ultrapassou a quantidade permitida de itens
		// 					mensagemCmpGlobal = "Quantidade de itens permitidos para inserir de acordo com o range atingido: " + totalItensPermitidos + ". Quantidade de itens já inseridos: " + qntTotalItensJaInseridos;
		// 					rej(mensagemCmpGlobal);
							
		// 				} else{
		// 					//Atendeu todas as expectativas e consegue usar a quantidade.
		// 					res("OK");
		// 				}
		// 			};
		// 		}
		// 	};
		// },
		
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
			}
		}

	});
});