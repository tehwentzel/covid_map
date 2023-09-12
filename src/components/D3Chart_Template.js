import React from "react";

export default class D3Chart extends React.Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    create(node, data, config){

    }

    update(node, data, config){
        //
    }

    destroy(){
        //
    }

    componentDidMount(){
        this.create(
            this._rootNode,
            this.props.data,
            this.props.config
    );
        //first draw
    }

    componentDidUpdate(){
        //update map
        this.update(
            this._rootNode,
            this.props.data,
            this.props.config
        );
    }

    componentWillUnmount(){
        //destroy stuff
        this.destroy();
    }

    _setRef(componentNode){
        this._rootNode = componentNode;
    }

    render(){
        return <div className='map-container' ref={this._setRef.bind(this)} />
    }
}