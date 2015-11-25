$(function () {

    // Create a model for the services
    var Service = Backbone.Model.extend({

        // Will contain three attributes.
        // These are their default values

        defaults: {
            id: undefined,
            title: 'My service',
            price: 100,
            checked: false,
            parentId: undefined
        },

        // Helper function for checking/unchecking a service
        toggle: function () {
            this.set('checked', !this.get('checked'));

            //We need to bubble down & up.  Unchecks need to bubble down and uncheck all children.
            //Checks need to bubble up and check all parents
            var state = this.get('checked');

            if (state) {
                var parent = services.getParent(this);
                if (parent && !parent.get('checked'))
                    parent.toggle();
            } else {
                _.each(services.getChildServices(this), function(child) {
                    if (child.get('checked')) {
                        child.toggle();
                    }
                });
            }
        }
    });

    // Create a collection of services
    var ServiceList = Backbone.Collection.extend({

        // Will hold objects of the Service model
        model: Service,

        // Return an array only with the checked services
        getChecked: function () {
            return this.where({checked: true});
        },

        getRootServices: function() {
            return this.filter(function(service) {
                return service.get('parentId') === undefined;
            });
        },
        getChildServices: function(parent) {
            return this.filter(function(service) {
                return parent.get('id') !== undefined && service.get('parentId') === parent.get('id');
            });
        },
        getParent: function(child) {
            if (child.get('parentId') === undefined)
                return undefined;
            return this.findWhere({id: child.get('parentId')});
        }
    });

    // Prefill the collection with a number of services.
    var services = new ServiceList([
        new Service({id: 0, title: 'web development', price: 200}),
        new Service({id: 1, title: 'web design', price: 250}),
        new Service({id: 2, title: 'photography', price: 100}),
        new Service({id: 3, title: 'coffee drinking', price: 10}),
        new Service({title: 'SEO', price: 50, parentId: 0}),
        new Service({title: 'Analytics', price: 25, parentId: 0}),
        new Service({title: 'Sugar', price: 1, parentId: 3}),
        new Service({title: 'Cream', price: 1, parentId: 3}),
        new Service({title: 'Decaf', price: 2, parentId: 3}),
        new Service({title: 'Custom Branding', price: 100, parentId: 1})
        // Add more here
    ]);

    // This view turns a Service model into HTML
    var ServiceView = Backbone.View.extend({
        tagName: 'li',

        events: {
            'click': 'toggleService'
        },

        initialize: function () {

            // Set up event listeners. The change backbone event
            // is raised when a property changes (like the checked field)

            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {

            // Create the HTML
            this.$el.html('<input type="checkbox" value="1" name="' + this.model.get('title') + '" /> ' + this.model.get('title') + '<span>$' + this.model.get('price') + '</span>');

            this.$('input').prop('checked', this.model.get('checked'));

            if (this.options.children) {
                var self = this;

                this.$el.append('<ul id="children"></ul>');
                _.each(this.options.children, function(child) {
                    var subView = new ServiceView({model:child});
                    self.$('#children').append(subView.render().el);
                });
            }

            // Returning the object is a good practice
            // that makes chaining possible
            return this;
        },

        toggleService: function (event) {
            this.model.toggle();

            event.stopImmediatePropagation();
        }
    });

    // The main view of the application
    var App = Backbone.View.extend({

        // Base the view on an existing element
        el: $('#main'),

        renderService: function(service) {
            var view = new ServiceView({model: service, children: services.getChildServices(service)});
            this.list.append(view.render().el);
        },

        initialize: function () {

            // Cache these selectors
            this.total = $('#total span');
            this.list = $('#services');

            // Listen for the change event on the collection.
            // This is equivalent to listening on every one of the
            // service objects in the collection.
            this.listenTo(services, 'change', this.render);


            // Create views for every one of the services in the
            // collection and add them to the page

            _.each(services.getRootServices(), function (service) {
                this.renderService(service);
            }, this);	// "this" is the context in the callback
        },

        render: function () {

            // Calculate the total order amount by aggregating
            // the prices of only the checked elements

            var total = 0;

            _.each(services.getChecked(), function (elem) {
                total += elem.get('price');
            });

            // Update the total price
            this.total.text('$' + total);

            return this;

        }

    });

    new App();

});