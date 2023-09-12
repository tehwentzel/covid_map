// import * as constants from './Constants';
import Utils from './Utils';
import { mean, sum } from 'simple-statistics';

export default class CountyStats {

    constructor(props){
        this.props = props
    }

    static getAccessor(key, date){
        var config = CountyStats.getVarConfig(key,date);
        return config.accessor
    }

    static getVarConfig(key, date){
        var accessor;//get data from a single county object
        var scaler; //scale the data when whe show it
        var aggregator; //how to aggregate given an array of values and weights for county Groups
        var weightAccessor; //how to weight counties when aggregating
        var labelFormatter; //formats the return value for display
        var name;
        switch(key){
            case 'none':
                name = 'NA';
                accessor = d=>0;
                scaler = d=>d;
                weightAccessor = d=>1;
                aggregator = (d,w) => 1;
                labelFormatter = (d) => '';
                break;
            case 'voting':
                name='Net Part Votes/Person'
                accessor = d=> CountyStats.getNetDemVotes(d)/CountyStats.getCountyPopulation(d);
                scaler = d=>d;
                weightAccessor = CountyStats.getCountyPopulation;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); } //weighted mean by population
                labelFormatter = function(d){
                    d = (100*d).toFixed(0);
                    if(d > 0){
                        return d + '% (D)'
                    } else{
                        return Math.abs(d) + '% (R)'
                    }
                }
                break;
            case 'income':
                name = 'Median Income';
                accessor = CountyStats.getMedianIncome;
                scaler = Math.log;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => "$" + Utils.numberWithCommas(d.toFixed(0));
                break;
            case 'population':
                name = 'Population (18+)';
                accessor = CountyStats.getCountyPopulation;
                scaler = Math.log;
                aggregator = (v,w) => { return Utils.sum(v); }
                weightAccessor = d => 1;
                labelFormatter = (d) => Utils.numberWithCommas(d.toFixed(0));
                break;
            case 'unemployment':
                name = 'Unemployment';
                accessor = CountyStats.getUnemploymentPct;
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => d.toFixed(1) + '%'
                break;
            case 'lowEducation':
                name = '% W/0 HS Degree';
                accessor = CountyStats.getLowEducationPct;
                scaler = d=>d**.25;
                aggregator = aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => d.toFixed(1) + '%'
                break;
            case 'underRepresentedMinorities':
                name = '% Black/Hispanc';
                accessor = CountyStats.getURMPct;
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => d.toFixed(1) + '%';
                break;
            case 'tweets':
                name = 'Unique Twitter Users';
                accessor = CountyStats.getTweetCount;
                scaler = d=> d**.25;
                //just get total tweets
                aggregator  = (v,w) => { return Utils.sum(v); }
                weightAccessor = d=>1;
                labelFormatter = (d) => Utils.numberWithCommas(d) + ' users';
                break;
            case 'tweetsPerCapita':
                name = 'Unique Twitter User';
                accessor = function(d){
                    var tweets = CountyStats.getTweetCount(d);
                    var pop = CountyStats.getCountyPopulation(d);
                    return tweets/pop;
                };
                scaler = d=> d**.25;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => (1000000*d).toFixed(0) + '/1M';
                break;
            case 'cases':
                name = 'Confirmed Cases';
                accessor = d => CountyStats.covidData(d,'cases',date);
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v); }
                weightAccessor = d=>1;
                labelFormatter = (d) => Utils.numberWithCommas(d) + ' cases';
                break;
            case 'casesPerCapita':
                name = 'Confirmed Cases';
                accessor = function(d){
                    let val = CountyStats.covidData(d,'cases',date)
                    var pop = CountyStats.getCountyPopulation(d);
                    return 100*val/pop
                }.bind(date);
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => (10000*d).toFixed(1) + '/10K';
                break;
            case 'deaths':
                name = 'Confirmed Deaths';
                accessor = d => CountyStats.covidData(d,'deaths',date);
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v); }
                weightAccessor = d=>1;
                labelFormatter = (d) => Utils.numberWithCommas(d) + ' deaths';
                break
            case 'deathsPerCapita':
                name = 'Confirmed Deaths'
                accessor = function(d){
                    let val = CountyStats.covidData(d,'deaths',date)
                    var pop = CountyStats.getCountyPopulation(d);
                    return 100*val/pop
                }.bind(date);
                scaler = d=>d**.25;
                aggregator = (v,w) => { return Utils.sum(v)/Utils.sum(w); }
                weightAccessor = CountyStats.getCountyPopulation;
                labelFormatter = (d) => (10000*d).toFixed(1) + '/10K';
                break
            default:
                name = 'NA';
                accessor = d=>.1;
                scaler = d=>d;
                aggregator = (v,w) => 1
                weightAccessor = d=>1;
                labelFormatter  = (d) => d.toFixed(4);
                break;
        }
        var config = {
            accessor: accessor, 
            scaler: scaler, 
            aggregator: aggregator,
            weightAccessor: weightAccessor,
            labelFormatter: labelFormatter,
            name: name,
        }
        return config
    }

    static getGroupAccessor(key, date){
        var config = CountyStats.getVarConfig(key, date);
        var groupAccessor = function(d){
            var vals = [];
            var totalWeights = [];
            for(var county of CountyStats.getGroupCounties(d)){
                let newVal = config.accessor(county);
                let weight = config.weightAccessor(county)
                vals.push(newVal*weight);
                totalWeights.push(weight)
            }
            return config.aggregator(vals,totalWeights)
        }.bind(config)
        return groupAccessor
    }

    static getSecondaryAccessor(key, startDate, endDate, perCapita = true){
        //get an accessor to calculate the thing to plot on the CovidTimeLine chart
        //for specifically time change data.  Currenlty just covid
        var accessor;
        switch(key){
            case 'cases':
            case 'deaths':
                if(startDate == endDate){
                    accessor = d => CountyStats.covidData(d, key, endDate)
                } else{
                    accessor = d => CountyStats.countyCovidChange(d, key, [startDate, endDate], perCapita)[0]
                }
                break;
            case 'tweets':
                accessor = CountyStats.getTweetCount
                break
            default:
                accessor = d => CountyStats.covidData(d, key, endDate);
        }
        return accessor;
    }
    
    static getCountyPopulation(data){
        return parseInt(data.cvap)
    }

    static getCountyName(data){
        return data.county_name;
    }

    static getGroupCounties(cgData){
        return cgData.counties;
    }

    static getNetDemVotes(data){
        var netClinton = parseFloat(data.net_dem_president_votes);
        var netDemGov = parseFloat(data.net_dem_gov_votes);
        var votes = 0;
        if(!isNaN(netClinton)){
            votes = netClinton;
        }
        else if(!isNaN(netDemGov)){
            votes = netDemGov;
        }
        return votes
    }

    static getMedianIncome(d){
        return parseInt(d.median_hh_inc)
    }

    static getLowEducationPct(d){
        return parseInt(d.lesshs_pct)
    }

    static getURMPct(d){
        return parseInt(d.urm_pct)
    }

    static getCountyGeoid(d){
        return parseInt(d.GEOID)
    }

    static getUnemploymentPct(d){
        return parseFloat(d.clf_unemploy_pct)
    }

    static getTweetCount(d){
        return parseInt(d.tweet_users)
    }

    static getParentCountyGroup(d){
        return parseInt(d.parent);
    }

    static getCountyGroup(d){
        return parseInt(d.groupId);
    }

    static getCountyName(d){
        return d.county_name;
    }

    static covidData(d, key, date){
        let covid = d.covid[date]
        return covid[key]
    }


    static groupCovidData(cgData, key, date){
        var total = 0;
        for(var countyPoint of cgData.counties){
            total += CountyStats.covidData(countyPoint, key, date);
        }
        return total
    }

    static countyGroupPopulation(cgData){
        var totalCVAP = 0;
        for(var countyPoint of cgData.counties){
            totalCVAP += CountyStats.getCountyPopulation(countyPoint);
        }
        return totalCVAP
    }

    

    static countyGroupMedianIncome(cgData){
        var income = cgData.counties.map(CountyStats.getMedianIncome)
        return Utils.mean(income).toFixed(0)
    }

    static countyGroupTweetCount(cgData){
        var tweets = cgData.counties.map(CountyStats.getTweetCount);
        return Utils.sum(tweets)
    }

    static countyCovidChange(county, key, dates, perCapita = true){
        //should give the change in covid rates between date in dates?
        //takes a singe county item
        //returns an array of dates.length - 1
        var diffs = [];
        let weight = (perCapita)? CountyStats.getCountyPopulation(county): 1;
        var currVal = CountyStats.covidData(county, key, dates[0])/weight;
        for(let date of dates.slice(1)){
            let newVal = CountyStats.covidData(county, key, date)/weight;
            let diff = newVal - currVal;
            diffs.push(diff)
            currVal = newVal;
        }
        return diffs
    }

    static groupNetDemVotes(cgData){
        var netVotes = cgData.counties.map(CountyStats.getNetDemVotes)
        return Utils.sum(netVotes)
    }

    static additionalToolTipVars = ['population','cases','deaths'];


    static getSingleCountyToolTip(data, date, pVar, sVar, tVar){
         var string = CountyStats.getCountyName(data) + ' county</br>';
         let vars = [pVar, sVar, tVar];
         for(let additionalVar of CountyStats.additionalToolTipVars.slice()){
             if(vars.indexOf(additionalVar) === -1){
                 vars.push(additionalVar)
             }
         }
         for(let v of vars){
             if(v !== 'none'){
                try{
                    let config = CountyStats.getVarConfig(v,date);
                    let accessor = config.accessor;
                    let value = accessor(data);
                    string += config.name + ': ' + config.labelFormatter(value) + '</br>';
                } catch{}
             }
        
         }
         return string
    }

    static getGroupToolTip(data, date, pVar, sVar, tVar){
        var string = '';
         let vars = [pVar, sVar, tVar];
         for(let additionalVar of CountyStats.additionalToolTipVars.slice()){
             if(vars.indexOf(additionalVar) === -1){
                 vars.push(additionalVar)
             }
         }
         for(let v of vars){
             if(v !== 'none'){ 
                try{
                    let config = CountyStats.getVarConfig(v,date);
                    let accessor = CountyStats.getGroupAccessor(v,date);
                    let value = accessor(data);
                    string += config.name + ': ' + config.labelFormatter(value) + '</br>';
                } catch {}
             }
         }
         return string
    }

    static activeGroups(data, active, inverse=false){
        //data: default county data format
        //active: list of groupIds that are currently selected.
        //returns data with the active groups.  Reverse returns all non-active groups
        var activeData;
        if(!inverse){
            activeData = data.slice().filter(d => active.indexOf(CountyStats.getCountyGroup(d)) > -1);
        } else{
            activeData = data.slice().filter(d => active.indexOf(CountyStats.getCountyGroup(d)) === -1);
        }
        return activeData;
    }

}
