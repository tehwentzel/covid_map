import React from 'react';
import * as d3 from 'd3';
import Utils from '../modules/Utils';
import * as constants from '../modules/Constants';
import CountyStats from '../modules/CountyStats';
import Grid from '@material-ui/core/Grid';

import '../App.css'

export default class ColorLegend extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          primaryTitle: 'none',
          secondaryTitle: 'none',
          tertiaryTitle: 'none',
    }
    }

    static defaultProps ={
        xMargin: 5,
        yMargin: 10,
        legendMargin: 15,
        nQuantiles: 5,
        barSpacing: .2,
        textWidth: 70,
        legendTitleSpace: 22,
        maxBarHeight: 30,
        maxBarWidth: 40
    }

    componentDidMount(){
        var node = this.refs.rootNode;
        this.height = node.clientHeight;
        this.width = node.clientWidth;

        this.primarySvg = d3.select(this.refs.primaryLegend)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.refs.primaryLegend.clientHeight -this.props.legendTitleSpace)
            // .attr('height',this.height/3);

        this.secondarySvg = d3.select(this.refs.secondaryLegend)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.refs.secondaryLegend.clientHeight -this.props.legendTitleSpace)
            // .attr('height',this.height/3);

        this.tertiarySvg = d3.select(this.refs.tertiaryLegend)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.refs.tertiaryLegend.clientHeight -this.props.legendTitleSpace)
            // .attr('height',this.height/3);

        this.draw();
    }

    componentDidUpdate(prevProps){

        //make sure we have data
        if(Utils.emptyObject(this.props.data) || !this.props.colorScale.active){
            return
        }

        let newScale = this.props.colorScale;
        let oldScale = prevProps.colorScale;
        //check that the color scale actually changes
        let varsInLegend = ['primaryVar', 'secondaryVar', 'tertiaryVar'];
        let flag = newScale.stateId !== oldScale.stateId;

        if(flag){ 
            this.draw() 
        }
    }

    draw(){

        if(!this.props.colorScale.active){
            return
        }

        var cs = this.props.colorScale;

        var cleanSvg = d => {
            d.selectAll('rect').remove();
            d.selectAll('text').remove();
            d.selectAll('circle').remove()
        }

        if(cs.activePrimary){
            this.drawPrimaryLegend(cs);
        } else{
            cleanSvg(this.primarySvg);
        }
        
        if(cs.activeSecondary){
            this.drawSecondaryLegend(cs);
        } else{
            cleanSvg(this.secondarySvg);
        }

        if(cs.activeTertiary){
            this.drawTertiaryLegend(cs);
        } else{
            cleanSvg(this.tertiarySvg);
        }

        var toTitle = d=>{
            if(d === 'none'){
                return ''
            }
            return Utils.unCamelCase(d)
        }

        this.setState({
            primaryTitle: toTitle(cs.primaryVar),
            secondaryTitle: toTitle(cs.secondaryVar),
            tertiaryTitle: toTitle(cs.tertiaryVar),
        })
    }

    

    drawPrimaryLegend(cs){
        var node = this.refs.primaryLegend;
        var height = node.clientHeight;
        var svg = this.primarySvg;

        let pStartY = 0;
        let pStopY = height;
        this.getLegend(svg, cs.primaryScale, cs.primaryVar, cs.interpolateFill.bind(cs), pStartY, pStopY, 'primary')
    }

    drawSecondaryLegend(cs){
        var node = this.refs.secondaryLegend;
        var height = node.clientHeight;
        var svg = this.secondarySvg;

        var ticks = this.reduceTicks(cs.secondaryScale.domain());
        var startY = 0;
        var stopY = height;
        var {barHeight, barWidth, yScale} = this.calcDims(ticks, startY, stopY);
        var radius = Math.min(barHeight, barWidth)/2;
        let getFill = d => cs.secondaryInterpolator(cs.secondaryScale(d))

        svg.selectAll('.legendGlyph').remove();

        let cx = (this.props.xMargin/2) + radius;
        let getY = d => (yScale(d) + radius)
        var legendGlyphs = svg.selectAll('circle')
            .filter('.legendGlyph')
            .data(ticks).enter()
            .append('circle').attr('class','legendGlyph')
            .attr('cx', cx)
            .attr('cy', getY)
            .attr('r', radius)
            .attr('fill',getFill.bind(cs))
            .attr('stroke','black')
            .attr('stroke-width',1);

        legendGlyphs.exit().remove();

        var formatter = CountyStats.getVarConfig(cs.secondaryVar).labelFormatter;
        svg.selectAll('.glyphLegendText').remove();
        var legendText = svg.selectAll('text')
            .filter('.glyphLegendText')
            .data(ticks).enter()
            .append('text').attr('class','glyphLegendText')
            .attr('x', cx + radius+5)
            .attr('y', d=> getY(d) + radius/3)
            .text(d=>formatter(d));
        legendText.exit().remove();
    }

    drawTertiaryLegend(cs){
        var node = this.refs.tertiaryLegend;
        var height = node.clientHeight;
        var svg = this.tertiarySvg;

        let tStartY = 0;
        let tStopY = height;
        let pTicks = cs.primaryScale.domain();
        var patternBackground = cs.interpolateFill(pTicks[pTicks.length - 1]);
        let tTicks = this.reduceTicks(cs.tertiaryScale.domain());
        let patterns = [];
        for(var tTick of tTicks){
            let p = cs.toTexture(tTick, patternBackground);
            console.log(patternBackground, p.url())
            svg.call(p);
            patterns.push(p.url());
        }
        let getTFill = (d,i) => patterns[i];
        this.getLegend(svg, cs.tertiaryScale, cs.tertiaryVar, getTFill, tStartY, tStopY, 'tertiaryLegend')
    }

    reduceTicks(ticks){
        let nTickSteps = parseInt(ticks.length/(this.props.nQuantiles-1));
        if(nTickSteps > 1){
            var newTicks = [];
            ticks.forEach((d,i) => {
                if(i%nTickSteps == 0){
                    newTicks.push(d)
                }
            })
        }
        return newTicks
    }


    calcDims(ticks, startY, stopY){
        var containerHeight = stopY - startY;
        var barHeight = containerHeight/(ticks.length + 1) - this.props.barSpacing;
        var barWidth = (this.width - this.props.xMargin) - this.props.textWidth;

        barHeight = Math.min(barHeight, this.props.maxBarHeight);
        barWidth = Math.min(barWidth, this.props.maxBarWidth);

        const height = (barHeight + this.props.barSpacing)*(ticks.length+1);
        var heights = Utils.arrange(startY,  stopY - barHeight, ticks.length);

        var yScale = d3.scaleLinear()
            .domain(ticks)
            .range(heights.reverse());

        return {barHeight: barHeight, barWidth: barWidth, yScale: yScale}
    }

    getLegend(svg, scale, varType, getFill, startY, stopY, className){
        var ticks = this.reduceTicks(scale.domain());

        var {barHeight, barWidth, yScale} = this.calcDims(ticks, startY, stopY);

        svg.selectAll('rect').filter('.'+className+'Rect').remove();
    
        var legendRects = svg.selectAll('rect')
            .filter('.'+className+'Rect')
            .data(ticks).enter()
            .append('rect').attr('class',className+'Rect')
            .attr('x', this.props.xMargin/2)
            .attr('y', d => yScale(d))
            .attr('width', barWidth)
            .attr('height', barHeight)
            .attr('fill', getFill);

        legendRects.exit().remove();

        svg.selectAll('text').filter('.' + className +'Text').remove();
        var legendFormatter = CountyStats.getVarConfig(varType).labelFormatter;
        var legendText = svg.selectAll('text')
            .filter('.' + className +'Text')
            .data(ticks).enter()
            .append('text').attr('class',className +'Text')
            .attr('x', this.props.xMargin/2 + barWidth*1.02)
            .attr('y', d => yScale(d) + barHeight/2 + this.props.yMargin/2)
            .text( d => legendFormatter(d));

        legendText.exit().remove();
    }

    render(){
        // return <div className='colorLegend' ref='rootNode'/>
        return (
            <Grid container className={'flex-center'} ref='rootNode'> 
                <Grid item mt={1} xs={12}>
                    <h6 className={'flex-auto'}>{this.state.primaryTitle}</h6>
                    <div ref='primaryLegend'></div>
                </Grid>
                <Grid item  mt={10} xs={12}>
                    <h6 className={'flex-auto'}>{this.state.secondaryTitle}</h6>
                    <div ref='secondaryLegend'></div>
                </Grid>
                <Grid item mt={10} xs={12}>
                    <h6 className={'flex-auto'}>{this.state.tertiaryTitle}</h6>
                    <div ref='tertiaryLegend'></div>
                </Grid>
            </Grid>
        )
    }
}