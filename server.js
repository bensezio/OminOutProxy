// Simple Express server setup to serve the build output
const compression = require("compression");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const reqPromise = require("request-promise");
const moment = require("moment");
const JwtGenerator = require("../scripts/jwt-generator");

// proxy
const url = require("url");
const https = require("https");
const HttpsProxyAgent = require("https-proxy-agent");
const request = require("request");

require("dotenv").config();
const { JWT_SUBJECT, JWT_AUDIENCE, QUOTAGUARDSHIELD_URL } = process.env;

// START HTTPS PROXY SETUP

var testEndpoint = "https://mydomain.my.salesforce.com";
var proxy = QUOTAGUARDSHIELD_URL; // process.env.QUOTAGUARDSHIELD_URL
var agent = new HttpsProxyAgent(proxy);
var options = {
  uri: url.parse(testEndpoint),
  agent,
};

console.log("using proxy server %j", proxy);
console.log("<<testEndpoint>>", testEndpoint);

https.get(options, function (res) {
  console.log('"response" event!', res.headers);
  res.pipe(process.stdout);
});

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log("body: ", body);
  } else {
    console.log("error: ", error);
  }
}

request(options, callback);

// END

const app = express();
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 4002;
const DIST_DIR = "./dist";

app.use(async (req, res, next) => {
  const cookie = req.cookies.oauthCookie;
  if (cookie === undefined) {
    const token = await generateAccessToken();
    let currentTime = moment().format();
    let expirationTime = moment(currentTime).add(1, "hours");
    console.log(`token =====> ${token}`);
    res.cookie("oauthCookie", `${token};Expiration=${expirationTime}`, {
      maxAge: 10800000,
      httpOnly: false,
    });
    console.log(`created new cookie => $expirationTime ${expirationTime}`);
  } else if (cookie !== undefined && isCookieValid(cookie)) {
    console.log(`cookie is still valid => `);
  } else if (cookie !== undefined && !isCookieValid(cookie)) {
    const token = await generateAccessToken();
    let currentTime = moment().format();
    let expirationTime = moment(currentTime).add(1, "hours");
    res.cookie("oauthCookie", `${token};Expiration=${expirationTime}`, {
      maxAge: 10800000,
      httpOnly: false,
    });
    console.log(
      `created new cookie =>${cookie} => $expirationTime ${expirationTime}`
    );
  }
  next();
});

async function generateAccessToken() {
  const jwtGenerator = new JwtGenerator();
  const token = jwtGenerator.generateToken(JWT_SUBJECT);

  const authRequest = {
    method: "POST",
    uri: JWT_AUDIENCE + "/services/oauth2/token",
    form: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    },
  };
  try {
    const sfResponse = JSON.parse(await reqPromise(authRequest));
    return sfResponse.access_token;
  } catch (err) {
    console.log(err);
  }
}

async function isCookieValid(cookie) {
  if (cookie !== undefined) {
    var first = cookie.split(";");
    var second = first[1].split("=");
    if (second[1] > moment().format()) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

async function parseCookies(request) {
  var list = {},
    rc = request.cookies.oauthCookie;

  rc &&
    rc.split(";").forEach(function (cookie) {
      var parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });
  return Object.keys(list)[0];
}
app.use("/", async (req, res, next) => {
  let cookie = req.cookies.oauthCookie;
  let cookieToken;

  if (req.method === "OPTIONS" || req.method === "GET") {
    // CORS Preflight
    next();
  } else {
    const targetURL = req.header("salesforceproxy-endpoint");
    if (!targetURL) {
      next();
    }

    if (isCookieValid(cookie)) {
      cookieToken = await parseCookies(req);
    } else {
      cookieToken = await generateAccessToken();
    }

    console.log();

    request(
      {
        url: targetURL,
        method: req.method,
        json: req.body,
        headers: { Authorization: `Bearer ${cookieToken}` },
      },
      (error, response, body) => {
        if (error) {
          console.error("error: " + response.statusCode);
        }
      }
    ).pipe(res);
  }
});

app.use(express.static(DIST_DIR));

app.listen(PORT, () =>
  console.log(`✅  Server started: http://${HOST}:${PORT}`)
);
