var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    json = require('./json'),
    faye = require('./faye');

var comet = new faye.NodeAdapter({mount: '/fayeclient', timeout: 45}),
    client = comet.getClient();

// setup sync client; TODO move into a separate module
var state = {};
client.subscribe('/general', function(message) {
// TODO discard malformed messages
   if (!message.client || !message.type) return;
   sys.puts('sync noticed message from client ' + message.client);
   sys.puts('message type == ' + message.type);
   switch (message.type) {
      case 'place' :
         state[message.el] = {
            x: message.x,
            y: message.y
         };
         break;
      case 'delete' :
         delete state[message.el];
         break;
   }
   sys.puts("state: ");
   sys.puts(json.stringify(state));
});

var port = 8010;

sys.puts('Listening on ' + port);

http.createServer(function(req, resp) {
   sys.puts(req.method + ' ' + req.url);
   if (comet.call(req, resp)) {
      sys.puts('** Handled by faye');
      return;
   }

  var path = (req.url === '/') ? '/index.html' : req.url;
  if (path === '/sync') {
      sys.puts('** Handled by syncserver');
      resp.sendHeader(200, {'Content-Type': 'text/html'});
      resp.write(json.stringify(state));
      resp.close();
      return;
  }
  sys.puts('** Handled by file server');
  fs.readFile('./static/' + path).addCallback(function(content) {
    resp.sendHeader(200, {'Content-Type': 'text/html'});
    resp.write(content);
    resp.close();
  }).addErrback(function(){
    resp.sendHeader(404, {'Content-Type': 'text/html'});
    resp.write('<html><head><title>404 not found</title></head><body>404 Not Found</body></html>');
    resp.close();
  });
}).listen(port);

