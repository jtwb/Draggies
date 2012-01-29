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
      $.extend(data, parameters);
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

   $('body').bind('dg-text', function(e, message) {
      console.log('text handler');
      console.log(message);
      $('#'+message.el).html('<span class="dg-letter">'+message.text+'</span>');
   });

   $('body').bind('dg-delete', function(e, message) {
      console.log('deletion handler');
      console.log(message);
      $('#'+message.el).remove();
   });

   var clientId = getNewId(),
       fayeclient = new Faye.Client('/fayeclient'),
       remote = new Remote(fayeclient, clientId),
       selected = null,
       select = function(el) {
          $(selected).removeClass('dg-selected');
          selected = el == null ? null : $(el).addClass('dg-selected');
       },
       newBox = function(id, data) {
         var boxHtml = data.text
            ? '<div class="dg-box"><span class="dg-letter">'+data.text+'</div>'
            : '<div class="dg-box"></div>';
         return $(boxHtml).appendTo($('#dg-boxstart'))
            .draggable({
               containment: 'window',
               distance: 30,
               grid: [51, 51],
               stop: function(event, ui){
                  if (ui.helper.hasClass('dg-dead')) return;
                  select(ui.helper);
                  remote.fire('place', {
                     el: ui.helper.attr('id'),
                     x: ui.position.left,
                     y: ui.position.top
                  });
               }
            }).css({
               top: data.top || data.y,
               left: data.left || data.x
            }).attr('id', id)
            .click(function(e) {
               console.log('box click fired');
               console.log(e.currentTarget);
               select(e.currentTarget);
            });
      };

   $(".dg-spawn").draggable({
      containment: 'window',
      grid: [51, 51],
      helper: 'clone',
      stop: function(event, ui){
         var newId = 'dg-box-' + getNewId();
         var box = newBox(newId, ui.position);
         select(box);
         remote.fire('place', {
            el: newId,
            x: ui.position.left,
            y: ui.position.top,
         });
      }
   });

   $(".dg-trash").droppable({
      drop: function(event, ui){
         if (ui.draggable.hasClass('dg-target')) return;
         remote.fire('delete', { el: ui.draggable.attr('id')});
         ui.draggable.addClass('dg-dead').remove();
      }
   });

   // listen for deselect-click
   $('html').add('.dg-banner').click(function(e){
      e.preventDefault();
      // deselect any selected items
      if (e.target == this) {
         console.log('click deselect');
         select(null);
      }
   });

   // listen for ESC (deselect)
   // TODO get this shit working
   /*$(document).keypress(function(e){
      console.log('keypress');
      console.log(e);
      e.charCode == 27 && console.log('ESC triggered');
   });*/
   $(document).keydown(function(e){
      console.log('keydown');
      console.log(e.keyCode);
      var key = e.which || e.keyCode;
      if (32 <= key && key <= 126) {
         //set selected state to keyCode
         var text = String.fromCharCode(key);
         $(selected).html('<span class="dg-letter">' + text + '</div>');
         remote.fire('text', { el: $(selected).attr('id'), text: text });
      }
   });

   $.getJSON('/sync', function(data) {
      console.log('sync data recieved: ');
      console.log(data);
      $.each(data, function(id, data) {
         newBox(id, data);
      });
   });
});
