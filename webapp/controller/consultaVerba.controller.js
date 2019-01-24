/*eslint-disable no-console, no-alert */
sap.ui.define([
	"testeui5/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"testeui5/model/formatter",
	"sap/ui/model/Filter"

], function(BaseController, Filter, MessageBox) {
	"use strict";

	return BaseController.extend("testeui5.controller.consultaVerba", {

		onInit: function() {
			this.getRouter().getRoute("consultaVerba").attachPatternMatched(this._onLoadFields, this);
		},
		
		_onLoadFields: function(){
			
		}

	});

});