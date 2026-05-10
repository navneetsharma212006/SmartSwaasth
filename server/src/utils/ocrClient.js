const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function runOcr(filePath) {
  const url = `${process.env.OCR_SERVICE_URL || "http://localhost:8000"}/ocr`;
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  const { data } = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    timeout: 60000,
  });
  return data;
}

module.exports = { runOcr };
