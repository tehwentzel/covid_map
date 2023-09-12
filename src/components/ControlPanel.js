import React from 'react';
import Utils from '../modules/Utils';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import InputLabel from '@material-ui/core/InputLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Grid from '@material-ui/core/Grid';
import MenuItem from '@material-ui/core/MenuItem';
import AppBar from '@material-ui/core/AppBar';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import "../App.css";

import * as constants from '../modules/Constants';
import { FormHelperText } from '@material-ui/core';
// import { Slider } from '@material-ui/core';

export default class ControlPanel extends React.Component {
    //Componenet used to control parts of the interface
    constructor(props){
        super(props);
        this.here = 0;
        //this is where I check to see if the selected mapvar is valid I guess
    }

    render() {

        //changes variable used to pick the color of the map
        //format with Utils.unCamelCase e.g. casesPerCapita => Cases Per Capita
        const mapVarDropDown = Utils.validMapVars().map(val => 
            <MenuItem key={val} value={val} disabled={Boolean(this.props.disabled || val == this.props.mapVar)}>{Utils.unCamelCase(val)}</MenuItem>
        )

        const secondaryVarDropDown = Utils.validMapVars().map(val => 
            <MenuItem key={val} value={val} disabled={Boolean(this.props.disabled || val === this.props.secondaryVar)}>{Utils.unCamelCase(val)}</MenuItem>
        )

        const tertiaryVarDropDown = Utils.validMapVars().map(val => 
            <MenuItem key={val} value={val} disabled={Boolean(this.props.disabled || val === this.props.tertiaryVar)}>{Utils.unCamelCase(val)}</MenuItem>
        )

        const aggregateDropDown = constants.AGGREGATION_LEVELS.slice().map( val =>
            <MenuItem key={val} value={val} disabled={this.props.disabled}>{Utils.unCamelCase(val)}</MenuItem>
        )

        return (
            <div className='controlPanel'>
                <AppBar color='default'>
                <Grid container spacing={1} justify='space-around' direction='row' align-items='flex-end'>
                    <Grid item>
                        <FormControl>
                            <Select 
                            disabled={this.props.disabled} 
                            value={this.props.mapVar} 
                            renderValue={d=>Utils.unCamelCase(d)} 
                            onClick={this.props.handleMapVarChange}
                            >
                                {mapVarDropDown}
                            </Select>
                            <FormHelperText id='mapVarInputLabel'>{'Primary Var.'}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl>
                            <Select 
                            disabled={this.props.disabled} 
                            value={this.props.secondaryVar} 
                            renderValue={d=>Utils.unCamelCase(d)} 
                            onClick={this.props.handleSecondaryVarChange}
                            >
                                {secondaryVarDropDown}
                            </Select>
                            <FormHelperText id='mapVarInputLabel'>{'Secondary Var.'}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl>
                            <Select 
                            disabled={this.props.disabled} 
                            value={this.props.tertiaryVar} 
                            renderValue={d=>Utils.unCamelCase(d)} 
                            onClick={this.props.handleTertiaryVarChange}
                            >
                                {tertiaryVarDropDown}
                            </Select>
                            <FormHelperText id='mapVarInputLabel'>{'Tertiary Var.'}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl>
                            <Select 
                            disabled={this.props.disabled} 
                            value={this.props.aggregationLevel} 
                            renderValue={d=>Utils.unCamelCase(d)} 
                            onClick={this.props.toggleAggregateCountys}
                            >
                                {aggregateDropDown}
                            </Select>
                            <FormHelperText id='mapVarInputLabel'>{'Aggregation Level'}</FormHelperText>
                        </FormControl>
                    </Grid>
                    {/* Button group to toggle between aggreggated and unaggregated counties on the map */}
                    <Grid item >
                        <ButtonGroup>
                            <Button 
                                color='default'
                                variant='contained'
                                onClick={this.props.resetActiveCountys}
                            >
                                Reset Selection
                            </Button>
                            <Button 
                                color='default'
                                variant='contained'
                                onClick={this.props.setAllCountiesActive}
                            >
                                Select All
                            </Button>
                        </ButtonGroup>
                    </Grid>
                </Grid>
                </AppBar>
            </div>
          )
    }
}