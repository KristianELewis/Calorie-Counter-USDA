/*
DESCRIPTION

    This file will take one entry from the original USDA Branded JSON file and write it into a new JSON file

    it uses a command line argument as the index. If there is no command line arguement, or the arguement is not a valid number, it will use 0 as the index

    This is helpful to use as a reference for the structure of the objects in the original JSON file
*/

//BrandedFoods
//FoundationFoods
//const data = require("./USDAFoodData/FoodData_Central_foundation_food_json_2023-04-20/foundationDownload.json")
//const data = require("./USDAFoodData/FoodData_Central_branded_food_json_2023-04-20/brandedDownload.json")

const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream')

const path = "./USDAFoodData/FoodData_Central_branded_food_json_2023-04-20/brandedDownload.json";

//const path = "./USDAFoodData/FoodData_Central_foundation_food_json_2023-04-20/foundationDownload.json";

let index = 0;
if(!isNaN(parseInt(process.argv[2]))){
    index = parseInt(process.argv[2]);
}
let count = 0;

fs.writeFileSync("./BrandedSample.json", '{"BrandedFoods":[', function(err) {
    if(err) {
        return console.log(err);
    }
});
fileStream = fs.createReadStream(path, { encoding: "utf8" });
fileStream.pipe(JSONStream.parse("BrandedFoods.*")).pipe(
    es.through(function(data) {
        if(count === index)
        {
            fs.appendFileSync("./BrandedSample.json", JSON.stringify(data), function(err) {
                if(err) {
                    return console.log(err);
                }
            }); 

            fs.appendFileSync("./BrandedSample.json",  "]}", function(err) {
                if(err) {
                    return console.log(err);
                }
            }); 
            this.end();
        }
        count++;
        return data;
    },
    function end() {
        console.log("stream reading ended");
        this.emit("end");
        //not ending for some reason
    }
));