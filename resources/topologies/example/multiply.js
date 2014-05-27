
// You can do all sorts of set-up here
console.log("Hi!, I'll multiply the input");

function handler(payload) {
  return (parseInt(payload) * 2) + ""; // Must return a string
}

module.exports = handler;
