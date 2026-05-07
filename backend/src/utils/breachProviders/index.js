const { checkLeakCheck } = require('./leakcheck')

async function checkEmailExposure(email) {
  return await checkLeakCheck(email)
}

module.exports = { checkEmailExposure }
