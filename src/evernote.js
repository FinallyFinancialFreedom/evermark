import Promise from 'bluebird'
import { Evernote } from 'evernote'

Promise.promisifyAll(Evernote.UserStoreClient.prototype)
Promise.promisifyAll(Evernote.NoteStoreClient.prototype)

const debug = require('debug')('evernote')

export default class EvernoteClient {
  constructor({ token, china = true, sandbox = false } = { china: true, sandbox: false }) {
    if (!token) {
      throw new Error('Missing developer token')
    }

    let serviceHost = china ? 'app.yinxiang.com' : 'www.evernote.com'
    serviceHost = sandbox ? 'sandbox.evernote.com' : serviceHost

    const options = { token, sandbox, serviceHost }
    debug('options: %o', options)
    this.options = options

    const client = new Evernote.Client(options)
    this.userStore = client.getUserStore()
    this.noteStore = client.getNoteStore()
  }

  listNotebooks() {
    return this.noteStore.listNotebooksAsync()
  }

  createNotebook(name) {
    const notebook = new Evernote.Notebook()
    notebook.name = name
    return this.noteStore.createNotebookAsync(notebook)
  }

  createNote(note) {
    return this.noteStore.createNoteAsync(note)
  }

  updateNote(note) {
    return this.noteStore.updateNoteAsync(note)
  }
}
