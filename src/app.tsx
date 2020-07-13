import * as React from 'react';
import { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import './css/style.css';
import Chart from './uiComponents/ohlcChart';
import { getData } from "./uiComponents/utils"

import { timeParse } from "d3-time-format";


function App() {
    const [date, setDate] = useState(Date.now());

    
    var parser = timeParse("%Y-%m-%d");
    const de = parser("2017-01-05")
    const den = parser("2017-01-06")
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
      <Chart data={[{"date":de,"open":119.34,"high":120.2,"low":119.1,"close":119.7,"adjusted_close":109.7062,"volume":4261070},
                   {"date":den,"open":118.93,"high":121.5,"low":118.52,"close":120.76,"adjusted_close":110.6777,"volume":4089186}]}/>
      </>
  );    
}

ReactDOM.render(<App />, document.querySelector('#root'))
