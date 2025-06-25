const { encrypt, decrypt } = require("../utils/encryption")
const config = require("../../key")

const encryptFields = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        if (req.body[field]) {
          req.body[field] = encrypt(req.body[field])
        }
      })
    }
    next()
  }
}

const decryptFields = (obj, fields) => {
  const decrypted = { ...obj }
  fields.forEach((field) => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field])
    }
  })
  return decrypted
}

module.exports = { encryptFields, decryptFields }
