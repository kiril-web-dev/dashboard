;( function( $, window, document, undefined ) {

    "use strict";

    var Utils = {
        throttle: function(callback, limit) {
            var wait = false;                  
            return function () {               
                if (!wait) {                  
                    callback();           
                    wait = true;               
                    setTimeout(function () {   
                        wait = false;         
                    }, limit);
                }
            }
        }
    }

    var MockConfig = {
        id: 33,
        configurations: {
            '300-600':       [{
                        id: 1,
                        name: 'One',
                        description: 'One Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0
                    }],

            '600-1200': [
                      {
                        id: 1,
                        name: 'One',
                        description: 'One Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0
                    },
                    {
                        id: 2,
                        name: 'Two',
                        description: 'Two Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 1,
                        y: 0
                    }
                ],
            '1200-1500': [
                    {
                        id: 1,
                        name: 'One',
                        description: 'One Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0
                    },
                    {
                        id: 2,
                        name: 'Two',
                        description: 'Two Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 1,
                        y: 0
                    },
                    {
                        id: 3,
                        name: 'Three',
                        description: 'Three Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 2,
                        y: 0
                    },
                    {
                        id: 4,
                        name: 'Four',
                        description: 'Three Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 3,
                        y: 0
                    }
                ],
            '1500-1800': [
                     {
                        id: 1,
                        name: 'One',
                        description: 'One Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0
                    },
                    {
                        id: 2,
                        name: 'Two',
                        description: 'Two Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 1,
                        y: 0
                    },
                    {
                        id: 3,
                        name: 'Three',
                        description: 'Three Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 2,
                        y: 0
                    },
                    {
                        id: 4,
                        name: 'Four',
                        description: 'Three Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 3,
                        y: 0
                    },
                     {
                        id: 5,
                        name: 'Five',
                        description: 'Five Description',
                        configUrl: 'some config url',
                        appContentUrl: 'some app ctnt url',
                        settings: {},
                        width: 1,
                        height: 1,
                        x: 4,
                        y: 0
                    }
                ]
        }
    };

    var MockConfigJSON = JSON.stringify(MockConfig);


    // Create the defaults once
    var pluginName = "dashboard",
        defaults = {
            //padding/margin between dimensions etc..
            grid: {
                alwaysShowResizeHandle: false,
                cellHeight: 300,
                verticalMargin: 0,
                acceptWidgets: '.grid-stack-item'
            },
             //get dashboard for user or get default dash for anonymous with changes set in cookie
            getConfigUrl: null,
            saveConfigUrl: null
        };

    //constructor 
    function Plugin ( element, options ) {
        this.element = element;
        //use this in the functions etc..
        //if nothing is passed upon widget initialization defaults are used...
        this.settings = $.extend({}, defaults, options );
        //refference what the defaults were..
        this._defaults = defaults;


        //data is fetched?
        this._hasConfig = false;
        this._configurations = {};
        this._configurationsData = {};
        //after init props..
        this._currentResolution = null;
        //current gridster instance
        this._grid = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend( Plugin.prototype, {
        buildGridLayout: function() {
            var $mount = $(this.element);
            this.$gridLayout = $('<div id="grid-layout"></div>');
            this.$gridRoot = $('<div></div>');
            this.$gridRoot.css('margin', '0 auto');
            // this.$widgetsMenu = $('<div style="width: 200px; height: 200px; background: red;    ">NEW</div>');    

            this.$gridRoot.appendTo(this.$gridLayout);
            // this.$widgetsMenu.appendTo(this.$gridLayout);
            this.$gridLayout.appendTo($mount);

            //returns the grid root el in order to init the grid with it.
            return this.$gridRoot;
        },
        init: function() {
            debugger;
            var self = this;
            self.buildGridLayout();

            //put loading bar
            $.ajax({
                method: 'get',
                type: 'application/json',
                url: 'this._settings.getConfigUrl'
            }).done(function (data) {
                self.setConfigurations(JSON.parse(MockConfigJSON));  
                self.showPropperConfiguration()
                self.listenForResolutionChange();    
                
            }).fail(function (error) {
                self.setConfigurations(JSON.parse(MockConfigJSON));  
                self.showPropperConfiguration()
                self.listenForResolutionChange();      
            })


           
        },


        setConfigurations: function (data) {
            if (this._gridster === null) {
                throw new Error('init gridster widget first!')
            }
            var self = this;
            self._configurations = data.configurations;
            Object.keys(data.configurations).forEach(function(key) {
                var $configurationMount;
                if(key === '300-600') {
                    $configurationMount = $('<div class="grid-stack grid-stack-' + '1' + '"></div>')
                } else if (key === '600-1200') {
                    $configurationMount = $('<div class="grid-stack grid-stack-' + '2' + '"></div>')
                } else if (key === '1200-1500') {
                    $configurationMount = $('<div class="grid-stack grid-stack-' + '4' + '"></div>')
                } else if (key === '1500-1800') {
                    $configurationMount = $('<div class="grid-stack grid-stack-' + '5' + '"></div>')
                } else {
                    throw new Error('passed an unsupported configuration');
                }
                $configurationMount.appendTo(self.$gridRoot);
                var grid = $configurationMount.gridstack(self.settings.grid);
                var gridData = grid.data('gridstack');


                $configurationMount.css('display', 'none')

                $.each(data.configurations[key], function (idx, node) {
                    var $widgetWrapper = $('<div></div>');
                    $widgetWrapper.css('width', node.width * 300);
                    $widgetWrapper.css('min-width', 0);

                    var $widgetContent = $("<div></div>");
                    $widgetContent.addClass('grid-stack-item-content');
                    $widgetContent.css('margin', 10);
                    $widgetContent.css('background', 'red');

                    $widgetContent.appendTo($widgetWrapper);

                    gridData.addWidget($widgetWrapper, node.x, node.y, node.width, node.height);
                });

                self._configurations[key] = grid;
                self._configurationsData[key] = gridData;
            })
        },

        listenForResolutionChange: function () {
            var self = this;
            $(window).resize(Utils.throttle(self.showPropperConfiguration.bind(self), 300 ))
        },

        showPropperConfiguration: function () {
            var width = $(window).width();
            var self = this;
            //hide all
            Object.keys(this._configurations).forEach(function(key) {
                self._configurations[key].css('display', 'none');
            });

            //show the proper
            if (width > 300 && width < 600 ) {
                self.$gridRoot.css('width', 300);
                self._configurations['300-600'].css('display', 'block');
            }
            else if (width > 600 && width < 1200 ) {
                self.$gridRoot.css('width', 600);
                self._configurations['600-1200'].css('display', 'block');

            }
            else if (width > 1200 && width < 1500 ) {
                self.$gridRoot.css('width', 1200);
                self._configurations['1200-1500'].css('display', 'block');
            }
            else if (width > 1500) {
                self.$gridRoot.css('width', 1500);
                self._configurations['1500-1800'].css('display', 'block');
            }
        }

    } );

    // prevent multiple instances
    $.fn[ pluginName ] = function( options ) {
        return this.each( function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" +
                    pluginName, new Plugin( this, options ) );
            }
        } );
    };

} )( jQuery, window, document );
