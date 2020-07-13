import * as React from 'react';
import { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import './css/style.css';
import { getData } from "./uiComponents/utils"
import OhlcData from "./uiComponents/ohlcData"
import { timeParse } from "d3-time-format";
import "babel-polyfill";
import StockChart from "./uiComponents/tsChart";

function App() {
  return (
      <>
      <AppBar title="My App">
        <Tabs value="1" >
          <Tab label="Item 1" value="1" />
          <Tab label="Item 2" value="1" />
          <Tab label="Item 3" value="1"/>
          <Tab label="Item 4" value="1"/>
        </Tabs>
      </AppBar>
      < StockChart />
      </>
  );    
}

ReactDOM.render(<App />, document.querySelector('#root'))
