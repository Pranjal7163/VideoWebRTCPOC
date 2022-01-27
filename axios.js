const axios = require("axios");
const utils = require("./utils");
const config = require("./config");

class ApiService {
  constructor({ prefix = "", responseBuilder = (res) => res } = {}) {
    this.prefix = prefix;
    this.responseBuilder = responseBuilder;
  }

  get = (url, data, options) =>
    this.request({ url, method: "get", data, options });

  post = (url, data, options) =>
    this.request({ url, method: "post", data, options });

  delete = (url, data, options) =>
    this.request({ url, method: "delete", data, options });

  postFormData = (url, data, options) => {
    data = utils.serializeParams(data);
    return this.post(url, data, {
      ...options,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...options.headers,
      },
    });
  };

  request = async ({ url, method, data, options = {} }) => {
    url = this.getUrl({ url, options });
    let axiosArgs = this.getAxiosArgs({ url, method, data, options });
    try {
      let response = await axios.request(axiosArgs);
      if (
        response.status !== 200
        // || (response.data.statusKey !== "SUCCESS" && !(response.data instanceof Blob))
      ) {
        console.log(
          `%c ApiService request: ${url} (${method}) status non success: ${response}`,
          "background: #701414; color: #bada55"
        );
        console.log(`%c throwing`, "background: #701414; color: #bada55");
        throw response;
      }
      return this.responseBuilder(response);
    } catch (thrown) {
      if (axios.isCancel(thrown)) {
        console.log("Request canceled", thrown.message);
      } else {
        if (
          false // add condition for need of custom interceptor in case of failure
        ) {
          let interceptorResp = await this.errorResponseInterceptor({
            method,
            url,
            axiosArgs,
            response: thrown.response,
          });
          return this.responseBuilder(interceptorResp);
        }
        console.log(
          `%c ApiService request: ${url} (${method}) catch: ${thrown.response}`,
          "background: #701414; color: #bada55"
        );
      }
      throw thrown;
    }
  };

  errorResponseInterceptor = ({ url, method, axiosArgs, response }) => {
    return new Promise.resolve();
  };

  getUrl = ({ url, options = {} }) => {
    let result = "";
    let urlType =
      options && options.urlType && typeof options.urlType === "string"
        ? options.urlType.toLowerCase()
        : "";
    switch (urlType) {
      case "absolute":
        result = url;
        break;
      case "relative":
        result = this.prefix + url;
        break;
      default:
        result = this.prefix + url;
    }
    return result;
  };

  getAxiosArgs = ({ url, method, data, options = {} }) => {
    let _options = {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    };
    let axiosArgs = {
      url,
      method,
      responseType: _options.responseType,
      headers: _options.headers,
      cancelToken: _options.cancelToken,
    };
    switch (method) {
      case "get":
        axiosArgs = { ...axiosArgs, params: data };
        break;
      case "post":
        axiosArgs = { ...axiosArgs, data, params: _options.params };
        break;
      default:
        break;
    }
    return axiosArgs;
  };
}

const Api = new ApiService({
  prefix: config.remoteServerUrl,
});

module.exports = ApiService;
module.exports.Api = Api;
