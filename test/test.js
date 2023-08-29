// var FileSaver = require('file-saver');
// var blob = new Blob(["Hello, world!"], { type: "text/plain;charset=utf-8" });
// FileSaver.saveAs(blob, "hello world.txt");

const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "hello-world.html");
const blob = new Blob(["Hello, world!"], { type: "text/html;charset=utf-8" });

blob.arrayBuffer().then(buffer => {
  fs.writeFile(filePath, Buffer.from(buffer), error => {}) 
});
