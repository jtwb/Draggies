if (typeof console == "undefined") { console = {log: function(m){}} };

$(function(){
   var getNewId = function() {
         // TODO overwrite with a hashing algorithm?
         return 'xxxxxxxx-xxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
         });
      };

   var fayepath = '/general',
       fayeclient = null,
       clientId = getNewId(),
       fayecb = function(message) {
         console.log('message recieved');
         console.log(message);
         if (message.client == clientId) {
            console.log('loopback; ignore');
            //return;
         }
         if ($('#'+message.el)[0]) {
            $('#'+message.el).css({
               left: message.x,
               top: message.y
            });
         } else {
             newBox({left: message.x, top: message.y}, message.el);
         }
         console.log(message.el);
       },
       fayesend = function(pos, id) {
         var data = {
            client: clientId,
            el: id,
            x: pos.left,
            y: pos.top
         };
         // placeholder
         console.log('starting fayesend');
         console.log('sending data');
         console.log(data);
         fayeclient.publish(fayepath, data);
      },
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
               fayesend(ui.position, ui.helper.attr('id'));
            }
         },
         spawn: {
            containment: 'window',
            grid: [51, 51],
            helper: 'clone',
            stop: function(event, ui){
               var newId = 'dg-box-' + getNewId();
               newBox(ui.position, newId);
               fayesend(ui.position, newId);
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
