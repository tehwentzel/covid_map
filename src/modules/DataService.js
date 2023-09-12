import * as constants from './Constants';
import CountyStats from './CountyStats';
// import Utils from './Utils.js';
//code is modified to use as a demo so it doesn't require an actual backend that deals with updated data 
export default class DataService {

    constructor(args){
        // this.axios = require('axios');
        // this.api = this.axios.create({
        //     baseURL: constants.API_URL,
        // })
        this.cache = {maxCovid: {}};
        this.preloadCache()
    }

    test(testData){
        return true;  
    }

    async getAvailableDates(useCache){
        if(!useCache || this.cache['availableDates'] === undefined){
            var availableDates = ["3/1/20","3/11/20","3/21/20","3/31/20","4/10/20","4/20/20","4/30/20","5/10/20","5/20/20","5/30/20","6/19/20","6/29/20","6/9/20","7/19/20","7/9/20"];
            availableDates.sort((a,b) => Date.parse(a) - Date.parse(b));
            this.cache.availableDates = availableDates;
            // console.log('dates', this.cache.availableDates)
            return this.cache.availableDates
        } else{
            return this.cache.availableDates
        }
        
    }

    async getMapData(useCache){
        if(!useCache || this.cache['mapData'] === undefined){
            var mapData = await fetch('county_groups.json');
            this.cache.mapData = await mapData.json();
            console.log(this.cache.mapData);
            return this.cache.mapData
        } else{
            return this.cache.mapData
        }
    }

    async preloadCache(){
        this.getMapData(false).then(res => {
            this.getAvailableDates(false);
        });
    }

    maxGroupCovid(groupData, key, useCache = true){
        if(this.cache.availableDates === undefined){
            return 0
        }
        if(this.cache.maxCovid[key] === undefined || !useCache){
            var covidPerCapita = function(d,key,date){
                let covid = CountyStats.groupCovidData(d,key,date);
                return covid/CountyStats.countyGroupPopulation(d)
            }
            let dates = this.cache.availableDates;
            var maxVal = 0;
            for(const date of dates){
                let covidValues = groupData.map(d=>covidPerCapita(d,key,date));
                for(var value of covidValues){
                    maxVal = (value > maxVal)? value: maxVal;
                }
            }
            this.cache.maxCovid[key] = maxVal
        } 
        console.log('max', this.cache.maxCovid[key])
        return this.cache.maxCovid[key]
    }

}