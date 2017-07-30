'use strict';

const bodyParser = require('body-parser')
const env = require('node-env-file')
const express = require('express')
const fetch = require('node-fetch')
const swaggerJSDoc = require('swagger-jsdoc')

const options = {
  swaggerDefinition: {
    info: {
      title: 'apiai-server',
      version: '1.0.0'
    },
    basePath: '/apiai-server'
  },
  apis: ['./server.js']
}

const swaggerSpec = swaggerJSDoc(options)

env(__dirname + '/.env')
const PORT = 8080
const DEFAULT_URL = process.env.APIAI_SERVER_URL
const DEFAULT_APP_KEY = process.env.APIAI_APP_KEY

let baseURL = DEFAULT_URL
let appKey = DEFAULT_APP_KEY

const app = express()
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.disable('etag')
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.get('/', function (req, res) {
  res.send('API.ai Proxy Server v1.0')
})
app.get('/api-docs.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

/**
 * @swagger
 * definitions:
 *   EntityResponse:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: ID of the entity
 *       name:
 *         type: string
 *         description: Name of the entity
 *       count:
 *         type: integer
 *         description: The total number of synonyms in the entity
 *       preview:
 *         type: string
 *         description: A string that contains summary information about
 *                      the entity
 *
 *   StatusInfo:
 *     type: object
 *     properties:
 *       code:
 *         type: integer
 *         description: HTTP status code
 *       errorType:
 *         type: string
 *         description: Text description of error, or "success" if no error.
 *       errorId:
 *         type: string
 *         description: ID of the error. Optionally returned if the request
 *                      failed.
 *       errorDetails:
 *         type: string
 *         description: Text details of the error. Only returned if the request
 *                      failed.
 *
 *   Status:
 *     type: object
 *     properties:
 *       status:
 *         type: object
 *         description: Contains data on how the request succeeded or failed.
 *         $ref: '#/definitions/StatusInfo'
 *
 *   EntitiesResponse:
 *     type: object
 *     properties:
 *       entities:
 *         type: array
 *         description: Array of objects
 *         items:
 *           $ref: '#/definitions/EntityResponse'
 *       status:
 *         type: object
 *         description: Contains data on how the request succeeded or failed.
 *         $ref: '#/definitions/Status'
 *
 * /entities:
 *   get:
 *     description: Retrieves a list of all entities for the agent.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/EntitiesResponse'
 *       500:
 *         description: Error getting entities from API.ai
 */
app.get('/entities', function (req, res) {
  const url = baseURL + '/entities'
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + appKey
    }
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error getting entities;', err)
      res.status(500).send({
        status: 500,
        message: 'Error getting entities'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   EntityInstance:
 *     type: object
 *     required:
 *       - value
 *     properties:
 *       value:
 *         type: string
 *         description: For mapping entities: a canonical name to be used in
 *                      place of synonyms.
 *                      For enum type entities: a string that can contain
 *                      references to other entities (with or without aliases).
 *       synonyms:
 *         type: array
 *         description: Array of strings that can include simple strings
 *                      (for words and phrases) or references to other
 *                      entites (with or without aliases).
 *                      For mapping entities: an array of synonyms.
 *                      Example: ["New York", "NYC", "big Apple"]
 *                      For enum type entities: a string that is identical
 *                      to the value string.
 *         items:
 *           type: string
 *
 *   Entity:
 *     type: object
 *     required:
 *       - id
 *       - name
 *       - entries
 *       - isEnum
 *       - automatedExpansion
 *     properties:
 *       id:
 *         type: string
 *         description: A unique identifier for the entity.
 *       name:
 *         type: string
 *         description: The name of the entity.
 *       entries:
 *         type: array
 *         description: An array of entry objects, which contain reference
 *                      values and synonyms.
 *         items:
 *           $ref: '#/definitions/EntityInstance'
 *       isEnum:
 *         type: boolean
 *         description: Indicates if the entity is a mapping or an enum
 *                      type entity.
 *       automatedExpansion:
 *         type: boolean
 *         description: Indicates if the entity can be automatically expanded.
 *
 * /entities:
 *   put:
 *     description: Deploy multiple entities to API.ai.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataObject
 *         description: Entities payload
 *         in: body
 *         required: true
 *         type: array
 *         items:
 *           $ref: '#/definitions/Entity'
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error putting entities to API.ai
 */
app.post('/entities', function (req, res) {
  console.log('received body:\n', req.body)
  const url = baseURL + '/entities'
  fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + appKey
    },
    body: JSON.stringify(req.body)
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error putting entities;', err)
      res.status(500).send({
        status: 500,
        message: 'Error putting entities'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   OutputContext:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the output context.
 *       lifespan:
 *         type: integer
 *         description: The number of queries this context will remain active
 *                      after being invoked.
 *
 *   Parameter:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the parameter.
 *       value:
 *         type: string
 *         description: The value of the parameter.
 *       defaultValue:
 *         type: string
 *         description: The default value of the parameter that should be
 *                      returned when the "value" field returns an empty value.
 *       required:
 *         type: boolean
 *         description: true if the action cannot be completed without
 *                      collecting this parameter value. false otherwise.
 *       dataType:
 *         type: string
 *         description: Entity name prefixed with @. This field is mandatory
 *                      if the parameter is required.
 *       prompts:
 *         type: array
 *         description: Questions that the agent will ask in order to collect
 *                      a value for a required parameter.
 *         items:
 *           type: string
 *
 *   IntentResponse:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: ID of the intent.
 *       name:
 *         type: string
 *         description: Name of the intent.
 *       contextIn:
 *         type: array
 *         description: List of input contexts. These contexts serve as
 *                      a prerequisite for this intent to be triggered.
 *         items:
 *           type: string
 *       contextOut:
 *         type: array
 *         description: List of output contexts that are set after this
 *                      intent is executed.
 *         items:
 *           $ref: '#/definitions/OutputContext'
 *       actions:
 *         type: array
 *         description: List of actions set by all responses of this intent.
 *         items:
 *           type: string
 *       parameters:
 *         type: array
 *         description: List of parameters for the action.
 *         items:
 *           $ref: '#/definitions/Parameter'
 *       priority:
 *         type: integer
 *         description: Intent priority.
 *       fallbackIntent:
 *         type: boolean
 *         description: true if this is a fallback intent. false if it is a
 *                      regular intent.
 *
 * /intents:
 *   get:
 *     description: Retrieves a list of all intents for the agent.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/IntentResponse'
 *       500:
 *         description: Error getting intents from API.ai
 */
app.get('/intents', function (req, res) {
  const url = baseURL + '/intents'
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + appKey
    }
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error getting intents;', err)
      res.status(500).send({
        status: 500,
        message: 'Error getting intents'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   Example:
 *     type: object
 *     properties:
 *       text:
 *         type: string
 *         description: Text corresponding to the entire example/template
 *                      (for examples without annotation and templates) or
 *                      to one of example's parts (only for annotated
 *                      examples).
 *       meta:
 *         type: string
 *         description: Entity name prefixed with @. This field is required
 *                      for the annotated part of the text and applies only
 *                      to examples.
 *       alias:
 *         type: string
 *         description: Parameter name for the annotated part of example.
 *       userDefined:
 *         type: boolean
 *         description: true if the text was annotated by developer.
 *                      false in the case of automatic annotation.
 *
 *   UserSaysObject:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: The id of the example/template.
 *       data:
 *         type: array
 *         description: Information about the text of the example/template
 *                      and its annotation.
 *         items:
 *           $ref: '#/definitions/Example'
 *       isTemplate:
 *         type: boolean
 *         description: true for template mode.
 *                      false for example mode.
 *       count:
 *         type: integer
 *         description: Equals to n-1 where n indicates how many times
 *                      this example/template was added to this intent.
 *
 *   Context:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the context.
 *       lifespan:
 *         type: integer
 *         description: Indicates the number of requests the context will
 *                      be active until expired.
 *
 *   Parameter:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the parameter.
 *       value:
 *         type: string
 *         description: The value of the parameter. It can be:
 *                      * a constant string
 *                      * a variable defined as the parameter name
 *                        prefixed with $. Example: $date
 *                      * original value defined as $parameter_name.original
 *                      * a value from a context defined as #context_name.parameter_name
 *       defaultValue:
 *         type: string
 *         description: Default value to use when the "value" field returns
 *                      an empty value. Default value can be extracted from
 *                      a context by using the format #context_name.parameter_name.
 *       required:
 *         type: boolean
 *         description: true if the action cannot be completed without
 *                      collecting this parameter value. false otherwise.
 *       dataType:
 *         type: string
 *         description: Entity name prefixed with @. This field is mandatory
 *                      if the parameter is required.
 *       prompts:
 *         type: array
 *         description: Questions that the agent will ask in order to collect
 *                      a value for a required parameter.
 *         items:
 *           type: string
 *       isList:
 *         type: boolean
 *         description: If true, the parameter value will be returned
 *                      as a list.
 *                      If false, the parameter value can be a string,
 *                      number, or object.
 *
 *   TextMessage:
 *     type: object
 *     properties:
 *       type:
 *         type: integer
 *         description: Equals to 0 for the Text response message type.
 *       speech:
 *         allOf:
 *           - type: string
 *           - type: array
 *             items:
 *               type: string
 *         description: Agent's text response(s). String in case of one
 *                      variation per one 'Text response' element, array
 *                      of strings in case of multiple variations. Line
 *                      breaks (\n) are currently supported for Facebook
 *                      Messenger, Kik, Slack, and Telegram one-click
 *                      integrations.
 *
 *   ImageMessage:
 *     type: object
 *     properties:
 *       type:
 *         type: integer
 *          description: Equals to 3 for the Image message type.
 *       imageUrl:
 *         type: string
 *         description: Public URL to the image file.
 *
 *   CardButton:
 *     type: object
 *     properties:
 *       text:
 *         type: string
 *         description: Button text.
 *       postback:
 *         type: string
 *         description: A text sent back to API.AI or a URL to open.
 *
 *   CardMessage:
 *     type: object
 *     properties:
 *       type:
 *         type: integer
 *         description: Equals to 1 for the Card message type.
 *       title:
 *         type: string
 *         description: Card title.
 *       subtitle:
 *         type: string
 *         description: Card subtitle.
 *       buttons:
 *         type: array
 *         description: Array of objects corresponding to card buttons.
 *         items:
 *           $ref: '#/definitions/CardButton'
 *
 *   QuickReplyMessage:
 *     type: object
 *     properties:
 *       type:
 *         type: integer
 *         description: Equals to 2 for the Quick replies message type.
 *       title:
 *         type: string
 *         description: Quick replies title. Required for the Facebook
 *                      Messenger, Kik, and Telegram one-click integrations.
 *       replies:
 *         type: array
 *         description: Array of strings corresponding to quick replies.
 *         items:
 *           type: string
 *
 *   CustomPayloadMessage:
 *     type: object
 *     properties:
 *       type:
 *         type: integer
 *         description: Equals to 4 for the Custom payload message type.
 *       payload:
 *         type: object
 *         description: Developer defined JSON. It is sent without
 *                      modifications.
 *
 *   Response:
 *     type: object
 *     properties:
 *       action:
 *         type: string
 *         description: The name of the action.
 *       resetContexts:
 *         type: boolean
 *         description: true indicates that all contexts will be reset
 *                      when this intent is triggered. Otherwise the value
 *                      is false.
 *       affectedContexts:
 *         type: array
 *         description: A list of contexts that are activated when this
 *                      intent is triggered (output contexts).
 *         items:
 *           $ref: '#/definitions/Context'
 *       parameters:
 *         type: array
 *         description: A list of parameters for the action.
 *       messages:
 *         type: array
 *         description: Agent response corresponding to the 'Response' field
 *                      in the UI. Array of message objects
 *         items:
 *           allOf:
 *             - $ref: '#/definitions/TextMessage'
 *             - $ref: '#/definitions/ImageMessage'
 *             - $ref: '#/definitions/CardMessage'
 *             - $ref: '#/definitions/QuickReplyMessage'
 *             - $ref: '#/definitions/CustomPayloadMessage'
 *
 *   CortanaCommand:
 *     type: object
 *     properties:
 *       navigateOrService:
 *         type: string
 *         description: "NAVIGATE" – for a page that the app should navigate
 *                      to when it launches
 *                      "SERVICE" – for an app service name that must handle
 *                      voice command.
 *       target:
 *         type: string
 *         description: Page or service name.
 *
 *   Event:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: Event name.
 *
 *   Intent:
 *     type: object
 *     required:
 *       - id
 *       - name
 *     properties:
 *       id:
 *         type: string
 *         description: A unique identifier for the intent.
 *       name:
 *         type: string
 *         description: The name of the intent.
 *       auto:
 *         type: boolean
 *         description: true if Machine learning is on in this intent.
 *       contexts:
 *         type: array
 *         description: A list of contexts required in order for this
 *                      intent to be triggered (input contexts).
 *         items:
 *           type: string
 *       templates:
 *         type: array
 *         description: Array of templates this intent will match. Each
 *                      template is a string that may contain legal names
 *                      corresponding to words and phrases, entity names
 *                      prefixed with '@', accompanied or not by aliases.
 *                      In addition to alphanumerical characters, it may
 *                      contain the symbols '?' and ','.
 *         items:
 *           type: string
 *       userSays:
 *         type: array
 *         description: Each object corresponds to one example/template
 *                      from the 'User says' field in the UI.
 *         items:
 *           $ref: '#/definitions/UserSaysObject'
 *       responses:
 *         type: array
 *         description: A list of responses for this intent.
 *         items:
 *           $ref: '#/definitions/Response'
 *       priority:
 *         type: integer
 *         description: Intent priority.
 *       webhookUsed:
 *         type: boolean
 *         description: true if webhook is enabled in the agent and in
 *                      the intent. false otherwise.
 *       webhookForSlotFilling:
 *         type: boolean
 *         description: true if webhook is enabled for the intent required
 *                      parameters. false otherwise.
 *       fallbackIntent:
 *         type: boolean
 *         description: true if this is a fallback intent. false if it is
 *                      a regular intent.
 *       cortanaCommand:
 *         type: object
 *         description: Object containing optional values for Cortana
 *                      integration.
 *         $ref: '#/definitions/CortanaCommand'
 *       events:
 *         type: array
 *         description: Array containing event objects.
 *         items:
 *           $ref: '#/definitions/Event'
 *
 * /intents:
 *   post:
 *     description: Creates a new intent.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error posting intent
 */
app.post('/intents', function (req, res) {
  const url = baseURL + '/intents'
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + appKey
    },
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error posting intents;', err)
      res.status(500).send({
        status: 500,
        message: 'Error posting intents'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   EntityInstance:
 *     type: object
 *     required:
 *       - value
 *     properties:
 *       value:
 *         type: string
 *         description: For mapping entities: a canonical name to be used in
 *                      place of synonyms.
 *                      For enum type entities: a string that can contain
 *                      references to other entities (with or without aliases).
 *       synonyms:
 *         type: array
 *         description: Array of strings that can include simple strings
 *                      (for words and phrases) or references to other
 *                      entites (with or without aliases).
 *                      For mapping entities: an array of synonyms.
 *                      Example: ["New York", "NYC", "big Apple"]
 *                      For enum type entities: a string that is identical
 *                      to the value string.
 *         items:
 *           type: string
 *
 *   UserEntries:
 *     type: object
 *     properties:
 *       sessionId:
 *         type: string
 *         description: Session ID for a user.
 *       name:
 *         type: string
 *         description: Name of the entity.
 *       extend:
 *         type: boolean
 *         description: A flag identifying whether the additional data
 *                      should extend or replace the default entity definition.
 *                      Optional field. If not defined, the default value
 *                      is `false`.
 *       entries:
 *         type: array
 *         description: Array of Entity Entry objects
 *         items:
 *           $ref: '#/definitions/EntityInstance'
 *
 * /userEntities:
 *   post:
 *     description: Entities can be redefined on a user (session ID) level.
 *                  A good scenario could be when you have a @playlist entity
 *                  that has generic playlist. As playlists are user-specific,
 *                  @playlist entity could be defined in a request or for a
 *                  given session. If user entities are submitted via the
 *                  /userEntities endpoint, they live in the session for
 *                  30 minutes.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error posting user entities
 */
app.post('/userEntities', function (req, res) {
  const url = baseURL + '/userEntities'
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + appKey
    },
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error posting user entities;', err)
      res.status(500).send({
        status: 500,
        message: 'Error posting user entities'
      })
    })
})

/**
 * @swagger
 * /publish:
 *   post:
 *     description: Publishes a specific version of the application.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error publishing workspace to LUIS
 */
app.post('/publish/:appId', function (req, res) {
  const appid = req.params.appId
  console.log('received body:\n', req.body)
  const url = baseURL + `/${appid}/publish`
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': appKey
    },
    body: JSON.stringify(req.body)
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error publishing workspace;', err)
      res.status(500).send({
        status: 500,
        message: 'Error publishing workspace'
      })
    })
})

/**
 * @swagger
 * /assignedkey:
 *   post:
 *     description: Assigns a subscription key to the given application version.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error publishing workspace to LUIS
 */
app.post('/assignedkey/:appId', function (req, res) {
  const appid = req.params.appId
  const url = baseURL + `/${appid}/versions/${versionId}/assignedkey`
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': appKey
    },
    body: JSON.stringify(appKey)
  })
    .then((resp) => {
      if (resp.ok) {
        res.send()
      } else {
        throw resp.statusText
      }
    })
    .catch((err) => {
      console.error('Error assigning key;', err)
      res.status(500).send({
        status: 500,
        message: 'Error assigning key'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   Message:
 *     type: object
 *     required:
 *       - q
 *     properties:
 *       q:
 *         type: string
 *         description: The utterance to parse.
 *
 *   Entity:
 *     type: object
 *     properties:
 *       start:
 *         type: integer
 *         description: The start index of the entity substring in the text
 *       end:
 *         type: integer
 *         description: The end index of the entity substring in the text
 *       value:
 *         type: string
 *         description: The entity instance or synonym
 *       entity:
 *         type: string
 *         description: The entity name
 *
 *   Intent:
 *     type: object
 *     properties:
 *       confidence:
 *         type: double
 *         description: A decimal percentage that represents RASA's confidence in the intent.
 *       name:
 *         type: string
 *         description: The name of the intent.
 *
 *   ParseResponse:
 *     type: object
 *     properties:
 *       text:
 *         type: string
 *         description: The parsed utterance.
 *       entities:
 *         type: array
 *         description: The list of extracted entities.
 *         items:
 *           $ref: '#/definitions/Entity'
 *       intent:
 *         type: object
 *         description: The top scoring intent.
 *         schema:
 *           $ref: '#/definitions/Intent'
 *       intent_ranking:
 *         type: array
 *         description: The list of all matching intents.
 *         items:
 *           $ref: '#/definitions/Intent'
 *
 * /parse:
 *   post:
 *     description: Send a message to RASA.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: message
 *         description: message payload
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Message'
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           $ref: '#/definitions/ParseResponse'
 *       500:
 *         description: Invalid request
 */
app.post('/parse', function (req, res) {
  console.log('received body:\n', req.body)
  const url = baseURL + '/parse'
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(req.body)
  })
    .then((resp) => resp.json())
    .then((json) => {
      res.send(json)
    })
    .catch((err) => {
      console.error('Error posting query;', err)
      res.status(500).send({
        status: 500,
        message: 'Error posting query'
      })
    })
})

/**
 * @swagger
 * definitions:
 *   Config:
 *     type: object
 *     properties:
 *       url:
 *         type: string
 *       appId:
 *         type: string
 *       appKey:
 *         type: string
 *
 * /config:
 *   post:
 *     description: Update the configuration of this proxy.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: configObject
 *         description: configuration object
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Config'
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error updating config
 */
app.post('/config', function (req, res) {
  console.log('received config:\n', req.body)
  const body = req.body
  baseURL = body.url || DEFAULT_URL
  appId = body.appId || DEFAULT_APP_ID
  appKey = body.appKey || DEFAULT_APP_KEY
  res.send({ status: 'OK' })
})

app.listen(PORT)
console.log('API.ai proxy server running on port:' + PORT)
