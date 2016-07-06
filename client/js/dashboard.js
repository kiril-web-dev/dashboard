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
                viewport_1: { stack: 1, range: { from: 0, to: 600 } },
                viewport_2: { stack: 2, range: { from: 600, to: 1200 } },
                viewport_3: { stack: 4, range: { from: 1200, to: 1500 } },
                viewport_4: { stack: 5, range: { from: 1500, to: 9999 } }
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
        this._currentViewport = null;
        //current gridster instance
        this._grid = null;
        this._editMode = false;

        this.menuWrapper = $('.menu-wrapper');
        this.toggleMenuButton = $('.widgets-menu-toggle-button');

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

            $.get(self.settings.apiUrl + 'availableWidgets', function (data) {
                self.buildAvailableWidgetsMenu(data.widgets);
            })

            var profile = new self.profile({ apiUrl: self.settings.apiUrl });

            profile.check().done(function (check) {

                if (check.login) {
                    profile.show('logout');
                    $.notify('Logged in', 'info');
                } else {
                    profile.show('login');
                    $.notify('Not Logged in', 'info');
                }

                $.get(self.settings.apiUrl + 'default', function (response) {
                    self._configurations = response;
                    self.initProperGridForViewport();
                    $.notify('Default Configuration', 'info');
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

                    $.each(this.widgets, function (idx, widget) {
                        self._grid.locked(widget.$widget, widget.locked);
                        self._grid.movable(widget.$widget, !widget.locked);
                    });

                });

                notified = false;

            });

            $.notify('Edit Mode is OFF', 'info');

        },

        initStyles: function () {

            var themes = 'css/themes/';
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

        createMenuWidgets: function (items) {
            var self = this;
            var widgets = items.map(function (widget) {
                var $widgetInfo = $('<div>').addClass('widgets-menu-item grid-stack-item');
                $widgetInfo.append($('<div>').addClass('grid-stack-item-content'))
                $widgetInfo.height(300);
                $widgetInfo.width(widget.width * 300);

                $widgetInfo.draggable({
                    helper: 'clone',
                     stop: function (e, ui) {
                         $(this).show()

                         //need to query it!! ui.helper wont do it
                         var $el = $('#' + widget.id);
                         //rm for sure
                         //$el.addClass('gridstack-item');
                         var w = self.createWidgetElement(widget).find('.grid-stack-item-content');
                         $el.find('.grid-stack-item-content').replaceWith(w);

                     },
                     start: function (e, ui) {
                         $(this).hide();

                         //detach the el from relative parent to escape from overflow hidden
                         //$(this).css('position','fixed');
                         //$(this).top('position','fixed');
                         $(this).attr('id', widget.id);
                         $(this).addClass('grid-stack-item');
                     }
                 });

                return $widgetInfo[0]
            });

            return widgets;
        },

        buildAvailableWidgetsMenu: function (widgets) {
            var self = this;
            var widgetsMenu = document.getElementById('widgets-menu');



            var items = document.createElement('div');
            var $items = $(items);
            items.classList.add('widgets-menu-items');
            var widgets = self.createMenuWidgets(widgets);
            widgets.forEach(function(w) {
                items.appendChild(w);
            });
            widgetsMenu.appendChild(items);

            var leftArrow = document.createElement('div')
            leftArrow.classList.add('widgets-menu-arrow', 'left');
            widgetsMenu.appendChild(leftArrow);
            leftArrow.addEventListener('click', function() {
                $items.animate({ scrollLeft: '-=300'}, 500)
            })

            var rightArrow = document.createElement('div');
            rightArrow.classList.add('widgets-menu-arrow', 'right');
            rightArrow.addEventListener('click', function() {
                $items.animate({ scrollLeft: '+=300'}, 500);
            })
            widgetsMenu.appendChild(rightArrow);

            this.toggleMenuButton.click(function () {
                self.toggleMenu();
            })

            //self.$availableWidgetsMenu = $widgetsMenu;
            //self.$gridLayout.prepend($menuWrapper);
        },

        toggleMenu: function () {
          this.toggleMenuButton.toggleClass('open');
          this.menuWrapper.toggle();
        },

        createWidgetElement: function (widgetSettings) {
            var self = this;
            var id = widgetSettings.id;
            var width = widgetSettings.width * self.settings.cellWidth;
            var $wrapper = $('<div>');
            var $iframe = $('<iframe src="' + self.settings.apiUrl + 'widgets/' + id + '" id="widget_' + id + '" name="widget_' + id + '" scrolling="no"></iframe>')
            var $hover = $('<div id="' + widgetSettings.url + '_widget" class="widget-hover">').mouseup(function () {

                if (self._editMode) {
                    return;
                }

                if (widgetSettings.settings) {
                    alert('Open Widget Settigs Dialog: ' + self.settings.apiUrl + 'settings/' + id);
                }

                alert('Call App ID: ' + id);

                window.location.hash = widgetSettings.url;

            });
            var $title = $('<div class="widget-title">' + widgetSettings.name + '</div>');
            var $close = $('<div class="widget-remove">remove</div>').click(function () {

                alert('Remove Widget ID:' + id);

                window.location.hash = '';

            });

            if (widgetSettings.refresh) {
                widgetSettings.refresh = setInterval(function () {
                    $iframe.attr('src', $iframe.attr('src'));
                }, widgetSettings.refresh * 1000);
            }

            $('<div class="grid-stack-item-content">')
                .data('id', id)
                .append($iframe)
                .append($hover)
                .append($title)
                .append($close)
                .appendTo($wrapper);

            return $wrapper;
        },

        setGridConfiguration: function (config) {

          var self = this;

          $.each(config.widgets, function (idx, widget) {
            var $wrapper = self.createWidgetElement(widget);
            self._grid.addWidget($wrapper, widget.x, widget.y, widget.width, widget.height);
            widget.$widget = $wrapper;
            self._grid.movable($wrapper, false);
          });

          var dashboard_config = _.map($('.grid-stack > .grid-stack-item:visible'), function (el) {
            var node = $(el).data('_gridstack_node');
            return { id: $(el).find('iframe').attr('id'), x: node.x, y: node.y, width: node.width, height: node.height };
          }, this);

          dashboard_config = JSON.stringify(dashboard_config, null, '');

          Cookies.set('dashboard_config', dashboard_config);
          console.log('set dashboard_config', dashboard_config);

          $.post(self.settings.apiUrl + 'config', dashboard_config, function (response) {
              $.notify('Dashboard Config Updated', 'info');
          });

        },

        initProperGridForViewport: function () {

          var dashboard_config = Cookies.get('dashboard_config');
          console.log('get cookie dashboard_config', dashboard_config);

          $.get(this.settings.apiUrl + 'config', function (data) {
              console.log('get api dashboard_config', data);
          })

            var self = this;
            var width = $(window).width();

            var properViewport = Object.keys(self.settings.viewports).filter(function (key) {
                var vp = self.settings.viewports[key];
                return width > vp.range.from && width <= vp.range.to
            });

            var viewportConfig = self.settings.viewports[properViewport];

            //dont reinit current
            if (self._currentViewport && viewportConfig.stack === self._currentViewport.stack) return;

            self._currentViewport = viewportConfig;

            //if currently set grid => remove it
            if (self._grid) self._grid.destroy();

            //rm children
            self.$gridRoot.empty();

            var properGridSettings = self.settings.grid;
            //important to set this in order to prevent overlapping.
            properGridSettings.width = self._currentViewport.stack;

            self.$grid =
                    $('<div class="grid-stack grid-stack-' + self._currentViewport.stack + '">')
                        .appendTo(self.$gridRoot)
                        .gridstack(properGridSettings);

            self._grid = this.$grid.data('gridstack');

            self.setGridConfiguration(self._configurations[properViewport]);

            var cv_info = 'Set Config: ' + self._currentViewport.stack + ' -> ' + self._currentViewport.range.from + 'x' + self._currentViewport.range.to;
            $.notify(cv_info, 'info');


        },

        listenForResolutionChange: function () {

            var self = this;
            $(window).resize(_.throttle(self.initProperGridForViewport.bind(self), self.settings.throttleInterval));
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
