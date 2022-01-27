const serializeParams = (params) => {
  let str = "";
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      if (str !== "") str += "&";
      str += key + "=" + params[key];
    }
  }
  return str;
};

const utils = {
  /**
   * Serialize a JSON object into a key=value pairs
   *
   * @method serializeParams
   * @private
   * @param object JSON object of parameters and their values
   * @return {string} Serialized parameters in the form of a query string
   */
  serializeParams,
};

module.exports = utils;
