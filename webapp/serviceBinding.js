function initModel() {
	var sUrl = "/VB_GWD/sap/opu/odata/sap/ZFORCA_VENDAS_VB_DEV_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}