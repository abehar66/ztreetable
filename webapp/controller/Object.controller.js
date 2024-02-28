sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (BaseController, JSONModel, History, formatter) {
    "use strict";

    return BaseController.extend("testreetable.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : false,
                    delay : 0
                });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");         
            
            this.modeloDato = new JSONModel({                                
                pernr:'',
                vacuna:'',
                fecha_vacuna:'',
                nombre:'',
                test:''

            });           

            this.setModel(this.modeloDato, "ModeloDato");
                
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched : function (oEvent) {
            const sObjectId =  oEvent.getParameter("arguments").objectId; 

            //let dato = this.getOwnerComponent().getModel("detalle").getData();                            
            // this._bindView("/VaccinationSet" + sObjectId);                                 
            
            
            const arrayOfParameters =  sObjectId.split("&");
            let Pernr = arrayOfParameters[0];
            let Fecha = arrayOfParameters[1];  
            
            //let Fecha = "2021-04-29";  
            //Pernr = "00002852";
            //let Fecha = "2021-06-04";            
                        
            let Fecha1 = encodeURIComponent(sap.ui.model.odata.ODataUtils.formatValue(new Date(Fecha), "Edm.DateTime"));                        
            //let Fecha1 = encodeURIComponent(sap.ui.model.odata.ODataUtils.formatValue(Fecha, "Edm.DateTime"));

            //let path = "/VaccinationSet(Pernr='" + Pernr + "',Begda=" + Fecha1 + ")";                                    
            let path = "/VaccinationSet(Pernr='" + Pernr + "',Begda=" + Fecha1 + ")".toString();                                    
            this._bindView(path);                

            this.modeloDato.setProperty("/test", path);    
            //this.modeloDato.setProperty("/vacuna", dato.Vacuna);

           /* this.modeloDato = new JSONModel({                                
                pernr:'',
                vacuna:''
            });               
                        
            this.modeloDato.setProperty("/pernr", dato.Pernr);    
            this.modeloDato.setProperty("/vacuna", dato.Vacuna);

            this.setModel(this.modeloDato, "ModeloDato");*/
            
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView : function (sObjectPath) {
            var oViewModel = this.getModel("objectView");            
            var oDataModel = this.getModel();
            const myFilters = [];            

            this.getView().setBusy(true);   
            
            oDataModel.read(sObjectPath, {
                filters: myFilters,
                success: oData => {                                                                                                                
                    this.modeloDato.setProperty("/pernr", oData.Pernr);                                   
                    this.modeloDato.setProperty("/vacuna", oData.VacunaTxt);
                    this.modeloDato.setProperty("/fecha_vacuna", oData.Begda);
                    this.modeloDato.setProperty("/nombre", oData.Nombre);
                    this.getView().setBusy(false);
                    },
                error: e => {
                    this.getView().setBusy(false);

                    const errorMessage = JSON.parse(e.responseText).error.message.value
                    MessageToast.show(errorMessage);
                }
            });

            /*this.getView().bindElement({
                path: sObjectPath,                           
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                       oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });*/
        },

        _onBindingChange : function () {
            var oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            var oResourceBundle = this.getResourceBundle(),
                oObject = oView.getBindingContext().getObject(),
                sObjectId = oObject.Pernr,
                sObjectName = oObject.VaccinationSet;

                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/shareSendEmailSubject",
                    oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
                oViewModel.setProperty("/shareSendEmailMessage",
                    oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        }
    });

});

