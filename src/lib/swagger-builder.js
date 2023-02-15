const SwaggerParser = require('swagger-parser')
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const apiTmpl = fs.readFileSync(path.join(__dirname, './tmpl/api.hbs'), 'utf-8')
const methods = fs.readFileSync(path.join(__dirname, './tmpl/methods.hbs'), 'utf-8')
const method = fs.readFileSync(path.join(__dirname, './tmpl/method.hbs'), 'utf-8')
Handlebars.registerPartial('methods', methods)
Handlebars.registerPartial('method', method)
Handlebars.registerHelper('wrap-helper', (object) => {
  const descriptions = []
  if (typeof object === 'string') {
    if (object !== '') {
      object = ' ' + object
    }
    let description = ' * @description' + object
    while (description.length > 150) {
      descriptions.push(description.substr(0, 150) + '\n')
      description = ' * ' + description.substr(150)
    }
    descriptions.push(description + '')
  }
  return new Handlebars.SafeString(descriptions.join(''))
})
Handlebars.registerHelper('safestring-helper', (object) => {
  let str = ''
  if (object !== undefined && object !== '') {
    str = ' ' + object.trim()
  }
  return new Handlebars.SafeString(str)
})
Handlebars.registerHelper('form-data-helper', (object) => {
  let ret = ''
  if (object.indexOf('multipart/form-data') !== -1) {
    ret = `  params.body = new FormData()`
  }
  if (object.indexOf('application/x-www-form-urlencoded') !== -1) {
    ret = `  params.body = new URLSearchParams()`
  }
  return new Handlebars.SafeString(ret)
})

Handlebars.registerHelper('compare-helper', (object) => {
  let ret = ''
  if (object.in === 'query') {
    ret = `    params.querys['` + object.name + `'] = parameters['` + object.name + `']`
  }
  if (object.in === 'header') {
    ret = `    params.headers['` + object.name + `'] = parameters['` + object.name + `']`
  }
  if (object.in === 'body') {
    ret = `    params.body = parameters['` + object.name + `']`
  }
  if (object.in === 'path') {
    ret = `    url = url.replace('{` + object.name + `}', parameters['` + object.name + `'])`
  }
  if (object.in === 'formData') {
    ret = `    params.body.append('` + object.name + `', parameters['` + object.name + `'])`
  }
  return new Handlebars.SafeString(ret)
})

Handlebars.registerHelper('url-compare-helper', (object) => {
  let ret = ''
  if (object.in === 'query') {
    ret = `  querys['` + object.name + `'] = parameters['` + object.name + `']`
  }
  if (object.in === 'header') {
    ret = `  // header ` + object.name
  }
  if (object.in === 'body') {
    ret = `  // body ` + object.name
  }
  if (object.in === 'path') {
    ret = `  url = url.replace('{` + object.name + `}', parameters['` + object.name + `'])`
  }
  if (object.in === 'formData') {
    ret = `  // formData ` + object.name
  }
  return new Handlebars.SafeString(ret)
})

module.exports.SwaggerBuilder = (filename, callback) => {
  SwaggerParser.validate(filename, (err, api) => {
    if (err) {
      console.error(err)
    } else {
      console.log('api:', api)
      const swagger = fliterApi(api)
      const template = Handlebars.compile(apiTmpl)(swagger)
      callback(template)
    }
  })
}

function fliterApi(api) {
  const swagger = {
    info: api.info,
    host: api.host,
    basePath: api.basePath,
    schemes: api.schemes,
    tags: []
  }

  // Init tags from swagger's tags
  // We only add methods array to tag's object
  const _tags = api.tags
  const tags = []
  _tags.forEach(_tag => {
    const tag = {
      name: _tag.name,
      description: _tag.description,
      methods: []
    }
    tags.push(tag)
  })

  // Analyse paths
  const paths = api.paths
  for (const path in paths) {
    for (const type in paths[path]) {
      const operation = paths[path][type]
      const tagsname = operation.tags
      tagsname.forEach(tagname => {
        // If tagname === undefine
        if (tagname === undefined || tagname === '') {
          tagname = 'default'
        }
        // Check tag if in the tags
        let tag = tags.find((tag) => {
          return tag.name === tagname
        })
        if (tag === undefined) {
          tag = {
            name: tagname,
            description: tagname,
            methods: []
          }
          tags.push(tag)
        }

        // Analyse operationId
        const operationId = toUpperFirstCase(operation.operationId)

        // Analyse parameters
        const parameters = []
        if (operation.parameters !== undefined) {
          operation.parameters.forEach(element => {
            let type = 'Object'
            if (element.type !== undefined) {
              type = toUpperFirstCase(element.type)
            }
            const parameter = element
            parameter.type = type
            parameters.push(parameter)
          })
        }

        // Analyse consumes
        let consumes = ['application/json']
        if (operation.consumes !== undefined) {
          consumes = operation.consumes.join(',')
        }

        // Analyse produces
        let produces = ['application/json']
        if (operation.produces !== undefined) {
          produces = operation.produces.join(',')
        }

        // Analyse method
        const method = {
          method: type.toLowerCase(),
          path: path,
          summary: operation.summary,
          description: operation.description,
          operationId: operationId,
          consumes: consumes,
          produces: produces,
          parameters: parameters,
          deprecated: operation.deprecated
        }

        // add method to tag
        tag.methods.push(method)
      })
    }
  }

  swagger.tags = tags
  return swagger
}

function toUpperFirstCase(str) {
  return str.replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}
