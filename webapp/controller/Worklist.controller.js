sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/core/Fragment',
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, ODataModel,Fragment) {
    "use strict";

    return BaseController.extend("testreetable.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {            
            const view = this.getView();
            const Hoy = new Date();
            var oViewModel;
            let fl_actualizar = false;
            let oModelAvatar = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZETECSA_NOMINA_SRV", false);
            let oView = this.getView();
            
            let anno = Hoy.getFullYear();
            let mes = Hoy.toISOString().substring(5, 7);        

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });

            this.setModel(oViewModel, "worklistView");

            if (sap.ui.getCore().fl_actualizar)
            {
                fl_actualizar = sap.ui.getCore().fl_actualizar === "true";
            }

            this.modeloVacunaciones = new JSONModel({
                lista:[],                
                actualizar: fl_actualizar
            });

           this.modeloVacunas = new JSONModel({                
                listaVacunas:[],                
                selVacuna:''
            });

            this.modeloFilter = new JSONModel({                
                Pernr:'',
                Vacuna:'',
                Name:'',
                Test:''                
            });

            this.modeloAddVacunacion = new JSONModel({                                                
                listaVacunas:[],
                selVacuna:'',
                Fecha:''
            });

            this.setModel(this.modeloVacunaciones, "ModeloVacunacion");
            this.setModel(this.modeloVacunas, "ModeloVacunas");
            this.setModel(this.modeloFilter, "ModeloFiltro");
            this.setModel(this.modeloAddVacunacion, "ModeloAddVacunacion");            

            this.oDataModel = new ODataModel('/sap/opu/odata/sap/ZETECSA_NOMINA_SRV');

            this.loadTableVaccineType();
            this.loadTableData();

            this.modeloFilter.setProperty("/Pernr","");            
            /*this.modeloFilter.setProperty("/Test","000");

            this.modeloDetalle = new JSONModel({
                Pernr:'98283'
            });                 

            this.setModel(this.modeloDetalle, "detalle");                         

            let tModel = this.getOwnerComponent().getModel("detalle").getData();
            if (tModel)
               this.modeloFilter.setProperty("/Test","001");
            else
               this.modeloFilter.setProperty("/Test","002");   */

            oModelAvatar.read("/SalarioCIDInfoSet", {
				success: function _OnSuccess(oData, response) {
					oView.setBusy(false);
					
					sap.ui.getCore().CID = oData.results[0].Pernr;									
					
					if (oData.results[0].Uri===""){
						oView.byId("avatar").setInitials(oData.results[0].Vorna.substring(0,1)+oData.results[0].Nachn.substring(0,1));
					}else{
						oView.byId("avatar").setSrc(oData.results[0].Uri);					
					}

					oView.byId("labelNombre").setText(oData.results[0].Vorna + " " + oData.results[0].Nachn + " " + oData.results[0].Nach2);
					oView.byId("cid1").setText(`#${oData.results[0].Pernr}`);
//					oView.byId("cid2").setText("Numero personal: " + oData.results[0].Pernr);
					
					//Lamada a la funcion de lectura de la imagen del trabajador
					var _path = "/sap/opu/odata/sap/ZETECSA_NOMINA_SRV/FileSet(Pernr='" + sap.ui.getCore().CID + "',Gjahr='" + anno + "',Monat='" +
					mes + "',Id='SalarioCIDInfo')/$value"; //?$expand=ToResumen,ToCabecera";
					oView.byId("avatar").setSrc(_path);	
					
				},
				error: function _OnError(oError) {
					oView.setBusy(false);
				}
			});   
            
        },

        onSelectVaccine: function () {               
            const view = this.getView();
            const datoVacunas = this.getModel("ModeloVacunas").getData(); 
            const datoFiltro = this.getModel("ModeloFiltro").getData();                       
            var aTableSearchState = [];            

            if (datoVacunas.selVacuna !== ""){ 
          /*       aTableSearchState = [new Filter("VacunaId", 
                                          FilterOperator.EQ, 
                                          datoVacunas.selVacuna)]; */
              aTableSearchState.push(new Filter("VacunaId", 
                                         FilterOperator.EQ, 
                                         datoVacunas.selVacuna));                           
            }

            if (datoFiltro.Pernr !== ""){                
                aTableSearchState.push(new Filter("Pernr", 
                                           FilterOperator.Contains,
                                           datoFiltro.Pernr));                           
            }

            if (datoFiltro.Name !== ""){                
                aTableSearchState.push(new Filter("Nombre", 
                                           FilterOperator.Contains,
                                           datoFiltro.Name));                           
            }

            this._applySearch(aTableSearchState); 
        },

        onMostrar: function () {
            this.loadTableData();
        },

        onCrear: function () {       
            const that = this;            

            if (!that.dlgVaccination) {
                that.dlgVaccination = Fragment.load({
                id: 'createVaccinationDialog',
                name: 'testreetable.view.dialogs.AddDialog',                
                controller: that
                }).then(oDialog => {
                        that.getView().addDependent(oDialog);
                        return oDialog;
                        });
                }
            that.dlgVaccination.then(function (oDialog) {
                oDialog.open();
            }.bind(this));


        },

        onDialogClose:function(){
            this.dlgVaccination.then(function (oDialog) {
                  oDialog.close();
            });
            },     

        onDialogAccept:function(){
            const msg = this.getView().getModel('i18n').getProperty('recordAdded');
            const modeloAdd = this.getModel("ModeloAddVacunacion").getData(); 

            let rc = new JSONModel({                
                'Begda': '',
                'VacunaId': ''                
            });
            
            rc.setProperty("/Begda",modeloAdd.Fecha);
            rc.setProperty("/VacunaId",modeloAdd.selVacuna);            

            this.getView().setBusy(true);

            this.oDataModel.create('/VaccinationSet', rc.oData, {                
                success: oData => {                                                                                              
                    this.loadTableData();
                    this.getView().setBusy(false);                    
                },

                error: e => {
                    this.getView().setBusy(false);
                    const errorMessage = JSON.parse(e.responseText).error.message.value
                    MessageToast.show(errorMessage);
                }
            });

          this.dlgVaccination.then(function (oDialog) {
                oDialog.close();
          });

        },             

        loadTableVaccineType: function() {                   
            const myFilters = [];
            const view = this.getView();
            let new_line = {};
            new_line.Key = "";
            new_line.Value = "Todas";
            let tabla = [];           
            let tablaAdd = [];                   
                 
            this.getView().setBusy(true);
            
            this.oDataModel.read('/VaccineTypeSet', {
                filters: myFilters,
                success: oData => {
                    this.modeloVacunas.setProperty('/selVacuna', "");                    
                    tabla = oData.results; 
                    tablaAdd = tabla.slice();
                                                                              
                    this.modeloAddVacunacion.setProperty('/listaVacunas',tablaAdd);
                    tabla.unshift(new_line);                    
                    this.modeloVacunas.setProperty('/listaVacunas',tabla);                                        
                    this.getView().setBusy(false);
                },
                error: e => {
                    this.getView().setBusy(false);

                    const errorMessage = JSON.parse(e.responseText).error.message.value
                    MessageToast.show(errorMessage);
                }
            });
        },

        loadTableData: function () {
            const view = this.getView();
            const datoVacunas = this.getModel("ModeloVacunas").getData();
            const datoFiltro = this.getModel("ModeloFiltro").getData();
            const myFilters = [];                 
            
            const f = new Filter({
                filters: [
                    new Filter({
                        path: 'Pernr',
                        operator: FilterOperator.Contains,
                        value1: ''
                    }),
                    new Filter({
                        path: 'VacunaId',
                        operator: FilterOperator.EQ,
                        value1: ''
                    })                        
                ],
                and: true
            });

            let filtro = [];

            if (datoFiltro.Pernr !== "")
            {
                filtro.push(new Filter({
                                path: 'Pernr',
                                operator: FilterOperator.Contains,
                                value1: datoFiltro.Pernr
                                    }));                
            }             

           if (datoVacunas.selVacuna !== "")
            {
                filtro.push(new Filter({
                                path: 'VacunaId',
                                operator: FilterOperator.EQ,
                                value1: datoVacunas.selVacuna
                                    }));                                                                                                         
            }             
                      
            myFilters.push(filtro); 

            this.getView().setBusy(true);

            this.oDataModel.read('/VaccinationSet', {
                filters: myFilters,
                success: oData => {
                    this.modeloVacunaciones.setProperty('/lista', oData.results);
                
                    this.getView().setBusy(false);
                },
                error: e => {
                    this.getView().setBusy(false);

                    const errorMessage = JSON.parse(e.responseText).error.message.value
                    MessageToast.show(errorMessage);
                }
            });

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch : function (oEvent) {
            const datoVacunas = this.getView().getModel("ModeloVacunas").getData();
            const datoFiltro = this.getModel("ModeloFiltro").getData();

            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                  //  aTableSearchState = [new Filter("Pernr", FilterOperator.Contains, sQuery)];
                  aTableSearchState.push(new Filter("Pernr", 
                                             FilterOperator.Contains, 
                                             sQuery));                                             
                }

                if (datoFiltro.Name && datoFiltro.Name.length > 0) {                  
                    aTableSearchState.push(new Filter("Nombre", 
                                               FilterOperator.Contains, 
                                               datoFiltro.Name));
                }
                 
                if (datoVacunas.selVacuna !== "") {
                    aTableSearchState.push(new Filter("VacunaId", 
                                               FilterOperator.EQ, 
                                               datoVacunas.selVacuna));   
                }    
                
                this._applySearch(aTableSearchState);
            }

        },

        onSearchName : function (oEvent) {
            const datoVacunas = this.getView().getModel("ModeloVacunas").getData();
            const datoFiltro = this.getModel("ModeloFiltro").getData();

            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {                  
                  aTableSearchState.push(new Filter("Nombre", 
                                             FilterOperator.Contains, 
                                             sQuery));
                }
                 
                if (datoVacunas.selVacuna !== "") {
                    aTableSearchState.push(new Filter("VacunaId", 
                                               FilterOperator.EQ, 
                                               datoVacunas.selVacuna));   
                }
                
                if (datoFiltro.Pernr && datoFiltro.Pernr.length > 0) {                  
                    aTableSearchState.push(new Filter("Pernr", 
                                               FilterOperator.Contains, 
                                               datoFiltro.Pernr));
                  }
                
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            //const Pernr = oItem.getCells()[1].getText();     
            const dato =  oItem.getBindingContext("ModeloVacunacion");
            //const datoDetalle = this.getOwnerComponent().getModel("detalle").getData();                  
            
            //this.modeloFilter.setProperty("/Test",dato.getProperty("Pernr"));
            
            //datoDetalle.Pernr = dato.getProperty('Pernr');
            //datoDetalle.Vacuna = dato.getProperty('VacunaTxt');            
            //this.getOwnerComponent().getModel("detalle").setData(datoDetalle);   
                        
            let Fecha = new Date(dato.getProperty("Begda"));           
            let objectId = dato.getProperty("Pernr") + '&' + Fecha;
                           
                          
            this.getRouter().navTo("object", {
//                objectId: oItem.getBindingContext().getPath().substring("/VaccinationSet".length)
                  objectId: objectId                                                     
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        }

    });
});
