import React, { useState, useEffect } from 'react';
import { Router, navigate } from '@reach/router';

import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import Protected from './components/Protected';
import Content from './components/Content';

export const UserContext = React.createContext([]);

function App() {
  const [user, setUser] = useState({})
  const [loading, setLoading] = useState(true)

  const logoutCallback = async () => {

  }

  useEffect(() => {

  }, [])

  return (
    <UserContext.Provider value={[user, setUser]}>
      <div className="App">
        <Navigation logoutCallback={logoutCallback}/>
        <Router id="router">
          <Login path="login" />
          <Register path="register" />
          <Protected path="protected" />
          <Content path="/" /> 
        </Router>
      </div>
    </UserContext.Provider>
  );
}

export default App;
