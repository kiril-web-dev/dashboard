;(function($, window, document, undefined) {

    'use strict';

    var pluginName = 'dashboard',
        defaults = {
            grid: {
                disableResize: true,
                cellHeight: 300,
                verticalMargin: 20,
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
            var profile = new self.profile({ apiUrl: self.settings.apiUrl });

            self.buildGridLayout();
            self.initEditMode();
            self.initStyles();

            if (!self.settings.apiUrl) {
                throw new Error('Undefined API URL');
            }

            profile.check().done(function (check) {

                if (check.login) {
                    profile.show('logout');
                    $.notify('Logged in', 'info');
                } else {
                    profile.show('login');
                    $.notify('Not Logged in', 'info');
                }

                $.get(self.settings.apiUrl + 'default', function (response) {
                    $.notify('Default Configuration', 'info');
                    self.setConfigurations(response);  
                    self.showPropperConfiguration()
                    self.listenForResolutionChange();
                    self.checkHash();
                });

            });

        },

        profile: function (settings) {

            var $profileLogIn = $('#profileLogIn').click(function(){ return login(true); });
            var $profileLogOut = $('#profileLogOut').click(function(){ return login(false); });

            function check(){

                return $.get(settings.apiUrl + 'profile/check');

            }

            function show(target){

                if (target === 'login') {
                    $profileLogOut.hide();
                    $profileLogIn.show();
                } else {
                    $profileLogIn.hide();
                    $profileLogOut.show();
                }

            }

            function login(type){

                var type = type ? 'in' : 'out';

                $.post(settings.apiUrl + 'profile/log' + type, {}, function (response) {
                    if (response.login) {
                        show('logout');
                        $.notify('Login', 'success');
                    } else {
                        show('login');
                        $.notify('Logout', 'success');
                    }
                });

                return false;

            }
            
            return {
                check: check,
                show: show
            };

        },

        checkHash: function () {

            var hash = window.location.hash;

            if (hash === '') {
                return;
            }

            $(hash + '_widget').mouseup();
            $.notify('Auto Open Widget', 'success');

        },

        initEditMode: function () {

            var self = this;
            var $addWidget = $('.panel-add');

            $('#editMode').change(function () {

                var notified = false;

                self._editMode = $(this).is(':checked');

                $.each(self._configurations, function() {

                    if (self._editMode) {
                        self.$gridLayout.addClass('edit-mode');
                        $addWidget.show();
                        if (!notified) {
                            $.notify('Edit Mode is ON', 'success');
                            notified = true;
                        }
                    } else {
                        self.$gridLayout.removeClass('edit-mode');
                        $addWidget.hide();
                        if (!notified) {
                            $.notify('Edit Mode is OFF', 'success');
                            notified = true;
                        }
                    }

                    var grid = this.$grid.data('gridstack');

                    $.each(this.widgets, function (idx, widget) {
                        grid.locked(widget.$widget, widget.locked);
                        grid.movable(widget.$widget, !widget.locked);
                    });

                });

                notified = false;

            });
            
            $.notify('Edit Mode is OFF', 'info');

        },

        initStyles: function () {

            var themes = '/css/themes/';
            var fonts = { 1: 'Raleway', 2: 'Oswald', 3: 'Indie+Flower' };
            var fontsUrl = 'https://fonts.googleapis.com/css?family=';

            $('.theme').change(function () {
                $('#theme').attr('href', themes + 'theme_' + this.value + '.css');
                $('#font').attr('href', fontsUrl + fonts[this.value]);
                $.notify('Theme Changed', 'success');
            });

            $('.background').change(function () {

                var value = parseInt(this.value);
                var background = 'none';

                if (value > 0) {
                    background = 'url(' + themes + 'backgrounds/background_' + value + '.jpg)';
                }

                $('body').css('background-image', background);
                $.notify('Background Changed', 'success');

            });

            $.notify('Default Theme', 'info');
            $.notify('Default Background', 'info');

        },

        buildGridLayout: function () {
            
            $.notify.defaults({ position: 'right middle', autoHideDelay: 10000 });

            this.$gridLayout = $('<div>').appendTo($(this.element));

            this.$gridRoot = $('<div class="widget-root">').appendTo(this.$gridLayout);

        },

        setConfigurations: function (data) {

            var self = this;
            var notified = {};

            self._configurations = data;

            $.each(self._configurations, function(key) {

                var grid;
                var stack = this.stack || self.settings.viewports[key].stack;

                this.$grid =
                    $('<div class="grid-stack grid-stack-' + stack + '">')
                        .appendTo(self.$gridRoot)
                        .gridstack(self.settings.grid);

                grid = this.$grid.data('gridstack');

                $.each(this.widgets, function (idx, widget) {

                    var id = widget.id;
                    var width = widget.width * self.settings.cellWidth;
                    var $wrapper = $('<div>');
                    var $iframe = $('<iframe src="' + self.settings.apiUrl + 'widgets/' + id + '" id="widget_' + id + '" name="widget_' + id + '" scrolling="no"></iframe>')
                    var $hover = $('<div id="' + widget.url + '_widget" class="widget-hover">').mouseup(function () {

                        if (self._editMode) {
                            return;
                        }

                        if (widget.settings) {
                            $.notify('Open Settings: ' + id, 'success');
                        }

                        window.location.hash = widget.url;
                        $.notify('Open App: ' + id, 'success');

                    });
                    var $title = $('<div class="widget-title">' + widget.name + '</div>');
                    var $close = $('<div class="widget-remove">remove</div>').click(function () {

                        window.location.hash = '';
                        $.notify('Remove Widget: ' + id, 'success');

                    });
                    
                    if (widget.refresh) {
                        widget.refresh = setInterval(function () {
                            $iframe.attr('src', $iframe.attr('src'));
                            if (!notified[id]) {
                                $.notify('Widget Refresh: ' + id, 'success');
                                notified[id] = true;
                            }
                        }, widget.refresh * 1000);
                    }

                    $('<div class="grid-stack-item-content">')
                        .append([$iframe, $hover, $title, $close])
                        .appendTo($wrapper);                        

                    grid.addWidget($wrapper, widget.x, widget.y, widget.width, widget.height);
                    widget.$widget = $wrapper;
                    
                    grid.movable($wrapper, false);

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
                
                if (self._currentResolution === key) {
                    return;
                }

                if (check.from && check.to) {
                    self.$gridRoot.css('width', range.from || self.settings.cellWidth);
                    this.$grid.show();
                    self._currentResolution = key;
                    $.notify('Set Configuration: ' + (range.from ? range.from + '-' : '<') + (range.to ? range.to : '∞'), 'success');
                } else {
                    this.$grid.hide();
                }

            });

        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
