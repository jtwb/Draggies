if (typeof console == "undefined") { console = {log: function(m){}} };

var Remote = function(fayeclient, clientId) {
   var fayepath = '/general';

   this.publish = function(message){
      return fayeclient.publish(fayepath, message);
   };

   this.clientId = clientId;

   fayeclient.subscribe(fayepath, function(message) {
      console.log('message recieved');
      console.log(message);
      if (message.client == clientId) {
         console.log('loopback; ignore');
         return;
      }
      $('body').trigger('dg-message', message);
   });

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
            data.el = parameters.el;
            data.x = parameters.pos.left;
            data.y = parameters.pos.top;
            break;
         case 'delete':
            data.el = parameters.el;
            break;
      }
      console.log('sending data');
      console.log(data);
      this.publish(data);
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
          newBox(message.el, {left: message.x, top: message.y});
      }
      console.log(message.el);
   });

   $('body').bind('dg-delete', function(e, message) {
      console.log('deletion handler');
      console.log(message);
      $('#'+message.el).remove();
   });

   var clientId = getNewId(),
       fayeclient = new Faye.Client('/fayeclient'),
       remote = new Remote(fayeclient, clientId),
       newBox = function(id, pos) {
         var boxHtml = '<div class="dg-box"></div>';
         return $(boxHtml).appendTo($('#dg-boxstart'))
            .draggable(dragOpts.box)
            .css({
               top: pos.top || pos.y || pos[1],
               left: pos.left || pos.x || pos[0]
            }).attr('id', id);
      },
       dragOpts = {
         box: {
            containment: 'window',
            grid: [51, 51],
            stop: function(event, ui){
               if (ui.helper.hasClass('dg-dead')) return;
               remote.fire('place', {
                  el: ui.helper.attr('id'), 
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
               newBox(newId, ui.position);
               remote.fire('place', {
                  el: newId,
                  pos: ui.position
               });
            }
         }
       };

   $(".dg-spawn").draggable(dragOpts.spawn);

   //$(".dg-box").draggable(dragOpts.box);

   $(".dg-trash").droppable({
      drop: function(event, ui){
         if (ui.draggable.hasClass('dg-target')) return;
         remote.fire('delete', { el: ui.draggable.attr('id')});
         ui.draggable.addClass('dg-dead').remove();
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

   $.getJSON('/sync', function(data) {
      console.log('sync data recieved: ');
      console.log(data);
      $.each(data, function(id, pos) {
         newBox(id, pos);
      });
   });
});
