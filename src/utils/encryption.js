const CryptoJS = require("crypto-js")
const config = require("../../key")

const ENCRYPTION_KEY = config.ENCRYPTION_KEY || "default-key-change-in-production"

const encrypt = (text) => {
  if (!text) return text
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error("Error al desencriptar:", error)
    return encryptedText
  }
}

module.exports = { encrypt, decrypt }
