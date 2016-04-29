;( function( $, window, document, undefined ) {

    'use strict';

    var pluginName = 'dashboard',
        defaults = {
            grid: {
                disableResize: true,
                staticGrid: true,
                cellHeight: 300,
                verticalMargin: 0,
                acceptWidgets: '.grid-stack-item'
            },
            viewports: {
                viewport_1: { stack: 1, range: { to: 600 } },
                viewport_2: { stack: 2, range: { from: 600, to: 1200 } },
                viewport_3: { stack: 4, range: { from: 1200, to: 1500 } },
                viewport_4: { stack: 5, range: { from: 1500 } }
            },
            apiUrl: null,
            cellWidth: 300,
            throttleInterval: 100
        };

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
        //after init props..
        this._currentResolution = null;
        //current gridster instance
        this._grid = null;
        this._editMode = false;

        this.init();
    }

    $.extend( Plugin.prototype, {

        init: function() {

            var self = this;

            self.buildGridLayout();
            self.initEditMode();
            
            if (!self.settings.apiUrl) {
                throw new Error('Undefined API URL');
            }

            $.get(self.settings.apiUrl + 'default', function (response) {
                self.setConfigurations(response);  
                self.showPropperConfiguration()
                self.listenForResolutionChange();
            });

        },
        
        initEditMode: function () {

            var self = this;

            $('#editMode').change(function () {

                self._editMode = $(this).is(':checked');

                $.each(self._configurations, function() {
                    if (self._editMode) {
                        this.$grid.data('gridstack').enable();
                        self.$gridLayout.addClass('edit-mode');
                    } else {
                        this.$grid.data('gridstack').disable();
                        self.$gridLayout.removeClass('edit-mode');
                    }
                });

            });

        },

        buildGridLayout: function() {
            var $mount = $(this.element);
            this.$gridLayout = $('<div id="grid-layout">');
            this.$gridRoot = $('<div>');
            this.$gridRoot.css('margin', '0 auto');
            this.$gridRoot.appendTo(this.$gridLayout);
            this.$gridLayout.appendTo($mount);
            return this.$gridRoot;
        },

        setConfigurations: function (data) {

            var self = this;

            self._configurations = data;

            $.each(self._configurations, function(key) {

                var stack = this.stack || self.settings.viewports[key].stack;

                this.$grid =
                    $('<div class="grid-stack grid-stack-' + stack + '">')
                        .css('display', 'none')
                        .appendTo(self.$gridRoot)
                        .gridstack(self.settings.grid);
                
                var grid = this.$grid.data('gridstack');
                
                console.log(grid)

                $.each(this.widgets, function (idx, widget) {
                    
                    var id = widget.id;
                    var width = widget.width * self.settings.cellWidth;
                    var $wrapper = $('<div>').css({ width: width, minWidth: 0 })
                    var $iframe = $('<iframe src="' + self.settings.apiUrl + 'widgets/' + id + '" name="widget_' + id + '" id="widget_' + id + '" scrolling="no"></iframe>')
                    var $iframe_hover = $('<div class="iframe_hover" title="' + widget.name + '">').click(function(){
                        
                        if (self._editMode) {
                            return;
                        }
                        
                        if (widget.settings) {
                            alert('Open Widget Settigs Dialog: ' + self.settings.apiUrl + 'settings/' + id);
                        }
                        
                        alert('Call App ID: ' + id);
                        
                    });    

                    $('<div class="grid-stack-item-content">')
                        .append($iframe)
                        .append($iframe_hover)
                        .appendTo($wrapper);                        

                    grid.addWidget($wrapper, widget.x, widget.y, widget.width, widget.height);

                });

            });

        },

        listenForResolutionChange: function () {
            var self = this;
            $(window).resize(_.throttle(self.showPropperConfiguration.bind(self), self.settings.throttleInterval));
        },

        showPropperConfiguration: function () {

            var self = this;
            var width = $(window).width();

            $.each(self._configurations, function(key) {

                var range = this.range || self.settings.viewports[key].range;
                var check = {
                    from: width > (range.from || 0),
                    to: range.to ? width <= range.to : true
                };

                if (check.from && check.to) {
                    self.$gridRoot.css('width', range.from || self.settings.cellWidth);
                    this.$grid.css('display', 'block');
                } else {
                    this.$grid.css('display', 'none');
                }

            });

        }

    });

    $.fn[ pluginName ] = function( options ) {
        return this.each( function() {
            if ( !$.data( this, 'plugin_' + pluginName ) ) {
                $.data( this, 'plugin_' +
                    pluginName, new Plugin( this, options ) );
            }
        } );
    };

} )( jQuery, window, document );
