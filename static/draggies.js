if (typeof console == "undefined") { console = {log: function(m){}} };

var Remote = function(clientId, publish) {
   this.publish = publish;
   this.clientId = clientId;
   this.listeners = {};

   $('body').bind('dg-message', function(e, args) {
      args.type && $('body').trigger('dg-' + args.type, args);
   });
}

Remote.prototype = {
   fire: function(eventType, parameters) {
      console.log('starting fayesend');
      var data = { client: this.clientId, type: eventType };
      switch (eventType) {
         case 'place':
            data.el = parameters.id;
            data.x = parameters.pos.left;
            data.y = parameters.pos.top;
            break;
         case 'delete':
            data.el = parameters.id;
            break;
      }
      console.log('sending data');
      console.log(data);
      this.publish(data);
   },
   subscribe: function(eventType, callback) {
      if (typeof this.listeners[eventType] == 'undefined') {
         this.listeners[eventType] = [];
      }
      
   }
};
$(function(){
   var getNewId = function() {
         // TODO overwrite with a hashing algorithm?
         return 'xxxxxxxx-xxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
         });
      };

   $('body').bind('dg-place', function(e, message) {
      console.log('place handler');
      console.log(message);
      if ($('#'+message.el)[0]) {
         $('#'+message.el).css({
            left: message.x,
            top: message.y
         });
      } else {
          newBox({left: message.x, top: message.y}, message.el);
      }
      console.log(message.el);
   });

   var fayepath = '/general',
       fayeclient = null,
       clientId = getNewId(),
       fayecb = function(message) {
         console.log('message recieved');
         console.log(message);
         if (message.client == clientId) {
            console.log('loopback; ignore');
            return;
         }
         $('body').trigger('dg-message', message);
       },
       remote = new Remote(clientId, function(message){
         return fayeclient.publish(fayepath, message); }
       ),
       newBox = function(pos, id) {
         var boxHtml = '<div class="dg-box"></div>';
         return $(boxHtml).appendTo($('#dg-boxstart'))
            .draggable(dragOpts.box)
            .css({
               top: pos.top || pos.y,
               left: pos.left || pos.x
            }).attr('id', id);
      },
       dragOpts = {
         box: {
            containment: 'window',
            grid: [51, 51],
            stop: function(event, ui){
               remote.fire('place', {
                  id: ui.helper.attr('id'), 
                  pos: ui.position,
               });
            }
         },
         spawn: {
            containment: 'window',
            grid: [51, 51],
            helper: 'clone',
            stop: function(event, ui){
               var newId = 'dg-box-' + getNewId();
               newBox(ui.position, newId);
               remote.fire('place', {
                  id: newId,
                  pos: ui.position
               });
            }
         }
       };

   $(".dg-spawn").draggable(dragOpts.spawn);

   //$(".dg-box").draggable(dragOpts.box);

   $(".dg-trash").droppable({
      drop: function(event, ui){
         ui.draggable.hasClass('dg-target') || ui.draggable.remove();
      }
   });

   // listen for deselect-click
   $('html').click(function(e){
      e.preventDefault();
      // deselect any selected items
      if (e.target == this) {
         console.log('html.click triggered');
      }
   });

   // listen for ESC (deselect)
   // TODO why doesn't this work?
   $('document').keypress(function(e){
      console.log(e.which);
      e.which == $.keyCode.ESCAPE && console.log('ESC triggered');
   });

   // faye setup
   fayeclient = new Faye.Client('/fayeclient');
   fayeclient.subscribe(fayepath, fayecb);
});
