import * as constants from './Constants';

export default class Utils {

    static signedLog(x){
        if(Math.abs(x) < 1){
            return x
        }
        return Math.sign(x)*Math.log(Math.abs(x));
    }

    static sum(arr){
        let total = 0;
        for(var val of arr){
            total += val;
        }
        return total
    }

    static mean(arr){
        let total = 0;
        for(var val of arr){
            total += val;
        }
        return total/arr.length
    }

    static median(arr){
        let sortedArray = arr.slice();
        sortedArray.sort();
        if(sortedArray.length === 1){
            return sortedArray[0]
        }
        else if(sortedArray.length%2 !== 0){
            return sortedArray[parseInt(sortedArray.length/2)]
        } else{
            let lower = parseInt(sortedArray.length/2);
            return (sortedArray[lower] + sortedArray[lower+1])/2
        }
    }

    static aggregateValues(dataGroup, accessor, aggregator, weightAccessor){
        //helper function to aggregate values accross county groups
        //data is a single county group {'counties':[{data},{data}], ...}, accessor gets a single value, aggregator is like sum/mean
        //weightAccessor is a secondary accessor for like population if we want to weight the sums
        var values = [];
        for(var dataPoint of dataGroup.counties){
            let dataVal = accessor(dataPoint);
            if(weightAccessor !== undefined){
                dataVal = dataVal*weightAccessor(dataPoint);
            }
            values.push(dataVal)
        }
        var finalValue = aggregator(values);
        return finalValue
    }

    static numberWithCommas(x){

        //from https://stackoverflow.com/a/2901298
        //should add commas to a number in thousands place?
        return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    }

    static emptyObject(obj){
        //checks if something is == {}, bascially
        try{
            var flag = (obj.constructor === Object && Object.keys(obj).length === 0);
            return flag
        } catch{
            return false
        }
    }

    static itemInArray(item, targetArray){
        for(let target of targetArray){
            if(item === target){
                return true
            }
        }
        return false
    }

    static validMapVars(mapType){
        return constants.COUNTY_MAP_VARS
    }

    static arrayUnions(...arrays){
        //should, in theory, join a list of arrays.  May not work
        var newArray = [];
        if(arrays.length === 1){
            return arrays[0];
        }
        for(var arr in arrays){
            newArray.concat( arr[1].filter(x => (!newArray.includes(x)) ));
        }
        return newArray
    }

    static isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    static unCamelCase(string){
        //converts camelCase to Camel Case.  For like, showing names
        //taken from https://stackoverflow.com/a/6229124
        try{
            var newString = string.replace(/([a-z])([A-Z])/g, '$1 $2')  //insert spaces
                .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3') //space before last upper in a sequence fellowed by lower
                .replace(/^./, function(str){ return str.toUpperCase(); });  //uppercase first character
            return newString
        }catch{
            return ''
        }
    }

    static unSnakeCase(string){
        //should convert snake-case to Snake Case.  untested. based on unCamelCase
        try{
            var newString = string.toLowerCase()
                .replace(/([a-z])-([a-z])/g, '$1 $2') 
                .replace(/^./, function(str){ return str.toUpperCase(); });
            return newString;
        } catch{
            return '';
        }
    }

    static formatPercent(string){
        return Utils.unCamelCase(string+'PerCapita')
    }

    static markify(stringArray, activeLabel){
        //converts array of things to a discrete format to use in sliders and maybe other stuff
        let stepSize = 100/(stringArray.length - 1);
        let currStep = 0;
        var markArray = [];
        for(var val in stringArray){
            let label = stringArray[val]
            if(activeLabel !== undefined){
                label = (label === activeLabel)? label: '';
            }
            let newEntry = {
                value: val,
                label: label
            }
            markArray.push(newEntry)
            currStep = currStep + stepSize;
        }
        return markArray;
    }

    static markifiedLabelLookup(index, markArray){
        //take an array from markify and maps an index to a value, for the slider
        var entry = markArray.filter(d => d.value === index);
        entry = entry[0].label;
        return entry
    }

    static wrapError(func, error_string){
        try{
            func();
        } catch(err){
            console.log(error_string);
            console.log(err);
        }
    }

    static arrayEqual(a1, a2){
        if(a1.length !== a2.length){
            return false
        }
        for(let idx in a1){
            if(a1[idx] !== a2){
                return false
            }
        }
        return true
    }

    // static quantiles(arr, nQuantiles){
    //     nQuantiles = Math.min(arr.length-1, nQuantiles)
    //     let vals = arr.slice()
    //     vals.sort();
    //     var quantiles = [];
    //     let stepSize = vals.length/(nQuantiles-1);
    //     var currPos = 0;
    //     while(currPos < vals.length-stepSize){
    //         quantiles.push(vals[parseInt(currPos)]);
    //         currPos += stepSize
    //     }
    //     quantiles.push(vals[vals.length-1])
    //     return quantiles
    // }

    static arrange(start, stop, nSteps){
        let stepSize = (stop - start)/(nSteps-1);
        let vals = [];
        let currVal = start;
        while(currVal < stop){
            vals.push(currVal);
            currVal += stepSize;
        }
        vals.push(stop)
        return vals
    }
}