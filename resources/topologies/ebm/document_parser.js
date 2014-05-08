function handler(payload) {
  var data = JSON.parse(payload);
  data.text = "foobar";
  return JSON.stringify(data);
}

module.exports = handler;
