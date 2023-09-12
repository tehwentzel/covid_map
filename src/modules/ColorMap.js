import * as d3 from 'd3';

export default class ColorMap {

    constructor(values, transform, props){
        //takes an array of values and transform function to access the value we want from each element
        //getColorScale takes optional props then returns a function that can be used to calculate color from one of the elements
        this.props = {
            'interpolator': d3.interpolateGreys, //color interpolator
            'transform': (d => d), //default accessor if the value
            'min': 0, //default minimum value, will change
            'max': 1, //default maximum value, will change
            'divergent': false, //wether to use divergent or sequential scaler
            'symmetric': false,//if true, max become the largest magnitude value, and min is -max
            'empty': false//just a white map please
        }
        if(props != null){
            this.props = Object.assign(this.props, props)
        }
        if(values !== undefined && transform !== undefined){
            this.fitValues(values,transform);
        }
    }

    getColorScale(props, transform){
        this.props.empty = false //assume not emtpy unless specified.  I can't find a more elegatn solution?
        this.props = Object.assign(this.props, props)
        if(this.props.empty){//empty = dummy variable
            return (d => 'white')
        }
        let min = this.props.min;
        let max = this.props.max;
        if(this.props.symmetric){
            max = Math.max(Math.abs(min), Math.abs(max));
            min = -max;
        }
        var domain = (this.props.divergent)? [min, 0, max] : [min, max];
        var scaler = (this.props.divergent)? d3.scaleDiverging : d3.scaleSequential;
        var scale = scaler()
            .domain(domain)
            .interpolator(this.props.interpolator);
        if(transform == null){
            transform = this.props.transform;
        }
        var interpolateScale = function(d){
            return scale(transform(d));
        }
        return interpolateScale
    }

    fitValues(values, transform){
        if(transform != null){
            this.props.transform = transform;
        } 
        var [min, max] = d3.extent(values, this.props.transform);
        this.props.min = min;
        this.props.max = max;
    }
}