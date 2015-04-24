'use strict';
var assert = require('assert');

var waterfall = require('promise-waterfall');

var utils = require('./utils');
var getParameters = utils.getParameters;


module.exports = function(resourceName) {
    it('should be able to search all by default', function(done) {
        var resource = this.resource;
        var postSchema = resource.post.parameters[0].schema;
        // XXX: if schema doesn't have strings, this will fail
        var firstString = findFirst(postSchema.properties, 'string');
        var fixedValue = 'foobar';
        var firstParameters = getParameters(postSchema);

        firstParameters[firstString] = fixedValue;

        waterfall([
            resource.post.bind(null, firstParameters),
            resource.post.bind(null, getParameters(postSchema)),
            resource.post.bind(null, getParameters(postSchema)),
            resource.get.bind(null, {q: fixedValue})
        ]).then(function() {
            // TODO: check that some field of each res.data item is set to fixedValue

            assert(true, 'Found ' + resourceName + ' as expected');
        }).catch(function() {
            assert(false, 'Didn\'t update ' + resourceName + ' even though should have');
        }).finally(done);
    });

    it('should be able to search by field', function(done) {
        // TODO: check that an item with the set field is returned

        done();
    });
};

function findFirst(orig, type) {
    var keys = Object.keys(orig);
    var i, k, o, len;

    for(i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        o = orig[k];

        if(o.type === type) {
            return k;
        }
    }
}