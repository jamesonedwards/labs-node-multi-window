
/*
 * Reset connection and redirect.
 */

exports.list = function(req, res){
	res.render('reset', { title: 'Express' });
};