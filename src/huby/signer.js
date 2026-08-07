const crypto = require("crypto");

require('dotenv').config();

class HubySigner {
  constructor() {
    this.publicKey = process.env.HUBY_PUBLIC_KEY;
    this.secretKey = process.env.HUBY_SECRET_KEY;
    this.baseUrl = process.env.HUBY_URL;
    this.prefix = "/.huby";
    this.defaultExpiry = 3 * 60 * 60;
  }

  generateEndpoint(action, payload) {
    const query = new URLSearchParams(payload).toString();
    return `${this.baseUrl}${this.prefix}/storage/${this.publicKey}/${action}?${query}`;
  }

  generatePayloadPersist(key, config = {}) {
    return {
      key,
      config: JSON.stringify(config),
    };
  }

  generatePayloadExpirable(key, expire, config = {}) {
    return {
      key: key,
      ip: "",
      exp: String(Math.floor(Date.now() / 1000) + expire),
      config: JSON.stringify(config),
    };
  }

  sign(action, payload) {
    const message = new URLSearchParams(payload).toString() + action;

    payload.hash = crypto
      .createHmac("sha256", this.secretKey)
      .update(message)
      .digest("hex");

    return this.generateEndpoint(action, payload);
  }

  put(key, expire = this.defaultExpiry, config = {}) {
    return this.sign(
      "put",
      this.generatePayloadExpirable(key, expire, config)
    );
  }

  resolve(key, expire = this.defaultExpiry, config = {}) {
    return this.sign(
      "resolve",
      this.generatePayloadExpirable(key, expire, config)
    );
  }

  resolvePersist(key, config = {}) {
    return this.sign(
      "resolve",
      this.generatePayloadPersist(key, config)
    );
  }

  checkStatus(key, expire = this.defaultExpiry) {
    return this.sign(
      "check-status",
      this.generatePayloadExpirable(key, expire, {})
    )
  }

  setPersistAccess(key, persist_access) {
    return this.sign(
      "set-persist-access",
      this.generatePayloadExpirable(key, 60, { persist_access })
    )
  }

  
}

module.exports = new HubySigner();

let huby = new HubySigner()
let url = huby.checkStatus("linux:me")


console.log(url)
