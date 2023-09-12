import React from "react";
import Map from './Map';
import './Map.css';
import ColorLegend from './ColorLegend';
import '../App.css'
import Utils from '../modules/Utils.js';
import DualColorScale from '../modules/DualColorScale.js';
import Grid from '@material-ui/core/Grid';
// import CountyStats from '../modules/CountyStats';
// import * as constants from '../modules/Constants.js';

export default class MapContainer extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        spikeColors: MapContainer.defaultSpikeConfig,
      };
    }

    static defaultSpikeConfig = {
        fill: 'yellow',
        stroke:'black',
        fillOpacity: .90,
        strokeOpacity: 1
    }

    render() {
        var colorScale = new DualColorScale(this.props.data, this.props.mapVar, this.props.secondaryVar, this.props.tertiaryVar, this.props.mapDate);

        return (
            <div className='mapContainer'>
                <Grid container  direction='row' className={'flex-center'}>
                    <Grid item className={'flex-center'} xs={10}>
                        <h2 className='flex-center'>{Utils.unCamelCase(this.props.mapVar)}</h2>
                        <div className='mapContainer flex-center'>
                        <Map data={this.props.data} 
                            mapDate = {this.props.mapDate} 
                            mapVar = {this.props.mapVar}
                            secondaryVar={this.props.secondaryVar}
                            tertiaryVar={this.props.tertiaryVar}
                            colorScale={colorScale} 
                            activeCountyGroups={this.props.activeCountyGroups}
                            toggleActiveCountyGroups={this.props.toggleActiveCountyGroups}
                            toggleLoading={this.props.toggleLoading}
                            dataService={this.props.dataService}
                            aggregateCountys={this.props.aggregateCountys}
                            spikeColors={this.state.spikeColors}
                        />
                        </div>
                    </Grid>
                    <Grid item className={'flex-left'} xs={2}>
                        <ColorLegend
                            className={'flex-left'}
                            colorScale={colorScale}
                            data={this.props.data}
                            mapDate={this.props.mapDate}
                        />
                    </Grid>
                </Grid>
            </div>
          )
    }



  }
