import setOptionsAndReturnOpenGraphResults from './lib/openGraphScraper';

/**
 * `open-graph-scraper` for Google Apps Script. Based on original open-graph-scraper
 * but adapted to work in GAS environment.
 *
 * @param {object} options - The options used by Open Graph Scraper
 * @param {boolean|string[]} [options.onlyGetOpenGraphInfo] - Only fetch open graph info and don't fall back on
 * anything else.
 * @param {object} [options.customMetaTags] - Here you can define custom meta tags you want to scrape.
 * @param {object} [options.fetchOptions] - Sets the options used by URLFetchApp for the http requests
 * @param {object} [options.urlValidatorSettings] - Sets the options used by validator.js for testing the URL
 * @param {string[]} [options.blacklist] - Pass in an array of sites you don't want ogs to run on.
 * @param {string} [options.html] - You can pass in an HTML string to run ogs on it. (use without options.url)
 * @param {number} [options.timeout] - Number of seconds before the fetch request ends. (default is 10 seconds)
 * @param {string} options.url - URL of the site. (Required)
 * @returns {string} Promise Object with the Open Graph results
 */
function run(options) {
  let results;
  try {
    results = setOptionsAndReturnOpenGraphResults(options);
  } catch (error) {
    const exception = error;
    const returnError = {
      error: true,
      result: {
        success: false,
        requestUrl: options.url,
        error: exception.message,
        errorDetails: exception,
      },
      response: undefined,
      html: undefined,
    };
    throw returnError;
  }
  const returnSuccess = {
    error: false,
    result: results.ogObject,
    response: results.response,
    html: results.html,
  };
  return returnSuccess;
}

// GAS用エクスポート
global.runOpenGraphScraper = run;

// ライブラリとしてのエクスポート
export default run;