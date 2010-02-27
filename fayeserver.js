var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    faye = require('./faye');

var comet = new faye.NodeAdapter({mount: '/fayeclient', timeout: 45});

var port = 8010;

sys.puts('Listening on ' + port);

http.createServer(function(req, resp) {
   sys.puts(req.method + ' ' + req.url);
   if (comet.call(req, resp)) {
      sys.puts('** Handled by faye');
      return;
   } else {
      sys.puts('** Handled by server');
   }

  var path = (req.url === '/') ? '/index.html' : req.url;
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

