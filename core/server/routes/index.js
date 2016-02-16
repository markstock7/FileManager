var express = require('express'),
    router = express.Router(),
    _ = require('lodash');

// 加载各个路由
_.each(['./localCloud'], function(r) {
    require(r)(router);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
