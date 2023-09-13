/*
DESCRIPTION

    This file will load the shortened version of the USDA Branded JSON file. It needs to be the file created by USDASimplifyer.js.

    After loading the file, it will connect to a mysql database with credentials as described in the .env.

    Then it will attempt to drop a table named foodItems, and recreate it.

    Finally It will load the data in the USDA Branded JSON file into the database asynchronously.


NOTES
----------------------------------------------------------------------
    -Decidied on FlOATS for all values
    It may be more memory effecient to use decimal with something like DECIMAL(5,2), I doubt anything larger would be necessary
    
    -LONGTEXT for name may be uneccessary but I think that some names are too large for VARCHAR to handle
    realistically people will not be make such long names. I could consider culling these entries, or perhaps removing duplicate words in the foot names
    many of these entries names are ridiculous long strings with multiple duplicate words
    
    -brand is set to 75, The largest brand name was 72. 75 is very large for brand names. I doubt people will enter such large brand names 
    If memory becomes an Issue i could think about doing something with these entries having such long brand names
    the longest brand name is "green land group for food industries   ____ ____ ____ ________ ________."
    this the brand name on the USDA website as well

    A delete query to get rid of the final dummy value could be entered at then.
    DELETE FROM foodItems WHERE name = "nothing";

*/
const uuid = require('uuid');
const mysql = require('mysql2/promise');
//I could potentially change this to use dotenv
const data2 = require("./USDABrandedFoodsData.json")

require('dotenv').config()

const dbHost = process.env.DBHOST
const dbUser = process.env.DBUSER
const dbPassword = process.env.DBPASSWORD
const database = process.env.DATABASE

//Database connecting stuff
const connection = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: database
})


async function main () {
    await connection.execute('DROP TABLE foodItems')
    .catch(err => {console.log("table not dropped")})
    await connection.execute('CREATE TABLE foodItems(foodItemID VARCHAR(36) PRIMARY KEY, name LONGTEXT, brand VARCHAR(75), servingSize FLOAT, servingUnit VARCHAR(16), calories FLOAT, protein FLOAT, fat FLOAT, carbs FLOAT)')
    let count = 0
    console.log("started")
    let promiseArray = []
    for (let food of data2.BrandedFoods) {
        const foodItemID = `${uuid.v4()}`;
        //running this asyncrhonously is there difference between a 1 hour wait and a 13 minute wait
        //each of these connections will return a promise passed to the promise array
        promiseArray.push(connection.execute(`INSERT INTO foodItems(foodItemID, name, brand, servingSize, servingUnit, calories, protein, fat, carbs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [foodItemID, food.name, food.brand, food.servingSize, food.servingSizeUnit, food.labelNutrients.calories.value, food.labelNutrients.protein.value, food.labelNutrients.fat.value , food.labelNutrients.carbohydrates.value])
        .catch(error => {
            console.log(foodItemID)
            console.log(food)
            //not sure if this will cause the main function to reject
            throw error
        }))
    }
    console.log("right above return")
    //this will resolve the main function after every promise has resolved in the promise array
    return Promise.all(promiseArray)
}

main()
.then((res) => {
    console.log("completed")
    connection.end(function(err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
      });
})
.catch(error => {
    console.log("error")
    connection.end(function(err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
      });
})
//DELETE FROM foodItems WHERE name = "nothing";