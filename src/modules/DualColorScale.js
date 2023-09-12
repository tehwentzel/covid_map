import * as d3 from 'd3';
import CountyStats from './CountyStats';
import Utils from './Utils';
import textures from 'textures';
import { quantile, qunatileRank } from 'simple-statistics';

export default class DualColorScale {

    constructor(groupData, primaryVar, secondaryVar, tertiaryVar, date, scaleFunc = null){
        if(groupData === undefined || Utils.emptyObject(groupData)){
            this.active = false;
        }

        else{
            this.active = true;
            this.activePrimary = primaryVar !== 'none' & primaryVar !== undefined;
            this.activeSecondary = secondaryVar !== 'none' & primaryVar !== undefined;
            this.activeTertiary = tertiaryVar !== 'none' & tertiaryVar !== undefined;
            this.stateId = primaryVar+secondaryVar+tertiaryVar+date;
            this.primaryVar = primaryVar;
            this.secondaryVar = secondaryVar;
            this.tertiaryVar = tertiaryVar;
            this.date = date;

            this.primarySingleAccessor = CountyStats.getAccessor(primaryVar, date);
            this.secondarySingleAccessor = CountyStats.getAccessor(secondaryVar, date);
            this.tertiarySingleAccessor = CountyStats.getAccessor(tertiaryVar, date);

            this.primaryGroupAccessor = CountyStats.getGroupAccessor(primaryVar, date);
            this.secondaryGroupAccessor = CountyStats.getGroupAccessor(secondaryVar, date);
            this.tertiaryGroupAccessor = CountyStats.getGroupAccessor(tertiaryVar, date);

            this.scaleRanges = Utils.arrange(0, 1, 20);
            this.colorRanges = Utils.arrange(.1,1,20)
            this.primaryScale = this.getQuantileScale(groupData, this.primaryGroupAccessor);
            this.secondaryScale = this.getQuantileScale(groupData,  this.secondaryGroupAccessor);
            this.tertiaryScale = this.getQuantileScale(groupData, this.tertiaryGroupAccessor)
            this.populationScale = this.getPowerScale(groupData, CountyStats.countyGroupPopulation);

            //this  sets a few things to correct for what to do when we show voting data since htat should alwyas be red/blue
            //there is probably a better way to do this?
            if(primaryVar === 'voting'){
                this.primaryInterpolator = d3.interpolateRdBu;
                if(secondaryVar === 'voting'){
                    this.secondaryInterpolator = d3.interpolateRdBu;
                    this.glyphScale = d => 2*Math.abs(d-.5);
                } else{
                    this.secondaryInterpolator = this.makeInterpolator(40);
                    this.glyphScale = d=>d;
                }
                if(tertiaryVar === 'voting'){
                    this.tertiaryInterpolator = d3.interpolateRdBu;
                    this.patternScale = d => 2*Math.abs(d-.5)**.5;
                } else{
                    this.tertiaryInterpolator = d3.interpolateGreys;
                    this.patternScale = d => d;
                }
 
            } 
            else{
                this.primaryInterpolator = this.makeInterpolator(40);

                if(secondaryVar === 'voting'){
                    this.secondaryInterpolator = d3.interpolateRdBu;
                    this.glyphScale = d => 2*Math.abs(d-.5);
                } else{
                    this.secondaryInterpolator = d3.interpolatePurples;
                    this.glyphScale = d=>d;
                }
                if(tertiaryVar === 'voting'){
                    this.tertiaryInterpolator = d3.interpolateRdBu;
                    this.primaryInterpolator = this.makeInterpolator(40);
                    this.patternScale = d => 2*Math.abs(d-.5)**.5;
                } else{
                    this.tertiaryInterpolator = d3.interpolateGreys;
                    this.patternScale = d => d;
                }
            }
        }
    }

    makeInterpolator(hue,hue2){
        var interpolateHue;
        if(hue2 === undefined){
            interpolateHue = function(d){
                let s = .1 + .9*d;
                let l = .9 - .55*d;
                return d3.hsl(hue, s,l).toString()
            }.bind(hue)
        } else{
            interpolateHue = function(d){
                let diff = 2*Math.abs(d - .5);
                let s = .1 + .9*diff;
                let l = .9 - .55*diff;
                let h = (d >= .5)? hue: hue2;
                return d3.hsl(h,s,l).toString()
            }
        }
        return interpolateHue
    }

    getPowerScale(cgData, accessor, exponent=1){
        //scale for primary color.  uses a continues scale
        var transform = d => d**exponent;

        let max = d3.max(cgData.map(accessor).map(transform));
        var scale = d3.scaleLinear()
            .domain([0, max])
            .range([0,1]);
        console.log('max', max, scale(max), scale(max/2))
        var powerTransform = d=>scale(transform(d));
        return powerTransform;
    }

    getQuantileScale(cgData, accessor, nQuantiles){
        //will use a discrete scale
        var values = cgData.map(accessor)
        var scaleRanges = (nQuantiles !== undefined)? Utils.arrange(0,1, nQuantiles): this.scaleRanges;
        var colorRanges = (nQuantiles !== undefined)? Utils.arrange(0,1, nQuantiles): this.colorRanges;
        var quantiles = quantile(values.filter(d => d !== 0), scaleRanges);
        //so I think this will give a qunatile transform?
        var scale = d3.scaleLinear()
            .domain(quantiles)
            .range(colorRanges);

        var quantileTransform = d => scale(d);
        return scale
    }

    interpolateFill(pVal, sVal){
        let pQuant = this.primaryScale(pVal);
        return this.primaryInterpolator(pQuant)
    }


    getGroupColor(cgData){
        if(!this.activePrimary || !this.active){
            return '#FAEBD7'
        } 
        var primaryVal = this.primaryGroupAccessor(cgData);
        if(!this.activeSecondary){
            return this.interpolateFill(primaryVal, 0.01)
        }
        var secondaryVal = this.secondaryGroupAccessor(cgData);
        return this.interpolateFill(primaryVal, secondaryVal)
    }

    getCountyColor(data){
        if(!this.activePrimary || !this.active){
            return '#FFEBCD'
        }
        var primaryVal = this.primarySingleAccessor(data);
        if(!this.activeSecondary){
            return this.interpolateFill(primaryVal, 0.01)
        }
        var secondaryVal = this.secondarySingleAccessor(data);
        return this.interpolateFill(primaryVal, secondaryVal)
    }

    getGroupTexture(cgData){
        // var backgroundColor = this.getGroupColor(cgData);
        var backgroundColor = this.getGroupColor(cgData)
        var tVal = this.tertiaryGroupAccessor(cgData);
        return this.toTexture(tVal, backgroundColor, 4)
    }

    getCountyTexture(cgData){
        var backgroundColor = this.getCountyColor(cgData);
        var tVal = this.tertiarySingleAccessor(cgData)
        return this.toTexture(tVal, backgroundColor, 3)
    }

    toTexture(value, bColor, size = 3){
        var val = this.tertiaryScale(value);
        let tColor = this.tertiaryInterpolator(val);

        var texture = textures
            .lines()
            .orientation('vertical')
            .size(size)
            .stroke(tColor)
            .strokeWidth(this.patternScale(val))
            .background(bColor);

        return texture
    }


    getGlyphColor(d){
        if(!this.activeSecondary || !this.active){
            return '';
        }
        var sVal = this.secondarySingleAccessor(d);
        sVal = this.secondaryScale(sVal)
        return this.secondaryInterpolator(sVal)
    }

    getGlyphRadius(d){
        if(!this.activeSecondary || !this.active){
            return 0
        }
        var value = this.secondarySingleAccessor(d);
        if(value === 0){
            return 0
        } else{
            value = this.secondaryScale(value);
            value = this.glyphScale(value); //basically if we doing voting data it makes it centered on .5
        }
        var pop = CountyStats.getCountyPopulation(d);
        pop = this.populationScale(pop)
        return this.scaleRadius(value,pop)
    }

    scaleRadius(valueQuant, populationQuant){
        return 7*((populationQuant*valueQuant)**.5) + 1
    }

    drawGlyph(node){
        // console.log('drawGlyph', node);
    }
}