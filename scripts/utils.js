const fs = require('fs')
const path = require('path')

exports.replacePackage = function replacePackage(sourcePackage, targetPackage) {
  const fileNames = fs.readdirSync(path.resolve(__dirname, '..', 'src'))

  fileNames.forEach((fileName) => {
    const filePath = path.resolve(__dirname, '..', 'src', fileName)
    let fileContent = fs.readFileSync(
      filePath,
      'utf-8'
    )
    if (fileContent.includes(`'${sourcePackage}'`)) {
      fileContent = fileContent.replace(new RegExp(`'${sourcePackage}'`, 'g'), `'${targetPackage}'`)
      fs.writeFileSync(filePath, fileContent)
    }
  })
}
