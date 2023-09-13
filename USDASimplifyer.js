/*
DESCRIPTION

    This file uses JSONStream and event-stream to read in the USDA Branded food JSON file
    Since it is 3GB in size, it needs read in pieces at a time

    It reads in a food object from the original JSON file, and trims down the object to only include the properties that are need
    for my use case. It then writes them to a new JSON file.

    It will discard any object that does not have its Calories/Energy recorded. At the time of writing, this ends up being about 12,000 objects

    It also ensures that calories, protein, carbs, and fat have at least 0 for a value. This may be removed for calories in the future.
    This will make it much easier to process later on

    The result is a new JSON file at the time of writing is 168.2MB in size, which is down from a 3GB file

    This is a much more portable file and is under the 2GB node default memory limit, allowing it to be directly imported


NOTES
----------------------------------------------------------------------
//BrandedFoods
//FoundationFoods

*/



const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream')

const path = "./USDAFoodData/FoodData_Central_branded_food_json_2023-04-20/brandedDownload.json";

//this makes it an array of objects. Each food being an object
fs.writeFileSync("./USDABrandedFoodsData.json", '{"BrandedFoods":[', function(err) {
    if(err) {
        return console.log(err);
    }
});


/*
This ensures that Calories, fat, protein, and carbohydrates always have atleast a 0 for value.
Calories should never be 0 though
I dont like the need for {value : x} in this, but thats how it is in the USDA Json file
I dont think its worth it to translate it
*/
const baseNutrients = {
    calories : {value: 0},
    fat : {value: 0},
    protein : {value : 0},
    carbohydrates : {value: 0}
}
let noCalories = 0;
fileStream = fs.createReadStream(path, { encoding: "utf8" });
fileStream.pipe(JSONStream.parse("BrandedFoods.*")).pipe(
    es.through(function(data) {
        //This adds a lot of time I think, but it is better to deal with it here
        if(data.labelNutrients.calories === undefined || data.labelNutrients.calories === 0)
        {
            noCalories++;
        }
        else {
            let newData = {
                //Removes all commas
                //not sure if lowercase is necessary
                name: data.description.toLowerCase().replace(/,/g,''),
                brand: data.brandOwner.toLowerCase(),
                servingSize : data.servingSize,
                servingSizeUnit: data.servingSizeUnit,
                labelNutrients : {...baseNutrients, ...data.labelNutrients}
                /*
                This used the nutrients calculated by the USDA. It includes a lot of uneccessary information for my specific use
                It's better to use the label nutrients. This can be more easily matched by the user, and it also uses
                the given serving size, rather than the 100g serving size.

                will probably delete this

                nutrients: data.foodNutrients.filter(nutrient => {
                    if(nutrient.amount != 0){
                        return nutrient
                    }
                }).map(nutrient => {
                    return {
                        name : nutrient.nutrient.name,
                        unit : nutrient.nutrient.unitName,
                        amount : nutrient.amount
                    }
                }),*/
        }
        //console.log(newData)
        fs.appendFileSync("./USDABrandedFoodsData.json", JSON.stringify(newData), function(err) {
            if(err) {
                return console.log(err);
            }
        }); 

        fs.appendFileSync("./USDABrandedFoodsData.json", ",", function(err) {
            if(err) {
                return console.log(err);
            }
        });
        }
        return data;
    },
    function end() {
        //dummy data at the end
        const finalData = {
            name: "nothing",
            brand: "nothing",
            servingSize : 0,
            servingSizeUnit: "nothing",
            labelNutrients: baseNutrients
        }

        fs.appendFileSync("./USDABrandedFoodsData.json", JSON.stringify(finalData), function(err) {
            if(err) {
                return console.log(err);
            }
        });
        fs.appendFileSync("./USDABrandedFoodsData.json",  "]}", function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The END");
        }); 
        console.log("Number of entries skipped due to 0 calories: " + noCalories)
        console.log("stream reading ended");
        this.emit("end");
    }
));