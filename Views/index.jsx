'use strict';

var React = require('react');
var ReactDOM = require('react-dom');


var App = React.createClass({

  componentWillMount: function() {
    this.lock = new Auth0Lock('BsLYn0hjaVDNa4LaBGWXZKYWezrkU2WV', 'hellobill.auth0.com');
  },

  render: function() {
    return (
      <div>
        <Home lock={this.lock}/>
      </div>
    )
  }
});

var Home = React.createClass({
  // ...
  showLock: function() {
    // We receive lock from the parent component in this case
    // If you instantiate it in this component, just do this.lock.show()
    this.props.lock.show();
  },

  render: function() {
    return (
      <div className="login-box">
      <a onClick={this.showLock}>Sign In</a>
      </div>);
    }
  });


var yo = function() {

  ReactDOM.render(
    <App/>,
    document.getElementById('example')
  );
}


module.exports = yo;
