var express = require("express");
var router = express.Router();
var path = require("path");
/* GET users listing. */

var fs = require("fs");
// router.use(express.static("e:NodeJs\ttt3/build/"));
// router.use(express.static("e:NodeJs\ttt3/node_modules/"));

router.get("/", (req, res) => {
  // const stream = fs.createReadStream(__dirname + "/../build/index.html");
  // stream.pipe(res);
});

module.exports = router;
