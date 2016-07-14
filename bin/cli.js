#!/usr/bin/env node
/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */
/* eslint global-require: 0 */

const DEV = process.env.NODE_ENV === 'development'
if (DEV) {
  require('babel-register')
}
require('babel-polyfill')

const os = require('os')
const co = require('co')
const ora = require('ora')
const chalk = require('chalk')
const program = require('commander')
const pkg = require('../package.json')
const { Evermark, config } = require(DEV ? '../src' : '../lib')

const magenta = chalk.magenta

program
  .version(pkg.version)
  .usage('[command]')
  .on('*', () => {
    program.help()
  })

const commands = {
  init: {
    cmd: 'init [destination]',
    desc: 'Create a new Evermark folder at the specified path or the current directory.',
    action: init,
    args: {
      '[destination]': 'Folder path. Initialize in current folder if not specified',
    },
  },
  config: {
    cmd: 'config [name] [value]',
    desc: 'Get or set configurations.',
    action: getOrSetConfig,
    args: {
      '[name]': 'Setting name. Leave it blank if you want to show all configurations.',
      '[value]': 'New value of a setting. ' +
        'Leave it blank if you want to show a single configuration.',
    },
  },
  new: {
    cmd: 'new <title>',
    desc: 'Create a new local note.',
    action: newNote,
    args: {
      '<title>': 'Note title. Wrap it with quotations to escape.',
    },
  },
  publish: {
    cmd: 'publish <file>',
    desc: 'Publish a local note to Evernote.',
    action: publishNote,
    args: {
      '<file>': 'Note file path.',
    },
  },
  unpublish: {
    cmd: 'unpublish <file>',
    desc: 'Remove a note from Evernote.',
    action: unpublish,
    args: {
      '<file>': 'Note file path.',
    },
  },
  help: {
    cmd: 'help [command]',
    desc: 'Get help on a command.',
    action: commandHelp,
  },
}

Object.keys(commands).forEach(cmd => {
  const command = commands[cmd]
  const prog = program
    .command(command.cmd)
    .description(command.desc)

  if (command.action) {
    prog.action(command.action)
  }
})

program.parse(process.argv)

if (process.argv.length === 2) {
  program.help()
}

function bold(command) {
  return chalk.bold(command)
}

function tildify(str) {
  const home = os.homedir()
  return magenta((str.indexOf(home) === 0 ? str.replace(home, '~') : str))
}

function info(message) {
  console.log(`${chalk.green('INFO')} `, message)
}

function error(message) {
  console.log(`${chalk.red('ERROR')} `, message)
}

function commandHelp(cmd) {
  const command = commands[cmd]
  if (command) {
    printCommandHelp(cmd, command.desc, command.args)
  } else {
    program.help()
  }
}

function printCommandHelp(command, desc, args) {
  args = args || {}

  console.log()
  console.log(`  Usage: evermark ${command} ${Object.keys(args).map(k => k).join(' ')}`)
  console.log()
  console.log('  Description:')
  console.log(`  ${desc}`)

  const argDesces = Object.keys(args)
    .map(k => `    ${bold(k.substring(1, k.length - 1))}\t${args[k]}`)
  if (argDesces.length) {
    console.log()
    console.log('  Arguments:')
    argDesces.map(s => console.log(s))
  }

  console.log()
}

function init(destination) {
  co(function* fn() {
    yield config.initConfig(destination)
    info('Evermark folder has been initialized.\n      ' +
      'Update the token in "evermark.json" then you can add some notes.')
  }).catch(e => error(e.message))
}

function getOrSetConfig(name, value) {
  co(function* fn() {
    if (!name) {
      const conf = yield config.readConfig()
      info(conf)
      return
    }

    if (!value) {
      const val = yield config.getConfig(name)
      info(`${name}: ${val}`)
      return
    }

    const conf = yield config.setConfig(name, value)
    info(`Updated config:\n\n${conf}`)
  }).catch(e => error(e.message))
}

function newNote(title) {
  co(function* fn() {
    const evermark = new Evermark()
    const notePath = yield evermark.createLocalNote(title)
    info(`Created local note: ${tildify(notePath)}`)
  }).catch(e => error(e.message))
}

function publishNote(file) {
  const spinner = ora('Publishing note').start()

  co(function* fn() {
    const evermark = new Evermark()
    const note = yield evermark.publishNote(file)

    spinner.stop()
    info(`Published note: ${tildify(note.absolutePath)}`)
  }).catch(e => {
    spinner.stop()
    error(e.message)
  })
}

function unpublish(file) {
  const spinner = ora('Unpublishing note').start()

  co(function* fn() {
    const evermark = new Evermark()
    const notePath = yield evermark.unpublishNote(file)

    spinner.stop()
    info(`Unpublished note: ${tildify(notePath)}`)
  }).catch(e => {
    spinner.stop()
    error(e.message)
  })
}