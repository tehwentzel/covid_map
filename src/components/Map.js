import React from "react";
import * as d3 from "d3";
import '../App.css';
// import ColorMap from '../modules/ColorMap.js';
import DualColorScale from '../modules/DualColorScale.js';
import Utils from '../modules/Utils.js';
import CountyStats from '../modules/CountyStats';
import textures from 'textures';
import * as constants from '../modules/Constants.js';
// import { interpolate, keys } from "d3";

export default class Map extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            zoomedToId: null,
            currentTransform: '',
            activeCountyGroups: [],
        }
        // this.colorMap = new ColorMap();
        this.dataAccessor = (d=>d);
        this.colorProps = {};
        this.bordersDrawn = false;
        this.glyphsDrawn = false;
    }

    static defaultProps = {
        spikeWidth: 6,
        backgroundColor: 'white',
        spikeStrokeWidth: 1,
        strokeColor: 'black',
        aggregateCountys: false,
        glyphsActive: true,
        maxSpikeHeight: 30,
        spikeHeightScaleExp: 2 //currently does a quantile transform and then applies a power tranform with this exp within it
    }

    zoomed(){
        var transform = d3.event.transform;
        this.setState({currentTransform: transform});
    }

    create(node){
        d3.select(node).selectAll('svg').remove();
        this.height = node.clientHeight;
        this.width = node.clientWidth;
        this.svg = d3.select(node).append('svg')
            .attr('class','map-svg zoomable')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', this.props.backgroundColor)
            .on('contextmenu',this.handleRightClick.bind(this));

        this.scale = Math.min(this.width*1.35, this.height*3);

        this.g = this.svg.append('g').attr('class','map');

        this.zoom = d3.zoom().on('zoom',this.zoomed.bind(this));

        this.svg.call(this.zoom);

        this.projection = d3.geoAlbersUsa()
            .translate([node.clientWidth/2, node.clientHeight/2])
            .scale(this.scale);

        this.path = d3.geoPath()
            .projection(this.projection);

        Utils.wrapError(this.drawBorders.bind(this), 'error in Map.drawBorders');
        Utils.wrapError(this.colorBoundaries.bind(this), 'error in Map.colorBoundaries');
        Utils.wrapError(this.drawGlyphs.bind(this), 'error in Map.drawSpikes');
    }

    destroy(){
        d3.selectAll('.map-svg').remove();
    }

    drawBorders(){
        this.g.selectAll('path').filter('.county').remove();
        if(Utils.emptyObject(this.props.data)){ return }
        if(this.props.aggregateCountys){
            this.drawCountyGroupBorders();
        } else{
            this.drawSingleCountys();
        }
    }

    drawCountyGroupBorders(){
        this.bordersDrawn = false;
        
        var borders = this.g.selectAll('path').filter('.county')
            .data(this.props.data)
            .enter().append('path')
            .attr('class', 'county')
            .attr('id', (d,i)=>{return 'countyGroup'+CountyStats.getCountyGroup(d)})
            .attr('d', d=> this.path(d.features));
        borders.exit().remove()

        this.bordersDrawn = true;
    }

    drawSingleCountys(){
        this.bordersDrawn = false;

        for(var countyData of this.props.data){
            var parentId = CountyStats.getCountyGroup(countyData)
            let currCountys = this.g.selectAll('path')
                .filter('.county')
                .filter("[parentId='" + parentId + "']");
            currCountys.data(countyData.counties).enter()
                .append('path')
                .attr('class', 'county')
                .attr('parentId', parentId)
                .attr('id', (d,i) =>'singleCounty' + CountyStats.getCountyGeoid(d))
                .attr('d', d => this.path(d.features));
            currCountys.exit().remove();
        }
        this.bordersDrawn = true;
    }

    colorBoundaries(){
        if(Utils.emptyObject(this.props.data)){ return }
        
        this.colorScale = this.props.colorScale;

        var getColor = this.colorScale.getCountyColor.bind(this.colorScale);;
        var onClick = this.handleSingleCountyClick.bind(this);
        var onMouseOver = (d,i) => this.handleSingleCountyMouseOver(d,i);
        var onMouseOut = (d,i) => this.handleSingleCountyMouseOut(d,i);
        var getGroupId = d => CountyStats.getParentCountyGroup(d);
        var activeStrokeWidth = 1;

        if(this.props.aggregateCountys){
            getColor = this.colorScale.getGroupColor.bind(this.colorScale);
            getGroupId = CountyStats.getCountyGroup;
            // getClass = d => 'countyGroup';
            onClick = this.handleCountyGroupClick.bind(this);
            onMouseOver = (d,i)=> this.handleGroupMouseOver(d,i);
            onMouseOut = (d,i) => this.handleGroupMouseOut(d,i);
            activeStrokeWidth = 1.5;
        }

        var getStroke = function(d){
            let groupId = getGroupId(d);
            let isActive = this.props.activeCountyGroups.indexOf(groupId) !== -1;
            return (isActive)? activeStrokeWidth: 0;
        }.bind(this)

        var counties = this.g.selectAll('path').filter('.county');
        var patterns = [];
        if(this.props.tertiaryVar !== 'none'){
            var getTexture = (this.props.aggregateCountys)? this.colorScale.getGroupTexture.bind(this.colorScale): this.colorScale.getCountyTexture.bind(this.colorScale);
            counties.data().forEach(d =>{
                var t = getTexture(d);
                patterns.push(t)
            });
            getColor = function(d,i){
                var t = patterns[i];
                this.svg.call(t)
                return t.url();
            }.bind(this)
        }
        
        counties.attr('stroke', this.props.strokeColor)
            .attr('fill', getColor)
            .attr('stroke-width', getStroke)
            .on('mouseover', onMouseOver.bind(this))
            .on('mouseout', onMouseOut.bind(this))
            .on('click', onClick.bind(this));

        counties.exit().remove();
    }

    drawGlyphs(){
        if(Utils.emptyObject(this.props.data) || !this.props.glyphsActive){ return }
        this.g.selectAll('.glyph').remove()
        if(this.props.secondaryVar === 'none'){return}
        console.log('drawGlyphs');

        var getCentroid = function(d){
            var centroid = this.projection(d3.geoCentroid(d.features));
            return centroid
        }.bind(this)

        var getGlyphColor = this.props.colorScale.getGlyphColor.bind(this.colorScale);
        var getGlyphRadius = this.props.colorScale.getGlyphRadius.bind(this.colorScale);


        for(var countyData of this.props.data){
            var parentId = CountyStats.getCountyGroup(countyData)
            let currCountys = this.g.selectAll('.glyph')
                .filter("[parentId='" + parentId + "']")
                .data(countyData.counties)
                .enter()
                .append('circle')
                .attr('class', 'glyph')
                .attr('id', d=> 'glyph'+CountyStats.getCountyGeoid(d))
                .attr('parentId', parentId)
                .attr('cx', d => getCentroid(d)[0])
                .attr('cy', d => getCentroid(d)[1])
                .attr('r', getGlyphRadius)
                .attr('stroke-width', .5)
                .attr('stroke','black')
                .attr('fill', getGlyphColor)
                .on('click', this.handleGlyphClick.bind(this))
                .on('mouseover',(d,i) => this.handleGlyphMouseOver(d,i))
                .on('mouseout', (d,i) => this.handleGlyphMouseOut(d,i))
                .raise()

            // currCountys.nodes().forEach(node =>{
            //     this.colorScale.drawGlyph(node)
            // }, this)
            currCountys.exit().remove();
        }
        this.glyphsDrawn = true;
    }

    handleGlyphClick(d){
        var countyGroup = CountyStats.getParentCountyGroup(d);
        this.props.toggleActiveCountyGroups(countyGroup)
    }

    singleTTip(d){
        return CountyStats.getSingleCountyToolTip(
            d, 
            this.props.mapDate, 
            this.props.mapVar, 
            this.props.secondaryVar, 
            this.props.tertiaryVar
        )
    }

    groupTTip(d){
        return CountyStats.getGroupToolTip(
            d, 
            this.props.mapDate, 
            this.props.mapVar, 
            this.props.secondaryVar, 
            this.props.tertiaryVar
        )
    }

    handleGlyphMouseOver(d,i){
        var target = this.g.select('#glyph'+CountyStats.getCountyGeoid(d));
        var currRadius = target.node().getAttribute('r')
        target.style('r', currRadius*3)
            .style('stroke','red')
            .style('z-index', 100);
        try{
            var bbox = target.node().getBoundingClientRect();
            console.log('gmouseover', bbox);
            var svgRect = d3.select('.map-svg').node().getBoundingClientRect();
            var ttip = d3.select('#mapToolTip');
            console.log('gm',ttip,svgRect)
            ttip.style('left', bbox.right - svgRect.left + bbox.width/4 + 'px')
                .style('top', bbox.top  - svgRect.top + bbox.height/2 + 'px')
                .style('visibility','visible')
                .html(this.singleTTip(d));
        } 
        catch {console.log('error on single mouseover')}
    }

    handleGlyphMouseOut(d,i){
        var target = this.g.select('#glyph'+CountyStats.getCountyGeoid(d));
        target.style('r', '')
            .style('stroke', '');
        var ttip = d3.select('#mapToolTip');
        ttip.style('visibility', 'hidden');
    }
    handleRightClick(event){
        d3.event.preventDefault()
        if(this.bordersDrawn){
            let emptyTransform = '';
            this.setState({currentTransform: emptyTransform})
        }
    }

    handleGroupMouseOver(d,i){
        var target = this.g.select('#countyGroup'+CountyStats.getCountyGroup(d));
        target.style('stroke-width', 7)
            .style('stroke', 'red')
            .style('z-index', 100);
        try{
            var bbox = target.node().getBoundingClientRect();
            var svgRect = d3.select('.map-svg').node().getBoundingClientRect();
            var ttip = d3.select('#mapToolTip');
            ttip.style('left', bbox.right - svgRect.left + bbox.width/4 + 'px')
                .style('top', bbox.top  - svgRect.top + bbox.height/2 + 'px')
                .style('visibility','visible')
                .html(this.groupTTip(d));
        } 
        catch {console.log('error on mouseover')}
    }

    handleSingleCountyMouseOver(d,i){
        var target = this.g.select('#singleCounty'+CountyStats.getCountyGeoid(d));
        target.style('stroke-width',5)
            .style('stroke','red')
            .style('z-index', 100)
        try{
            var bbox = target.node().getBoundingClientRect();
            var svgRect = d3.select('.map-svg').node().getBoundingClientRect();
            var ttip = d3.select('#mapToolTip');
            ttip.style('left', bbox.right - svgRect.left + bbox.width/4 + 'px')
                .style('top', bbox.top  - svgRect.top + bbox.height/2 + 'px')
                .style('visibility','visible')
                .html(this.singleTTip(d));
        } 
        catch {console.log('error on single mouseover')}
    }   

    handleGroupMouseOut(d,i){
        var target = this.g.select('#countyGroup'+CountyStats.getCountyGroup(d));
        target.style('stroke-width', '')
            .style('stroke', '');
        var ttip = d3.select('#mapToolTip');
        ttip.style('visibility', 'hidden');
    }

    handleSingleCountyMouseOut(d,i){
        var geoid = CountyStats.getCountyGeoid(d)
        try{
            var target = this.g.select('#singleCounty'+geoid);
            target.style('stroke-width','')
                .style('stroke','')
                .style('z-index', '');
        } catch {
            d3.selectAll('.map-svg').select('#singleCounty'+geoid)
                .style('stroke-width','')
                .style('stroke','')
                .style('z-index', '');
        }

        var ttip = d3.select('#mapToolTip');
        ttip.style('visibility', 'hidden')
    }

    handleCountyGroupClick(event){
        var countyGroup = CountyStats.getCountyGroup(event);
        this.props.toggleActiveCountyGroups(countyGroup)
    }

    handleSingleCountyClick(event){
        var countyGroup = CountyStats.getParentCountyGroup(event);
        this.props.toggleActiveCountyGroups(countyGroup)
    }

    componentDidMount(){
        //I coppied code and this gives the root element and I don't know why
        this.create(this._rootNode,);
        //first draw
    }

    shouldDrawBorders(prevProps){
        if(this.props.data === undefined){
            return false
        }
        else if(!this.bordersDrawn & this.props.data.length > 0){
            return true
        } else if(this.props.aggregateCountys !== prevProps.aggregateCountys){
            return true
        }
        else{
            return (prevProps.data.length !== this.props.data.length)
        }
    }

    shouldDrawGlyphs(prevProps){
        if(this.props.data === undefined || Utils.emptyObject(this.props.data)){
            return false
        } else if(Utils.emptyObject(prevProps.data) || this.props.data.length !== prevProps.data.length){
            return true
        }
        else if(this.props.mapDate !== prevProps.mapDate || this.props.secondaryVar !== prevProps.secondaryVar){
            return true
        } 
        if(!this.glyphsDrawn){
            return true
        }
        return (prevProps.data.length !== this.props.data.length)
    }

    componentDidUpdate(prevProps){
        //update map
        //I'm assuming we only need to redraw borders when they change and the dataset size changes?
        console.log('map Update', this.props, prevProps)
        if(this.props.data !== undefined){
            if(this.shouldDrawBorders(prevProps)){
                Utils.wrapError(this.drawBorders.bind(this), 'error in Map.drawBorders');
            }
            Utils.wrapError(this.colorBoundaries.bind(this), 'error in Map.colorBoundaries');
            if(this.shouldDrawGlyphs(prevProps)){
                Utils.wrapError(this.drawGlyphs.bind(this), 'error in Map.drawGlyphs')
            }
            this.g.attr('transform', this.state.currentTransform)
            this.g.selectAll('.glyph').raise()
        }
    }

    componentWillUnmount(){
        //destroy stuff
        this.destroy();
    }

    _setRef(componentNode){
        this._rootNode = componentNode;
    }

    render(){
        return <div className='map-container' ref={this._setRef.bind(this)}>
            <div 
                id={'mapToolTip'}
                className={'toolTip'} 
            >
                Test
            </div>
        </div>
    }
}