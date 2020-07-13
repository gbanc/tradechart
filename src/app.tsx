import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppBar, Tabs, Tab } from '@material-ui/core';

function App() {
  return (
      <AppBar title="My App">
        <Tabs value="1" >
          <Tab label="Item 1" value="1" />
          <Tab label="Item 2" value="1" />
          <Tab label="Item 3" value="1"/>
          <Tab label="Item 4" value="1"/>
        </Tabs>
      </AppBar>
  );    
}

ReactDOM.render(<App />, document.querySelector('#root'))
