import React from "react";
import * as d3 from 'd3';
import "../App.css";
import CountyStats from "../modules/CountyStats";
import Utils from '../modules/Utils';
import { mean, sum } from 'simple-statistics';

export default class D3Chart extends React.Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    static defaultProps = {
        margin: 30,
        marginTop: 5,
        rectPadding: 2,
        data: {},
        covidVar: 'cases',
        perCapita: true
    }

    create(node){
        d3.select(node).selectAll('svg').remove();
        this.height = node.clientHeight;
        this.width = node.clientWidth;
        this.svg = d3.select(node).append('svg')
            .attr('class','covidTimeLine')
            .attr('width', this.width)
            .attr('height', this.height);

        this.g = this.svg.append('g')
            .attr('class','chart')
        
        this.setupData();
    }

    setupData(){
        if(this.props.data.length === undefined || this.props.availableDates.length === undefined){
            return
        }
        //should current set this.data [{key,value...}, {key, value}], this.accessor x=>x[mapVar], this.startDate and this.endDate '4/1/2020'
        var data = CountyStats.activeGroups(this.props.data, this.props.activeCountyGroups);
        var flattenedData = [];
        for(let countyGroup of data){
            let counties = countyGroup.counties;
            for(let county of counties){
                flattenedData.push(county)
            }
        }
        //data should now be an object with keys for each active county
        this.data = flattenedData;

        //accessor should be county level. add 1 so we can take the logscale easily
        this.accessor = CountyStats.getAccessor(this.props.mapVar, this.props.mapDate);
        this.data.sort((x,y) => this.accessor(x) > this.accessor(y))

    
    }

    shouldSetupData(prevProps){
        //when shoudl we update the filtered data?
        //if the data changes
        if(Utils.emptyObject(this.props.data)){
            return false
        }
        if(Utils.emptyObject(prevProps.data)){
            return true
        } 
        if(prevProps.data.length !== this.props.data.length){
            return true
        }
        //if the active groups change
        else if(!Utils.arrayEqual(prevProps.activeCountyGroups, this.props.activeCountyGroups)){
            return true
        }
        //otherthings to change
        let propsToCheck = ['mapVar','mapDate','secondaryVar'];
        for(let propKey of propsToCheck){
            if(this.props[propKey] !== prevProps[propKey]){
                return true
            }
        }
        return false
    }

    shouldDraw(prevProps){
        return true
    }

    getPoints(){
        var secondaryAccessor = CountyStats.getAccessor(this.props.secondaryVar, this.props.mapDate)
        var rates = this.data.map(secondaryAccessor);
        var refValues = this.data.map(this.accessor);
        var population = this.data.map(CountyStats.getCountyPopulation);

        var points = []
        for(let idx in rates){
            let newPoint = {y: rates[idx], x: refValues[idx], pop: population[idx]}
            points.push(newPoint)
        }
        points.sort((x1,x2) => x1.x - x2.x)

        return points
    }

    // Function to compute density
    smoothXPoints(points, xMin, xMax, yMin, nPoints){
        var smoothedPoints = [{x: xMin, y: yMin}]
        var windowWidth = (xMax - xMin)/nPoints;
        let windowStart = xMin;
        while(windowStart < xMax){
            let windowEnd = windowStart + windowWidth;
            let window = points.filter(d => d.x > windowStart)
                .filter(d => d.x <= windowEnd);

            if(window.length > 0){ 
                let totalPop = sum( window.map(d => d.pop));
                let xMean = sum( window.map(d => d.x*d.pop) )/totalPop;
                let yMean = sum( window.map(d => d.y*d.pop) )/totalPop;
                let newPoint ={x: xMean, y: yMean, pop: totalPop};
                smoothedPoints.push(newPoint)
            } 
            else{
                smoothedPoints.push({x: windowStart, y:yMin, pop: 0})
            }
            windowStart = windowEnd;
        }
        smoothedPoints.push({x: xMax, y: yMin, pop: 0})
        return smoothedPoints
    }

    getScaleType(xVar){
        if(xVar === 'voting'){
            return d3.scaleLinear()
        } else{
            return d3.scalePow(.5);
        }
    }

    draw(){
        return
        this.g.selectAll('path').filter('.diffCurve').remove()
        var points = this.getPoints()

        if(points.length === 0){
            return
        }

        var xMin = d3.min(points.map(d=>d.x));
        var xMax = d3.max(points.map(d=>d.x));
        var yMin = d3.min(points.map(d=>d.y));

        points = this.smoothXPoints(points, xMin, xMax, yMin, 40)
        console.log('smothpoint', points)
        let xScale = this.getScaleType(this.props.mapVar)
            .domain([xMin, xMax])
            .range([this.props.margin, this.width - this.props.margin])

        let yScale = this.getScaleType(this.props.secondaryVar)
            .domain( d3.extent(points.map(d=>d.y)) )
            .range([this.height - this.props.margin , this.props.marginTop])

        var line = d3.line()
            .x(d=>xScale(d.x))
            .y(d=>yScale(d.y))
            .curve(d3.curveBasis)

        
        var curve = this.g
            .append('path')
            .attr('class','diffCurve')
            .datum(points)
            .attr('d', line)
            .attr('stroke-width',1)
            .attr('fill-opacity', .25);
        curve.exit().remove()

        var yAxis = d3.axisLeft(yScale).ticks(5, '.00%');
        var xAxis = d3.axisBottom(xScale).ticks(20, 's')
        this.svg.selectAll('.axis').remove()
        this.svg.append('g')
            .attr('class','axis')
            .attr('id', 'yAxis')
            .attr('transform', 'translate(' + this.props.margin + ',0)' )
            .call(yAxis)

        let xTransform = this.height - this.props.margin;
        this.svg.append('g')
            .attr('class','axis')
            .attr('id', 'xAxis')
            .attr('transform', 'translate(0,' + xTransform + ')')
            .call(xAxis)

        this.svg.selectAll('text').filter('.title').remove();
        this.svg.append('text')
            .attr('class','title h6')
            .attr('x', this.width/2)
            .attr('y', this.props.margin-10)
            .html(Utils.unCamelCase(this.props.mapVar));
        var textX = this.width-this.props.margin;
        var textY = this.height/2;
        var textTransform = 'translate(' + textX +',' + textY + ')'
        this.svg.append('text')
            .attr('class','title h6')
            .attr('transform',textTransform+'rotate(90)')
            .attr('width',this.height/2)
            .attr('height','auto')
            .attr('text-anchor', 'middle')
            .html(Utils.unCamelCase(this.props.secondaryVar) )
    }

    componentDidMount(){
        this.create(
            this._rootNode,
        );
        //first draw
    }

    componentDidUpdate(prevProps){
        return
        if(this.shouldSetupData(prevProps)){
            Utils.wrapError(this.setupData.bind(this),  'Error in CovidTimeLine.setupData');
        }
        if(this.shouldDraw(prevProps)){
            Utils.wrapError(this.draw.bind(this), 'Error in CovidTimeLine.draw');
        }
    }

    componentWillUnmount(){
    }

    _setRef(componentNode){
        this._rootNode = componentNode;
    }

    render(){
        return <div className='map-container' ref={this._setRef.bind(this)}>
        </div>
    }
}