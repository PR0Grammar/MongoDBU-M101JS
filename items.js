/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

       var categories = [];

       database.collection("item").aggregate([{
           $group: {
               _id: "$category",
               num: { $sum: 1 }
           }
       }, { $sort: { _id: 1 } }, {
           $group: {
               _id: 1,
               All: { $sum: "$num" },
               categories: {
                   $push: {
                       _id: "$_id",
                       num: "$num"
                   }
               }
           }
       }]).toArray((err, data) => {
           let all = {_id: 'All', num: data[0]['All']}; 
           categories = data[0]["categories"];
           categories.push(all);

           callback(categories);
       })


    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        database.collection('item').find({category}).limit(itemsPerPage).skip(page*itemsPerPage).sort({"_id":1}).toArray((err,data) => {
            var pageItems = [];

            for(let i = 0; i < data.length; i++) {
                let pageItem = data[i];
                pageItems.push(pageItem);
            }
            callback(pageItems);

        });
    }


    this.getNumItems = function(category, callback) {
        "use strict";


        database.collection('item').find({category}).count().then(numItems => callback(numItems));

    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        database.collection('item').find({"$text": {"$search": query}}).limit(itemsPerPage).skip(page*itemsPerPage).sort({"_id" : 1}).toArray((err, data) => {
            var items = [];
            for(let i = 0; i < data.length; i++)
                items.push(data[i]);
            callback(items);
        });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        database.collection('item').find({"$text": {"$search": query}}).count().then(num => callback(num));
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        database.collection('item').findOne({"_id": itemId}).then(doc => callback(doc));

    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }
        database.collection('item').update({"_id": itemId}, {"$push": {"reviews": reviewDoc}}).then(doc =>  callback(doc));

    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
