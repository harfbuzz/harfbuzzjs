var fs = require('fs');

require('http').createServer(function (req, res) {
  // quick'n dirty

  if (req.url === '/favicon.ico') return res.end();

  res.writeHead(200, {
    'Content-Type': {
      ttf: 'application/octet-stream', wasm: 'application/wasm',
      html: 'text/html; charset=utf8', js: 'application/javascript'
    }[req.url.split('.').slice(-1)[0]] || 'text/plain'
  });

  if (req.url.slice(1) === 'DejaVuSans.ttf')
    return fs.createReadStream('/usr/share/fonts/TTF/DejaVuSans.ttf').pipe(res);

  if (['harfbuzzjs.js', 'harfbuzzjs.wasm', 'hbjs.js'].indexOf(req.url.slice(1)) !== -1)
    return fs.createReadStream('..' + req.url).pipe(res);
    
  if (['hbjs.example.html',
       'hbjs.example.js',
       'nohbjs.html',
       'nohbjs.js'].indexOf(req.url.slice(1)) !== -1)
    return fs.createReadStream('.' + req.url).pipe(res);

  res.end('not found');
}).listen(3473);

console.log('http://127.0.0.1:3473/hbjs.example.html');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});